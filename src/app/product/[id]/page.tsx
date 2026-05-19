'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowLeft, Loader2, Globe2, ChevronDown, ChevronUp, Share2, Check } from 'lucide-react'
import { ProductDetail } from '@/lib/types'
import { MOCK_PRODUCTS } from '@/lib/mock-data'
import PriceStats from '@/components/PriceStats'
import ShopComparison from '@/components/ShopComparison'
import PriceMatchReport from '@/components/PriceMatchReport'

// Dynamic import to avoid SSR issues with Recharts
const PriceChart = dynamic(() => import('@/components/PriceChart'), { ssr: false })

export default function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const productName = searchParams.get('name') || id.replace(/-/g, ' ')

  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingPhase, setLoadingPhase] = useState('Searching the internet...')
  const [isWatched, setIsWatched] = useState(false)
  const [showSpecs, setShowSpecs] = useState(false)
  const [copied, setCopied] = useState(false)
  const [source, setSource] = useState<string>('')

  useEffect(() => {
    // Check watchlist
    try {
      const wl = JSON.parse(localStorage.getItem('watchlist') || '[]')
      setIsWatched(wl.some((i: { id: string }) => i.id === id))
    } catch {}

    loadProduct()
  }, [id])

  async function loadProduct() {
    setLoading(true)

    // Check if we have mock data
    const mock = MOCK_PRODUCTS[id]
    if (mock) {
      setProduct(mock)
      setSource('demo')
      setLoading(false)
      return
    }

    // Load live prices and history in parallel
    setLoadingPhase('Fetching prices from all stores...')
    try {
      const query = productName

      const [pricesRes, historyRes] = await Promise.all([
        fetch(`/api/prices?id=${encodeURIComponent(id)}&q=${encodeURIComponent(query)}`).then((r) => r.json()),
        fetch(`/api/history?id=${encodeURIComponent(id)}`).then((r) => r.json()),
      ])

      const prices = pricesRes.prices || []
      const groqDetail = pricesRes.productDetail || null
      const history = groqDetail?.priceHistory || historyRes.history || []

      if (prices.length === 0 && history.length === 0) {
        setProduct(null)
        setLoading(false)
        return
      }

      const priceValues = prices.map((p: { price: number }) => p.price).filter(Boolean)
      const historyValues = history.map((p: { price: number }) => p.price).filter(Boolean)
      const allValues = [...priceValues, ...historyValues]
      const lowestCurrent = priceValues.length ? Math.min(...priceValues) : 0
      const highestCurrent = priceValues.length ? Math.max(...priceValues) : 0

      const assembled: ProductDetail = {
        // Groq fills in rich metadata; fallback to bare minimum
        ...groqDetail,
        id,
        name: groqDetail?.name || productName,
        image: groqDetail?.image || prices[0]?.image || '',
        currentPrices: prices,
        priceHistory: history,
        allTimeLow: groqDetail?.allTimeLow || (historyValues.length ? Math.min(...historyValues) : lowestCurrent),
        allTimeHigh: groqDetail?.allTimeHigh || (historyValues.length ? Math.max(...historyValues) : highestCurrent),
        averagePrice: groqDetail?.averagePrice || (allValues.length ? allValues.reduce((a: number, b: number) => a + b, 0) / allValues.length : 0),
        trendDirection: groqDetail?.trendDirection || 'stable',
        bestDeal: prices[0] || { shop: 'Unknown', price: 0, currency: 'AUD', inStock: false, url: '#', lastUpdated: new Date().toISOString() },
      }

      setProduct(assembled)
      setSource(pricesRes.source || '')
    } catch {
      setProduct(null)
    }

    setLoading(false)
  }

  function toggleWatch() {
    if (!product) return
    try {
      const wl = JSON.parse(localStorage.getItem('watchlist') || '[]')
      if (isWatched) {
        const updated = wl.filter((i: { id: string }) => i.id !== id)
        localStorage.setItem('watchlist', JSON.stringify(updated))
        setIsWatched(false)
      } else {
        const item = {
          id,
          name: product.name,
          price: Math.min(...product.currentPrices.map((p) => p.price)),
          image: product.image,
          trend: product.trendDirection,
        }
        localStorage.setItem('watchlist', JSON.stringify([item, ...wl]))
        setIsWatched(true)
      }
    } catch {}
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-20 h-20 bg-blue-600/20 border border-blue-500/30 rounded-3xl flex items-center justify-center">
          <Loader2 size={36} className="text-blue-400 animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-lg">{loadingPhase}</p>
          <p className="text-gray-500 text-sm mt-1">AI is searching Australian retailers for live prices</p>
        </div>
        <div className="flex gap-2 mt-2 flex-wrap justify-center">
          {['JB Hi-Fi', 'Harvey Norman', 'Kogan', 'Officeworks', 'Amazon AU'].map((shop) => (
            <span key={shop} className="text-xs text-gray-600 bg-gray-800 px-2 py-1 rounded-full">{shop}</span>
          ))}
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-4">😕</p>
        <h1 className="text-2xl font-bold text-white mb-3">Product not found</h1>
        <p className="text-gray-400 mb-6">We couldn't find pricing data for this product.</p>
        <Link href="/" className="text-blue-400 hover:underline">← Back to search</Link>
      </div>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-3">
          {source === 'groq' && (
            <span className="flex items-center gap-1.5 text-purple-400 text-xs bg-purple-400/10 border border-purple-400/20 px-3 py-1.5 rounded-full">
              ✦ AI-powered prices
            </span>
          )}
          {source === 'live' && (
            <span className="flex items-center gap-1.5 text-green-400 text-xs bg-green-400/10 border border-green-400/20 px-3 py-1.5 rounded-full">
              <Globe2 size={12} /> Live scraped
            </span>
          )}
          {source === 'demo' && (
            <span className="text-blue-400 text-xs bg-blue-400/10 border border-blue-400/20 px-3 py-1.5 rounded-full">
              Demo data
            </span>
          )}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-1.5 rounded-xl text-sm transition-all"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Share2 size={14} />}
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </div>

      {/* Product header */}
      <div className="flex gap-6 mb-8">
        {product.image && (
          <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-800 rounded-2xl overflow-hidden flex-shrink-0">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {product.brand && (
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-wide mb-1">{product.brand}</p>
          )}
          <h1 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2">{product.name}</h1>
          {product.category && (
            <span className="text-xs text-gray-500 bg-gray-800 border border-gray-700 px-2 py-1 rounded-full">
              {product.category}
            </span>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: chart + shop comparison */}
        <div className="lg:col-span-2 space-y-6">
          <PriceChart
            history={product.priceHistory}
            allTimeLow={product.allTimeLow}
            allTimeHigh={product.allTimeHigh}
          />

          <ShopComparison
            prices={product.currentPrices}
            bestDealShop={product.bestDeal?.shop}
          />

          {/* Price Match Report */}
          {product.currentPrices.length > 1 && (
            <PriceMatchReport
              productName={product.name}
              prices={product.currentPrices}
            />
          )}

          {/* Product specs */}
          {product.specs && Object.keys(product.specs).length > 0 && (
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <button
                onClick={() => setShowSpecs(!showSpecs)}
                className="flex items-center justify-between w-full text-white font-bold text-lg"
              >
                Specifications
                {showSpecs ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {showSpecs && (
                <div className="mt-4 space-y-3">
                  {Object.entries(product.specs).map(([key, val]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-gray-800 last:border-0">
                      <span className="text-gray-400 text-sm">{key}</span>
                      <span className="text-white text-sm font-medium text-right ml-4">{val}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h3 className="text-white font-bold text-lg mb-3">About this product</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{product.description}</p>
            </div>
          )}
        </div>

        {/* Right column: price stats + watchlist */}
        <div className="space-y-6">
          <PriceStats product={product} onWatch={toggleWatch} isWatched={isWatched} />

          {/* Price tip box */}
          <div className="bg-gradient-to-br from-blue-600/10 to-cyan-600/10 border border-blue-500/20 rounded-2xl p-5">
            <h4 className="text-white font-bold mb-2">💡 Price Tip</h4>
            <p className="text-gray-300 text-sm leading-relaxed">
              {product.trendDirection === 'down'
                ? 'Price is trending down. You might get an even better deal if you wait a few more days.'
                : product.trendDirection === 'up'
                ? 'Price is rising. If you need this now, buying soon might save you money.'
                : 'Price has been stable. Now is as good a time as any to buy.'}
            </p>
            <div className="mt-3 pt-3 border-t border-blue-500/20">
              <p className="text-gray-400 text-xs">
                Best time to buy: <span className="text-green-400 font-semibold">Holiday sales, Black Friday, Prime Day</span>
              </p>
            </div>
          </div>

          {/* Quick links */}
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <h4 className="text-white font-semibold mb-3">Quick Links</h4>
            <div className="space-y-2">
              {product.currentPrices.slice(0, 4).map((shop, i) => (
                <a
                  key={i}
                  href={shop.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <span className="text-gray-300 text-sm">{shop.shop}</span>
                  <span className="text-green-400 text-sm font-bold">
                    {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(shop.price)}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
