/**
 * Parse Google Flights booking URL to extract flight details.
 * The `tfs` parameter contains base64-encoded protobuf with flight info.
 */

const AIRLINE_NAMES: Record<string, string> = {
  FR: 'Ryanair',
  W6: 'Wizz Air',
  LO: 'LOT',
  LH: 'Lufthansa',
  KL: 'KLM',
  U2: 'easyJet',
  DY: 'Norwegian',
  TP: 'TAP Portugal',
  VY: 'Vueling',
  IB: 'Iberia',
  AF: 'Air France',
  BA: 'British Airways',
  SK: 'SAS',
  AY: 'Finnair',
  TK: 'Turkish Airlines',
  EK: 'Emirates',
  QR: 'Qatar Airways',
  LX: 'Swiss',
  OS: 'Austrian Airlines',
  SN: 'Brussels Airlines',
  EW: 'Eurowings',
  DE: 'Condor',
  PC: 'Pegasus',
  W9: 'Wizz Air UK',
}

export interface ParsedFlightUrl {
  origin: string
  destination: string
  date: string
  airlineCode: string
  airlineName: string
  flightNumber: string
  trackingUrl: string
}

export function parseGoogleFlightsUrl(url: string): ParsedFlightUrl | null {
  try {
    const urlObj = new URL(url)

    // Must be a Google Flights booking URL
    if (!urlObj.hostname.includes('google.com') || !urlObj.pathname.includes('/travel/flights')) {
      return null
    }

    const tfs = urlObj.searchParams.get('tfs')
    if (!tfs) return null

    // Decode base64 (handle URL-safe base64)
    const base64 = tfs.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(base64)

    // Extract strings from the protobuf binary
    // Look for IATA codes (3 uppercase letters) and dates (YYYY-MM-DD)
    const dateMatch = decoded.match(/(\d{4}-\d{2}-\d{2})/)
    const date = dateMatch ? dateMatch[1] : ''

    // Find 3-letter airport codes
    const iataMatches: string[] = []
    for (let i = 0; i < decoded.length - 2; i++) {
      const three = decoded.slice(i, i + 3)
      if (/^[A-Z]{3}$/.test(three)) {
        // Check it's preceded by a length byte (protobuf string encoding)
        const prevByte = decoded.charCodeAt(i - 1)
        if (prevByte === 3) {
          iataMatches.push(three)
        }
      }
    }

    // Find airline code (2 uppercase letters)
    const airlineMatches: string[] = []
    for (let i = 0; i < decoded.length - 1; i++) {
      const two = decoded.slice(i, i + 2)
      if (/^[A-Z0-9]{2}$/.test(two) && two in AIRLINE_NAMES) {
        airlineMatches.push(two)
      }
    }

    // Find flight number (digits after airline code)
    let flightNumber = ''
    const flightMatch = decoded.match(/([A-Z]{2})\x32[\x03\x04\x05](\d{3,5})/)
    if (flightMatch) {
      flightNumber = flightMatch[2]
    } else {
      // Fallback: find 3-4 digit numbers that look like flight numbers
      const numMatches = decoded.match(/\d{3,4}/g)
      if (numMatches) {
        for (const num of numMatches) {
          if (!num.startsWith('202') && parseInt(num) >= 100 && parseInt(num) <= 9999) {
            flightNumber = num
            break
          }
        }
      }
    }

    // Deduplicate and identify origin/destination
    const uniqueIata = [...new Set(iataMatches)]
    const origin = uniqueIata[0] || ''
    const destination = uniqueIata.find(code => code !== origin) || uniqueIata[1] || ''

    const airlineCode = airlineMatches[0] || ''

    if (!origin || !destination || !date) return null

    return {
      origin,
      destination,
      date,
      airlineCode,
      airlineName: AIRLINE_NAMES[airlineCode] || airlineCode,
      flightNumber: airlineCode + (flightNumber ? ` ${flightNumber}` : ''),
      trackingUrl: url,
    }
  } catch {
    return null
  }
}
