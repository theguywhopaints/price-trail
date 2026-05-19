'use client'

import { useState } from 'react'
import { ShopPrice } from '@/lib/types'
import { FileText, Download, TrendingDown, AlertCircle, CheckCircle2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  productName: string
  prices: ShopPrice[]
  targetShop?: string
}

function fmt(price: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(price)
}


export default function PriceMatchReport({ productName, prices, targetShop }: Props) {
  const [selectedShop, setSelectedShop] = useState(targetShop || prices[0]?.shop || '')
  const [open, setOpen] = useState(true)

  const myShopPrice = prices.find((p) => p.shop === selectedShop)
  const competitors = prices
    .filter((p) => p.shop !== selectedShop && p.inStock)
    .sort((a, b) => a.price - b.price)

  const lowestCompetitor = competitors[0]
  const canPriceMatch = lowestCompetitor && myShopPrice && lowestCompetitor.price < myShopPrice.price
  const savings = myShopPrice && lowestCompetitor ? myShopPrice.price - lowestCompetitor.price : 0
  const savingsPct = myShopPrice && savings ? ((savings / myShopPrice.price) * 100).toFixed(1) : '0'

  function exportCSV() {
    const rows = [
      ['Store', 'Price (AUD)', 'In Stock', 'Discount', 'URL'],
      ...prices.map((p) => [
        p.shop,
        p.price.toFixed(2),
        p.inStock ? 'Yes' : 'No',
        p.discount ? `${p.discount}%` : '-',
        p.url,
      ]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `price-match-${productName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  function exportText() {
    const lines = [
      `PRICE MATCH REPORT`,
      `Product: ${productName}`,
      `Generated: ${new Date().toLocaleString('en-AU')}`,
      ``,
      `YOUR STORE (${selectedShop}): ${myShopPrice ? fmt(myShopPrice.price) : 'Not listed'}`,
      ``,
      `COMPETITOR PRICES:`,
      ...competitors.map((p, i) => `  ${i + 1}. ${p.shop}: ${fmt(p.price)}${p.discount ? ` (${p.discount}% off)` : ''}`),
      ``,
      canPriceMatch
        ? `ACTION REQUIRED: ${lowestCompetitor.shop} is selling at ${fmt(lowestCompetitor.price)} — ${savingsPct}% cheaper.`
        : `STATUS: You are already competitive or have the best price.`,
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `price-match-report-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
  }

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${
      canPriceMatch ? 'border-orange-500/40 bg-orange-500/5' : 'border-green-500/30 bg-green-500/5'
    }`}>
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            canPriceMatch ? 'bg-orange-500/20' : 'bg-green-500/20'
          }`}>
            {canPriceMatch ? (
              <AlertCircle size={20} className="text-orange-400" />
            ) : (
              <CheckCircle2 size={20} className="text-green-400" />
            )}
          </div>
          <div>
            <p className={`font-bold text-lg ${canPriceMatch ? 'text-orange-300' : 'text-green-300'}`}>
              {canPriceMatch ? 'Price Match Opportunity' : 'You Have the Best Price'}
            </p>
            <p className="text-gray-400 text-sm">
              {canPriceMatch
                ? `${lowestCompetitor?.shop} is ${savingsPct}% cheaper — action needed`
                : 'No price matching required right now'}
            </p>
          </div>
        </div>
        {open ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4">
          {/* Select your store */}
          <div>
            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-2">
              Your Store
            </label>
            <select
              value={selectedShop}
              onChange={(e) => setSelectedShop(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              {prices.map((p) => (
                <option key={p.shop} value={p.shop}>{p.shop}</option>
              ))}
            </select>
          </div>

          {/* Your price vs competition */}
          {myShopPrice && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700">
                <p className="text-gray-500 text-xs mb-1">{selectedShop}</p>
                <p className="text-white font-black text-2xl">{fmt(myShopPrice.price)}</p>
                <p className="text-gray-500 text-xs mt-1">Your current price</p>
              </div>
              {lowestCompetitor && (
                <div className={`rounded-xl p-4 border ${
                  canPriceMatch
                    ? 'bg-orange-500/10 border-orange-500/30'
                    : 'bg-green-500/10 border-green-500/30'
                }`}>
                  <p className="text-gray-400 text-xs mb-1">Lowest competitor</p>
                  <p className={`font-black text-2xl ${canPriceMatch ? 'text-orange-400' : 'text-green-400'}`}>
                    {fmt(lowestCompetitor.price)}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">{lowestCompetitor.shop}</p>
                </div>
              )}
            </div>
          )}

          {/* Savings callout */}
          {canPriceMatch && lowestCompetitor && (
            <div className="bg-orange-500/10 border border-orange-500/25 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <TrendingDown size={18} className="text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-orange-300 font-semibold text-sm">Match this price to stay competitive</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Reduce your price from <strong className="text-white">{fmt(myShopPrice!.price)}</strong> to{' '}
                    <strong className="text-green-400">{fmt(lowestCompetitor.price)}</strong> to match{' '}
                    <a href={lowestCompetitor.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1">
                      {lowestCompetitor.shop} <ExternalLink size={11} />
                    </a>
                  </p>
                  <p className="text-gray-500 text-xs mt-2">
                    Customer saves {fmt(savings)} ({savingsPct}%)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* All competitor table */}
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">All Competitor Prices</p>
            <div className="space-y-2">
              {competitors.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-800/40 rounded-xl border border-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 text-xs w-5">{i + 1}.</span>
                    <span className="text-gray-300 text-sm">{p.shop}</span>
                    {!p.inStock && <span className="text-xs text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">Out of stock</span>}
                    {p.discount && <span className="text-xs text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">-{p.discount}%</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold text-sm ${
                      myShopPrice && p.price < myShopPrice.price ? 'text-orange-400' : 'text-gray-300'
                    }`}>
                      {fmt(p.price)}
                    </span>
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-400 transition-colors">
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Export buttons */}
          <div className="flex gap-3 pt-2 border-t border-gray-800">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-xl text-sm font-medium transition-all"
            >
              <Download size={14} />
              Export CSV
            </button>
            <button
              onClick={exportText}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-xl text-sm font-medium transition-all"
            >
              <FileText size={14} />
              Export Report
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
