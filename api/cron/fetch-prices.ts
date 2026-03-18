import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getDb } from '../../src/lib/db'
import { watchedRoutes, priceSnapshots } from '../../src/lib/schema'
import { eq } from 'drizzle-orm'
import { getMinPrice } from '../../src/lib/flights-api'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify auth
  const authHeader = req.headers.authorization
  const cronSecret = process.env.CRON_SECRET
  const vercelCron = req.headers['x-vercel-cron']

  if (!vercelCron && (!authHeader || authHeader !== `Bearer ${cronSecret}`)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const db = getDb()
    const routes = await db
      .select()
      .from(watchedRoutes)
      .where(eq(watchedRoutes.isActive, true))

    const results: Array<{ routeId: number; success: boolean; price?: number; error?: string }> = []

    for (const route of routes) {
      try {
        const priceData = await getMinPrice(
          route.originCode,
          route.destinationCode,
          route.departureDate,
          route.returnDate || undefined,
          route.flexDays,
          route.cabinClass,
        )

        if (priceData) {
          await db.insert(priceSnapshots).values({
            routeId: route.id,
            priceCents: priceData.priceCents,
            airline: priceData.airline,
            stops: priceData.stops,
            bookingLink: priceData.bookingLink,
            source: 'serpapi',
          })

          await db
            .update(watchedRoutes)
            .set({
              previousMinPrice: route.currentMinPrice,
              currentMinPrice: priceData.priceCents,
              lastChecked: new Date(),
            })
            .where(eq(watchedRoutes.id, route.id))

          results.push({ routeId: route.id, success: true, price: priceData.priceCents })
        } else {
          results.push({ routeId: route.id, success: true })
        }
      } catch (err) {
        results.push({ routeId: route.id, success: false, error: (err as Error).message })
      }

      // Rate limiting: 3s delay between calls (SerpApi free tier)
      await sleep(3000)
    }

    return res.status(200).json({
      success: true,
      processed: routes.length,
      results,
    })
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message })
  }
}
