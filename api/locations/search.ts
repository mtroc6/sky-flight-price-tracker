import type { VercelRequest, VercelResponse } from '@vercel/node'
import { searchAirports } from '../../src/lib/airports'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const q = req.query.q as string
  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters' })
  }

  const locations = searchAirports(q)
  return res.status(200).json({ data: locations })
}
