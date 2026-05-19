'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import SearchBar from '@/components/SearchBar'
import { Loader2, TrendingDown, TrendingUp, Minus, ArrowLeft, Globe2 } from 'lucide-react'
import { ProductDetail } from '@/lib/types'

function fmt(price: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
}

function SearchResults() {
  const params = useSearchParams()
  const query = params.get('q') || ''
  const [products, setProducts] = useState<Partial<ProductDetail>[]>([])
  const [loading, setLoading] = useState(false)
  const [source, setSource] = useState<string>('')

  useEffect(() => {
    if (!query) return
    setLoading(true)
    setProducts([])

    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products || [])
        setSource(data.source || '')
      })
      .finally(() => setLoading(false))
  }, [query])

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Back + search bar */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="text-gray-400 hover:text-white transition-colors flex-shrink-0">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <SearchBar initialValue={query} size="sm" />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {query ? `Results for "${query}"` : 'Search results'}
          </h1>
          {!loading && products.length > 0 && (
            <p className="text-gray-500 text-sm mt-1">
              {products.length} products found
              {source === 'groq' && (
                <span className="ml-2 inline-flex items-center gap-1 text-purple-400 text-xs">
                  ✦ AI search (Groq)
                </span>
              )}
              {source === 'live' && (
                <span className="ml-2 inline-flex items-center gap-1 text-green-400 text-xs">
                  <Globe2 size={11} /> Live internet search
                </span>
              )}
              {source === 'demo' && (
                <span className="ml-2 text-blue-400 text-xs">(demo mode)</span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center">
            <Loader2 size={28} className="text-blue-400 animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-white font-semibold">AI is searching for products...</p>
            <p className="text-gray-500 text-sm mt-1">Powered by Groq · checking JB Hi-Fi, Harvey Norman, Kogan and more</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && products.length === 0 && query && (
        <div className="text-center py-24">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-white font-semibold text-xl mb-2">No results found</p>
          <p className="text-gray-500">Try a different search term or check the spelling</p>
        </div>
      )}

      {/* Results grid */}
      {!loading && products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map((product, i) => {
            const p = product as ProductDetail
            const lowestPrice = p.currentPrices ? Math.min(...p.currentPrices.map((c) => c.price)) : undefined

            const TrendIcon = p.trendDirection === 'down' ? TrendingDown : p.trendDirection === 'up' ? TrendingUp : Minus
            const trendColor = p.trendDirection === 'down' ? 'text-green-400' : p.trendDirection === 'up' ? 'text-red-400' : 'text-gray-400'

            return (
              <Link
                key={i}
                href={`/product/${p.id}?name=${encodeURIComponent(p.name)}`}
                className="group bg-gray-900 border border-gray-800 hover:border-blue-500/50 rounded-2xl overflow-hidden transition-all hover:shadow-xl hover:shadow-blue-500/5"
              >
                <div className="aspect-square bg-gray-800 overflow-hidden">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">
                      📦
                    </div>
                  )}
                </div>
                <div className="p-4">
                  {p.brand && (
                    <p className="text-blue-400 text-xs font-semibold uppercase tracking-wide mb-1">{p.brand}</p>
                  )}
                  <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 mb-3">{p.name}</h3>

                  {lowestPrice !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-green-400 font-bold">{fmt(lowestPrice)}</span>
                      {p.trendDirection && (
                        <span className={`flex items-center gap-1 text-xs ${trendColor}`}>
                          <TrendIcon size={12} />
                          {p.trendDirection}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchResults />
    </Suspense>
  )
}
