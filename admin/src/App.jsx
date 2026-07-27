import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import UsersPage from './pages/UsersPage'
import ThoughtsPage from './pages/ThoughtsPage'
import CommentsPage from './pages/CommentsPage'
import ActiveUsersPage from './pages/ActiveUsersPage'

function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const links = [
    { path: '/', label: 'Dashboard', icon: '◈' },
    { path: '/users', label: 'Users', icon: '●' },
    { path: '/thoughts', label: 'Thoughts', icon: '◇' },
    { path: '/comments', label: 'Comments', icon: '○' },
    { path: '/active-users', label: 'Active Users', icon: '🟢' },
  ]

  const handleNav = (path) => {
    navigate(path)
    onClose?.()
  }

  const handleLogout = () => {
    logout()
    onClose?.()
  }

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay ${open ? 'visible' : ''}`}
        onClick={onClose}
      />

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <span className="sidebar-logo">◆</span>
          <span>Thoughtify</span>
        </div>
        <nav className="sidebar-nav">
          {links.map((l) => (
            <button
              key={l.path}
              onClick={() => handleNav(l.path)}
              className={`sidebar-link ${location.pathname === l.path ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{l.icon}</span>
              {l.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user?.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">
                {user?.name || user?.username}
              </div>
              <div className="sidebar-user-role">Admin</div>
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (loading) {
    return <div className="loading-screen">Loading…</div>
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <div className="app-layout">
      {/* Mobile header */}
      <header className="mobile-header">
        <button
          className={`hamburger ${sidebarOpen ? 'open' : ''}`}
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label="Toggle sidebar"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <span className="sidebar-logo">◆</span>
        <span className="sidebar-brand-text">Thoughtify</span>
      </header>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/thoughts" element={<ThoughtsPage />} />
          <Route path="/comments" element={<CommentsPage />} />
          <Route path="/active-users" element={<ActiveUsersPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
