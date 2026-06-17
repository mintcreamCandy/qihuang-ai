import { Link, useLocation } from 'react-router-dom'
import { useContext, useState } from 'react'
import { AuthContext } from '../App'
import './Header.css'

function Header() {
  const { user, logout } = useContext(AuthContext)
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const navItems = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/consult', label: '问诊', icon: '💬' },
    { path: '/herbs', label: '本草', icon: '🌿' },
    { path: '/prescriptions', label: '方剂', icon: '📜' },
    { path: '/knowledge-graph', label: '图谱', icon: '🧠' },
  ]

  return (
    <header className="header" id="main-header">
      <div className="header-inner">
        {/* Logo */}
        <Link to="/" className="header-logo" id="header-logo">
          <span className="logo-icon">岐</span>
          <span className="logo-text">岐黄AI</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="header-nav" id="main-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              id={`nav-${item.path.replace('/', '') || 'home'}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="header-user">
          <div className="user-profile" id="user-profile-btn" onClick={() => setMenuOpen(!menuOpen)}>
            <div className="user-avatar">
              {user?.name?.charAt(0) || '用'}
            </div>
            <span className="user-name">{user?.name || '用户'}</span>
            <span className="user-constitution tag tag-gold">{user?.profile?.constitution || ''}</span>
          </div>

          {/* Dropdown */}
          {menuOpen && (
            <div className="user-dropdown" id="user-dropdown">
              <Link to="/profile" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                👤 个人画像
              </Link>
              <Link to="/profile" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                ⚙️ 设置
              </Link>
              <div className="dropdown-divider" />
              <button className="dropdown-item dropdown-logout" onClick={logout} id="logout-btn">
                🚪 退出登录
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="mobile-toggle"
          id="mobile-menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          <span className={`hamburger ${menuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </div>
    </header>
  )
}

export default Header
