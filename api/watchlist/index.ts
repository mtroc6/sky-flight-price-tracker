import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getDb } from '../../src/lib/db'
import { watchedRoutes, priceSnapshots } from '../../src/lib/schema'
import { desc, eq, and } from 'drizzle-orm'
import { getMinPrice } from '../../src/lib/flights-api'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    var db = getDb()
  } catch (err) {
    return res.status(500).json({ error: 'DB init failed: ' + (err as Error).message })
  }

  if (req.method === 'GET') {
    try {
      const routes = await db
        .select()
        .from(watchedRoutes)
        .orderBy(desc(watchedRoutes.createdAt))
      return res.status(200).json({ data: routes })
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message })
    }
  }

  if (req.method === 'POST') {
    try {
      const body = req.body

      // Check for duplicate route
      const existing = await db
        .select({ id: watchedRoutes.id })
        .from(watchedRoutes)
        .where(
          and(
            eq(watchedRoutes.originCode, body.originCode),
            eq(watchedRoutes.destinationCode, body.destinationCode),
            eq(watchedRoutes.departureDate, body.departureDate),
          )
        )

      if (existing.length > 0) {
        return res.status(409).json({ error: 'Ta trasa jest juz obserwowana' })
      }

      const [route] = await db
        .insert(watchedRoutes)
        .values({
          originCode: body.originCode,
          originName: body.originName,
          destinationCode: body.destinationCode,
          destinationName: body.destinationName,
          departureDate: body.departureDate,
          returnDate: body.returnDate || null,
          isRoundTrip: body.isRoundTrip || false,
          flexDays: body.flexDays || 0,
          cabinClass: body.cabinClass || 'economy',
          adults: body.adults || 1,
        })
        .returning()

      // Fetch initial price right away
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

          const [updatedRoute] = await db
            .update(watchedRoutes)
            .set({
              currentMinPrice: priceData.priceCents,
              lastChecked: new Date(),
              bestAirline: priceData.airline,
              bestStops: priceData.stops,
              bestDepartureTime: priceData.departureTime,
              bestArrivalTime: priceData.arrivalTime,
              bestDuration: priceData.duration,
            })
            .where(eq(watchedRoutes.id, route.id))
            .returning()

          return res.status(201).json({ data: updatedRoute })
        }
      } catch (priceErr) {
        // Price fetch failed but route was created - that's ok
        console.error('[watchlist] Initial price fetch failed:', (priceErr as Error).message)
      }

      return res.status(201).json({ data: route })
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
