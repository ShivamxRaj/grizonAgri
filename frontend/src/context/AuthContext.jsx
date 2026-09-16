import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const API_BASE = 'http://127.0.0.1:8000/api/v1/auth'

export function AuthProvider({ children }) {
  const [farmer, setFarmer] = useState(() => {
    try {
      const saved = localStorage.getItem('grizon_farmer')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const [token, setToken] = useState(() => localStorage.getItem('grizon_token') || null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  useEffect(() => {
    if (farmer) {
      localStorage.setItem('grizon_farmer', JSON.stringify(farmer))
    } else {
      localStorage.removeItem('grizon_farmer')
    }
  }, [farmer])

  useEffect(() => {
    if (token) {
      localStorage.setItem('grizon_token', token)
    } else {
      localStorage.removeItem('grizon_token')
    }
  }, [token])

  const openAuthModal = () => setIsAuthModalOpen(true)
  const closeAuthModal = () => setIsAuthModalOpen(false)

  const requestOTP = async (phoneNumber) => {
    const res = await fetch(`${API_BASE}/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phoneNumber })
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to send OTP')
    }
    return data
  }

  const verifyOTP = async (phoneNumber, otp) => {
    const res = await fetch(`${API_BASE}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phoneNumber, otp })
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.detail || 'Invalid OTP')
    }
    setToken(data.token)
    setFarmer(data.farmer)
    return data
  }

  const saveProfile = async ({ farmerId, name, gender, preferredLanguage, district, primaryCrops }) => {
    const res = await fetch(`${API_BASE}/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farmer_id: farmerId || farmer?.farmer_id,
        name,
        gender: gender || 'male',
        preferred_language: preferredLanguage || 'pa-IN',
        district: district || 'Ludhiana',
        state: 'Punjab',
        primary_crops: primaryCrops || ['Wheat', 'Paddy']
      })
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to update profile')
    }
    setFarmer(data.farmer)
    return data.farmer
  }

  const logout = () => {
    setFarmer(null)
    setToken(null)
    localStorage.removeItem('grizon_farmer')
    localStorage.removeItem('grizon_token')
  }

  return (
    <AuthContext.Provider
      value={{
        farmer,
        token,
        isAuthenticated: !!(farmer && farmer.name),
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        requestOTP,
        verifyOTP,
        saveProfile,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
