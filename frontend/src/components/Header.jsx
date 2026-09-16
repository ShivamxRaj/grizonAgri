import React, { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Menu, LogOut, MapPin, CheckCircle, Phone, User } from 'lucide-react'
import { useLang } from '../i18n/LangProvider'
import { useAuth } from '../context/AuthContext'

export default function Header({ onToggleMobileSidebar }) {
  const { t } = useLang()
  const { farmer, isAuthenticated, openAuthModal, logout } = useAuth()
  const location = useLocation()
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close profile dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/mandi':
        return t('tile_mandi') || 'Mandi Market Prices'
      case '/weather':
        return t('tile_weather') || 'Weather & Spray Advisory'
      case '/disease':
        return t('tile_disease') || 'Crop Disease Scanner'
      case '/planner':
        return t('tile_planner') || 'Crop Season Planner'
      case '/finance':
        return t('tile_finance') || 'Govt Schemes & Subsidies'
      case '/chat':
      case '/':
      default:
        return 'Grizon Agri AI Assistant'
    }
  }

  const avatarSrc = farmer?.gender === 'female' 
    ? '/avatars/female_farmer.png' 
    : '/avatars/male_farmer.png'

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <button 
          className="mobile-menu-toggle" 
          onClick={onToggleMobileSidebar}
          aria-label="Toggle menu"
        >
          <Menu size={22} />
        </button>

        <div className="topbar-title-wrap">
          <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>{getPageTitle()}</span>
        </div>
      </div>

      <div className="topbar-right">
        {/* Auth User Section — Far Right Corner */}
        {isAuthenticated ? (
          <div className="user-profile-wrapper" ref={dropdownRef}>
            <button 
              className="user-avatar-btn"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              title={farmer.name}
            >
              <img 
                src={avatarSrc} 
                alt={farmer.name} 
                className="header-avatar-img"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = '/avatars/male_farmer.png'
                }}
              />
            </button>

            {/* Profile Details Dropdown Card */}
            {profileDropdownOpen && (
              <div className="profile-dropdown-card">
                <div className="profile-card-header">
                  <img 
                    src={avatarSrc} 
                    alt={farmer.name} 
                    className="profile-card-avatar"
                  />
                  <div className="profile-card-titles">
                    <h4 className="profile-farmer-name">{farmer.name}</h4>
                    <div className="profile-verified-phone">
                      <Phone size={12} />
                      <span>+91 {farmer.phone_number}</span>
                      <span className="verified-badge" title="Phone OTP Verified">
                        <CheckCircle size={12} /> Verified
                      </span>
                    </div>
                  </div>
                </div>

                <div className="profile-card-divider"></div>

                <div className="profile-card-details">
                  <div className="profile-detail-item">
                    <MapPin size={14} className="detail-icon" />
                    <span>Location: <b>{farmer.district || 'Ludhiana'}, {farmer.state || 'Punjab'}</b></span>
                  </div>
                </div>

                <button 
                  className="profile-logout-btn" 
                  onClick={() => {
                    setProfileDropdownOpen(false)
                    logout()
                  }}
                >
                  <LogOut size={16} />
                  <span>Log Out / ਲੌਗਆਊਟ</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="header-login-glass-btn" onClick={openAuthModal}>
            <User size={15} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  )
}
