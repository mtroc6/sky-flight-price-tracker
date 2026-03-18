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

    // Try to find the cheapest price on the page
    // Google Flights shows prices in various formats, we look for the first/best result
    const priceResult = await page.evaluate(() => {
      // Look for price elements — Google Flights uses various selectors
      // Try common patterns for the best flight price
      const priceSelectors = [
        '[data-price]',
        '.YMlIz',          // Common Google Flights price class
        'span[aria-label*="zł"]',
        'span[aria-label*="PLN"]',
      ]

      let priceText: string | null = null

      for (const selector of priceSelectors) {
        const el = document.querySelector(selector)
        if (el) {
          // Try data-price attribute first
          const dataPrice = el.getAttribute('data-price')
          if (dataPrice) {
            priceText = dataPrice
            break
          }
          priceText = el.textContent
          break
        }
      }

      // Fallback: find any element containing a PLN price pattern
      if (!priceText) {
        const allElements = document.querySelectorAll('span, div')
        for (const el of allElements) {
          const text = el.textContent || ''
          // Match patterns like "509 zł", "1 234 zł", "PLN 509"
          if (/\d[\d\s]*\s*zł/i.test(text) && text.length < 20) {
            priceText = text
            break
          }
        }
      }

      if (!priceText) return null

      // Extract numeric price
      const cleaned = priceText.replace(/[^\d]/g, '')
      const price = parseInt(cleaned, 10)
      if (isNaN(price) || price === 0) return null

      // Try to get airline name from the first result
      let airline = ''
      const airlineSelectors = [
        '.Ir0Voe .sSHqwe',  // Airline name in result
        '[data-airline-name]',
        '.h1fkLb',
      ]
      for (const sel of airlineSelectors) {
        const el = document.querySelector(sel)
        if (el?.textContent) {
          airline = el.textContent.trim()
          break
        }
      }

      // Try to get stops info
      let stops = 0
      const stopsEl = document.querySelector('.EfT7Ae .ogfYpf')
      if (stopsEl?.textContent) {
        const stopsText = stopsEl.textContent
        if (/bezpo/i.test(stopsText) || /direct/i.test(stopsText) || /nonstop/i.test(stopsText)) {
          stops = 0
        } else {
          const match = stopsText.match(/(\d+)/)
          if (match) stops = parseInt(match[1], 10)
        }
      }

      return { price, airline, stops }
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
