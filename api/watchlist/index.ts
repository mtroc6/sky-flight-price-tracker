import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getDb } from '../../src/lib/db'
import { watchedRoutes } from '../../src/lib/schema'
import { desc } from 'drizzle-orm'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const db = getDb()

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
      return res.status(201).json({ data: route })
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
