import Groq from 'groq-sdk'
import { ProductDetail, ShopPrice } from './types'

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY || 'placeholder' })
}

// Generates a real product search URL for each Australian retailer
export function getShopSearchUrl(shop: string, productName: string): string {
  const q = encodeURIComponent(productName)
  const map: Record<string, string> = {
    'JB Hi-Fi':       `https://www.jbhifi.com.au/search?q=${q}`,
    'Harvey Norman':  `https://www.harveynorman.com.au/search?q=${q}`,
    'Kogan':          `https://www.kogan.com/au/shop/?q=${q}`,
    'Officeworks':    `https://www.officeworks.com.au/shop/officeworks/c/search?q=${q}`,
    'The Good Guys':  `https://www.thegoodguys.com.au/SearchDisplay?searchTerm=${q}`,
    'Amazon AU':      `https://www.amazon.com.au/s?k=${q}`,
    'Bing Lee':       `https://www.binglee.com.au/search?q=${q}`,
    'Big W':          `https://www.bigw.com.au/search?q=${q}`,
    'Costco AU':      `https://www.costco.com.au/SearchDisplay?searchTerm=${q}`,
    'Target AU':      `https://www.target.com.au/search?q=${q}`,
    'Myer':           `https://www.myer.com.au/search?q=${q}`,
    'PriceHipster':   `https://www.pricehipster.com/search?q=${q}`,
    'StaticIce':      `https://www.staticice.com.au/cgi-bin/search.cgi?q=${q}`,
  }
  return map[shop] || `https://www.google.com.au/search?q=${q}+${encodeURIComponent(shop)}+price+australia`
}

const SYSTEM_PROMPT = `You are a product pricing assistant for Australia. Your job is to return the best estimate of current Australian retail prices for specific products.

CRITICAL RULES:
- Prices MUST be in AUD. Use your best knowledge of Australian retail pricing as of your training cutoff.
- Be as precise as possible for the exact model/SKU given. Do not guess or round up to a convenient number.
- Harvey Norman tends to be at or slightly above RRP
- The Good Guys is usually within 2–5% of JB Hi-Fi
- Amazon AU is often 3–10% below JB Hi-Fi
- Bing Lee is usually close to JB Hi-Fi pricing
- For cameras and photo gear: JB Hi-Fi, Harvey Norman, The Good Guys, Amazon AU are main retailers. Officeworks does NOT sell cameras — set its price to 0 if the product is not sold there.
- IMPORTANT: If a store does not carry that type of product, set its price to 0. The app will automatically hide $0 entries.
- Do NOT invent stock URLs — leave the url field blank ("") — the app will build correct search links automatically
- trendDirection: "down" if product recently got a price cut, "up" if recently increased, "stable" if no change
- Return ONLY valid JSON, no markdown, no commentary`

export function generateGroqHistory(basePrice: number): Array<{ date: string; price: number; shop: string }> {
  const points = []
  const now = new Date()
  let price = basePrice * 1.2

  for (let i = 365; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000)

    const isBoxingDay   = dayOfYear >= 359 || dayOfYear <= 5
    const isClickFrenzy = dayOfYear >= 136 && dayOfYear <= 140
    const isEOFY        = dayOfYear >= 165 && dayOfYear <= 181

    let multiplier = 1
    if (isBoxingDay) multiplier = 0.82
    else if (isClickFrenzy) multiplier = 0.88
    else if (isEOFY) multiplier = 0.90

    const drift = (Math.random() - 0.48) * (basePrice * 0.03)
    price = Math.max(basePrice * 0.7, Math.min(basePrice * 1.35, price + drift))

    points.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(price * multiplier * 100) / 100,
      shop: 'JB Hi-Fi',
    })
  }
  return points
}

export interface GroqSearchResult {
  products: Partial<ProductDetail>[]
  source: 'groq'
}

export async function searchWithGroq(query: string): Promise<GroqSearchResult> {
  if (!process.env.GROQ_API_KEY) return { products: [], source: 'groq' }

  const now = new Date().toISOString()

  const completion = await getGroq().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Find Australian retail prices for: "${query}"

Be precise about the exact model. If this is a specific SKU (e.g. "Sony ZV-E10 16-50mm kit"), give the price for exactly that bundle — not the body-only price.

Return this exact JSON (raw JSON only, no markdown):
{
  "products": [
    {
      "id": "kebab-case-product-id",
      "name": "Exact Full Product Name including model number",
      "brand": "Brand",
      "category": "Category",
      "description": "2-3 sentence description of what makes this product notable",
      "currentPrices": [
        { "shop": "JB Hi-Fi",      "price": 0.00, "currency": "AUD", "inStock": true, "url": "", "lastUpdated": "${now}", "shipping": "Free", "rating": 4.6, "reviews": 850 },
        { "shop": "Harvey Norman", "price": 0.00, "currency": "AUD", "inStock": true, "url": "", "lastUpdated": "${now}", "shipping": "Free" },
        { "shop": "The Good Guys", "price": 0.00, "currency": "AUD", "inStock": true, "url": "", "lastUpdated": "${now}", "shipping": "Free" },
        { "shop": "Amazon AU",     "price": 0.00, "currency": "AUD", "inStock": true, "url": "", "lastUpdated": "${now}", "shipping": "Free" },
        { "shop": "Bing Lee",      "price": 0.00, "currency": "AUD", "inStock": true, "url": "", "lastUpdated": "${now}", "shipping": "Free" },
        { "shop": "Officeworks",   "price": 0.00, "currency": "AUD", "inStock": true, "url": "", "lastUpdated": "${now}", "shipping": "Free" }
      ],
      "allTimeLow": 0.00,
      "allTimeHigh": 0.00,
      "averagePrice": 0.00,
      "trendDirection": "stable",
      "priceDropPercent": 0
    }
  ]
}

Return 1–3 most relevant results. Leave url as "" — the app will generate the correct search links.`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 2000,
  })

  const raw = completion.choices[0]?.message?.content || '{}'
  const parsed = JSON.parse(raw)

  const products: Partial<ProductDetail>[] = (parsed.products || []).map(
    (p: Partial<ProductDetail> & { currentPrices?: ShopPrice[] }) => {
      const prices = (p.currentPrices || [])
        // Drop any entry where Groq returned $0 (store doesn't carry the product)
        .filter((s: ShopPrice) => s.price > 0)
        .map((s: ShopPrice) => ({
          ...s,
          url: getShopSearchUrl(s.shop, p.name || ''),
        }))

      const priceValues = prices.map((s) => s.price)
      const lowestPrice = priceValues.length ? Math.min(...priceValues) : 0
      const sorted = [...prices].sort((a, b) => a.price - b.price)

      return {
        ...p,
        currentPrices: sorted,
        priceHistory: generateGroqHistory(lowestPrice || p.averagePrice || 100),
        bestDeal: sorted[0],
      }
    }
  )

  return { products, source: 'groq' }
}

export async function getProductDetailsWithGroq(productName: string): Promise<Partial<ProductDetail> | null> {
  if (!process.env.GROQ_API_KEY) return null
  const result = await searchWithGroq(productName)
  return result.products[0] || null
}
