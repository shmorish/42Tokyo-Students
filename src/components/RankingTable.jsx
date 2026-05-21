import { useState, useEffect, useMemo } from 'react'
import './RankingTable.css'

const PAGE_SIZE = 50

const MONTH_ORDER = [
  'january','february','march','april','may','june',
  'july','august','september','october','november','december',
]
const MONTH_LABEL = {
  january: '1月', february: '2月', march: '3月', april: '4月',
  may: '5月', june: '6月', july: '7月', august: '8月',
  september: '9月', october: '10月', november: '11月', december: '12月',
}

const BATCH_SIZE = 3
const BATCH_DELAY_MS = 700

async function fetchAllPages() {
  const firstRes = await fetch('/api/ranking?page=1&perPage=100')
  if (!firstRes.ok) throw new Error(`HTTP ${firstRes.status}`)
  const total = parseInt(firstRes.headers.get('X-Total') || '0')
  const firstData = await firstRes.json()
  if (firstData?.error) throw new Error(firstData.error)

  const totalPages = Math.ceil(total / 100)
  if (totalPages <= 1) return firstData

  const all = [...firstData]
  for (let i = 2; i <= totalPages; i += BATCH_SIZE) {
    const count = Math.min(BATCH_SIZE, totalPages - i + 1)
    const batch = await Promise.all(
      Array.from({ length: count }, (_, j) =>
        fetch(`/api/ranking?page=${i + j}&perPage=100`).then(r => r.json())
      )
    )
    all.push(...batch.flat())
    if (i + BATCH_SIZE <= totalPages) {
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS))
    }
  }
  return all
}

function getStatus(entry) {
  if (entry.grade === 'Alumni' || entry.user?.['alumni?']) return 'alumni'
  if (entry.end_at !== null) return 'blackholed'
  return 'active'
}

function formatDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const diff = new Date(dateStr) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function alumniDeadline(markedAt) {
  if (!markedAt) return null
  const d = new Date(markedAt)
  d.setMonth(d.getMonth() + 8)
  return d.toISOString()
}

function bhUrgency(days) {
  if (days === null) return ''
  if (days < 0)  return 'bh-overdue'
  if (days <= 30) return 'bh-danger'
  if (days <= 60) return 'bh-warning'
  return ''
}

function LevelBar({ level }) {
  const floor = Math.floor(level)
  const progress = ((level % 1) * 100).toFixed(1)
  return (
    <div className="level-cell">
      <span className="level-number">{floor}</span>
      <div className="level-bar-wrap">
        <div className="level-bar-fill" style={{ width: `${progress}%` }} />
      </div>
      <span className="level-pct">{progress}%</span>
    </div>
  )
}

function RankBadge({ rank }) {
  if (rank === 1) return <span className="medal">🥇</span>
  if (rank === 2) return <span className="medal">🥈</span>
  if (rank === 3) return <span className="medal">🥉</span>
  return <span className="rank-num">{rank}</span>
}

export default function RankingTable() {
  const [allData, setAllData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)

  const [filters, setFilters] = useState({
    status: '',
    piscineYear: '',
    piscineMonth: '',
    beginYear: '',
  })
  const [lastProjectDates, setLastProjectDates] = useState({})

  useEffect(() => {
    fetchAllPages()
      .then(data => { setAllData(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [filters])

  // 表示中のアクティブユーザーの最終プロジェクト日を非同期取得
  useEffect(() => {
    const unloaded = pageData
      .filter(cu => getStatus(cu) === 'active' && cu.user?.id && !(cu.user.id in lastProjectDates))
      .map(cu => cu.user.id)
    if (unloaded.length === 0) return

    fetch('/api/last-projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: unloaded }),
    })
      .then(r => r.json())
      .then(dates => setLastProjectDates(prev => ({ ...prev, ...dates })))
      .catch(console.error)
  }, [page, filters, allData])

  // Derive dropdown options from loaded data
  const piscineYears = useMemo(() =>
    [...new Set(allData.map(d => d.user?.pool_year).filter(Boolean))]
      .sort((a, b) => b - a),
    [allData]
  )
  const piscineMonths = useMemo(() => {
    const set = new Set(allData.map(d => d.user?.pool_month).filter(Boolean))
    return MONTH_ORDER.filter(m => set.has(m))
  }, [allData])
  const beginYears = useMemo(() =>
    [...new Set(
      allData.map(d => d.begin_at ? new Date(d.begin_at).getFullYear() : null).filter(Boolean)
    )].sort((a, b) => b - a),
    [allData]
  )

  const filtered = useMemo(() => {
    return allData.filter(entry => {
      if (filters.status === 'no-bh' && getStatus(entry) === 'blackholed') return false
      if (filters.status === 'active' && getStatus(entry) !== 'active') return false
      if (filters.piscineYear && String(entry.user?.pool_year) !== filters.piscineYear) return false
      if (filters.piscineMonth && entry.user?.pool_month !== filters.piscineMonth) return false
      if (filters.beginYear && entry.begin_at) {
        if (new Date(entry.begin_at).getFullYear() !== parseInt(filters.beginYear)) return false
      }
      return true
    })
  }, [allData, filters])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const rankOffset = (page - 1) * PAGE_SIZE

  const statusCounts = useMemo(() => {
    const counts = { active: 0, alumni: 0, blackholed: 0 }
    allData.forEach(d => { counts[getStatus(d)]++ })
    return counts
  }, [allData])

  const hasFilter = Object.values(filters).some(Boolean)

  function setFilter(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  function clearFilters() {
    setFilters({ status: '', piscineYear: '', piscineMonth: '', beginYear: '' })
  }

  if (loading) {
    return (
      <div className="state-box">
        <div className="spinner" />
        <p>全データを読み込み中…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="state-box error">
        <p>Error: {error}</p>
        <button onClick={() => { setError(null); setLoading(true); fetchAllPages().then(d => { setAllData(d); setLoading(false) }).catch(e => { setError(e.message); setLoading(false) }) }}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="ranking-wrap">
      {/* Filter bar */}
      <div className="filter-bar">
        <div className="filter-controls">
          <select
            value={filters.status}
            onChange={e => setFilter('status', e.target.value)}
            className="filter-select"
          >
            <option value="">全て ({allData.length})</option>
            <option value="no-bh">BHを除く ({statusCounts.active + statusCounts.alumni})</option>
            <option value="active">BH・Alumniを除く ({statusCounts.active})</option>
          </select>

          <select
            value={filters.piscineYear}
            onChange={e => setFilter('piscineYear', e.target.value)}
            className="filter-select"
          >
            <option value="">Piscine年 — 全て</option>
            {piscineYears.map(y => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>

          <select
            value={filters.piscineMonth}
            onChange={e => setFilter('piscineMonth', e.target.value)}
            className="filter-select"
          >
            <option value="">Piscine月 — 全て</option>
            {piscineMonths.map(m => (
              <option key={m} value={m}>{MONTH_LABEL[m]}</option>
            ))}
          </select>

          <select
            value={filters.beginYear}
            onChange={e => setFilter('beginYear', e.target.value)}
            className="filter-select"
          >
            <option value="">入学年 — 全て</option>
            {beginYears.map(y => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>

          {hasFilter && (
            <button className="clear-btn" onClick={clearFilters}>
              クリア
            </button>
          )}
        </div>

        <div className="filter-count">
          {hasFilter
            ? <>{filtered.length} 件 / 全 {allData.length} 件</>
            : <>全 {allData.length} 件</>
          }
        </div>
      </div>

      {/* Table */}
      <div className="table-card">
        {filtered.length === 0 ? (
          <div className="state-box" style={{ padding: '3rem 0' }}>
            <p>該当するユーザーがいません</p>
          </div>
        ) : (
          <table className="ranking-table">
            <thead>
              <tr>
                <th className="col-rank">Rank</th>
                <th className="col-user">User</th>
                <th className="col-level">Level</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((cu, i) => {
                const rank = rankOffset + i + 1
                const user = cu.user
                const avatar =
                  user?.image?.versions?.small ||
                  user?.image?.link ||
                  null
                const status = getStatus(cu)
                return (
                  <tr key={cu.id} className={rank <= 3 ? 'top3' : ''}>
                    <td className="td-rank">
                      <RankBadge rank={rank} />
                    </td>
                    <td className="td-user">
                      {avatar ? (
                        <img
                          className="avatar"
                          src={avatar}
                          alt={user?.login}
                          onError={e => { e.currentTarget.style.display = 'none' }}
                        />
                      ) : (
                        <div className="avatar-placeholder" />
                      )}
                      <div className="user-info">
                        <a
                          className="login"
                          href={`https://profile.intra.42.fr/users/${user?.login}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {user?.login}
                        </a>
                        <div className="meta">
                          {user?.pool_year && user?.pool_month && (
                            <span>Piscine {MONTH_LABEL[user.pool_month]} {user.pool_year}</span>
                          )}
                          {status !== 'active' && (
                            <span className={`status-tag status-${status}`}>
                              {status === 'alumni' ? 'Alumni' : 'BH'}
                            </span>
                          )}
                        </div>
                        {status === 'active' && (() => {
                          const bhDays = cu.blackholed_at ? daysUntil(cu.blackholed_at) : null
                          const dateLoaded = user?.id in lastProjectDates
                          const alumniDateStr = alumniDeadline(lastProjectDates[user?.id])
                          const alumniDays = daysUntil(alumniDateStr)
                          return (
                            <>
                              {cu.blackholed_at && (
                                <div className={`end-date ${bhUrgency(bhDays)}`}>
                                  BH期限: {formatDate(cu.blackholed_at)}
                                  {bhDays !== null && (
                                    <span className="days-remaining">
                                      {bhDays >= 0 ? ` (あと${bhDays}日)` : ` (${Math.abs(bhDays)}日超過)`}
                                    </span>
                                  )}
                                </div>
                              )}
                              {!dateLoaded && (
                                <div className="end-date loading-date">Alumni予定: 計算中…</div>
                              )}
                              {dateLoaded && alumniDateStr && (
                                <div className={`end-date ${bhUrgency(alumniDays)}`}>
                                  Alumni予定: {formatDate(alumniDateStr)}
                                  {alumniDays !== null && (
                                    <span className="days-remaining">
                                      {alumniDays >= 0 ? ` (あと${alumniDays}日)` : ` (${Math.abs(alumniDays)}日超過)`}
                                    </span>
                                  )}
                                </div>
                              )}
                            </>
                          )
                        })()}
                        {status === 'alumni' && user?.alumnized_at && (
                          <div className="end-date">
                            アルムナイ: {formatDate(user.alumnized_at)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="td-level">
                      <LevelBar level={cu.level} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ← Prev
          </button>
          <span className="page-info">Page {page} / {totalPages}</span>
          <button
            className="page-btn"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
