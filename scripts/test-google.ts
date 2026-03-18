/**
 * Test: Extract price from Google Flights booking URL
 * Run: npx tsx scripts/test-google.ts
 */

import { chromium } from 'playwright'

const TEST_URL = 'https://www.google.com/travel/flights/booking?tfs=CBwQAhpFEgoyMDI2LTA0LTE2IiAKA0tSSxIKMjAyNi0wNC0xNhoDT1BPKgJGUjIEMzA0N2oHCAESA0tSS3IMCAISCC9tLzBwbW43QAFIAXABggELCP___________wGYAQI&tfu=CmxDalJJYkhOYU9YQnBjV05sTVdkQlJrNXdZbEZDUnkwdExTMHRMUzB0TFMxM1ptdHRNMEZCUVVGQlIyMDJORmQzUjBzM2IyOUJFZ1pHVWpNd05EY2FDd2lPOWdJUUFob0RVRXhPT0J4dzMyUT0SAggAIgMKATA&hl=pl&curr=PLN'

async function main() {
  console.log('Opening Google Flights booking URL...')

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    locale: 'pl-PL',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
  })

  const page = await context.newPage()

  await page.goto(TEST_URL, { waitUntil: 'networkidle', timeout: 30000 })
  console.log('Waiting for page to render...')
  await page.waitForTimeout(3000)

  // Accept cookie consent if present
  const consentButton = page.locator('button').filter({ hasText: /Zaakceptuj wszystko|Accept all/i }).first()
  if (await consentButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('Accepting cookies...')
    await consentButton.click()
    await page.waitForTimeout(3000)
  }

  // Wait for actual content
  await page.waitForTimeout(5000)

  // Screenshot
  await page.screenshot({ path: 'scripts/google-booking-screenshot.png', fullPage: true })
  console.log('Screenshot saved: scripts/google-booking-screenshot.png')

  // Extract all text with "zł"
  const priceElements = await page.evaluate(() => {
    const results: string[] = []

    document.querySelectorAll('span, div, p').forEach(el => {
      const text = el.textContent?.trim() || ''
      if (/\d+\s*zł/i.test(text) && text.length < 40 && el.children.length < 3) {
        results.push(`<${el.tagName}> "${text}" [${el.className?.toString().slice(0, 60) || ''}]`)
      }
    })

    return results
  })

  console.log(`\n=== Price elements (${priceElements.length}) ===`)
  priceElements.forEach((p, i) => console.log(`[${i}] ${p}`))

  // Get page title
  const title = await page.title()
  console.log('\nTitle:', title)

  // First 800 chars of visible text
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 800))
  console.log('\nPage text (first 800 chars):')
  console.log(bodyText)

  await browser.close()
}

main().catch(err => { console.error(err); process.exit(1) })
