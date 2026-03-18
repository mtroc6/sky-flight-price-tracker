import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getDb } from '../../src/lib/db'
import { watchedRoutes } from '../../src/lib/schema'
import { eq } from 'drizzle-orm'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = Number(req.query.id)
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid route ID' })
  }

  const db = getDb()

  if (req.method === 'PATCH') {
    try {
      const body = req.body
      const updates: Record<string, unknown> = {}
      if (body.isActive !== undefined) updates.isActive = body.isActive
      if (body.flexDays !== undefined) updates.flexDays = body.flexDays
      if (body.cabinClass !== undefined) updates.cabinClass = body.cabinClass
      if (body.departureDate !== undefined) updates.departureDate = body.departureDate
      if (body.returnDate !== undefined) updates.returnDate = body.returnDate

      const [route] = await db
        .update(watchedRoutes)
        .set(updates)
        .where(eq(watchedRoutes.id, id))
        .returning()

      if (!route) {
        return res.status(404).json({ error: 'Route not found' })
      }
      return res.status(200).json({ data: route })
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const [deleted] = await db
        .delete(watchedRoutes)
        .where(eq(watchedRoutes.id, id))
        .returning()

      if (!deleted) {
        return res.status(404).json({ error: 'Route not found' })
      }
      return res.status(200).json({ success: true })
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
