import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getDb } from '../../src/lib/db'
import { groupSettings } from '../../src/lib/schema'
import { asc, eq } from 'drizzle-orm'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const db = getDb()

  // GET - return ordered group list
  if (req.method === 'GET') {
    try {
      const groups = await db
        .select()
        .from(groupSettings)
        .orderBy(asc(groupSettings.sortOrder))
      return res.status(200).json({ data: groups })
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message })
    }
  }

  // PUT - save full group order
  if (req.method === 'PUT') {
    try {
      const { groups } = req.body as { groups: string[] }

      // Delete all existing and re-insert in order
      await db.delete(groupSettings)
      if (groups.length > 0) {
        await db.insert(groupSettings).values(
          groups.map((name, i) => ({ name, sortOrder: i }))
        )
      }

      return res.status(200).json({ data: groups })
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
