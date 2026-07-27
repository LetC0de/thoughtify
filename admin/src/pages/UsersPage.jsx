import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const limit = 20

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit, search })
      const data = await api(`/admin/users?${params}`)
      setUsers(data.users)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const totalPages = Math.ceil(total / limit)

  const deleteUser = async (id) => {
    if (!confirm('Delete this user and all their content?')) return
    await api(`/admin/users/${id}`, { method: 'DELETE' })
    fetchUsers()
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Users</h2>
        <span className="page-count">{total} total</span>
      </div>

      <input
        className="search-input"
        type="text"
        placeholder="Search users…"
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
                  <th>Role</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty-row">No users found</td>
                  </tr>
                )}
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="avatar-sm">{u.username?.[0]?.toUpperCase() || '?'}</div>
                    </td>
                    <td className="cell-primary">{u.username}</td>
                    <td className="cell-mono">{u.email || '—'}</td>
                    <td>
                      <span className={`badge ${u.role === 'ADMIN' ? 'badge-admin' : 'badge-user'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-icon btn-danger"
                        onClick={() => deleteUser(u.id)}
                        title="Delete user"
                      >
                        🗑️
                      </button>
                    </td>
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
