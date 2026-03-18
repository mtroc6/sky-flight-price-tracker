/**
 * Test: Can we extract price from a Skyscanner flight config URL?
 * Run: npx tsx scripts/test-skyscanner.ts
 */

import { chromium } from 'playwright'

const TEST_URL = 'https://www.skyscanner.pl/transport/loty/krk/opo/260416/config/13235-2604161100--31915-0-15055-2604161350?adultsv2=1&cabinclass=economy&childrenv2=&ref=home&rtn=0&preferdirects=true&outboundaltsenabled=false&inboundaltsenabled=false'

async function main() {
  console.log('Opening Skyscanner URL...')
  console.log('URL:', TEST_URL)

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    locale: 'pl-PL',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
  })

  const page = await context.newPage()

  await page.goto(TEST_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })

  // Wait for content to load (SPA needs time)
  console.log('Waiting for page to render...')
  await page.waitForTimeout(8000)

  // Take screenshot
  await page.screenshot({ path: 'scripts/skyscanner-screenshot.png', fullPage: true })
  console.log('Screenshot saved: scripts/skyscanner-screenshot.png')

  // Dump all elements with "zł" to understand the DOM
  const priceElements = await page.evaluate(() => {
    const results: { tag: string; text: string; classes: string; ariaLabel: string | null }[] = []

    document.querySelectorAll('*').forEach(el => {
      const ownText = Array.from(el.childNodes)
        .filter(n => n.nodeType === Node.TEXT_NODE)
        .map(n => n.textContent?.trim())
        .join(' ')
        .trim()

      if (/zł|PLN/i.test(ownText) && ownText.length < 50) {
        results.push({
          tag: el.tagName,
          text: ownText,
          classes: (el.className?.toString() || '').slice(0, 120),
          ariaLabel: el.getAttribute('aria-label')?.slice(0, 100) || null,
        })
      }
    })

    return results
  })

  console.log(`\n=== Found ${priceElements.length} elements with "zł" ===\n`)
  priceElements.forEach((p, i) => {
    console.log(`[${i}] <${p.tag}> "${p.text}"`)
    console.log(`    classes: ${p.classes}`)
    if (p.ariaLabel) console.log(`    aria: ${p.ariaLabel}`)
    console.log()
  })

  // Also try to get the page title and any meta info
  const title = await page.title()
  console.log('Page title:', title)

  // Check if there's a cookie/consent banner blocking
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500))
  console.log('\nFirst 500 chars of page text:')
  console.log(bodyText)

  await browser.close()
}

main().catch(err => { console.error(err); process.exit(1) })
