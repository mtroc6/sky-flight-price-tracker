import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getDb } from '../../src/lib/db'
import { watchedRoutes, priceSnapshots } from '../../src/lib/schema'
import { eq } from 'drizzle-orm'
import { getMinPrice } from '../../src/lib/flights-api'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const routeId = Number(req.query.routeId)
  if (!routeId || isNaN(routeId)) {
    return res.status(400).json({ error: 'routeId is required' })
  }

  const db = getDb()

  // Get route
  const [route] = await db
    .select()
    .from(watchedRoutes)
    .where(eq(watchedRoutes.id, routeId))

  if (!route) {
    return res.status(404).json({ error: 'Route not found' })
  }

  // Check cooldown — 1 hour between manual refreshes
  if (route.lastChecked) {
    const lastChecked = new Date(route.lastChecked)
    const cooldownMs = 5 * 60 * 1000 // 5 minutes
    const elapsed = Date.now() - lastChecked.getTime()
    if (elapsed < cooldownMs) {
      const remainingMs = cooldownMs - elapsed
      const remainingMin = Math.ceil(remainingMs / 60000)
      return res.status(429).json({
        error: `Odczekaj jeszcze ${remainingMin} min przed kolejnym odswiezeniem`,
        nextRefreshAt: new Date(lastChecked.getTime() + cooldownMs).toISOString(),
      })
    }
  }

  try {
    const priceData = await getMinPrice(
      route.originCode,
      route.destinationCode,
      route.departureDate,
      route.returnDate || undefined,
      route.flexDays,
      route.cabinClass,
    )

    if (!priceData) {
      return res.status(200).json({ data: null, message: 'Nie znaleziono ceny' })
    }

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
        previousMinPrice: route.currentMinPrice,
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

    return res.status(200).json({ data: updatedRoute })
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message })
  }
}
