const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
const API_BASE = isDev && import.meta.env.VITE_API_URL_LOCAL
  ? import.meta.env.VITE_API_URL_LOCAL
  : import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export async function api(path, options = {}) {
  const token = localStorage.getItem('admin_token')
  const headers = { ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Request failed')
  return data
}

export function formatDate(d) {
  if (!d) return '—'
  const date = new Date(d)
  const now = new Date()
  const diff = now - date
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}
