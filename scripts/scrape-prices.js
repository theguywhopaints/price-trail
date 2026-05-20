/**
 * Playwright price scraper for AU retailers that block server-side requests.
 * Runs on self-hosted GitHub Actions runner (residential IP bypasses Incapsula).
 *
 * Usage: node scripts/scrape-prices.js
 * Output: src/data/scraped-prices.json
 */

const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

// ─── Retailer scrape configs ────────────────────────────────────────────────

const RETAILERS = {
  'Harvey Norman': {
    searchUrl: (q) => `https://www.harveynorman.com.au/catalogsearch/result/?q=${encodeURIComponent(q)}`,
    waitFor: '.product-item-info, .product-item',
    extractPrices: () => {
      const items = []
      document.querySelectorAll('.product-item').forEach((el) => {
        const name = el.querySelector('.product-item-name a, .product-name')?.textContent?.trim()
        const priceEl = el.querySelector('[data-price-type="finalPrice"] .price, .price-final_price .price, .price')
        const price = priceEl?.textContent?.trim()
        const link = el.querySelector('a.product-item-link, a')?.href
        if (name && price) items.push({ name, price, link })
      })
      return items
    },
  },
  'JB Hi-Fi': {
    searchUrl: (q) => `https://www.jbhifi.com.au/search?q=${encodeURIComponent(q)}`,
    waitFor: '[data-testid="product-card"], .product-card, article',
    extractPrices: () => {
      const items = []
      document.querySelectorAll('[data-testid="product-card"], article.product-card, [class*="ProductCard"]').forEach((el) => {
        const name = el.querySelector('h3, h2, [class*="title"], [data-testid="product-title"]')?.textContent?.trim()
        const priceEl = el.querySelector('[class*="price"], [data-testid*="price"]')
        const price = priceEl?.textContent?.trim()
        const link = el.querySelector('a')?.href
        if (name && price) items.push({ name, price, link })
      })
      return items
    },
  },
  'The Good Guys': {
    searchUrl: (q) => `https://www.thegoodguys.com.au/SearchDisplay?searchTerm=${encodeURIComponent(q)}`,
    waitFor: '.product-tile, [class*="ProductTile"]',
    extractPrices: () => {
      const items = []
      document.querySelectorAll('.product-tile, [class*="ProductTile"]').forEach((el) => {
        const name = el.querySelector('[class*="name"], [class*="title"], h3')?.textContent?.trim()
        const price = el.querySelector('[class*="price"]')?.textContent?.trim()
        const link = el.querySelector('a')?.href
        if (name && price) items.push({ name, price, link })
      })
      return items
    },
  },
  'Bing Lee': {
    searchUrl: (q) => `https://www.binglee.com.au/search?q=${encodeURIComponent(q)}`,
    waitFor: '.product-item, [class*="product"]',
    extractPrices: () => {
      const items = []
      document.querySelectorAll('.product-item, [class*="ProductItem"]').forEach((el) => {
        const name = el.querySelector('.product-name, h2, [class*="name"]')?.textContent?.trim()
        const price = el.querySelector('.price, [class*="price"]')?.textContent?.trim()
        const link = el.querySelector('a')?.href
        if (name && price) items.push({ name, price, link })
      })
      return items
    },
  },
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function parsePrice(text) {
  if (!text) return 0
  const match = text.replace(/,/g, '').match(/[\d]+\.?\d*/)
  return match ? parseFloat(match[0]) : 0
}

function bestMatchPrice(items, query) {
  if (!items || items.length === 0) return null
  const q = query.toLowerCase()

  // Score each item by how well the name matches the query tokens
  const scored = items
    .map((item) => {
      const name = (item.name || '').toLowerCase()
      const tokens = q.split(/\s+/).filter((t) => t.length > 2)
      const matches = tokens.filter((t) => name.includes(t)).length
      const price = parsePrice(item.price)
      return { ...item, score: matches, price }
    })
    .filter((i) => i.score > 0 && i.price > 0)
    .sort((a, b) => b.score - a.score || a.price - b.price)

  return scored[0] || null
}

async function scrapeRetailer(browser, retailerName, config, query) {
  const page = await browser.newPage()
  try {
    console.log(`  → ${retailerName}: searching for "${query}"`)
    await page.goto(config.searchUrl(query), {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    })

    // Wait for product cards to appear (up to 8s)
    try {
      await page.waitForSelector(config.waitFor, { timeout: 8000 })
    } catch {
      console.log(`    ⚠ ${retailerName}: no product cards found within 8s`)
    }

    const items = await page.evaluate(config.extractPrices)
    const best = bestMatchPrice(items, query)

    if (best) {
      console.log(`    ✓ ${retailerName}: ${best.name} — $${best.price}`)
      return {
        shop: retailerName,
        price: best.price,
        currency: 'AUD',
        inStock: true,
        url: best.link || config.searchUrl(query),
        lastUpdated: new Date().toISOString(),
        shipping: 'Check site',
      }
    } else {
      console.log(`    ✗ ${retailerName}: no matching result`)
      return null
    }
  } catch (err) {
    console.log(`    ✗ ${retailerName}: error — ${err.message}`)
    return null
  } finally {
    await page.close()
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  // Load existing cache to preserve data for queries we won't re-scrape
  const outPath = path.join(__dirname, '..', 'src', 'data', 'scraped-prices.json')
  let cache = {}
  try {
    cache = JSON.parse(fs.readFileSync(outPath, 'utf8'))
  } catch {
    // fresh start
  }

  // Read queries to scrape — from file or env, default to a base set
  const QUERIES_ENV = process.env.SCRAPE_QUERIES
  const queries = QUERIES_ENV
    ? QUERIES_ENV.split('|')
    : (cache._queries && cache._queries.length > 0 ? cache._queries : [
        'Sony ZV-E10 16-50mm kit',
        'Sony WH-1000XM5',
        'iPhone 15 Pro',
        'Samsung Galaxy S24 Ultra',
        'Sony PS5 Slim',
        'MacBook Air M3',
        'LG OLED C3 55 inch',
      ])

  console.log(`\nStarting price scrape for ${queries.length} products across ${Object.keys(RETAILERS).length} retailers...\n`)

  const browser = await chromium.launch({ headless: true })

  for (const query of queries) {
    console.log(`\n[${query}]`)
    const results = []

    for (const [name, config] of Object.entries(RETAILERS)) {
      const result = await scrapeRetailer(browser, name, config, query)
      if (result) results.push(result)
      // Brief pause between retailers to be polite
      await new Promise((r) => setTimeout(r, 1500))
    }

    if (results.length > 0) {
      cache[query.toLowerCase()] = {
        prices: results.sort((a, b) => a.price - b.price),
        scrapedAt: new Date().toISOString(),
      }
    }
  }

  await browser.close()

  // Keep track of which queries this cache covers
  cache._queries = queries
  cache._lastRun = new Date().toISOString()

  fs.writeFileSync(outPath, JSON.stringify(cache, null, 2))
  console.log(`\n✅ Scraped prices saved to src/data/scraped-prices.json`)
}

main().catch((err) => {
  console.error('Scrape failed:', err)
  process.exit(1)
})
