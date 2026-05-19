import axios from 'axios'
import * as cheerio from 'cheerio'
import { ShopPrice, PricePoint, Product } from './types'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-AU,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate',
  'Connection': 'keep-alive',
}

// Scrape PriceHipster (Australian price comparison)
export async function fetchPriceHipster(query: string): Promise<ShopPrice[]> {
  try {
    const url = `https://www.pricehipster.com/search?q=${encodeURIComponent(query)}`
    const res = await axios.get(url, { headers: HEADERS, timeout: 8000 })
    const $ = cheerio.load(res.data)
    const results: ShopPrice[] = []

    // PriceHipster product cards
    $('.search-result, .product-item, [data-price]').each((_, el) => {
      const shop = $(el).find('.merchant-name, .shop-name, [class*="merchant"]').first().text().trim()
      const priceText = $(el).find('.price, [class*="price"]').first().text().trim()
      const link = $(el).find('a').first().attr('href') || '#'
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ''))

      if (shop && price > 0) {
        results.push({
          shop,
          price,
          currency: 'AUD',
          inStock: true,
          url: link.startsWith('http') ? link : `https://www.pricehipster.com${link}`,
          lastUpdated: new Date().toISOString(),
          shipping: 'Check site',
        })
      }
    })

    return results.filter((r) => r.price > 0).slice(0, 10)
  } catch {
    return []
  }
}

// Scrape StaticIce (Australian price comparison)
export async function fetchStaticIce(query: string): Promise<ShopPrice[]> {
  try {
    const url = `https://www.staticice.com.au/cgi-bin/search.cgi?q=${encodeURIComponent(query)}&stype=1`
    const res = await axios.get(url, { headers: HEADERS, timeout: 8000 })
    const $ = cheerio.load(res.data)
    const results: ShopPrice[] = []

    $('table.search-result tr, .product-row').each((_, el) => {
      const cells = $(el).find('td')
      if (cells.length >= 3) {
        const shop = $(cells[0]).text().trim()
        const priceText = $(cells[1]).text().trim()
        const link = $(cells[0]).find('a').attr('href') || '#'
        const price = parseFloat(priceText.replace(/[^0-9.]/g, ''))

        if (shop && price > 0) {
          results.push({
            shop,
            price,
            currency: 'AUD',
            inStock: true,
            url: link.startsWith('http') ? link : `https://www.staticice.com.au${link}`,
            lastUpdated: new Date().toISOString(),
            shipping: 'Check site',
          })
        }
      }
    })

    return results.filter((r) => r.price > 0).slice(0, 10)
  } catch {
    return []
  }
}

// Serper.dev Google Shopping API
export async function fetchGoogleShoppingPrices(query: string): Promise<ShopPrice[]> {
  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) return []

  try {
    const res = await axios.post(
      'https://google.serper.dev/shopping',
      { q: query, gl: 'us', hl: 'en', num: 20 },
      { headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' }, timeout: 8000 }
    )

    const items = res.data?.shopping || []
    return items.slice(0, 12).map((item: Record<string, unknown>) => ({
      shop: (item.source as string) || 'Unknown',
      price: parseFloat(((item.price as string) || '0').replace(/[^0-9.]/g, '')) || 0,
      currency: 'USD',
      originalPrice: item.oldPrice ? parseFloat(((item.oldPrice as string) || '').replace(/[^0-9.]/g, '')) : undefined,
      discount: item.discount ? parseInt(String(item.discount)) : undefined,
      inStock: true,
      url: (item.link as string) || '#',
      lastUpdated: new Date().toISOString(),
      shipping: (item.delivery as string) || 'Check site',
      rating: item.rating ? parseFloat(String(item.rating)) : undefined,
      reviews: item.ratingCount ? parseInt(String(item.ratingCount)) : undefined,
    })).filter((p: ShopPrice) => p.price > 0)
  } catch {
    return []
  }
}

// Scrape CamelCamelCamel for Amazon price history
export async function fetchCamelHistory(asin: string): Promise<PricePoint[]> {
  try {
    const url = `https://camelcamelcamel.com/product/${asin}`
    const res = await axios.get(url, { headers: HEADERS, timeout: 10000 })
    const $ = cheerio.load(res.data)

    const points: PricePoint[] = []

    // Extract current price data points from the page scripts
    $('script').each((_, el) => {
      const content = $(el).html() || ''
      const match = content.match(/amazon_prices\s*=\s*(\[[\s\S]*?\])/)
      if (match) {
        try {
          const raw = JSON.parse(match[1])
          raw.forEach((entry: [number, number]) => {
            if (Array.isArray(entry) && entry.length >= 2) {
              points.push({
                date: new Date(entry[0] * 1000).toISOString().split('T')[0],
                price: entry[1] / 100,
                shop: 'Amazon',
              })
            }
          })
        } catch {
          // parse error, skip
        }
      }
    })

    return points.sort((a, b) => a.date.localeCompare(b.date))
  } catch {
    return []
  }
}

// Search Google Shopping via Serper for product list
export async function searchProductsOnline(query: string): Promise<Product[]> {
  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) return []

  try {
    const res = await axios.post(
      'https://google.serper.dev/shopping',
      { q: query, gl: 'us', hl: 'en', num: 10 },
      { headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' }, timeout: 8000 }
    )

    const items = res.data?.shopping || []
    const seen = new Set<string>()
    const products: Product[] = []

    items.forEach((item: Record<string, unknown>) => {
      const name = (item.title as string) || ''
      const key = name.toLowerCase().slice(0, 30)
      if (!seen.has(key) && name) {
        seen.add(key)
        products.push({
          id: key.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          name,
          image: (item.imageUrl as string) || '',
          brand: extractBrand(name),
        })
      }
    })

    return products
  } catch {
    return []
  }
}

function extractBrand(name: string): string {
  const brands = ['Apple', 'Samsung', 'Sony', 'LG', 'Dell', 'HP', 'Lenovo', 'Asus', 'Google', 'Microsoft', 'Bose', 'JBL', 'Nike', 'Adidas', 'Canon', 'Nikon']
  return brands.find((b) => name.includes(b)) || ''
}
