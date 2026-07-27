import { useState, useEffect, useCallback } from 'react'
import { api, formatDate } from '../lib'
import ConfirmDialog from '../components/ConfirmDialog'

export default function ThoughtsPage() {
  const [posts, setPosts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const limit = 20

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit, search })
      const data = await api(`/admin/posts?${params}`)
      setPosts(data.posts)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { fetch() }, [fetch])

  const totalPages = Math.ceil(total / limit)

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await api(`/admin/posts/${deleteTarget.id}`, { method: 'DELETE' })
    setDeleteTarget(null)
    fetch()
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Thoughts</h2>
        <span className="page-count">{total} total</span>
      </div>

      <input
        className="search-input"
        type="text"
        placeholder="Search thoughts…"
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
                  <th>Thought</th>
                  <th>Author</th>
                  <th>Likes</th>
                  <th>Comments</th>
                  <th>Created</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {posts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-row">No thoughts found</td>
                  </tr>
                )}
                {posts.map((p) => (
                  <tr key={p.id}>
                    <td className="cell-primary cell-title">{p.title || 'Untitled'}</td>
                    <td>{p.author_username}</td>
                    <td>{p.likes_count}</td>
                    <td>{p.comments_count}</td>
                    <td className="cell-mono">{formatDate(p.created_at)}</td>
                    <td>
                      <button
                        className="btn-icon btn-danger"
                        onClick={() => setDeleteTarget(p)}
                        title="Delete thought"
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

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete thought?"
        message={`Permanently delete "${deleteTarget?.title || 'Untitled'}" by ${deleteTarget?.author_username}?`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
