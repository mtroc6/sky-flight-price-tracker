import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getDb } from '../../src/lib/db'
import { priceSnapshots } from '../../src/lib/schema'
import { eq, asc } from 'drizzle-orm'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const routeId = Number(req.query.routeId)
  if (isNaN(routeId)) {
    return res.status(400).json({ error: 'Invalid route ID' })
  }

  try {
    const db = getDb()
    const snapshots = await db
      .select()
      .from(priceSnapshots)
      .where(eq(priceSnapshots.routeId, routeId))
      .orderBy(asc(priceSnapshots.fetchedAt))

    return res.status(200).json({ data: snapshots })
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message })
  }
}
