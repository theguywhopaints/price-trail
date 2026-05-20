/**
 * Playwright price scraper for AU retailers.
 * Runs on self-hosted GitHub Actions runner (residential IP bypasses IP-level blocks).
 * Uses stealth context to bypass headless-browser detection (Incapsula).
 */

const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

// ─── Retailer scrape configs ────────────────────────────────────────────────

const RETAILERS = {
  'CameraPro': {
    searchUrl: (q) => `https://www.camerapro.com.au/catalogsearch/result/?q=${encodeURIComponent(q)}`,
    waitFor: '.products-grid .product-item, .product-items .item',
    extractPrices: () => {
      const items = []
      document.querySelectorAll('.product-item, .item.product').forEach((el) => {
        const name = el.querySelector('.product-item-name, .product-name')?.textContent?.trim()
        const price = el.querySelector('.price-box .price, .special-price .price, .regular-price .price')?.textContent?.trim()
        const link = el.querySelector('a.product-item-link, a')?.href
        if (name && price) items.push({ name, price, link })
      })
      return items
    },
  },

  'Harvey Norman': {
    searchUrl: (q) => `https://www.harveynorman.com.au/catalogsearch/result/?q=${encodeURIComponent(q)}`,
    waitFor: '[data-product-id], .product-item-info, .hn-product-tile, [class*="product"]',
    extractPrices: () => {
      const items = []
      // Try multiple selector strategies Harvey Norman may use
      const cards = [
        ...document.querySelectorAll('[data-product-id]'),
        ...document.querySelectorAll('.hn-product-tile'),
        ...document.querySelectorAll('[class*="ProductCard"]'),
        ...document.querySelectorAll('[class*="product-item"]'),
      ]
      const seen = new Set()
      cards.forEach((el) => {
        if (seen.has(el)) return
        seen.add(el)
        const name = el.querySelector('[class*="name"], [class*="title"], h2, h3')?.textContent?.trim()
        const priceEl = el.querySelector('[class*="price"], [data-price], .special-price, .regular-price')
        const price = priceEl?.textContent?.trim()
        const link = el.querySelector('a')?.href || el.closest('a')?.href
        if (name && price) items.push({ name, price, link })
      })
      return items
    },
  },

  'JB Hi-Fi': {
    searchUrl: (q) => `https://www.jbhifi.com.au/search?q=${encodeURIComponent(q)}`,
    waitFor: '[data-testid="product-card"], [class*="ProductCard"], article[class*="product"]',
    extractPrices: () => {
      const items = []
      document.querySelectorAll('[data-testid="product-card"], [class*="ProductCard"], article').forEach((el) => {
        const name = el.querySelector('[data-testid="product-title"], [class*="title"], [class*="name"], h2, h3')?.textContent?.trim()
        const price = el.querySelector('[data-testid*="price"], [class*="price"], [class*="Price"]')?.textContent?.trim()
        const link = el.querySelector('a')?.href
        if (name && price) items.push({ name, price, link })
      })
      return items
    },
  },

  'The Good Guys': {
    searchUrl: (q) => `https://www.thegoodguys.com.au/SearchDisplay?searchTerm=${encodeURIComponent(q)}`,
    waitFor: '[data-testid="product-card"], [class*="ProductCard"]',
    extractPrices: () => {
      const items = []
      document.querySelectorAll('[data-testid="product-card"], [class*="ProductCard"]').forEach((el) => {
        // Cast a wide net — grab ALL text nodes if specific selectors miss
        const nameEl = el.querySelector('[data-testid*="name"], [data-testid*="title"], [class*="name"], [class*="title"], h1, h2, h3, h4, p')
        const name = nameEl?.textContent?.trim() || el.textContent?.split('\n').map(s => s.trim()).filter(s => s.length > 5)[0] || ''
        const price = el.querySelector('[data-testid*="price"], [class*="price"], [class*="Price"], [class*="amount"]')?.textContent?.trim()
        const link = el.querySelector('a')?.href
        if (name && price) items.push({ name, price, link })
      })
      return items
    },
  },

  'Bing Lee': {
    searchUrl: (q) => `https://www.binglee.com.au/search?q=${encodeURIComponent(q)}`,
    waitFor: '[class*="ProductCard"], [class*="product-card"], [data-product], .product',
    extractPrices: () => {
      const items = []
      document.querySelectorAll('[class*="ProductCard"], [class*="product-card"], [data-product], .product-item').forEach((el) => {
        const name = el.querySelector('[class*="name"], [class*="title"], h2, h3')?.textContent?.trim()
        const price = el.querySelector('[class*="price"], [class*="Price"]')?.textContent?.trim()
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

// Reject accessories — we want the main product, not cases/covers/caps for it
// "shield" without \b catches "Aeroshield", "RhinoShield" etc.
// "\bfilter\b" catches "ND Filter Set", "Polarizing Filter" etc.
const ACCESSORY_RE = /\b(case|cover|cap|protector|sleeve|skin|mount|clip|stand|holder|charger|cable|adapter|strap|tempered glass|silicone|pouch|bumper|hardshell|softshell)\b|shield|\bfilter\b/i

function bestMatchPrice(items, query) {
  if (!items || items.length === 0) return null
  const q = query.toLowerCase().replace(/[-]/g, '')
  // Include 2-char tokens so "lg", "c3", "55" all act as discriminators
  const tokens = q.split(/\s+/).filter((t) => t.length >= 2)
  // Require 70% of tokens to match (minimum 2) so accessories with partial overlap get rejected
  const minRequired = Math.max(2, Math.ceil(tokens.length * 0.7))

  const scored = items
    .map((item) => {
      const name = (item.name || '').toLowerCase().replace(/[-]/g, '')
      const matches = tokens.filter((t) => name.includes(t)).length
      const price = parsePrice(item.price)
      return { ...item, score: matches, price }
    })
    .filter((i) => {
      if (i.score < minRequired) return false
      if (i.price < 25) return false          // $1 cases, $17 lens caps — all wrong
      if (ACCESSORY_RE.test(i.name)) return false  // reject even if it scores well
      return true
    })
    .sort((a, b) => b.score - a.score || a.price - b.price)

  return scored[0] || null
}

async function scrapeRetailer(context, retailerName, config, query) {
  const page = await context.newPage()
  try {
    console.log(`  → ${retailerName}: searching for "${query}"`)

    await page.goto(config.searchUrl(query), {
      waitUntil: 'domcontentloaded',
      timeout: 25000,
    })

    // Extra wait for JS-rendered content
    try {
      await page.waitForSelector(config.waitFor, { timeout: 10000 })
    } catch {
      // selector timed out — still try to extract whatever loaded
    }

    // Additional settle time for dynamic content
    await page.waitForTimeout(2000)

    const items = await page.evaluate(config.extractPrices)

    // Debug: which selectors matched
    const found = await page.evaluate(() => {
      const checks = [
        '[data-testid="product-card"]', '[data-product-id]', '[class*="ProductCard"]',
        '[class*="product-card"]', '[class*="ProductTile"]', '[class*="product-tile"]',
        '[class*="ProductItem"]', 'article', '.product',
      ]
      return checks.map(s => `${s}:${document.querySelectorAll(s).length}`).filter(x => !x.endsWith(':0'))
    })
    console.log(`    [debug] ${found.length ? found.join(', ') : 'no selectors matched'} | extracted ${items.length} items`)

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
    console.log(`    ✗ ${retailerName}: error — ${err.message.split('\n')[0]}`)
    return null
  } finally {
    await page.close()
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const outPath = path.join(__dirname, '..', 'src', 'data', 'scraped-prices.json')
  let cache = {}
  try { cache = JSON.parse(fs.readFileSync(outPath, 'utf8')) } catch { }

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

  console.log(`\nScraping ${queries.length} products × ${Object.keys(RETAILERS).length} retailers (headed mode — bypasses Incapsula)\n`)

  // headless: false — real visible browser on Mac self-hosted runner.
  // Incapsula cannot detect headless because there is nothing to detect.
  // Window is positioned far off-screen so it doesn't disrupt the desktop.
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--disable-dev-shm-usage',
      '--window-position=-32000,0',
      '--window-size=1440,900',
      '--disable-blink-features=AutomationControlled',
    ],
  })

  // Shared context with real-browser fingerprint
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
    locale: 'en-AU',
    timezoneId: 'Australia/Sydney',
    extraHTTPHeaders: {
      'Accept-Language': 'en-AU,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    },
  })

  // Belt-and-suspenders stealth patches (belt = headless:false, suspenders = these)
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
    // Realistic plugins list (not just an array of numbers)
    Object.defineProperty(navigator, 'plugins', {
      get: () => {
        const p = Object.create(PluginArray.prototype)
        Object.defineProperty(p, 'length', { get: () => 3 })
        return p
      },
    })
    Object.defineProperty(navigator, 'languages', { get: () => ['en-AU', 'en'] })
    Object.defineProperty(navigator, 'vendor', { get: () => 'Google Inc.' })
    Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel' })
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 })
    // Full chrome object expected by Incapsula fingerprinting
    window.chrome = {
      app: { isInstalled: false, InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' }, RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' } },
      runtime: {
        PlatformOs: { MAC: 'mac', WIN: 'win', ANDROID: 'android', CROS: 'cros', LINUX: 'linux', OPENBSD: 'openbsd' },
        PlatformArch: { ARM: 'arm', X86_32: 'x86-32', X86_64: 'x86-64' },
        RequestUpdateCheckStatus: { THROTTLED: 'throttled', NO_UPDATE: 'no_update', UPDATE_AVAILABLE: 'update_available' },
        OnInstalledReason: { INSTALL: 'install', UPDATE: 'update', CHROME_UPDATE: 'chrome_update', SHARED_MODULE_UPDATE: 'shared_module_update' },
        OnRestartRequiredReason: { APP_UPDATE: 'app_update', OS_UPDATE: 'os_update', PERIODIC: 'periodic' },
        id: undefined,
        connect: () => {},
        sendMessage: () => {},
      },
      loadTimes: () => ({}),
      csi: () => ({}),
    }
    // Patch permissions so notifications don't say 'denied' (Incapsula check)
    const origQuery = window.navigator.permissions.query.bind(navigator.permissions)
    window.navigator.permissions.query = (params) =>
      params.name === 'notifications' ? Promise.resolve({ state: Notification.permission }) : origQuery(params)
  })

  for (const query of queries) {
    console.log(`\n[${query}]`)
    const results = []

    for (const [name, config] of Object.entries(RETAILERS)) {
      const result = await scrapeRetailer(context, name, config, query)
      if (result) results.push(result)
      await new Promise((r) => setTimeout(r, 2000))
    }

    // Always write (even empty) so stale wrong results don't persist across runs
    cache[query.toLowerCase()] = {
      prices: results.sort((a, b) => a.price - b.price),
      scrapedAt: new Date().toISOString(),
    }
    if (results.length > 0) {
      console.log(`  → Saved ${results.length} prices for "${query}"`)
    } else {
      console.log(`  → No real prices found for "${query}" (cleared stale cache)`)
    }
  }

  await context.close()
  await browser.close()

  cache._queries = queries
  cache._lastRun = new Date().toISOString()

  fs.writeFileSync(outPath, JSON.stringify(cache, null, 2))
  console.log(`\n✅ Done — saved to src/data/scraped-prices.json`)
}

main().catch((err) => {
  console.error('Scrape failed:', err)
  process.exit(1)
})
