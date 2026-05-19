'use client'

import Link from 'next/link'
import { TrendingDown, TrendingUp, Minus, ExternalLink } from 'lucide-react'
import { ProductDetail } from '@/lib/types'

interface Props {
  product: Partial<ProductDetail> & { id: string; name: string; image: string }
  showHistory?: boolean
}

function fmt(price: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
}

export default function ProductCard({ product, showHistory = true }: Props) {
  const lowestPrice = product.currentPrices
    ? Math.min(...product.currentPrices.map((p) => p.price))
    : undefined

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

  return (
    <Link
      href={`/product/${product.id}`}
      className="group block bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all hover:shadow-xl hover:shadow-blue-500/5"
    >
      {/* Image */}
      <div className="aspect-square bg-gray-800 overflow-hidden relative">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <ExternalLink size={32} />
          </div>
        )}
        {product.priceDropPercent && (
          <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{product.priceDropPercent}%
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        {product.brand && (
          <p className="text-blue-400 text-xs font-semibold uppercase tracking-wide mb-1">{product.brand}</p>
        )}
        <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 mb-3">{product.name}</h3>

        {lowestPrice !== undefined && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs mb-0.5">From</p>
              <p className="text-green-400 font-bold text-lg">{fmt(lowestPrice)}</p>
            </div>
            {product.trendDirection && (
              <div className={`flex items-center gap-1 ${trendColor}`}>
                <TrendIcon size={14} />
                <span className="text-xs capitalize">{product.trendDirection}</span>
              </div>
            )}
          </div>
        )}

        {showHistory && product.allTimeLow && (
          <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between text-xs text-gray-500">
            <span>Low: <span className="text-green-400 font-medium">{fmt(product.allTimeLow)}</span></span>
            <span>High: <span className="text-red-400 font-medium">{fmt(product.allTimeHigh || 0)}</span></span>
          </div>
        )}
      </div>
    </Link>
  )
}
