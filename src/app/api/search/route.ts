import { NextRequest, NextResponse } from 'next/server'
import { searchMockProducts } from '@/lib/mock-data'
import { searchProductsOnline } from '@/lib/scraper'
import { searchWithGroq } from '@/lib/groq'

export const maxDuration = 30

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q') || ''
  if (!query.trim()) return NextResponse.json({ products: [] })

  // 1. Try Groq AI search (fastest path — gives product + AU prices in one call)
  if (process.env.GROQ_API_KEY) {
    try {
      const { products } = await searchWithGroq(query)
      if (products.length > 0) {
        return NextResponse.json({ products, source: 'groq' })
      }
    } catch {
      // fall through
    }
  }

  // 2. Try live Google Shopping scrape
  const liveResults = await searchProductsOnline(query)
  if (liveResults.length > 0) {
    return NextResponse.json({ products: liveResults, source: 'live' })
  }

  // 3. Mock data fallback
  const mockResults = searchMockProducts(query)
  return NextResponse.json({ products: mockResults, source: 'demo' })
}
