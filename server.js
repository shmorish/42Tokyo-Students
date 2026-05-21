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

// ランキング取得
app.get('/api/ranking', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const perPage = Math.min(100, Math.max(1, parseInt(req.query.perPage) || 50))
    const token = await getAccessToken()

    const url =
      `https://api.intra.42.fr/v2/cursus_users` +
      `?filter[campus_id]=${CAMPUS_ID}` +
      `&filter[cursus_id]=${CURSUS_ID}` +
      `&sort=-level` +
      `&page[size]=${perPage}` +
      `&page[number]=${page}`

    const upstream = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!upstream.ok) throw new Error(`42 API responded with ${upstream.status}`)

    const xTotal = upstream.headers.get('X-Total')
    const xPerPage = upstream.headers.get('X-Per-Page')
    if (xTotal) res.setHeader('X-Total', xTotal)
    if (xPerPage) res.setHeader('X-Per-Page', xPerPage)

    res.json(await upstream.json())
  } catch (err) {
    console.error('[server]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// 最終プロジェクト日取得（サーバー側キャッシュ付き）
const lastProjectCache = new Map()

app.post('/api/last-projects', async (req, res) => {
  try {
    const { userIds } = req.body
    if (!Array.isArray(userIds)) return res.status(400).json({ error: 'userIds required' })

    const result = {}
    const toFetch = []

    for (const id of userIds) {
      if (lastProjectCache.has(id)) {
        result[id] = lastProjectCache.get(id)
      } else {
        toFetch.push(id)
      }
    }

    if (toFetch.length > 0) {
      const token = await getAccessToken()
      const BATCH = 3
      const DELAY = 700

      for (let i = 0; i < toFetch.length; i += BATCH) {
        const batch = toFetch.slice(i, i + BATCH)
        const batchResults = await Promise.all(
          batch.map(async userId => {
            try {
              const r = await fetch(
                `https://api.intra.42.fr/v2/users/${userId}/projects_users` +
                `?filter[status]=finished&sort=-updated_at&page[size]=1`,
                { headers: { Authorization: `Bearer ${token}` } }
              )
              const data = await r.json()
              const markedAt = Array.isArray(data) && data.length > 0 ? data[0].marked_at : null
              return { userId, markedAt }
            } catch {
              return { userId, markedAt: null }
            }
          })
        )
        for (const { userId, markedAt } of batchResults) {
          lastProjectCache.set(userId, markedAt)
          result[userId] = markedAt
        }
        if (i + BATCH < toFetch.length) {
          await new Promise(r => setTimeout(r, DELAY))
        }
      }
    }

    res.json(result)
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
