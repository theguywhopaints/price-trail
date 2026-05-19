export interface Product {
  id: string
  name: string
  image: string
  brand?: string
  category?: string
  asin?: string // Amazon Standard Identification Number
}

export interface ShopPrice {
  shop: string
  shopLogo?: string
  price: number
  currency: string
  originalPrice?: number
  discount?: number
  inStock: boolean
  url: string
  lastUpdated: string
  isLocal?: boolean
  shipping?: string
  rating?: number
  reviews?: number
}

export interface PricePoint {
  date: string
  price: number
  shop: string
}

export interface ProductDetail extends Product {
  description?: string
  specs?: Record<string, string>
  currentPrices: ShopPrice[]
  priceHistory: PricePoint[]
  allTimeHigh: number
  allTimeLow: number
  averagePrice: number
  priceDropPercent?: number
  trendDirection: 'up' | 'down' | 'stable'
  bestDeal: ShopPrice
}

export interface SearchResult {
  products: Product[]
  query: string
}
