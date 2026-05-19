import Groq from 'groq-sdk'
import { ProductDetail, ShopPrice } from './types'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const AU_RETAILERS = [
  'JB Hi-Fi', 'Harvey Norman', 'Kogan', 'Officeworks',
  'The Good Guys', 'Amazon AU', 'Bing Lee', 'Big W',
]

const SYSTEM_PROMPT = `You are a product price database for Australia. When asked to search for products, return accurate JSON with realistic AUD retail prices from major Australian stores (JB Hi-Fi, Harvey Norman, Kogan, Officeworks, The Good Guys, Amazon AU, Bing Lee, Big W, Costco AU).

Rules:
- Prices MUST be in Australian Dollars (AUD) — multiply typical USD prices by ~1.55 and add GST/import margin
- Always include at least 4 Australian retailers with realistic price variation between them
- Kogan is usually 5–15% cheaper than JB Hi-Fi
- Harvey Norman is often slightly above JB Hi-Fi
- Amazon AU is usually competitive, sometimes cheapest
- Return proper product names, not truncated ones
- trendDirection: "down" if recently discounted, "up" if recently increased, "stable" otherwise
- allTimeLow is typically 15–35% below current price for electronics
- allTimeHigh is typically 10–25% above current price
- Generate realistic 12-month price history with seasonal dips (Boxing Day, Click Frenzy, EOFY sales in June)
- Respond ONLY with valid JSON, no markdown, no explanation`

function generateGroqHistory(basePrice: number, trend: string): Array<{ date: string; price: number; shop: string }> {
  const points = []
  const now = new Date()
  let price = basePrice * 1.2

  for (let i = 365; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000)

    // Seasonal sales simulation
    const isBoxingDay = dayOfYear >= 359 || dayOfYear <= 5
    const isClickFrenzy = dayOfYear >= 136 && dayOfYear <= 140
    const isEOFY = dayOfYear >= 165 && dayOfYear <= 181
    const isMidYear = dayOfYear >= 180 && dayOfYear <= 195

    let multiplier = 1
    if (isBoxingDay) multiplier = 0.82
    else if (isClickFrenzy) multiplier = 0.88
    else if (isEOFY || isMidYear) multiplier = 0.90

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

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Search Australian retail prices for: "${query}"

Return this exact JSON structure (no markdown, raw JSON only):
{
  "products": [
    {
      "id": "kebab-case-product-id",
      "name": "Full Product Name with Model",
      "brand": "Brand Name",
      "category": "Category",
      "description": "2-3 sentence product description",
      "currentPrices": [
        { "shop": "JB Hi-Fi", "price": 0.00, "currency": "AUD", "inStock": true, "url": "https://jbhifi.com.au", "lastUpdated": "${now}", "shipping": "Free", "rating": 4.5, "reviews": 1200 },
        { "shop": "Harvey Norman", "price": 0.00, "currency": "AUD", "inStock": true, "url": "https://harveynorman.com.au", "lastUpdated": "${now}", "shipping": "Free" },
        { "shop": "Kogan", "price": 0.00, "currency": "AUD", "inStock": true, "url": "https://kogan.com", "lastUpdated": "${now}", "shipping": "$9.90" },
        { "shop": "Officeworks", "price": 0.00, "currency": "AUD", "inStock": true, "url": "https://officeworks.com.au", "lastUpdated": "${now}", "shipping": "Free" },
        { "shop": "Amazon AU", "price": 0.00, "currency": "AUD", "inStock": true, "url": "https://amazon.com.au", "lastUpdated": "${now}", "shipping": "Free" },
        { "shop": "The Good Guys", "price": 0.00, "currency": "AUD", "inStock": true, "url": "https://thegoodguys.com.au", "lastUpdated": "${now}", "shipping": "Free" }
      ],
      "allTimeLow": 0.00,
      "allTimeHigh": 0.00,
      "averagePrice": 0.00,
      "trendDirection": "down",
      "priceDropPercent": 10
    }
  ]
}

Return 1–3 most relevant products. Fill in all prices with real AUD values.`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_tokens: 2000,
  })

  const raw = completion.choices[0]?.message?.content || '{}'
  const parsed = JSON.parse(raw)
  const products: Partial<ProductDetail>[] = (parsed.products || []).map((p: Partial<ProductDetail> & { currentPrices?: ShopPrice[] }) => {
    const prices = p.currentPrices || []
    const priceValues = prices.map((s) => s.price).filter(Boolean)
    const lowestPrice = priceValues.length ? Math.min(...priceValues) : 0

    return {
      ...p,
      currentPrices: prices,
      priceHistory: generateGroqHistory(lowestPrice || p.averagePrice || 100, p.trendDirection || 'stable'),
      bestDeal: prices.sort((a: ShopPrice, b: ShopPrice) => a.price - b.price)[0],
    }
  })

  return { products, source: 'groq' }
}

export async function getProductDetailsWithGroq(productName: string): Promise<Partial<ProductDetail> | null> {
  if (!process.env.GROQ_API_KEY) return null

  const result = await searchWithGroq(productName)
  return result.products[0] || null
}
