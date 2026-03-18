import type { VercelRequest, VercelResponse } from '@vercel/node'
import { parseGoogleFlightsUrl } from '../../src/lib/parse-google-url'
import { searchFlights } from '../../src/lib/flights-api'
import { airports } from '../../src/lib/airports'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url } = req.body as { url: string }
  if (!url) {
    return res.status(400).json({ error: 'URL is required' })
  }

  // Parse flight details from URL
  const parsed = parseGoogleFlightsUrl(url)
  if (!parsed) {
    return res.status(400).json({ error: 'Nie udalo sie odczytac danych z tego URL. Uzyj linku z Google Flights (strona rezerwacji lotu).' })
  }

  // Get airport names from local database
  const originAirport = airports.find(a => a.code === parsed.origin)
  const destAirport = airports.find(a => a.code === parsed.destination)

  // Search for flights on this route via SerpApi to get times and prices
  try {
    const flights = await searchFlights({
      origin: parsed.origin,
      destination: parsed.destination,
      departureDate: parsed.date,
      currency: 'PLN',
    })

    // Filter flights matching the airline from URL
    const matchingFlights = flights.filter(f =>
      f.airline.toLowerCase().includes(parsed.airlineName.toLowerCase()) ||
      f.airlineCode === parsed.airlineCode
    )

    // If we have matching flights, return them for user to pick
    const flightsToReturn = matchingFlights.length > 0 ? matchingFlights : flights

    return res.status(200).json({
      data: {
        parsed: {
          ...parsed,
          originName: originAirport ? `${originAirport.cityName} (${originAirport.code})` : parsed.origin,
          destinationName: destAirport ? `${destAirport.cityName} (${destAirport.code})` : parsed.destination,
        },
        flights: flightsToReturn,
      },
    })
  } catch (err) {
    // SerpApi failed — return parsed data without flight details
    // User can still add with basic info, cron will fill in the rest
    return res.status(200).json({
      data: {
        parsed: {
          ...parsed,
          originName: originAirport ? `${originAirport.cityName} (${originAirport.code})` : parsed.origin,
          destinationName: destAirport ? `${destAirport.cityName} (${destAirport.code})` : parsed.destination,
        },
        flights: [],
        warning: 'Nie udalo sie pobrac listy lotow. Mozesz dodac lot recznie.',
      },
    })
  }
}
