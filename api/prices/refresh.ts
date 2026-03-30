import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getDb } from '../../src/lib/db'
import { watchedRoutes, priceSnapshots } from '../../src/lib/schema'
import { eq } from 'drizzle-orm'
import { searchFlights } from '../../src/lib/flights-api'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const routeId = Number(req.query.routeId)
  if (!routeId || isNaN(routeId)) {
    return res.status(400).json({ error: 'routeId is required' })
  }

  const db = getDb()

  const [route] = await db
    .select()
    .from(watchedRoutes)
    .where(eq(watchedRoutes.id, routeId))

  if (!route) {
    return res.status(404).json({ error: 'Route not found' })
  }

  // Check if flight already departed
  const departureTime = route.bestDepartureTime
    ? new Date(route.bestDepartureTime)
    : new Date(route.departureDate + 'T23:59:59')

  if (departureTime < new Date()) {
    await db
      .update(watchedRoutes)
      .set({ isActive: false })
      .where(eq(watchedRoutes.id, route.id))
    return res.status(200).json({ data: null, message: 'Lot juz odlecial — zarchiwizowany' })
  }

  // Cooldown: 5 minutes
  if (route.lastChecked) {
    const elapsed = Date.now() - new Date(route.lastChecked).getTime()
    if (elapsed < 5 * 60 * 1000) {
      const remainingMin = Math.ceil((5 * 60 * 1000 - elapsed) / 60000)
      return res.status(429).json({
        error: `Odczekaj jeszcze ${remainingMin} min`,
      })
    }
  }

  try {
    // Search all flights on this route
    const flights = await searchFlights({
      origin: route.originCode,
      destination: route.destinationCode,
      departureDate: route.departureDate,
      currency: 'PLN',
    })

    if (flights.length === 0) {
      return res.status(200).json({ data: null, message: 'Nie znaleziono lotow' })
    }

    // Match the EXACT flight by airline + departure time
    const airlineCode = route.flightNumber?.split(' ')[0] || ''
    const savedDepTime = route.bestDepartureTime?.split(' ')[1]?.slice(0, 5) || ''

    let matched = null

    // Best match: same airline code + same departure time
    if (airlineCode && savedDepTime) {
      matched = flights.find(f => {
        const flightTime = f.departureTime.split(' ')[1]?.slice(0, 5)
        return f.airlineCode === airlineCode && flightTime === savedDepTime
      })
    }

    // Fallback: same departure time only
    if (!matched && savedDepTime) {
      matched = flights.find(f => {
        const flightTime = f.departureTime.split(' ')[1]?.slice(0, 5)
        return flightTime === savedDepTime
      })
    }

    // Fallback: same airline code, closest time
    if (!matched && airlineCode) {
      matched = flights.find(f => f.airlineCode === airlineCode)
    }

    if (!matched) {
      return res.status(200).json({ data: null, message: `Nie znaleziono lotu ${route.flightNumber} (${savedDepTime})` })
    }

    const priceCents = Math.round(matched.price * 100)

    await db.insert(priceSnapshots).values({
      routeId: route.id,
      priceCents,
      airline: route.bestAirline || matched.airline,
      stops: route.bestStops ?? matched.stops,
      source: 'serpapi',
    })

    // Only update price and lastChecked — NEVER overwrite flight details
    const [updatedRoute] = await db
      .update(watchedRoutes)
      .set({
        previousMinPrice: route.currentMinPrice,
        currentMinPrice: priceCents,
        lastChecked: new Date(),
      })
      .where(eq(watchedRoutes.id, route.id))
      .returning()

    return res.status(200).json({ data: updatedRoute })
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message })
  }
}
