import { useState, useEffect, useCallback } from 'react'
import { api, formatDate } from '../lib'

export default function CommentsPage() {
  const [comments, setComments] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const limit = 20

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit, search })
      const data = await api(`/admin/comments?${params}`)
      setComments(data.comments)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { fetch() }, [fetch])

  const totalPages = Math.ceil(total / limit)

  const deleteComment = async (id) => {
    if (!confirm('Delete this comment?')) return
    await api(`/admin/comments/${id}`, { method: 'DELETE' })
    fetch()
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Comments</h2>
        <span className="page-count">{total} total</span>
      </div>

      <input
        className="search-input"
        type="text"
        placeholder="Search comments…"
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
                  <th>Comment</th>
                  <th>User</th>
                  <th>Replies</th>
                  <th>Created</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {comments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty-row">No comments found</td>
                  </tr>
                )}
                {comments.map((c) => (
                  <tr key={c.id}>
                    <td className="cell-primary cell-comment">{c.content}</td>
                    <td>{c.author_username}</td>
                    <td>{c.reply_count}</td>
                    <td className="cell-mono">{formatDate(c.created_at)}</td>
                    <td>
                      <button
                        className="btn-icon btn-danger"
                        onClick={() => deleteComment(c.id)}
                        title="Delete comment"
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
