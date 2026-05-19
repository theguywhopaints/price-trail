import { ProductDetail, PricePoint } from './types'

function generateHistory(basePrice: number, days: number, volatility = 0.04): PricePoint[] {
  const points: PricePoint[] = []
  const now = new Date()
  let price = basePrice * 1.25

  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const change = (Math.random() - 0.48) * (basePrice * volatility)
    price = Math.max(basePrice * 0.72, Math.min(basePrice * 1.5, price + change))
    if (Math.random() < 0.05) price *= 0.88
    points.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(price * 100) / 100,
      shop: 'JB Hi-Fi',
    })
  }
  return points
}

// AUD prices + Australian retailers
export const MOCK_PRODUCTS: Record<string, ProductDetail> = {
  'iphone-15-pro': {
    id: 'iphone-15-pro',
    name: 'Apple iPhone 15 Pro 256GB',
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400',
    brand: 'Apple',
    category: 'Smartphones',
    asin: 'B0CHX1W1XY',
    description: 'The iPhone 15 Pro features a titanium design, A17 Pro chip, and a Pro camera system with 48MP main camera.',
    specs: {
      Display: '6.1-inch Super Retina XDR OLED',
      Chip: 'A17 Pro',
      Camera: '48MP Main + 12MP Ultra Wide + 12MP 3x Telephoto',
      Storage: '256GB',
      Battery: 'Up to 23 hours video playback',
      Connector: 'USB-C',
    },
    currentPrices: [
      { shop: 'JB Hi-Fi', price: 1849, currency: 'AUD', inStock: true, url: 'https://jbhifi.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free', rating: 4.7, reviews: 3241 },
      { shop: 'Harvey Norman', price: 1849, currency: 'AUD', inStock: true, url: 'https://harveynorman.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free', rating: 4.6, reviews: 1820 },
      { shop: 'Officeworks', price: 1799, currency: 'AUD', originalPrice: 1849, discount: 3, inStock: true, url: 'https://officeworks.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free' },
      { shop: 'Kogan', price: 1729, currency: 'AUD', originalPrice: 1849, discount: 6, inStock: true, url: 'https://kogan.com', lastUpdated: new Date().toISOString(), shipping: '$9.90' },
      { shop: 'The Good Guys', price: 1849, currency: 'AUD', inStock: false, url: 'https://thegoodguys.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free' },
      { shop: 'Amazon AU', price: 1749, currency: 'AUD', inStock: true, url: 'https://amazon.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free', rating: 4.5, reviews: 892 },
      { shop: 'Big W', price: 1799, currency: 'AUD', inStock: true, url: 'https://bigw.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free', isLocal: true },
      { shop: 'Bing Lee', price: 1849, currency: 'AUD', inStock: true, url: 'https://binglee.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free', isLocal: true },
      { shop: 'Costco AU', price: 1799, currency: 'AUD', inStock: true, url: 'https://costco.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free', isLocal: true },
    ],
    priceHistory: generateHistory(1849, 365),
    allTimeHigh: 2399,
    allTimeLow: 1449,
    averagePrice: 1799,
    priceDropPercent: 23,
    trendDirection: 'down',
    bestDeal: { shop: 'Kogan', price: 1729, currency: 'AUD', inStock: true, url: 'https://kogan.com', lastUpdated: new Date().toISOString(), shipping: '$9.90' },
  },

  'samsung-s24-ultra': {
    id: 'samsung-s24-ultra',
    name: 'Samsung Galaxy S24 Ultra 256GB',
    image: 'https://images.unsplash.com/photo-1706152568785-d6a69d76e3f6?w=400',
    brand: 'Samsung',
    category: 'Smartphones',
    currentPrices: [
      { shop: 'JB Hi-Fi', price: 1999, currency: 'AUD', originalPrice: 2199, discount: 9, inStock: true, url: 'https://jbhifi.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free', rating: 4.8, reviews: 2187 },
      { shop: 'Harvey Norman', price: 2099, currency: 'AUD', inStock: true, url: 'https://harveynorman.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free' },
      { shop: 'Kogan', price: 1899, currency: 'AUD', originalPrice: 2199, discount: 14, inStock: true, url: 'https://kogan.com', lastUpdated: new Date().toISOString(), shipping: '$9.90' },
      { shop: 'Officeworks', price: 2099, currency: 'AUD', inStock: true, url: 'https://officeworks.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free' },
      { shop: 'The Good Guys', price: 1999, currency: 'AUD', inStock: true, url: 'https://thegoodguys.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free', isLocal: true },
      { shop: 'Amazon AU', price: 1949, currency: 'AUD', inStock: true, url: 'https://amazon.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free', rating: 4.6, reviews: 654 },
      { shop: 'Bing Lee', price: 2099, currency: 'AUD', inStock: true, url: 'https://binglee.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free', isLocal: true },
    ],
    priceHistory: generateHistory(1999, 365),
    allTimeHigh: 2399,
    allTimeLow: 1599,
    averagePrice: 2099,
    priceDropPercent: 14,
    trendDirection: 'down',
    bestDeal: { shop: 'Kogan', price: 1899, currency: 'AUD', inStock: true, url: 'https://kogan.com', lastUpdated: new Date().toISOString(), shipping: '$9.90' },
  },

  'sony-wh1000xm5': {
    id: 'sony-wh1000xm5',
    name: 'Sony WH-1000XM5 Wireless Headphones',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    brand: 'Sony',
    category: 'Headphones',
    currentPrices: [
      { shop: 'JB Hi-Fi', price: 449, currency: 'AUD', originalPrice: 549, discount: 18, inStock: true, url: 'https://jbhifi.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free', rating: 4.8, reviews: 8234 },
      { shop: 'Harvey Norman', price: 479, currency: 'AUD', inStock: true, url: 'https://harveynorman.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free' },
      { shop: 'Officeworks', price: 459, currency: 'AUD', inStock: true, url: 'https://officeworks.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free' },
      { shop: 'Kogan', price: 429, currency: 'AUD', inStock: true, url: 'https://kogan.com', lastUpdated: new Date().toISOString(), shipping: '$9.90' },
      { shop: 'The Good Guys', price: 469, currency: 'AUD', inStock: true, url: 'https://thegoodguys.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free', isLocal: true },
      { shop: 'Amazon AU', price: 439, currency: 'AUD', inStock: true, url: 'https://amazon.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free', rating: 4.7, reviews: 3102 },
      { shop: 'Bing Lee', price: 479, currency: 'AUD', inStock: true, url: 'https://binglee.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free', isLocal: true },
      { shop: 'Big W', price: 449, currency: 'AUD', inStock: false, url: 'https://bigw.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free', isLocal: true },
    ],
    priceHistory: generateHistory(449, 365),
    allTimeHigh: 549,
    allTimeLow: 349,
    averagePrice: 469,
    priceDropPercent: 18,
    trendDirection: 'down',
    bestDeal: { shop: 'Kogan', price: 429, currency: 'AUD', inStock: true, url: 'https://kogan.com', lastUpdated: new Date().toISOString(), shipping: '$9.90' },
  },

  'ps5': {
    id: 'ps5',
    name: 'Sony PlayStation 5 Slim Console',
    image: 'https://images.unsplash.com/photo-1607853202273-232359e53e95?w=400',
    brand: 'Sony',
    category: 'Gaming',
    currentPrices: [
      { shop: 'JB Hi-Fi', price: 799, currency: 'AUD', inStock: true, url: 'https://jbhifi.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free', rating: 4.9, reviews: 12876 },
      { shop: 'Harvey Norman', price: 799, currency: 'AUD', inStock: true, url: 'https://harveynorman.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free' },
      { shop: 'Big W', price: 799, currency: 'AUD', inStock: true, url: 'https://bigw.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free', isLocal: true },
      { shop: 'Target AU', price: 799, currency: 'AUD', inStock: false, url: 'https://target.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free', isLocal: true },
      { shop: 'Kogan', price: 779, currency: 'AUD', inStock: true, url: 'https://kogan.com', lastUpdated: new Date().toISOString(), shipping: '$9.90' },
      { shop: 'Amazon AU', price: 789, currency: 'AUD', inStock: true, url: 'https://amazon.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free', rating: 4.8, reviews: 5432 },
      { shop: 'The Good Guys', price: 799, currency: 'AUD', inStock: true, url: 'https://thegoodguys.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free', isLocal: true },
    ],
    priceHistory: generateHistory(799, 365, 0.02),
    allTimeHigh: 999,
    allTimeLow: 699,
    averagePrice: 799,
    trendDirection: 'stable',
    bestDeal: { shop: 'Kogan', price: 779, currency: 'AUD', inStock: true, url: 'https://kogan.com', lastUpdated: new Date().toISOString(), shipping: '$9.90' },
  },

  'macbook-air-m3': {
    id: 'macbook-air-m3',
    name: 'Apple MacBook Air 13" M3 8GB 256GB',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
    brand: 'Apple',
    category: 'Laptops',
    specs: {
      Chip: 'Apple M3',
      Memory: '8GB Unified Memory',
      Storage: '256GB SSD',
      Display: '13.6-inch Liquid Retina',
      Battery: 'Up to 18 hours',
      Ports: '2x Thunderbolt 3, MagSafe 3, 3.5mm headphone jack',
    },
    currentPrices: [
      { shop: 'JB Hi-Fi', price: 1799, currency: 'AUD', originalPrice: 1899, discount: 5, inStock: true, url: 'https://jbhifi.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free', rating: 4.9, reviews: 4231 },
      { shop: 'Harvey Norman', price: 1899, currency: 'AUD', inStock: true, url: 'https://harveynorman.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free' },
      { shop: 'Officeworks', price: 1849, currency: 'AUD', inStock: true, url: 'https://officeworks.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free' },
      { shop: 'Kogan', price: 1749, currency: 'AUD', originalPrice: 1899, discount: 8, inStock: true, url: 'https://kogan.com', lastUpdated: new Date().toISOString(), shipping: '$9.90' },
      { shop: 'Amazon AU', price: 1779, currency: 'AUD', inStock: true, url: 'https://amazon.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free', rating: 4.8, reviews: 2109 },
      { shop: 'Costco AU', price: 1749, currency: 'AUD', inStock: true, url: 'https://costco.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free', isLocal: true },
      { shop: 'The Good Guys', price: 1849, currency: 'AUD', inStock: true, url: 'https://thegoodguys.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free', isLocal: true },
    ],
    priceHistory: generateHistory(1799, 365),
    allTimeHigh: 2199,
    allTimeLow: 1599,
    averagePrice: 1849,
    priceDropPercent: 8,
    trendDirection: 'stable',
    bestDeal: { shop: 'Kogan', price: 1749, currency: 'AUD', inStock: true, url: 'https://kogan.com', lastUpdated: new Date().toISOString(), shipping: '$9.90' },
  },

  'lg-c3-oled-55': {
    id: 'lg-c3-oled-55',
    name: 'LG C3 55" OLED 4K Smart TV',
    image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400',
    brand: 'LG',
    category: 'TVs',
    specs: {
      Display: '55-inch OLED evo',
      Resolution: '4K UHD (3840 x 2160)',
      'Smart TV': 'webOS 23',
      HDR: 'Dolby Vision, HDR10, HLG',
      'Gaming': 'NVIDIA G-Sync, AMD FreeSync, 4x HDMI 2.1',
    },
    currentPrices: [
      { shop: 'JB Hi-Fi', price: 2495, currency: 'AUD', originalPrice: 3495, discount: 29, inStock: true, url: 'https://jbhifi.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free', rating: 4.8, reviews: 6123 },
      { shop: 'Harvey Norman', price: 2695, currency: 'AUD', inStock: true, url: 'https://harveynorman.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free' },
      { shop: 'The Good Guys', price: 2495, currency: 'AUD', inStock: true, url: 'https://thegoodguys.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free', isLocal: true },
      { shop: 'Bing Lee', price: 2599, currency: 'AUD', inStock: true, url: 'https://binglee.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free', isLocal: true },
      { shop: 'Kogan', price: 2299, currency: 'AUD', originalPrice: 3495, discount: 34, inStock: true, url: 'https://kogan.com', lastUpdated: new Date().toISOString(), shipping: '$19.90' },
      { shop: 'Amazon AU', price: 2449, currency: 'AUD', inStock: true, url: 'https://amazon.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free', rating: 4.7, reviews: 1987 },
      { shop: 'Costco AU', price: 2399, currency: 'AUD', inStock: true, url: 'https://costco.com.au', lastUpdated: new Date().toISOString(), shipping: 'Free', isLocal: true },
    ],
    priceHistory: generateHistory(2495, 365, 0.06),
    allTimeHigh: 3995,
    allTimeLow: 1999,
    averagePrice: 2799,
    priceDropPercent: 37,
    trendDirection: 'down',
    bestDeal: { shop: 'Kogan', price: 2299, currency: 'AUD', inStock: true, url: 'https://kogan.com', lastUpdated: new Date().toISOString(), shipping: '$19.90' },
  },
}

export const FEATURED_PRODUCTS = [
  { id: 'iphone-15-pro', name: 'iPhone 15 Pro 256GB', image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300', price: 1849, trend: 'down' as const },
  { id: 'sony-wh1000xm5', name: 'Sony WH-1000XM5', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300', price: 449, trend: 'down' as const },
  { id: 'ps5', name: 'PlayStation 5 Slim', image: 'https://images.unsplash.com/photo-1607853202273-232359e53e95?w=300', price: 799, trend: 'stable' as const },
  { id: 'macbook-air-m3', name: 'MacBook Air M3', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300', price: 1799, trend: 'down' as const },
]

export function searchMockProducts(query: string) {
  const q = query.toLowerCase()
  return Object.values(MOCK_PRODUCTS).filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
  )
}
