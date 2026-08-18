import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import cattleLogo from "../assets/cattle.png"
const NAV_ITEMS = [
  { path: '/',        label: 'Dashboard' },
  { path: '/health',  label: 'Health' },
  { path: '/vet',     label: 'Vet & AI'},
  { path: '/milk',    label: 'Milk' },
  { path: '/finance', label: 'Finance'},
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme]       = useState(() => localStorage.getItem('theme') || 'dark')
  const location                = useLocation()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => { setMenuOpen(false) }, [location])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  const isLight     = theme === 'light'

  return (
    <>
      {/* ── TOP NAV ── */}
      <nav className="topnav">
        {/* Brand */}
        <NavLink to="/" className="topnav-brand">
          <div className="floating-logo">
            <img
              src={cattleLogo}
              alt="GauRaksha Logo"
              className="logo-image"
            />
          </div>
        </NavLink>

        {/* Desktop links */}
        <div className="topnav-links">
          {NAV_ITEMS.map(({ path, label, emoji }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) => `topnav-link${isActive ? ' active' : ''}`}
            >
              <span style={{ fontSize: 13 }}>{emoji}</span>
              {label}
            </NavLink>
          ))}
        </div>

        {/* Right actions */}
        <div className="topnav-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="live-dot" />
            <span style={{ fontSize: 11, color: 'var(--green)', fontFamily: 'JetBrains Mono,monospace', letterSpacing: '0.05em' }}>
              LIVE
            </span>
          </div>
          <button className="btn-theme" onClick={toggleTheme} aria-label="Toggle theme">
            {isLight ? '🌙' : '☀️'}
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className={`hamburger${menuOpen ? ' open' : ''}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Menu"
        >
          <span /><span /><span />
        </button>
      </nav>

      {/* ── MOBILE MENU ── */}
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        {NAV_ITEMS.map(({ path, label, emoji }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) => `mobile-menu-link${isActive ? ' active' : ''}`}
          >
            <span style={{ fontSize: 16, width: 22 }}>{emoji}</span>
            {label}
          </NavLink>
        ))}
        <div className="mobile-menu-divider" />
        <div className="mobile-theme-row">
          <span className="mobile-theme-label">{isLight ? '☀️ Light mode' : '🌙 Dark mode'}</span>
          <button className="btn-theme" onClick={toggleTheme}>{isLight ? '🌙' : '☀️'}</button>
        </div>
      </div>
    </>
  )
}