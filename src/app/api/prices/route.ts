import { NextRequest, NextResponse } from 'next/server'
import { MOCK_PRODUCTS } from '@/lib/mock-data'
import { fetchGoogleShoppingPrices, fetchPriceHipster, fetchStaticIce } from '@/lib/scraper'
import { getProductDetailsWithGroq } from '@/lib/groq'

export const maxDuration = 30

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') || ''
  const query = req.nextUrl.searchParams.get('q') || id.replace(/-/g, ' ')

  // 1. Groq — returns full product detail with AU prices
  if (process.env.GROQ_API_KEY) {
    try {
      const detail = await getProductDetailsWithGroq(query)
      if (detail?.currentPrices && detail.currentPrices.length > 0) {
        const sorted = [...detail.currentPrices].sort((a, b) => a.price - b.price)
        return NextResponse.json({
          prices: sorted,
          bestDeal: sorted[0],
          productDetail: detail,
          source: 'groq',
        })
      }
    } catch {
      // fall through
    }
  }

  // 2. Live scrape — Google Shopping AU + PriceHipster + StaticIce in parallel
  const [googlePrices, hipsterPrices, staticPrices] = await Promise.all([
    fetchGoogleShoppingPrices(query + ' australia'),
    fetchPriceHipster(query),
    fetchStaticIce(query),
  ])

  const allLive = [...googlePrices, ...hipsterPrices, ...staticPrices]
  if (allLive.length > 0) {
    const seen = new Set<string>()
    const deduped = allLive.filter((p) => {
      const key = `${p.shop}-${p.price}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    const sorted = deduped.sort((a, b) => a.price - b.price)
    return NextResponse.json({ prices: sorted, bestDeal: sorted[0], source: 'live' })
  }

  // 3. Mock fallback
  const mock = MOCK_PRODUCTS[id]
  if (mock) {
    return NextResponse.json({ prices: mock.currentPrices, bestDeal: mock.bestDeal, source: 'demo' })
  }

  return NextResponse.json({ prices: [], source: 'none' })
}
