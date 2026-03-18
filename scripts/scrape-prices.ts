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
  console.log(`  Scraping: ${origin} → ${destination} (${departureDate})`)

  try {
    // Go to Google Flights main page
    await page.goto('https://www.google.com/travel/flights?hl=pl&curr=PLN', {
      waitUntil: 'networkidle',
      timeout: 30000,
    })
    await page.waitForTimeout(2000)

    // Set one-way if no return date
    if (!returnDate) {
      const tripTypeButton = page.locator('[aria-label*="obie strony"], [aria-label*="W obie strony"], [aria-label*="Round trip"]').first()
      if (await tripTypeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await tripTypeButton.click()
        await page.waitForTimeout(500)
        // Select "W jedną stronę" / "One way"
        const oneWayOption = page.locator('li').filter({ hasText: /jedn|One way/i }).first()
        if (await oneWayOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await oneWayOption.click()
          await page.waitForTimeout(500)
        }
      }
    }

    // Clear and fill origin
    const originInput = page.locator('input[aria-label*="kąd"], input[aria-label*="Where from"], input[placeholder*="kąd"]').first()
    await originInput.click()
    await page.waitForTimeout(300)
    await originInput.fill('')
    await originInput.fill(origin)
    await page.waitForTimeout(1000)
    // Click first suggestion
    const originSuggestion = page.locator('li[role="option"], ul[role="listbox"] li').first()
    if (await originSuggestion.isVisible({ timeout: 3000 }).catch(() => false)) {
      await originSuggestion.click()
    } else {
      await page.keyboard.press('Enter')
    }
    await page.waitForTimeout(500)

    // Fill destination
    const destInput = page.locator('input[aria-label*="Dokąd"], input[aria-label*="Where to"], input[placeholder*="Dokąd"]').first()
    await destInput.click()
    await page.waitForTimeout(300)
    await destInput.fill(destination)
    await page.waitForTimeout(1000)
    const destSuggestion = page.locator('li[role="option"], ul[role="listbox"] li').first()
    if (await destSuggestion.isVisible({ timeout: 3000 }).catch(() => false)) {
      await destSuggestion.click()
    } else {
      await page.keyboard.press('Enter')
    }
    await page.waitForTimeout(500)

    // Fill departure date
    const dateInput = page.locator('input[aria-label*="Wylot"], input[aria-label*="Departure"], input[placeholder*="Wylot"]').first()
    await dateInput.click()
    await page.waitForTimeout(500)

    // Parse date and find the right day in the calendar
    const [year, month, day] = departureDate.split('-').map(Number)
    const monthNames = ['', 'styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
      'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień']

    // Navigate calendar to correct month
    for (let attempts = 0; attempts < 12; attempts++) {
      const calendarHeader = await page.locator('[role="heading"]').filter({ hasText: new RegExp(monthNames[month], 'i') }).first()
      if (await calendarHeader.isVisible({ timeout: 500 }).catch(() => false)) break
      const nextButton = page.locator('button[aria-label*="Następny"], button[aria-label*="Next"]').first()
      if (await nextButton.isVisible({ timeout: 500 }).catch(() => false)) {
        await nextButton.click()
        await page.waitForTimeout(300)
      }
    }

    // Click the day
    const dayButton = page.locator(`[role="button"][aria-label*="${day}"]`).filter({ hasText: String(day) }).first()
    if (await dayButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dayButton.click()
      await page.waitForTimeout(300)
    }

    // Click "Gotowe" / "Done"
    const doneButton = page.locator('button').filter({ hasText: /Gotowe|Done/i }).first()
    if (await doneButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await doneButton.click()
    }
    await page.waitForTimeout(500)

    // Click search / "Eksploruj" / results should auto-load
    const searchButton = page.locator('button').filter({ hasText: /Szukaj|Eksploruj|Search|Explore/i }).first()
    if (await searchButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchButton.click()
    }

    // Wait for results to load
    await page.waitForTimeout(5000)

    // Now extract prices from the results page
    const priceResult = await page.evaluate(() => {
      // On the search results page, prices are typically in elements with "zł"
      // Look for flight result cards and extract prices
      const allPrices: { price: number; context: string }[] = []

      // Find all elements containing "zł" that are likely flight prices
      document.querySelectorAll('span, div').forEach(el => {
        const text = el.textContent?.trim() || ''
        // Match standalone prices like "479 zł", "1 234 zł"
        // Exclude "od 282 zł" (teaser prices with "od")
        if (el.children.length > 3) return // skip container elements

        const match = text.match(/^(\d[\d\s]*)[\s]*zł$/i)
        if (match) {
          const price = parseInt(match[1].replace(/\s/g, ''), 10)
          if (price > 50 && price < 50000) {
            allPrices.push({ price, context: el.parentElement?.textContent?.slice(0, 80) || '' })
          }
        }
      })

      if (allPrices.length === 0) return null

      // The first real flight price (not "od X zł") is likely the best flight
      const bestPrice = allPrices[0].price

      // Airline detection from page text
      let airline = ''
      const airlinePatterns = [
        'Ryanair', 'Wizz Air', 'LOT', 'Lufthansa', 'KLM',
        'easyJet', 'Norwegian', 'TAP', 'Vueling', 'Iberia',
        'Air France', 'British Airways', 'SAS', 'Finnair',
        'Turkish Airlines', 'Emirates', 'Qatar Airways', 'Swiss', 'Austrian',
      ]
      const bodyText = document.body.innerText
      for (const name of airlinePatterns) {
        if (bodyText.includes(name)) { airline = name; break }
      }

      // Stops detection
      let stops = -1 // unknown
      if (/Bez przesiadek|bezpośredni/i.test(bodyText.slice(0, 8000))) stops = 0
      else if (/1 przesiadka/i.test(bodyText.slice(0, 8000))) stops = 1
      else if (/2 przesiadk/i.test(bodyText.slice(0, 8000))) stops = 2

      return { price: bestPrice, airline, stops: stops >= 0 ? stops : 0 }
    })

    if (!priceResult) {
      // Take a screenshot for debugging
      const screenshotName = `scripts/debug-${origin}-${destination}.png`
      await page.screenshot({ path: screenshotName, fullPage: true })
      console.log(`  No price found, screenshot: ${screenshotName}`)
    }

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
    viewport: { width: 1920, height: 1080 },
  })

  const results: Array<{ routeId: number; success: boolean; price?: number; error?: string }> = []

  for (const route of routes) {
    // Each route gets a fresh page to avoid state leaking
    const page = await context.newPage()

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

      console.log(`  ✓ ${route.originCode}→${route.destinationCode}: ${priceData.price} PLN (${priceData.airline})`)
      results.push({ routeId: route.id, success: true, price: priceCents })
    } else {
      console.log(`  ✗ ${route.originCode}→${route.destinationCode}: no price found`)
      results.push({ routeId: route.id, success: false, error: 'No price found' })
    }

    await page.close()

    // Wait between routes
    if (routes.indexOf(route) < routes.length - 1) {
      const delay = 3000 + Math.random() * 3000
      console.log(`  Waiting ${Math.round(delay / 1000)}s...`)
      await sleep(delay)
    }
  }

  await browser.close()

  const successful = results.filter((r) => r.success).length
  console.log(`\n=== Done: ${successful}/${routes.length} routes scraped ===`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
