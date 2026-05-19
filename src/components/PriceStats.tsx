'use client'

import { TrendingDown, TrendingUp, Minus, Bell, Bookmark } from 'lucide-react'
import { ProductDetail } from '@/lib/types'

interface Props {
  product: ProductDetail
  onWatch?: () => void
  isWatched?: boolean
}

function fmt(price: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(price)
}

export default function PriceStats({ product, onWatch, isWatched }: Props) {
  const TrendIcon =
    product.trendDirection === 'down'
      ? TrendingDown
      : product.trendDirection === 'up'
      ? TrendingUp
      : Minus

  const trendColor =
    product.trendDirection === 'down'
      ? 'text-green-400'
      : product.trendDirection === 'up'
      ? 'text-red-400'
      : 'text-gray-400'

  const trendLabel =
    product.trendDirection === 'down'
      ? 'Price dropping'
      : product.trendDirection === 'up'
      ? 'Price rising'
      : 'Price stable'

  const currentLowest = Math.min(...product.currentPrices.map((p) => p.price))
  const savingsFromHigh = product.allTimeHigh - currentLowest
  const savingsPct = ((savingsFromHigh / product.allTimeHigh) * 100).toFixed(0)

  return (
    <div className="space-y-4">
      {/* Current best price */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <p className="text-gray-400 text-sm mb-2">Best price right now</p>
        <div className="flex items-end justify-between">
          <div>
            <span className="text-4xl font-black text-green-400">{fmt(currentLowest)}</span>
            <p className="text-gray-400 text-sm mt-1">at {product.bestDeal.shop}</p>
          </div>
          <div className={`flex items-center gap-2 ${trendColor}`}>
            <TrendIcon size={20} />
            <span className="text-sm font-semibold">{trendLabel}</span>
          </div>
        </div>

        {product.priceDropPercent && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
            <p className="text-green-400 text-sm font-medium">
              🔥 {product.priceDropPercent}% below all-time high — great time to buy!
            </p>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-1">All-time low</p>
          <p className="text-green-400 font-bold text-xl">{fmt(product.allTimeLow)}</p>
          <p className="text-gray-600 text-xs mt-1">Lowest ever recorded</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-1">All-time high</p>
          <p className="text-red-400 font-bold text-xl">{fmt(product.allTimeHigh)}</p>
          <p className="text-gray-600 text-xs mt-1">Peak price</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-1">Average price</p>
          <p className="text-white font-bold text-xl">{fmt(product.averagePrice)}</p>
          <p className="text-gray-600 text-xs mt-1">Typical price</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-1">You save vs peak</p>
          <p className="text-blue-400 font-bold text-xl">{fmt(savingsFromHigh)}</p>
          <p className="text-gray-600 text-xs mt-1">{savingsPct}% below high</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={onWatch}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all border ${
            isWatched
              ? 'bg-blue-600/20 border-blue-500/40 text-blue-400 hover:bg-blue-600/30'
              : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-blue-500 hover:text-blue-400'
          }`}
        >
          <Bookmark size={16} fill={isWatched ? 'currentColor' : 'none'} />
          {isWatched ? 'Watching' : 'Add to Watchlist'}
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-500 text-white transition-all">
          <Bell size={16} />
          Price Alert
        </button>
      </div>
    </div>
  )
}
