'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Clock, TrendingUp } from 'lucide-react'

const SUGGESTIONS = [
  'iPhone 15 Pro',
  'MacBook Air M3',
  'Sony WH-1000XM5',
  'PlayStation 5',
  'Samsung Galaxy S24',
  'AirPods Pro',
  'iPad Pro',
  'Nintendo Switch',
]

interface Props {
  initialValue?: string
  autoFocus?: boolean
  size?: 'sm' | 'lg'
}

export default function SearchBar({ initialValue = '', autoFocus = false, size = 'lg' }: Props) {
  const [query, setQuery] = useState(initialValue)
  const [focused, setFocused] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('recentSearches') || '[]')
      setRecentSearches(saved)
    } catch {}
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  function handleSearch(q: string) {
    const trimmed = q.trim()
    if (!trimmed) return

    // Save to recent searches
    try {
      const existing: string[] = JSON.parse(localStorage.getItem('recentSearches') || '[]')
      const updated = [trimmed, ...existing.filter((s) => s !== trimmed)].slice(0, 8)
      localStorage.setItem('recentSearches', JSON.stringify(updated))
    } catch {}

    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    setFocused(false)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch(query)
    if (e.key === 'Escape') setFocused(false)
  }

  const showDropdown = focused && (!query || recentSearches.length > 0 || SUGGESTIONS.length > 0)
  const filteredSuggestions = query
    ? SUGGESTIONS.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
    : SUGGESTIONS.slice(0, 4)

  return (
    <div className="relative w-full" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false) }}>
      <div className={`flex items-center gap-3 bg-gray-800 border rounded-2xl transition-all ${
        focused ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-gray-700 hover:border-gray-600'
      } ${size === 'lg' ? 'px-5 py-4' : 'px-4 py-3'}`}>
        <Search size={size === 'lg' ? 20 : 16} className="text-gray-400 flex-shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKey}
          placeholder="Search any product — iPhone, headphones, laptops..."
          className={`flex-1 bg-transparent outline-none text-white placeholder-gray-500 ${
            size === 'lg' ? 'text-lg' : 'text-base'
          }`}
        />
        {query && (
          <button onClick={() => setQuery('')} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X size={16} />
          </button>
        )}
        <button
          onMouseDown={(e) => { e.preventDefault(); handleSearch(query) }}
          className={`bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-colors flex-shrink-0 ${
            size === 'lg' ? 'px-5 py-2' : 'px-4 py-1.5 text-sm'
          }`}
        >
          Search
        </button>
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {recentSearches.length > 0 && !query && (
            <div className="p-3 border-b border-gray-700">
              <p className="text-gray-500 text-xs uppercase font-semibold px-2 mb-2">Recent</p>
              {recentSearches.map((s) => (
                <button
                  key={s}
                  onMouseDown={() => handleSearch(s)}
                  className="flex items-center gap-3 w-full px-2 py-2 rounded-xl hover:bg-gray-700 text-gray-300 text-sm transition-colors"
                >
                  <Clock size={14} className="text-gray-500" />
                  {s}
                </button>
              ))}
            </div>
          )}

          {filteredSuggestions.length > 0 && (
            <div className="p-3">
              <p className="text-gray-500 text-xs uppercase font-semibold px-2 mb-2">
                {query ? 'Suggestions' : 'Popular Searches'}
              </p>
              {filteredSuggestions.map((s) => (
                <button
                  key={s}
                  onMouseDown={() => handleSearch(s)}
                  className="flex items-center gap-3 w-full px-2 py-2 rounded-xl hover:bg-gray-700 text-gray-300 text-sm transition-colors"
                >
                  <TrendingUp size={14} className="text-blue-400" />
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
