import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, formatDate } from '../lib'

const RANGE_LABELS = {
  now: 'Online Now',
  today: 'Active Today',
  week: 'Active This Week',
  month: 'Active This Month',
}

const RANGE_DESCS = {
  now: 'Users active in the last 5 minutes',
  today: 'Users active since midnight',
  week: 'Users active since Monday',
  month: 'Users active since the 1st',
}

function PulseDot({ small }) {
  return <span className={`pulse-dot ${small ? 'pulse-dot-sm' : ''}`} />
}

export default function ActiveUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const range = searchParams.get('range') || 'now'

  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const limit = 20

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit, search, range })
      const data = await api(`/admin/users/active?${params}`)
      setUsers(data.users)
      setTotal(data.total)
    } catch (err) {
      console.error('Failed to fetch active users:', err)
    } finally {
      setLoading(false)
    }
  }, [page, search, range])

  useEffect(() => { fetch() }, [fetch])

  const totalPages = Math.ceil(total / limit)

  const switchRange = (r) => {
    setSearchParams({ range: r })
    setPage(1)
    setSearch('')
  }

  const ranges = ['now', 'today', 'week', 'month']

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">
          {RANGE_LABELS[range]}
          {range === 'now' && total > 0 && <PulseDot />}
        </h2>
        <span className="page-count">{total} users</span>
      </div>

      {/* ─── Time-range tabs ─── */}
      <div className="range-tabs">
        {ranges.map((r) => (
          <button
            key={r}
            className={`range-tab ${r === range ? 'active' : ''}`}
            onClick={() => switchRange(r)}
          >
            {RANGE_LABELS[r]} {r === 'now' && total > 0 && <span className="range-tab-dot" />}
          </button>
        ))}
      </div>

      <p className="range-desc">{RANGE_DESCS[range]}</p>

      <input
        className="search-input"
        type="text"
        placeholder={`Search ${RANGE_LABELS[range].toLowerCase()}…`}
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1) }}
      />

      {loading ? (
        <div className="loading">Loading…</div>
      ) : (
        <>
          <div className="table-wrap">
            <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>ID</th>
                  <th>Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty-row">No {RANGE_LABELS[range].toLowerCase()}</td>
                  </tr>
                )}
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="avatar-sm">{u.username?.[0]?.toUpperCase() || '?'}</div>
                    </td>
                    <td className="cell-primary">{u.username}</td>
                    <td className="cell-mono">{u.email}</td>
                    <td className="cell-mono">#{u.id}</td>
                    <td className="cell-mono">{formatDate(u.last_seen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          <div className="pagination">
            <button
              className="btn-pagination"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Prev
            </button>
            <span className="page-info">
              Page {page} of {totalPages || 1}
            </span>
            <button
              className="btn-pagination"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  )
}
