import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import UsersPage from './pages/UsersPage'
import ThoughtsPage from './pages/ThoughtsPage'
import CommentsPage from './pages/CommentsPage'

function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const links = [
    { path: '/', label: 'Dashboard', icon: '◈' },
    { path: '/users', label: 'Users', icon: '●' },
    { path: '/thoughts', label: 'Thoughts', icon: '◇' },
    { path: '/comments', label: 'Comments', icon: '○' },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo">◆</span>
        <span>Thoughtify</span>
      </div>
      <nav className="sidebar-nav">
        {links.map((l) => (
          <button
            key={l.path}
            onClick={() => navigate(l.path)}
            className={`sidebar-link ${location.pathname === l.path ? 'active' : ''}`}
          >
            <span className="sidebar-icon">{l.icon}</span>
            {l.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{user?.username?.[0]?.toUpperCase() || 'A'}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name || user?.username}</div>
            <div className="sidebar-user-role">Admin</div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={logout}>
          Logout
        </button>
      </div>
    </aside>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading-screen">Loading…</div>
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/thoughts" element={<ThoughtsPage />} />
          <Route path="/comments" element={<CommentsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
