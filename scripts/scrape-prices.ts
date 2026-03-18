/**
 * Playwright Google Flights price scraper
 * Runs on GitHub Actions to fetch prices for all active watched routes.
 * Writes directly to Neon DB — no deployed app needed.
 */

import { chromium } from 'playwright'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq } from 'drizzle-orm'
import * as schema from '../src/lib/schema'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required')
  process.exit(1)
}

const sql = neon(DATABASE_URL)
const db = drizzle(sql, { schema })

function buildGoogleFlightsUrl(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate?: string | null,
): string {
  // Google Flights URL format: /travel/flights/WAW/OPO/2026-04-13
  const base = 'https://www.google.com/travel/flights'
  if (returnDate) {
    return `${base}/${origin}/${destination}/${departureDate}/${returnDate}?hl=pl&curr=PLN`
  }
  return `${base}/${origin}/${destination}/${departureDate}?hl=pl&curr=PLN&tfs=oneway`
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function scrapePrice(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof chromium.launch>>['newPage']>>,
  origin: string,
  destination: string,
  departureDate: string,
  returnDate?: string | null,
): Promise<{ price: number; airline: string; stops: number } | null> {
  const url = buildGoogleFlightsUrl(origin, destination, departureDate, returnDate)
  console.log(`  Scraping: ${origin} → ${destination} (${departureDate})`)
  console.log(`  URL: ${url}`)

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })

    // Wait for flight results to load
    await page.waitForTimeout(3000)

    // Extract price from Google Flights results
    // Strategy: find all price-like elements, collect them, pick the best flight price
    const priceResult = await page.evaluate(() => {
      // Collect ALL prices on the page that look like flight prices
      const prices: { price: number; element: Element }[] = []

      // Method 1: elements with aria-label containing price
      document.querySelectorAll('[aria-label]').forEach(el => {
        const label = el.getAttribute('aria-label') || ''
        const match = label.match(/(\d[\d\s.,]*)\s*(zł|PLN)/i)
        if (match) {
          const price = parseInt(match[1].replace(/[\s.,]/g, ''), 10)
          if (price > 50 && price < 50000) prices.push({ price, element: el })
        }
      })

      // Method 2: span/div elements with zł text
      if (prices.length === 0) {
        document.querySelectorAll('span, div').forEach(el => {
          const text = el.textContent || ''
          // Only match leaf elements (no children with prices) and short text
          if (text.length > 30 || el.children.length > 2) return
          const match = text.match(/^[\s]*(\d[\d\s.,]*)[\s]*zł[\s]*$/i)
          if (match) {
            const price = parseInt(match[1].replace(/[\s.,]/g, ''), 10)
            if (price > 50 && price < 50000) prices.push({ price, element: el })
          }
        })
      }

      if (prices.length === 0) return null

      // Find the most common price range (likely actual flight prices, not ads)
      // Sort prices and look for clusters
      const sortedPrices = prices.map(p => p.price).sort((a, b) => a - b)

      // If there are prices in the 100-2000 range AND in the 200-5000 range,
      // the lower ones might be "from X" labels. Take the median-area price.
      // Simple heuristic: skip the bottom 20% of prices (likely "from X" teasers)
      const skipCount = Math.floor(sortedPrices.length * 0.2)
      const relevantPrices = sortedPrices.slice(skipCount)
      const bestPrice = relevantPrices.length > 0 ? relevantPrices[0] : sortedPrices[0]

      // Try to get airline name
      let airline = ''
      const airlinePatterns = [
        /Ryanair/i, /Wizz\s*Air/i, /LOT/i, /Lufthansa/i, /KLM/i,
        /easyJet/i, /Norwegian/i, /TAP/i, /Vueling/i, /Iberia/i,
        /Air France/i, /British Airways/i, /SAS/i, /Finnair/i,
        /Turkish/i, /Emirates/i, /Qatar/i, /Swiss/i, /Austrian/i,
      ]
      const pageText = document.body.innerText
      for (const pattern of airlinePatterns) {
        const match = pageText.match(pattern)
        if (match) { airline = match[0]; break }
      }

      // Try to detect stops
      let stops = 0
      if (/bezpośredni|direct|nonstop/i.test(pageText.slice(0, 5000))) {
        stops = 0
      } else if (/1 przesiadka|1 stop/i.test(pageText.slice(0, 5000))) {
        stops = 1
      } else if (/2 przesiadk|2 stop/i.test(pageText.slice(0, 5000))) {
        stops = 2
      }

      return { price: bestPrice, airline, stops }
    })

    return priceResult
  } catch (err) {
    console.error(`  Error scraping ${origin}→${destination}:`, (err as Error).message)
    return null
  }
}

async function main() {
  console.log('=== Sky Price Scraper ===')
  console.log(`Time: ${new Date().toISOString()}`)

  // Get active routes from DB
  const routes = await db
    .select()
    .from(schema.watchedRoutes)
    .where(eq(schema.watchedRoutes.isActive, true))

  console.log(`Found ${routes.length} active route(s)`)

  if (routes.length === 0) {
    console.log('No active routes. Exiting.')
    return
  }

  // Launch browser
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const context = await browser.newContext({
    locale: 'pl-PL',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  })

  const page = await context.newPage()

  const results: Array<{ routeId: number; success: boolean; price?: number; error?: string }> = []

  for (const route of routes) {
    const priceData = await scrapePrice(
      page,
      route.originCode,
      route.destinationCode,
      route.departureDate,
      route.returnDate,
    )

    if (priceData) {
      const priceCents = priceData.price * 100

      await db.insert(schema.priceSnapshots).values({
        routeId: route.id,
        priceCents,
        airline: priceData.airline || null,
        stops: priceData.stops,
        bookingLink: '',
        source: 'google',
      })

      await db
        .update(schema.watchedRoutes)
        .set({
          previousMinPrice: route.currentMinPrice,
          currentMinPrice: priceCents,
          lastChecked: new Date(),
        })
        .where(eq(schema.watchedRoutes.id, route.id))

      console.log(`  ✓ ${route.originCode}→${route.destinationCode}: ${priceData.price} PLN`)
      results.push({ routeId: route.id, success: true, price: priceCents })
    } else {
      console.log(`  ✗ ${route.originCode}→${route.destinationCode}: no price found`)
      results.push({ routeId: route.id, success: false, error: 'No price found' })
    }

    // Wait between routes to avoid detection
    if (routes.indexOf(route) < routes.length - 1) {
      const delay = 5000 + Math.random() * 5000 // 5-10s random delay
      console.log(`  Waiting ${Math.round(delay / 1000)}s...`)
      await sleep(delay)
    }
  }

  await browser.close()

  // Summary
  const successful = results.filter((r) => r.success).length
  console.log(`\n=== Done: ${successful}/${routes.length} routes scraped ===`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
