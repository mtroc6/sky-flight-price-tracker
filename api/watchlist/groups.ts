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

  // PUT - save full group order (preserves ntfyTopic)
  if (req.method === 'PUT') {
    try {
      const { groups } = req.body as { groups: string[] }

      // Read existing topics before delete
      const existing = await db.select().from(groupSettings)
      const topicMap = new Map(existing.map(g => [g.name, g.ntfyTopic]))

      // Delete all existing and re-insert in order
      await db.delete(groupSettings)
      if (groups.length > 0) {
        await db.insert(groupSettings).values(
          groups.map((name, i) => ({
            name,
            sortOrder: i,
            ntfyTopic: topicMap.get(name) ?? null,
          }))
        )
      }

      return res.status(200).json({ data: groups })
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message })
    }
  }

  // PATCH - update ntfyTopic for a group
  if (req.method === 'PATCH') {
    try {
      const { name, ntfyTopic } = req.body as { name: string; ntfyTopic: string | null }

      await db
        .update(groupSettings)
        .set({ ntfyTopic })
        .where(eq(groupSettings.name, name))

      return res.status(200).json({ data: { name, ntfyTopic } })
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
