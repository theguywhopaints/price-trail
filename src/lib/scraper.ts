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

// StaticIce date format: "DD-MM-YYYY" → ISO string
function parseStaticIceDate(ddmmyyyy: string): string {
  const [d, m, y] = ddmmyyyy.split('-')
  return `${y}-${m}-${d}T00:00:00.000Z`
}

// Scrape StaticIce (Australian price comparison — server-rendered, reliable)
export async function fetchStaticIce(query: string): Promise<ShopPrice[]> {
  try {
    const url = `https://www.staticice.com.au/cgi-bin/search.cgi?q=${encodeURIComponent(query)}&stype=1`
    const res = await axios.get(url, { headers: HEADERS, timeout: 10000 })
    const $ = cheerio.load(res.data)
    const raw: ShopPrice[] = []

    // Each product row is <tr valign="top"> with two <td> children
    $('tr[valign="top"]').each((_, row) => {
      const tds = $(row).find('> td')
      if (tds.length < 2) return

      const priceLink = $(tds[0]).find('a[alt]').first()
      const priceText = priceLink.text().trim()
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ''))
      if (!price || price <= 0) return

      // Shop name is before the first ":" in the alt attribute
      const altText = priceLink.attr('alt') || ''
      const shopName = altText.split(':')[0].trim()
      if (!shopName) return

      // Decode the real product URL from the redirect href
      const redirectHref = priceLink.attr('href') || ''
      const newurlMatch = redirectHref.match(/newurl=([^&]+)/)
      const productUrl = newurlMatch ? decodeURIComponent(newurlMatch[1]) : ''

      // "updated: DD-MM-YYYY" inside the description cell
      const descText = $(tds[1]).text()
      const updatedMatch = descText.match(/updated:\s*(\d{2}-\d{2}-\d{4})/)
      const lastUpdated = updatedMatch ? parseStaticIceDate(updatedMatch[1]) : new Date().toISOString()

      raw.push({
        shop: shopName,
        price,
        currency: 'AUD',
        inStock: true,
        url: productUrl,
        lastUpdated,
        shipping: 'Check site',
      })
    })

    // Deduplicate by shop — keep the best (lowest) price per store
    const byShop = new Map<string, ShopPrice>()
    for (const entry of raw) {
      const existing = byShop.get(entry.shop)
      if (!existing || entry.price < existing.price) {
        byShop.set(entry.shop, entry)
      }
    }

    return Array.from(byShop.values()).sort((a, b) => a.price - b.price)
  } catch {
    return []
  }
}

// Scrape Google Shopping via Serper.dev (requires SERPER_API_KEY)
export async function fetchGoogleShoppingPrices(query: string): Promise<ShopPrice[]> {
  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) return []

  try {
    const res = await axios.post(
      'https://google.serper.dev/shopping',
      { q: query, gl: 'au', hl: 'en-AU', num: 20 },
      { headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' }, timeout: 8000 }
    )

    const items = res.data?.shopping || []
    return items.slice(0, 12).map((item: Record<string, unknown>) => ({
      shop: (item.source as string) || 'Unknown',
      price: parseFloat(((item.price as string) || '0').replace(/[^0-9.]/g, '')) || 0,
      currency: 'AUD',
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
      { q: query, gl: 'au', hl: 'en-AU', num: 10 },
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
