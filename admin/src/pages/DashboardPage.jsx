import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, formatDate } from '../lib'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recentUsers, setRecentUsers] = useState([])
  const [recentPosts, setRecentPosts] = useState([])
  const [recentComments, setRecentComments] = useState([])

  useEffect(() => {
    api('/admin/dashboard').then((data) => {
      setStats(data.stats)
      setRecentUsers(data.recent_users || [])
      setRecentPosts(data.recent_posts || [])
      setRecentComments(data.recent_comments || [])
    })
  }, [])

  if (!stats) {
    return <div className="loading">Loading dashboard…</div>
  }

  const cards = [
    { label: 'Users', value: stats.total_users, icon: '👥', to: '/users' },
    { label: 'Thoughts', value: stats.total_posts, icon: '📝', to: '/thoughts' },
    { label: 'Comments', value: stats.total_comments, icon: '💬', to: '/comments' },
  ]

  const activeCards = [
    { label: 'Online Now', value: stats.online_users, icon: '🟢', desc: 'Last 5 minutes', to: '/active-users?range=now' },
    { label: 'Active Today', value: stats.active_today, icon: '☀️', desc: 'Since midnight', to: '/active-users?range=today' },
    { label: 'Active This Week', value: stats.active_week, icon: '📅', desc: 'Since Monday', to: '/active-users?range=week' },
    { label: 'Active This Month', value: stats.active_month, icon: '🌙', desc: 'Since 1st', to: '/active-users?range=month' },
  ]

  return (
    <div className="page">
      <h2 className="page-title">Dashboard</h2>

      {/* Global stat cards */}
      <div className="stat-grid">
        {cards.map((c) => (
          <button key={c.label} className="stat-card stat-card-clickable" onClick={() => navigate(c.to)}>
            <span className="stat-icon">{c.icon}</span>
            <div>
              <div className="stat-value">{c.value}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Active Users section — inline heading and cards */}
      <div className="active-section">
        <div className="active-section-header">
          <h3>Active Users</h3>
        </div>
        <div className="active-grid">
          {activeCards.map((c) => (
            <button
              key={c.label}
              className="active-card"
              onClick={() => navigate(c.to)}
            >
              <div className="active-card-row">
                <span className="active-card-value">{c.value}</span>
                <span className="active-card-icon">{c.icon}</span>
              </div>
              <div className="active-card-label">{c.label}</div>
              <div className="active-card-desc">{c.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent activity grid */}
      <div className="activity-grid">
        <div className="activity-section">
          <h3>Recent Users</h3>
          <div className="activity-list">
            {recentUsers.length === 0 && <p className="empty">No users yet</p>}
            {recentUsers.map((u) => (
              <div key={u.id} className="activity-item">
                <div className="activity-avatar">{u.username?.[0]?.toUpperCase() || '?'}</div>
                <div>
                  <div className="activity-title">
                    {u.name || u.username}{' '}
                    <span className="activity-action">joined</span>
                  </div>
                  <div className="activity-meta">{formatDate(u.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="activity-section">
          <h3>Recent Thoughts</h3>
          <div className="activity-list">
            {recentPosts.length === 0 && <p className="empty">No thoughts yet</p>}
            {recentPosts.map((p) => (
              <div key={p.id} className="activity-item">
                <div className="activity-avatar">{p.author_username?.[0]?.toUpperCase() || '?'}</div>
                <div>
                  <div className="activity-title">
                    <span className="activity-action">New thought by</span>{' '}
                    {p.author_username}
                  </div>
                  <div className="activity-meta">{formatDate(p.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="activity-section">
          <h3>Recent Comments</h3>
          <div className="activity-list">
            {recentComments.length === 0 && <p className="empty">No comments yet</p>}
            {recentComments.map((c) => (
              <div key={c.id} className="activity-item">
                <div className="activity-avatar">{c.author_username?.[0]?.toUpperCase() || '?'}</div>
                <div>
                  <div className="activity-title">
                    {c.author_username}{' '}
                    <span className="activity-action">commented</span>
                  </div>
                  <div className="activity-meta">{formatDate(c.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
