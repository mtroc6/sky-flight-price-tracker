/**
 * Debug script: opens failing OPO routes in Playwright, saves screenshots + dumps price-like text.
 * Run: export DATABASE_URL="..." && npx tsx scripts/debug-scrape.ts
 */

import { chromium } from 'playwright'
import { neon } from '@neondatabase/serverless'
import { mkdirSync } from 'fs'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

async function main() {
  // Get the two failing routes + one working for comparison
  const routes = await sql`SELECT id, origin_code, destination_code, flight_number, tracking_url FROM watched_routes WHERE id IN (16, 20, 21) ORDER BY id`

  mkdirSync('screenshots', { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    locale: 'pl-PL',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
  })

  for (const route of routes) {
    const label = `${route.origin_code}→${route.destination_code} (${route.flight_number})`
    console.log(`\n=== ${label} (id=${route.id}) ===`)
    console.log(`URL: ${route.tracking_url}`)

    const page = await context.newPage()

    try {
      await page.goto(route.tracking_url, { waitUntil: 'networkidle', timeout: 30000 })
      await page.waitForTimeout(3000)

      // Accept cookies if present
      const consentButton = page.locator('button').filter({ hasText: /Zaakceptuj wszystko|Accept all/i }).first()
      if (await consentButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await consentButton.click()
        await page.waitForTimeout(3000)
      }

      await page.waitForTimeout(3000)

      // Save screenshot
      const filename = `screenshots/${route.id}_${route.origin_code}_${route.destination_code}.png`
      await page.screenshot({ path: filename, fullPage: true })
      console.log(`Screenshot saved: ${filename}`)

      // Dump price-like text (broader search: zł, €, PLN, EUR)
      const priceTexts = await page.evaluate(() => {
        const results: string[] = []
        document.querySelectorAll('span, div').forEach(el => {
          const text = el.textContent?.trim() || ''
          if (el.children.length > 3) return
          if (text.match(/\d+\s*(zł|€|PLN|EUR|USD|\$)/i)) {
            results.push(text.substring(0, 120))
          }
        })
        return [...new Set(results)].slice(0, 30)
      })
      console.log(`Price-like text on page (${priceTexts.length}):`)
      priceTexts.forEach(t => console.log(`  "${t}"`))

      // Try the same regex the scraper uses
      const scrapedPrice = await page.evaluate(() => {
        const candidates: number[] = []
        document.querySelectorAll('span, div').forEach(el => {
          const text = el.textContent?.trim() || ''
          if (el.children.length > 3) return
          const match = text.match(/^(\d[\d\s]*)[\s]*zł$/)
          if (match) {
            const price = parseInt(match[1].replace(/\s/g, ''), 10)
            if (price > 30 && price < 50000) {
              candidates.push(price)
            }
          }
        })
        return candidates.length > 0 ? candidates[0] : null
      })
      console.log(`Scraper regex result: ${scrapedPrice ?? 'NULL (no match)'}`)

      // Check page title/language
      const title = await page.title()
      const htmlLang = await page.evaluate(() => document.documentElement.lang)
      console.log(`Page title: ${title}`)
      console.log(`Page lang: ${htmlLang}`)

    } catch (err) {
      console.error(`Error: ${(err as Error).message}`)
    }

    await page.close()
  }

  await browser.close()
}

main().catch(e => {
  console.error('Fatal:', e)
  process.exit(1)
})
