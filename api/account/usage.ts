import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.SERPAPI_KEY
  if (!apiKey) {
    return res.status(200).json({ data: null })
  }

  try {
    const response = await fetch(`https://serpapi.com/account.json?api_key=${apiKey}`)
    if (!response.ok) {
      return res.status(200).json({ data: null })
    }
    const account = await response.json()
    return res.status(200).json({
      data: {
        used: account.this_month_usage || 0,
        limit: account.searches_per_month || 100,
        left: account.total_searches_left || 0,
      },
    })
  } catch {
    return res.status(200).json({ data: null })
  }
}
