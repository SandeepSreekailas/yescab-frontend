import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
    navigate('/login')
  }

  const closeMenu = () => setMenuOpen(false)

  const initials = user?.name
    ? user.name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '?'

  return (
    <>
      <nav className="navbar">
        {/* Brand */}
        <NavLink to="/dashboard" className="navbar-brand" onClick={closeMenu}>
          <div className="navbar-logo">Y</div>
          <span className="navbar-name">
            Yes<span>Cab</span>
          </span>
        </NavLink>

        {/* Desktop links */}
        <ul className="navbar-links">
          <li>
            <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
              🏠 Dashboard
            </NavLink>
          </li>
          {!isAdmin && (
            <>
              <li>
                <NavLink to="/book" className={({ isActive }) => (isActive ? 'active' : '')}>
                  🚕 Book a Cab
                </NavLink>
              </li>
              <li>
                <NavLink to="/my-bookings" className={({ isActive }) => (isActive ? 'active' : '')}>
                  📋 My Bookings
                </NavLink>
              </li>
            </>
          )}
          {isAdmin && (
            <li>
              <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : '')}>
                ⚙️ Admin
              </NavLink>
            </li>
          )}
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
            <div className="avatar" title={user?.name}>
              {initials}
            </div>
          </li>
          <li>
            <button onClick={handleLogout} className="navbar-logout">
              🚪 Logout
            </button>
          </li>
        </ul>

        {/* Hamburger */}
        <button
          className="navbar-hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile drawer */}
      <div className={`navbar-mobile ${menuOpen ? 'open' : ''}`}>
        <NavLink to="/dashboard" onClick={closeMenu}>
          🏠 Dashboard
        </NavLink>
        {!isAdmin && (
          <>
            <NavLink to="/book" onClick={closeMenu}>
              🚕 Book a Cab
            </NavLink>
            <NavLink to="/my-bookings" onClick={closeMenu}>
              📋 My Bookings
            </NavLink>
          </>
        )}
        {isAdmin && (
          <NavLink to="/admin" onClick={closeMenu}>
            ⚙️ Admin Dashboard
          </NavLink>
        )}
        <div
          style={{
            padding: '0.5rem 1rem',
            color: 'var(--text-muted)',
            fontSize: '0.82rem',
            borderTop: '1px solid var(--border)',
            marginTop: '0.25rem',
          }}
        >
          Signed in as <strong style={{ color: 'var(--text)' }}>{user?.name}</strong>
        </div>
        <button onClick={handleLogout} style={{ color: 'var(--danger)' }}>
          🚪 Logout
        </button>
      </div>
    </>
  )
}
