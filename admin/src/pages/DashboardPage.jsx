import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, formatDate } from '../lib'

function AnimatedNumber({ value }) {
  const [prev, setPrev] = useState(value)
  const dir = value > prev ? 'up' : value < prev ? 'down' : null
  useEffect(() => { setPrev(value) }, [value])
  return (
    <span className={`animated-num ${dir ? `animated-num-${dir}` : ''}`} key={value}>
      {value}
    </span>
  )
}

function PulseDot() {
  return <span className="pulse-dot" />
}

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
    { label: 'Online Now', value: stats.online_users, icon: 'pulse', desc: 'Last 5 minutes', to: '/active-users?range=now', live: true },
    { label: 'Active Today', value: stats.active_today, icon: 'sun', desc: 'Since midnight', to: '/active-users?range=today' },
    { label: 'Active This Week', value: stats.active_week, icon: 'calendar', desc: 'Since Monday', to: '/active-users?range=week' },
    { label: 'Active This Month', value: stats.active_month, icon: 'moon', desc: 'Since 1st', to: '/active-users?range=month' },
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
              <div className="stat-value"><AnimatedNumber value={c.value} /></div>
              <div className="stat-label">{c.label}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Active Users section */}
      <div className="active-section">
        <div className="active-section-header">
          <h3>Active Users</h3>
          {stats.online_users > 0 && <span className="live-badge"><PulseDot /> Live</span>}
        </div>
        <div className="active-grid">
          {activeCards.map((c) => (
            <button
              key={c.label}
              className={`active-card ${c.live && stats.online_users > 0 ? 'active-card-live' : ''}`}
              onClick={() => navigate(c.to)}
            >
              <div className="active-card-row">
                <span className="active-card-value">
                  <AnimatedNumber value={c.value} />
                  {c.live && stats.online_users > 0 && <PulseDot />}
                </span>
                <span className="active-card-icon">
                  {c.icon === 'pulse' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                  ) : c.icon === 'sun' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="5"/>
                      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                    </svg>
                  ) : c.icon === 'calendar' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                  )}
                </span>
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
