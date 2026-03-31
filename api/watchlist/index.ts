import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getDb } from '../../src/lib/db'
import { watchedRoutes, priceSnapshots } from '../../src/lib/schema'
import { desc, eq, and, lte, inArray } from 'drizzle-orm'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const db = getDb()

  if (req.method === 'GET') {
    try {
      const routes = await db
        .select()
        .from(watchedRoutes)
        .orderBy(desc(watchedRoutes.createdAt))

      // Fetch price from ~24h ago for each route
      const routeIds = routes.map((r) => r.id)
      const prices24h: Record<number, number> = {}

      if (routeIds.length > 0) {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)

        // Get the latest snapshot before 24h ago for each route
        const snapshots = await db
          .select({
            routeId: priceSnapshots.routeId,
            priceCents: priceSnapshots.priceCents,
            fetchedAt: priceSnapshots.fetchedAt,
          })
          .from(priceSnapshots)
          .where(
            and(
              inArray(priceSnapshots.routeId, routeIds),
              lte(priceSnapshots.fetchedAt, cutoff),
            )
          )
          .orderBy(desc(priceSnapshots.fetchedAt))

        // Pick latest per route
        for (const snap of snapshots) {
          if (!(snap.routeId in prices24h)) {
            prices24h[snap.routeId] = snap.priceCents
          }
        }
      }

      const data = routes.map((r) => ({
        ...r,
        price24hAgoCents: prices24h[r.id] ?? null,
      }))

      return res.status(200).json({ data })
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message })
    }
  }

  if (req.method === 'POST') {
    try {
      const body = req.body

      // Check for duplicate
      const existing = await db
        .select({ id: watchedRoutes.id })
        .from(watchedRoutes)
        .where(
          and(
            eq(watchedRoutes.originCode, body.originCode),
            eq(watchedRoutes.destinationCode, body.destinationCode),
            eq(watchedRoutes.departureDate, body.departureDate),
            eq(watchedRoutes.flightNumber, body.flightNumber || ''),
          )
        )

      if (existing.length > 0) {
        return res.status(409).json({ error: 'Ten lot jest juz obserwowany' })
      }

      // Ensure tracking URL has Polish locale and PLN currency
      let trackingUrl = body.trackingUrl || null
      if (trackingUrl) {
        const u = new URL(trackingUrl)
        if (!u.searchParams.has('hl')) u.searchParams.set('hl', 'pl')
        if (!u.searchParams.has('curr')) u.searchParams.set('curr', 'PLN')
        trackingUrl = u.toString()
      }

      // Create route with all flight details
      const [route] = await db
        .insert(watchedRoutes)
        .values({
          originCode: body.originCode,
          originName: body.originName,
          destinationCode: body.destinationCode,
          destinationName: body.destinationName,
          departureDate: body.departureDate,
          flightNumber: body.flightNumber || null,
          trackingUrl,
          bestAirline: body.airline || null,
          bestDepartureTime: body.departureTime || null,
          bestArrivalTime: body.arrivalTime || null,
          bestDuration: body.duration || null,
          bestStops: body.stops ?? null,
          group: body.group || null,
          currentMinPrice: body.price ? Math.round(body.price * 100) : null,
          lastChecked: body.price ? new Date() : null,
        })
        .returning()

      // Save initial price snapshot
      if (body.price) {
        await db.insert(priceSnapshots).values({
          routeId: route.id,
          priceCents: Math.round(body.price * 100),
          airline: body.airline || null,
          stops: body.stops ?? 0,
          source: 'serpapi',
        })
      }

      return res.status(201).json({ data: route })
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
