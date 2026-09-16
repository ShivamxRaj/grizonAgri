import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  MessageSquare, 
  TrendingUp, 
  CloudSun, 
  ScanLine, 
  Plus, 
  Sun, 
  Moon, 
  MapPin, 
  X,
  Sparkles,
  History
} from 'lucide-react'
import { useLang } from '../i18n/LangProvider'
import LanguageSelector from './LanguageSelector'

import GrizonAgriLogo from './GrizonAgriLogo'

export default function Sidebar({ isOpen, onClose }) {
  const { t, lang } = useLang()
  const location = useLocation()
  const navigate = useNavigate()

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('grizon-theme-mode') || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('grizon-theme-mode', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const handleNewChat = () => {
    navigate('/chat', { state: { reset: true } })
    if (onClose) onClose()
  }

  const navItems = [
    { path: '/chat', label: t('nav_chat') || 'Agri Chat AI', icon: MessageSquare },
    { path: '/planner', label: t('nav_planner') || 'Smart Crop Planner', icon: Sparkles },
    { path: '/mandi', label: t('tile_mandi') || 'Mandi Prices', icon: TrendingUp },
    { path: '/weather', label: t('tile_weather') || 'Weather & Spray', icon: CloudSun },
    { path: '/finance', label: t('nav_finance') || 'Farm Financials', icon: TrendingUp },
    { path: '/disease', label: t('tile_disease') || 'Disease Scan', icon: ScanLine },
  ]


  const recentQueries = [
    lang === 'pa' ? 'ਕਣਕ ਤੇ ਪੀਲਾ ਤੇਲਾ ਦਾ ਇਲਾਜ' : lang === 'hi' ? 'गेहूं पर पीला रतुआ का इलाज' : 'Wheat Yellow Rust Treatment',
    lang === 'pa' ? 'ਲੁਧਿਆਣਾ ਮੰਡੀ ਕਣਕ ਭਾਅ' : lang === 'hi' ? 'लुधियाना मंडी गेहूं भाव' : 'Ludhiana Mandi Wheat Price',
    lang === 'pa' ? 'ਅੱਜ ਖਾਦ ਪਾਉਣ ਦਾ ਸਮਾਂ' : lang === 'hi' ? 'आज खाद डालने का समय' : 'Fertilizer Application Weather',
  ]

  return (
    <aside className={`app-sidebar ${isOpen ? 'mobile-open' : ''}`}>
      {/* Top Header & Brand */}
      <div>
        <div className="sidebar-header">
          <Link to="/chat" className="sidebar-brand" onClick={onClose}>
            <GrizonAgriLogo size={38} />
            <div>
              <h1 className="brand-title">Grizon Agri</h1>
              <span className="brand-sub">by Grizon</span>
            </div>
          </Link>

          {onClose && (
            <button className="mobile-menu-toggle" onClick={onClose} aria-label="Close sidebar">
              <X size={20} />
            </button>
          )}
        </div>

        {/* New Chat Button */}
        <button className="btn-new-chat" onClick={handleNewChat}>
          <Plus size={18} />
          <span>{t('new_chat') || 'New Conversation'}</span>
        </button>

        {/* Navigation Section */}
        <div className="sidebar-nav-section">
          <div className="nav-label">{t('nav_tools') || 'Agricultural Tools'}</div>
          <ul className="nav-list">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path || (location.pathname === '/' && item.path === '/chat')
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`nav-link ${isActive ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <Icon className="nav-icon" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Recent History */}
          <div className="nav-label">{t('recent_history') || 'Recent Queries'}</div>
          <ul className="recent-history-list">
            {recentQueries.map((q, idx) => (
              <li 
                key={idx} 
                className="history-item"
                onClick={() => {
                  navigate('/chat', { state: { initialQuery: q } })
                  if (onClose) onClose()
                }}
              >
                <History size={14} />
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="sidebar-footer">
        <div className="location-badge">
          <MapPin size={13} />
          <span>Ludhiana, Punjab</span>
        </div>

        <div className="sidebar-controls-row">
          <LanguageSelector />
          <button 
            className="theme-toggle-btn" 
            onClick={toggleTheme} 
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </aside>
  )
}
