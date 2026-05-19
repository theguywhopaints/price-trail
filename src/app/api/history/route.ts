import { NextRequest, NextResponse } from 'next/server'
import { MOCK_PRODUCTS } from '@/lib/mock-data'
import { fetchCamelHistory } from '@/lib/scraper'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') || ''
  const asin = req.nextUrl.searchParams.get('asin') || ''

  // Try CamelCamelCamel for real Amazon history
  if (asin) {
    const history = await fetchCamelHistory(asin)
    if (history.length > 0) {
      const prices = history.map((p) => p.price)
      return NextResponse.json({
        history,
        allTimeHigh: Math.max(...prices),
        allTimeLow: Math.min(...prices),
        averagePrice: prices.reduce((a, b) => a + b, 0) / prices.length,
        source: 'camelcamelcamel',
      })
    }
  }

  // Fall back to mock history data
  const mock = MOCK_PRODUCTS[id]
  if (mock) {
    return NextResponse.json({
      history: mock.priceHistory,
      allTimeHigh: mock.allTimeHigh,
      allTimeLow: mock.allTimeLow,
      averagePrice: mock.averagePrice,
      source: 'demo',
    })
  }

  return NextResponse.json({ history: [], source: 'none' })
}
