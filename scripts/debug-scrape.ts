/**
 * Debug script — scrapes ONE route and dumps all price data found
 * Run: npx tsx scripts/debug-scrape.ts
 */

import { chromium } from 'playwright'

const ORIGIN = 'WAW'
const DEST = 'OPO'
const DATE = '2026-04-13'

async function main() {
  const url = `https://www.google.com/travel/flights/${ORIGIN}/${DEST}/${DATE}?hl=pl&curr=PLN&tfs=oneway`
  console.log('URL:', url)

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    locale: 'pl-PL',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  })
  const page = await context.newPage()

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(5000)

  // Screenshot
  await page.screenshot({ path: 'scripts/debug-screenshot.png', fullPage: true })
  console.log('Screenshot saved: scripts/debug-screenshot.png')

  // Dump ALL elements that contain "zł" or price-like patterns
  const priceData = await page.evaluate(() => {
    const results: { tag: string; text: string; ariaLabel: string | null; classes: string; parentText: string }[] = []

    document.querySelectorAll('*').forEach(el => {
      const text = el.textContent?.trim() || ''
      const ownText = Array.from(el.childNodes)
        .filter(n => n.nodeType === Node.TEXT_NODE)
        .map(n => n.textContent?.trim())
        .join(' ')
        .trim()

      const ariaLabel = el.getAttribute('aria-label')

      // Check if this element directly contains a price
      const hasPrice = /\d+\s*zł/i.test(ownText) || (ariaLabel && /\d+.*zł/i.test(ariaLabel))

      if (hasPrice) {
        results.push({
          tag: el.tagName,
          text: ownText.slice(0, 100),
          ariaLabel: ariaLabel?.slice(0, 200) || null,
          classes: el.className?.toString().slice(0, 100) || '',
          parentText: el.parentElement?.textContent?.trim().slice(0, 150) || '',
        })
      }
    })

    return results
  })

  console.log(`\n=== Found ${priceData.length} elements with prices ===\n`)
  priceData.forEach((p, i) => {
    console.log(`[${i}] <${p.tag}> classes="${p.classes}"`)
    console.log(`    text: "${p.text}"`)
    if (p.ariaLabel) console.log(`    aria-label: "${p.ariaLabel}"`)
    console.log(`    parent: "${p.parentText}"`)
    console.log()
  })

  await browser.close()
}

main().catch(err => { console.error(err); process.exit(1) })
