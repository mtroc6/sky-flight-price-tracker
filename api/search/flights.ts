import type { VercelRequest, VercelResponse } from '@vercel/node'
import { searchFlights } from '../../src/lib/flights-api'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { origin, destination, departureDate, returnDate, adults, cabinClass, maxStops, currency } = req.query

  if (!origin || !destination || !departureDate) {
    return res.status(400).json({ error: 'origin, destination, and departureDate are required' })
  }

  try {
    const flights = await searchFlights({
      origin: origin as string,
      destination: destination as string,
      departureDate: departureDate as string,
      returnDate: returnDate as string | undefined,
      adults: adults ? Number(adults) : undefined,
      cabinClass: (cabinClass as 'economy' | 'business' | 'first') || undefined,
      maxStops: maxStops ? Number(maxStops) : undefined,
      currency: (currency as string) || 'PLN',
    })
    return res.status(200).json({ data: flights })
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message })
  }
}
