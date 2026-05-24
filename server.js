import express from 'express'
import { config } from 'dotenv'

config()

const app = express()
app.use(express.json())

const PORT = process.env.PORT || 3001
const CAMPUS_ID = process.env.FT_CAMPUS_ID || '26'
const CURSUS_ID = process.env.FT_CURSUS_ID || '21'

let cachedToken = null
let tokenExpiry = 0

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }

  const res = await fetch('https://api.intra.42.fr/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: process.env.FT_CLIENT_ID,
      client_secret: process.env.FT_CLIENT_SECRET,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Token fetch failed (${res.status}): ${body}`)
  }

  const data = await res.json()
  cachedToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
  return cachedToken
}

const RANKING_TTL = 24 * 60 * 60 * 1000

let rankingCache = { data: null, fetchedAt: 0 }

async function refreshRankingCache(token) {
  const all = []
  let page = 1

  while (true) {
    const params = new URLSearchParams({
      'filter[campus_id]': CAMPUS_ID,
      'filter[cursus_id]': CURSUS_ID,
      'sort': '-level',
      'page[size]': '100',
      'page[number]': String(page),
    })
    const res = await fetch(`https://api.intra.42.fr/v2/cursus_users?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error(`42 API responded with ${res.status}`)
    const data = await res.json()
    if (data.length === 0) break
    all.push(...data)
    const total = parseInt(res.headers.get('X-Total') || '0')
    if (all.length >= total) break
    page++
  }

  rankingCache = { data: all, fetchedAt: Date.now() }
}

app.get('/api/ranking', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const perPage = Math.min(100, Math.max(1, parseInt(req.query.perPage) || 50))

    if (!rankingCache.data || Date.now() - rankingCache.fetchedAt > RANKING_TTL) {
      const token = await getAccessToken()
      await refreshRankingCache(token)
    }

    const start = (page - 1) * perPage
    res.setHeader('X-Total', String(rankingCache.data.length))
    res.setHeader('X-Per-Page', String(perPage))
    res.json(rankingCache.data.slice(start, start + perPage))
  } catch (err) {
    console.error('[server]', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`API proxy running → http://localhost:${PORT}`)
}).on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Run: lsof -ti :${PORT} | xargs kill -9`)
    process.exit(1)
  }
  throw err
})
