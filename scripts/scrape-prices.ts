/**
 * Playwright Google Flights price scraper
 * Loads each watched route's trackingUrl and extracts the current price.
 * Writes directly to Neon DB.
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function scrapePrice(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof chromium.launch>>['newPage']>>,
  trackingUrl: string,
  label: string,
): Promise<{ price: number } | null> {
  console.log(`  Scraping: ${label}`)

  try {
    await page.goto(trackingUrl, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(3000)

    // Accept cookie consent if present
    const consentButton = page.locator('button').filter({ hasText: /Zaakceptuj wszystko|Accept all/i }).first()
    if (await consentButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await consentButton.click()
      await page.waitForTimeout(3000)
    }

    // Wait for content
    await page.waitForTimeout(3000)

    // Extract price from the booking page
    // Google Flights booking page shows price in elements with class QORQHb or similar
    const price = await page.evaluate(() => {
      // Method 1: Look for standalone price elements with "zł"
      const candidates: number[] = []

      document.querySelectorAll('span, div').forEach(el => {
        const text = el.textContent?.trim() || ''
        if (el.children.length > 3) return

        // Match "479 zł" pattern (standalone, not "od X zł")
        const match = text.match(/^(\d[\d\s]*)[\s]*zł$/)
        if (match) {
          const price = parseInt(match[1].replace(/\s/g, ''), 10)
          if (price > 30 && price < 50000) {
            candidates.push(price)
          }
        }
      })

      // The first price on Google Flights booking page is the flight price
      return candidates.length > 0 ? candidates[0] : null
    })

    if (price) {
      return { price }
    }

    // Fallback screenshot for debugging
    console.log(`  No price found, taking screenshot`)
    return null
  } catch (err) {
    console.error(`  Error: ${(err as Error).message}`)
    return null
  }
}

async function main() {
  console.log('=== Sky Price Scraper ===')
  console.log(`Time: ${new Date().toISOString()}`)

  // Get active routes with tracking URLs
  const routes = await db
    .select()
    .from(schema.watchedRoutes)
    .where(eq(schema.watchedRoutes.isActive, true))

  const trackableRoutes = routes.filter(r => r.trackingUrl)
  console.log(`Found ${routes.length} active route(s), ${trackableRoutes.length} with tracking URLs`)

  if (trackableRoutes.length === 0) {
    console.log('No trackable routes. Exiting.')
    return
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const context = await browser.newContext({
    locale: 'pl-PL',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
  })

  const results: Array<{ routeId: number; success: boolean; price?: number }> = []

  for (const route of trackableRoutes) {
    const page = await context.newPage()
    const label = `${route.originCode}→${route.destinationCode} (${route.flightNumber || route.departureDate})`

    const priceData = await scrapePrice(page, route.trackingUrl!, label)
    await page.close()

    if (priceData) {
      const priceCents = priceData.price * 100

      await db.insert(schema.priceSnapshots).values({
        routeId: route.id,
        priceCents,
        airline: route.bestAirline,
        stops: route.bestStops ?? 0,
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

      console.log(`  ✓ ${label}: ${priceData.price} PLN`)
      results.push({ routeId: route.id, success: true, price: priceCents })
    } else {
      await db.insert(schema.priceSnapshots).values({
        routeId: route.id,
        priceCents: null,
        airline: route.bestAirline,
        stops: route.bestStops ?? 0,
        source: 'google',
        error: 'Nie znaleziono ceny',
      })

      console.log(`  ✗ ${label}: no price found`)
      results.push({ routeId: route.id, success: false })
    }

    // Wait between routes
    if (trackableRoutes.indexOf(route) < trackableRoutes.length - 1) {
      const delay = 3000 + Math.random() * 3000
      console.log(`  Waiting ${Math.round(delay / 1000)}s...`)
      await sleep(delay)
    }
  }

  await browser.close()

  const successful = results.filter(r => r.success).length
  console.log(`\n=== Done: ${successful}/${trackableRoutes.length} routes scraped ===`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
