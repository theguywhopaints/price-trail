'use client'

import { useState, useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { PricePoint } from '@/lib/types'
import { format, subDays } from 'date-fns'

interface Props {
  history: PricePoint[]
  allTimeLow: number
  allTimeHigh: number
  currency?: string
}

const RANGES = [
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
  { label: 'All', days: 0 },
]

function fmt(price: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price)
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{value: number}>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 shadow-2xl">
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        <p className="text-white font-bold text-lg">{fmt(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

export default function PriceChart({ history, allTimeLow, allTimeHigh, currency = 'USD' }: Props) {
  const [range, setRange] = useState('1M')

  const filtered = useMemo(() => {
    const selected = RANGES.find((r) => r.label === range)
    if (!selected || selected.days === 0) return history

    const cutoff = subDays(new Date(), selected.days).toISOString().split('T')[0]
    return history.filter((p) => p.date >= cutoff)
  }, [history, range])

  const prices = filtered.map((p) => p.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const firstPrice = prices[0] || 0
  const lastPrice = prices[prices.length - 1] || 0
  const change = lastPrice - firstPrice
  const changePct = firstPrice ? ((change / firstPrice) * 100).toFixed(1) : '0'
  const isPositive = change >= 0

  const chartData = filtered.map((p) => ({
    date: format(new Date(p.date), 'MMM d'),
    fullDate: p.date,
    price: p.price,
  }))

  const gradientId = 'priceGradient'
  const strokeColor = isPositive ? '#f87171' : '#34d399'
  const fillColor = isPositive ? '#f87171' : '#34d399'

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-gray-400 text-sm mb-1">Price History</p>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-white">{fmt(lastPrice, currency)}</span>
            <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${isPositive ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
              {isPositive ? '▲' : '▼'} {Math.abs(Number(changePct))}%
            </span>
          </div>
        </div>

        <div className="flex gap-1 bg-gray-800 rounded-xl p-1">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setRange(r.label)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                range === r.label
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={fillColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={fillColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[minPrice * 0.95, maxPrice * 1.05]}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v}`}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={allTimeLow} stroke="#34d399" strokeDasharray="4 4" label={{ value: 'All-time low', fill: '#34d399', fontSize: 10, position: 'insideTopLeft' }} />
            <ReferenceLine y={allTimeHigh} stroke="#f87171" strokeDasharray="4 4" label={{ value: 'All-time high', fill: '#f87171', fontSize: 10, position: 'insideBottomLeft' }} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={strokeColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 5, fill: strokeColor, stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-800">
        <div className="text-center">
          <p className="text-gray-500 text-xs mb-1">All-time low</p>
          <p className="text-green-400 font-bold">{fmt(allTimeLow, currency)}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-xs mb-1">Average</p>
          <p className="text-gray-300 font-bold">{fmt((minPrice + maxPrice) / 2, currency)}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-xs mb-1">All-time high</p>
          <p className="text-red-400 font-bold">{fmt(allTimeHigh, currency)}</p>
        </div>
      </div>
    </div>
  )
}
