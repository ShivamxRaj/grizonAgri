import React, { useState, useEffect } from 'react'
import { X, ShieldCheck, User, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import GrizonAgriLogo from '../components/GrizonAgriLogo'

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, requestOTP, verifyOTP, saveProfile } = useAuth()

  const [step, setStep] = useState(1) // 1: Phone, 2: OTP, 3: Profile Setup
  const [phone, setPhone] = useState('')
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [name, setName] = useState('')
  const [farmerId, setFarmerId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Always reset to Step 1 from the beginning whenever modal opens
  useEffect(() => {
    if (isAuthModalOpen) {
      setStep(1)
      setPhone('')
      setOtpDigits(['', '', '', '', '', ''])
      setName('')
      setError('')
    }
  }, [isAuthModalOpen])

  if (!isAuthModalOpen) return null

  const handlePhoneSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length < 10) {
      setError('Please enter a valid 10-digit mobile number')
      return
    }

    setLoading(true)
    try {
      await requestOTP(cleaned)
      setStep(2)
    } catch (err) {
      setError(err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1)
    const nextDigits = [...otpDigits]
    nextDigits[index] = value
    setOtpDigits(nextDigits)

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }

  const handleOtpVerify = async (e) => {
    e.preventDefault()
    setError('')
    const code = otpDigits.join('')
    if (code.length < 6) {
      setError('Please enter 6-digit OTP code')
      return
    }

    setLoading(true)
    try {
      const res = await verifyOTP(phone, code)
      setFarmerId(res.farmer.farmer_id)
      
      // If returning user with registered name, log in immediately!
      if (!res.is_new_user && res.farmer.name) {
        closeAuthModal()
      } else {
        setStep(3)
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP code')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('Please enter your name')
      return
    }

    setLoading(true)
    try {
      await saveProfile({
        farmerId,
        name: name.trim()
      })
      closeAuthModal()
    } catch (err) {
      setError(err.message || 'Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-modal-backdrop" onClick={closeAuthModal}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={closeAuthModal} title="Close">
          <X size={18} />
        </button>

        {error && (
          <div className="auth-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Phone Input */}
        {step === 1 && (
          <form onSubmit={handlePhoneSubmit} className="auth-step-body">
            <div className="auth-icon-header">
              <div className="auth-icon-badge logo-grizon-badge">
                <GrizonAgriLogo size={36} />
              </div>
              <h2>Welcome to Grizon Agri</h2>
              <p>Enter mobile number to log in</p>
            </div>

            <div className="auth-input-group">
              <div className="auth-phone-input-wrap">
                <span className="auth-country-code">🇮🇳 +91</span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoFocus
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-primary-btn" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* STEP 2: OTP Verification */}
        {step === 2 && (
          <form onSubmit={handleOtpVerify} className="auth-step-body">
            <div className="auth-icon-header">
              <div className="auth-icon-badge success">
                <ShieldCheck size={24} />
              </div>
              <h2>Enter 6-Digit OTP</h2>
              <p>Sent to +91-{phone} <button type="button" className="auth-link-btn" onClick={() => setStep(1)}>Edit</button></p>
            </div>

            <div className="auth-otp-inputs-row">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-input-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  autoFocus={idx === 0}
                  className="auth-otp-box"
                />
              ))}
            </div>

            <button type="submit" className="auth-primary-btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP & Continue'}
              <CheckCircle2 size={18} />
            </button>
          </form>
        )}

        {/* STEP 3: Ultra Simple Name Setup */}
        {step === 3 && (
          <form onSubmit={handleProfileSubmit} className="auth-step-body">
            <div className="auth-icon-header">
              <div className="auth-icon-badge">
                <User size={24} />
              </div>
              <h2>Profile Setup</h2>
              <p>Please enter your full name</p>
            </div>

            {/* Name Input */}
            <div className="auth-input-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="e.g. Gurpreet Singh / Harpreet Kaur"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <button type="submit" className="auth-primary-btn" disabled={loading}>
              {loading ? 'Saving...' : 'Complete & Start'}
              <ArrowRight size={18} />
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
