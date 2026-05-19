import Link from 'next/link'
import SearchBar from '@/components/SearchBar'
import { FEATURED_PRODUCTS } from '@/lib/mock-data'
import { TrendingDown, TrendingUp, Minus, ArrowRight, Globe2, BarChart3, ShieldCheck, FileSpreadsheet } from 'lucide-react'

function fmt(price: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(price)
}

const CATEGORIES = [
  { name: 'Laptops', icon: '💻', query: 'laptop macbook dell hp' },
  { name: 'Phones', icon: '📱', query: 'iphone samsung galaxy pixel' },
  { name: 'Headphones', icon: '🎧', query: 'sony bose airpods headphones' },
  { name: 'Gaming', icon: '🎮', query: 'ps5 xbox nintendo switch gaming' },
  { name: 'TVs', icon: '📺', query: 'samsung lg sony 4k tv oled' },
  { name: 'Cameras', icon: '📷', query: 'canon nikon sony camera mirrorless' },
  { name: 'Tablets', icon: '📟', query: 'ipad samsung galaxy tab' },
  { name: 'Wearables', icon: '⌚', query: 'apple watch samsung galaxy watch fitbit' },
]

const FEATURES = [
  {
    icon: Globe2,
    title: 'Live AU Price Search',
    desc: 'Scans JB Hi-Fi, Harvey Norman, Kogan, Officeworks, The Good Guys, PriceHipster and more in real-time',
  },
  {
    icon: BarChart3,
    title: 'Full Price History Charts',
    desc: 'Interactive charts showing price changes over 1 week to 12 months — spot sales instantly',
  },
  {
    icon: FileSpreadsheet,
    title: 'Price Match Reports',
    desc: 'One-click export of competitor pricing so your team can act fast on price match opportunities',
  },
  {
    icon: ShieldCheck,
    title: 'Built for Australian Retail',
    desc: 'AUD pricing, Australian retailers, and local store data — not a US-focused tool',
  },
]

const AU_RETAILERS = [
  'JB Hi-Fi', 'Harvey Norman', 'Officeworks', 'The Good Guys',
  'Kogan', 'Amazon AU', 'Bing Lee', 'Big W', 'Costco AU', 'Target AU',
]

export default function HomePage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6">

      {/* Retailer pitch banner */}
      <div className="mt-6 bg-gradient-to-r from-blue-600/15 to-cyan-600/10 border border-blue-500/20 rounded-2xl px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-gray-300 text-sm">
          <span className="text-blue-400 font-semibold">For retail teams:</span> Use PriceTrail to monitor competitors and generate price-match reports instantly.
        </p>
        <Link href="/product/iphone-15-pro" className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 whitespace-nowrap">
          See demo report <ArrowRight size={13} />
        </Link>
      </div>

      {/* Hero */}
      <section className="text-center py-16 md:py-24">
        <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 text-sm px-4 py-2 rounded-full mb-6">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Live prices from 10+ Australian retailers
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
          Australia&apos;s Price
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            History Tracker
          </span>
        </h1>

        <p className="text-gray-400 text-xl mb-4 max-w-2xl mx-auto">
          Search any product — we pull live prices from JB Hi-Fi, Harvey Norman, Kogan, Officeworks and more, with full price history charts.
        </p>
        <p className="text-gray-500 text-base mb-12 max-w-xl mx-auto">
          Perfect for retail teams to monitor competitor pricing and generate instant price-match reports.
        </p>

        <div className="max-w-3xl mx-auto">
          <SearchBar size="lg" />
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-6">
          {['iPhone 15 Pro', 'MacBook Air M3', 'PS5', 'Sony WH-1000XM5', 'LG OLED TV'].map((q) => (
            <Link
              key={q}
              href={`/search?q=${encodeURIComponent(q)}`}
              className="text-sm text-gray-400 hover:text-white border border-gray-800 hover:border-gray-600 px-3 py-1.5 rounded-full transition-all hover:bg-gray-800/50"
            >
              {q}
            </Link>
          ))}
        </div>
      </section>

      {/* Retailer logos strip */}
      <div className="mb-12 overflow-hidden">
        <p className="text-center text-gray-600 text-xs uppercase tracking-widest font-semibold mb-4">
          Tracks prices from these Australian retailers
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {AU_RETAILERS.map((r) => (
            <span key={r} className="text-sm text-gray-400 bg-gray-800/60 border border-gray-700/60 px-3 py-1.5 rounded-full">
              {r}
            </span>
          ))}
        </div>
      </div>

      {/* Features grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 flex gap-4">
            <div className="w-10 h-10 bg-blue-600/20 border border-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon size={18} className="text-blue-400" />
            </div>
            <div>
              <p className="text-white font-semibold mb-1">{title}</p>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Featured products */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Popular Products</h2>
            <p className="text-gray-500 text-sm mt-1">Click any product to see price history + competitor comparison</p>
          </div>
          <Link href="/search?q=electronics" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition-colors">
            Browse all <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {FEATURED_PRODUCTS.map((product) => {
            const trend = product.trend as string
            const TrendIcon = trend === 'down' ? TrendingDown : trend === 'up' ? TrendingUp : Minus
            const trendColor = trend === 'down' ? 'text-green-400' : trend === 'up' ? 'text-red-400' : 'text-gray-400'

            return (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="group bg-gray-900 border border-gray-800 hover:border-blue-500/40 rounded-2xl overflow-hidden transition-all hover:shadow-xl hover:shadow-blue-500/5"
              >
                <div className="aspect-square bg-gray-800 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3">
                  <p className="text-white text-sm font-semibold line-clamp-2 mb-2">{product.name}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-green-400 font-bold">{fmt(product.price)}</span>
                    <span className={`flex items-center gap-1 text-xs ${trendColor}`}>
                      <TrendIcon size={12} />
                      {product.trend}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Categories */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-white mb-6">Browse by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={`/search?q=${encodeURIComponent(cat.query)}`}
              className="flex items-center gap-3 bg-gray-900 border border-gray-800 hover:border-blue-500/40 rounded-xl p-4 transition-all hover:bg-gray-800/50 group"
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-white font-medium group-hover:text-blue-400 transition-colors">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* For retailers CTA */}
      <section className="mb-16 relative overflow-hidden bg-gradient-to-br from-blue-600/20 via-blue-900/10 to-cyan-600/10 border border-blue-500/20 rounded-3xl p-8 md:p-12">
        <div className="relative z-10">
          <p className="text-blue-400 text-sm font-semibold uppercase tracking-wider mb-3">For Retail Teams</p>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
            Built for Australian Price Matching
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-xl">
            Show your retail team exactly where competitors are undercutting you. Search any product, see all Australian prices side by side, and export a price-match report in one click.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { num: '10+', label: 'AU retailers tracked' },
              { num: '365', label: 'Days of price history' },
              { num: '1-click', label: 'CSV export for your team' },
            ].map(({ num, label }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <p className="text-3xl font-black text-white mb-1">{num}</p>
                <p className="text-gray-400 text-sm">{label}</p>
              </div>
            ))}
          </div>
          <Link
            href="/product/iphone-15-pro"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            See a live example <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="mb-16 bg-gray-900/40 border border-gray-800 rounded-3xl p-8 md:p-12">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '1', title: 'Search Any Product', desc: 'Type any product name. We search Australian retailers live — JB Hi-Fi, Harvey Norman, Kogan, Officeworks and more.' },
            { step: '2', title: 'See All AU Prices', desc: 'All prices side by side in AUD. Major retailers and online shops. See who is cheapest instantly.' },
            { step: '3', title: 'Export Price Match Report', desc: 'One click exports a CSV or text report your team can use immediately to match or beat competitor prices.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl mx-auto mb-4">
                {step}
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
