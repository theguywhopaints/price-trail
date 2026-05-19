'use client'

import { useState } from 'react'
import { ShopPrice } from '@/lib/types'
import { ExternalLink, Star, Truck, MapPin } from 'lucide-react'

interface Props {
  prices: ShopPrice[]
}

function fmt(price: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(price)
}

const SHOP_COLORS: Record<string, string> = {
  'JB Hi-Fi': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Harvey Norman': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Officeworks: 'bg-red-500/10 text-red-400 border-red-500/20',
  Kogan: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'The Good Guys': 'bg-green-500/10 text-green-400 border-green-500/20',
  'Amazon AU': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Bing Lee': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Big W': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Target AU': 'bg-red-500/10 text-red-400 border-red-500/20',
  'Costco AU': 'bg-teal-500/10 text-teal-400 border-teal-500/20',
}

function ShopBadge({ name }: { name: string }) {
  const cls = SHOP_COLORS[name] || 'bg-gray-700/50 text-gray-300 border-gray-600'
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cls}`}>
      {name}
    </span>
  )
}

export default function ShopComparison({ prices }: Props) {
  const [showAll, setShowAll] = useState(false)
  const [filter, setFilter] = useState<'all' | 'major' | 'local'>('all')

  const filtered = prices.filter((p) => {
    if (filter === 'local') return p.isLocal
    if (filter === 'major') return !p.isLocal
    return true
  })

  const displayed = showAll ? filtered : filtered.slice(0, 5)
  const lowestPrice = Math.min(...prices.map((p) => p.price))

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-white font-bold text-lg">Compare Prices</h3>
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
          {(['all', 'major', 'local'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all ${
                filter === f ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {f === 'all' ? 'All Stores' : f === 'major' ? 'Major' : 'Local'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {displayed.map((shop, i) => {
          const isBest = shop.price === lowestPrice
          const savings = shop.originalPrice ? shop.originalPrice - shop.price : 0

          return (
            <div
              key={i}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:border-gray-600 ${
                isBest
                  ? 'border-green-500/40 bg-green-500/5'
                  : 'border-gray-800 bg-gray-800/30'
              }`}
            >
              {/* Rank */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                isBest ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'
              }`}>
                {i + 1}
              </div>

              {/* Shop info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <ShopBadge name={shop.shop} />
                  {isBest && (
                    <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-semibold">
                      Best Deal
                    </span>
                  )}
                  {shop.isLocal && (
                    <span className="flex items-center gap-1 text-xs text-purple-400">
                      <MapPin size={10} /> Local
                    </span>
                  )}
                  {!shop.inStock && (
                    <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Out of Stock</span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {shop.shipping && (
                    <span className="flex items-center gap-1">
                      <Truck size={11} />
                      {shop.shipping === 'Free' ? <span className="text-green-400">Free shipping</span> : shop.shipping}
                    </span>
                  )}
                  {shop.rating && (
                    <span className="flex items-center gap-1">
                      <Star size={11} className="text-yellow-400 fill-yellow-400" />
                      {shop.rating} ({shop.reviews?.toLocaleString()})
                    </span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-2">
                  {shop.originalPrice && (
                    <span className="text-gray-500 line-through text-sm">{fmt(shop.originalPrice)}</span>
                  )}
                  <span className={`font-bold text-lg ${isBest ? 'text-green-400' : 'text-white'}`}>
                    {fmt(shop.price)}
                  </span>
                </div>
                {savings > 0 && (
                  <p className="text-green-400 text-xs">Save {fmt(savings)}</p>
                )}
              </div>

              {/* Link */}
              <a
                href={shop.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 w-9 h-9 bg-gray-700 hover:bg-blue-600 rounded-xl flex items-center justify-center transition-colors"
              >
                <ExternalLink size={14} className="text-gray-300" />
              </a>
            </div>
          )
        })}
      </div>

      {filtered.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-4 py-2.5 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-xl transition-all"
        >
          {showAll ? 'Show less' : `Show ${filtered.length - 5} more stores`}
        </button>
      )}
    </div>
  )
}
