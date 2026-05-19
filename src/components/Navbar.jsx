import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Home, CarFront, ClipboardList, Settings, LogOut, Menu, X } from 'lucide-react'

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  // Scroll lock when mobile drawer is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

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
            <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Home size={18} /> Dashboard
            </NavLink>
          </li>
          {!isAdmin && (
            <>
              <li>
                <NavLink to="/book" className={({ isActive }) => (isActive ? 'active' : '')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CarFront size={18} /> Book a Cab
                </NavLink>
              </li>
              <li>
                <NavLink to="/my-bookings" className={({ isActive }) => (isActive ? 'active' : '')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ClipboardList size={18} /> My Bookings
                </NavLink>
              </li>
            </>
          )}
          <li>
            <NavLink to="/settings" className={({ isActive }) => (isActive ? 'active' : '')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Settings size={18} /> Settings
            </NavLink>
          </li>
          {isAdmin && (
            <li>
              <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : '')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Settings size={18} /> Admin
              </NavLink>
            </li>
          )}
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
            <div className="avatar" title={user?.name}>
              {initials}
            </div>
          </li>
          <li>
            <button onClick={handleLogout} className="navbar-logout" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <LogOut size={18} /> Logout
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
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Backdrop */}
      <div 
        className={`navbar-mobile-backdrop ${menuOpen ? 'open' : ''}`}
        onClick={closeMenu}
      />

      {/* Mobile drawer */}
      <div className={`navbar-mobile ${menuOpen ? 'open' : ''}`}>
        <div className="navbar-mobile-header">
          <div className="navbar-logo" style={{ fontSize: '1.2rem', width: '32px', height: '32px' }}>Y</div>
          <span className="navbar-name" style={{ fontSize: '1.2rem' }}>Yes<span>Cab</span></span>
          <button className="navbar-hamburger" onClick={closeMenu} style={{ marginLeft: 'auto' }}>
            <X size={24} />
          </button>
        </div>
        
        <NavLink to="/dashboard" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Home size={20} /> Dashboard
        </NavLink>
        {!isAdmin && (
          <>
            <NavLink to="/book" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CarFront size={20} /> Book a Cab
            </NavLink>
            <NavLink to="/my-bookings" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ClipboardList size={20} /> My Bookings
            </NavLink>
          </>
        )}
        <NavLink to="/settings" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings size={20} /> Settings
        </NavLink>
        {isAdmin && (
          <NavLink to="/admin" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={20} /> Admin
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
        <button onClick={handleLogout} style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LogOut size={20} /> Logout
        </button>
      </div>
    </>
  )
}
