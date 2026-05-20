import { NextRequest, NextResponse } from 'next/server'
import { MOCK_PRODUCTS } from '@/lib/mock-data'
import { fetchStaticIce, fetchGoogleShoppingPrices } from '@/lib/scraper'
import { searchWithGroq, generateGroqHistory } from '@/lib/groq'
import { ShopPrice } from '@/lib/types'
import scrapedCache from '@/data/scraped-prices.json'

export const maxDuration = 30

const MAJOR_RETAILERS = ['JB Hi-Fi', 'Harvey Norman', 'The Good Guys', 'Amazon AU', 'Bing Lee', 'Officeworks', 'Big W']

// Find the best-matching scraped prices for this query (from GitHub Actions cache)
function getCachedPrices(query: string): ShopPrice[] | null {
  const q = query.toLowerCase().trim()
  const data = scrapedCache as unknown as Record<string, { prices: ShopPrice[]; scrapedAt: string }>

  // Exact match first
  if (data[q]?.prices?.length) return data[q].prices

  // Fuzzy: find a cached key where all words of query appear in the key (or vice versa)
  const tokens = q.split(/\s+/).filter((t) => t.length > 2)
  for (const [key, val] of Object.entries(data)) {
    if (key.startsWith('_')) continue
    const matchCount = tokens.filter((t) => key.includes(t)).length
    if (matchCount >= Math.min(tokens.length, 2) && val.prices?.length) {
      return val.prices
    }
  }
  return null
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') || ''
  const query = req.nextUrl.searchParams.get('q') || id.replace(/-/g, ' ')

  // 1. Check GitHub Actions scraped cache (Playwright — real prices from blocked retailers)
  const cachedPrices = getCachedPrices(query)

  // 2. Fetch live StaticIce + Google Shopping + Groq in parallel
  const [staticPrices, googlePrices, groqResult] = await Promise.all([
    fetchStaticIce(query),
    fetchGoogleShoppingPrices(query),
    process.env.GROQ_API_KEY ? searchWithGroq(query).catch(() => null) : Promise.resolve(null),
  ])

  const groqProduct = groqResult?.products[0] ?? null

  // Merge all sources: cached (Playwright) > StaticIce > Google Shopping > Groq estimate
  const liveByShop = new Map<string, ShopPrice>()

  // StaticIce + Google Shopping (real, live)
  for (const p of [...staticPrices, ...googlePrices]) {
    const existing = liveByShop.get(p.shop)
    if (!existing || p.price < existing.price) liveByShop.set(p.shop, p)
  }

  // Playwright cache — overrides live scraping for retailers like Harvey Norman that block servers
  if (cachedPrices) {
    for (const p of cachedPrices) {
      liveByShop.set(p.shop, p)   // cached Playwright price wins (real browser, real IP)
    }
  }

  // Groq estimates — only fill in major retailers still missing after real sources
  if (groqProduct?.currentPrices) {
    for (const gp of groqProduct.currentPrices) {
      if (MAJOR_RETAILERS.includes(gp.shop) && !liveByShop.has(gp.shop) && gp.price > 0) {
        liveByShop.set(gp.shop, { ...gp, estimated: true })
      }
    }
  }

  const hasPrices = liveByShop.size > 0

  if (hasPrices) {
    const prices = Array.from(liveByShop.values()).sort((a, b) => a.price - b.price)
    const lowestPrice = prices[0].price

    const productDetail = groqProduct
      ? { ...groqProduct, currentPrices: prices, priceHistory: generateGroqHistory(lowestPrice), bestDeal: prices[0] }
      : {
          id,
          name: query,
          currentPrices: prices,
          priceHistory: generateGroqHistory(lowestPrice),
          bestDeal: prices[0],
          allTimeLow: lowestPrice * 0.85,
          allTimeHigh: lowestPrice * 1.2,
          averagePrice: lowestPrice * 1.05,
          trendDirection: 'stable' as const,
        }

    const hasAnyLive = prices.some((p) => !p.estimated)
    return NextResponse.json({
      prices,
      bestDeal: prices[0],
      productDetail,
      source: hasAnyLive ? 'live' : 'groq',
    })
  }

  // 3. Mock demo data fallback
  const mock = MOCK_PRODUCTS[id]
  if (mock) {
    return NextResponse.json({ prices: mock.currentPrices, bestDeal: mock.bestDeal, source: 'demo' })
  }

  return NextResponse.json({ prices: [], source: 'none' })
}
