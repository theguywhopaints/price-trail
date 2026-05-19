'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bookmark, X, TrendingDown, TrendingUp, Minus } from 'lucide-react'

interface WatchItem {
  id: string
  name: string
  price: number
  image: string
  trend: 'up' | 'down' | 'stable'
}

function fmt(price: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
}

export default function Watchlist() {
  const [items, setItems] = useState<WatchItem[]>([])

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('watchlist') || '[]')
      setItems(saved)
    } catch {}
  }, [])

  function remove(id: string) {
    const updated = items.filter((i) => i.id !== id)
    setItems(updated)
    localStorage.setItem('watchlist', JSON.stringify(updated))
  }

  if (items.length === 0) return null

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <div className="flex items-center gap-2 mb-4">
        <Bookmark size={18} className="text-blue-400" />
        <h3 className="text-white font-bold">Your Watchlist</h3>
        <span className="text-xs bg-blue-600/30 text-blue-400 px-2 py-0.5 rounded-full">{items.length}</span>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const TrendIcon = item.trend === 'down' ? TrendingDown : item.trend === 'up' ? TrendingUp : Minus
          const trendColor = item.trend === 'down' ? 'text-green-400' : item.trend === 'up' ? 'text-red-400' : 'text-gray-400'

          return (
            <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-gray-600 transition-all">
              {item.image && (
                <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
              )}
              <Link href={`/product/${item.id}`} className="flex-1 min-w-0 hover:text-blue-400 transition-colors">
                <p className="text-white text-sm font-medium truncate">{item.name}</p>
                <p className="text-gray-400 text-sm font-bold">{fmt(item.price)}</p>
              </Link>
              <TrendIcon size={16} className={trendColor} />
              <button onClick={() => remove(item.id)} className="text-gray-600 hover:text-red-400 transition-colors ml-1">
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
