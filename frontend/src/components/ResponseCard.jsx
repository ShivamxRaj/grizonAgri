import React, { useState } from 'react'
import { Volume2, VolumeX, Share2, CheckCircle2, Droplets, AlertTriangle, Info, Check } from 'lucide-react'
import { useLang } from '../i18n/LangProvider'

export default function ResponseCard({ data }) {
  const { t, lang } = useLang()
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  const {
    severity = 'high',
    title = 'WARNING',
    bullets = [
      'ਕਣਕ ਤੇ ਪੀਲੀ ਕੁੰਗੀ / ਤੇਲਾ ਦੇ ਲੱਛਣ ਹਨ',
      '200 ਮਿ.ਲੀ. ਟਿਲਟ (Propiconazole 25 EC) ਪਾਓ',
      '200 ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ ਮਿਲਾ ਕੇ ਛਿੜਕਾਅ ਕਰੋ'
    ],
    body = '',
    dosage = '2.5 ਪੰਪ / ਏਕੜ',
    productImage = '/assets/pesticide_bottle.png',
  } = data || {}

  const playAudioAloud = () => {
    if ('speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel()
        setIsPlayingAudio(false)
        return
      }
      window.speechSynthesis.cancel()
      setIsPlayingAudio(true)
      const textToSpeak = `${title}. ${bullets.join('. ')}. ${dosage ? `ਮਾਤਰਾ: ${dosage}` : ''}`
      const speech = new SpeechSynthesisUtterance(textToSpeak)
      speech.lang = lang === 'pa' ? 'pa-IN' : lang === 'hi' ? 'hi-IN' : 'en-US'
      speech.onend = () => setIsPlayingAudio(false)
      speech.onerror = () => setIsPlayingAudio(false)
      window.speechSynthesis.speak(speech)
    }
  }

  const shareWhatsApp = () => {
    const text = `🌾 *Grizon Agri Advisory*\n\n🚨 *${title}*\n\n${bullets.map(b => `• ${b}`).join('\n')}\n\n💧 *Dosage*: ${dosage}\n\n— Voice-first Agri AI by Grizon AI`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const getSeverityClass = () => {
    if (severity === 'high' || title.includes('WARNING')) return 'severity-high'
    if (severity === 'medium' || title.includes('ADVISORY') || title.includes('RATE')) return 'severity-warning'
    return 'severity-info'
  }

  return (
    <div className="response-card">
      {/* Top Bar */}
      <div className="card-header-bar">
        <div className={`severity-pill ${getSeverityClass()}`}>
          {severity === 'high' ? <AlertTriangle size={14} /> : <Info size={14} />}
          <span>{title}</span>
        </div>

        <div className="card-actions-right">
          <button className="tts-play-btn" onClick={playAudioAloud} title="Audio Advisory (Sarvam TTS)">
            {isPlayingAudio ? <VolumeX size={14} /> : <Volume2 size={14} />}
            <span>{isPlayingAudio ? (lang === 'pa' ? 'ਰੋਕੋ' : 'Stop') : (t('btn_listen') || 'Listen')}</span>
          </button>

          <button 
            className="dock-action-btn" 
            onClick={shareWhatsApp} 
            title="Share via WhatsApp"
            style={{ width: '32px', height: '32px' }}
          >
            <Share2 size={15} />
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="card-body-content">
        {bullets && bullets.length > 0 ? (
          <ul className="card-bullets-list">
            {bullets.map((bullet, idx) => (
              <li key={idx} className="bullet-item">
                <CheckCircle2 size={17} className="bullet-icon-check" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ fontSize: '0.95rem', lineHeight: '1.5', color: 'var(--text-primary)' }}>{body}</p>
        )}

        {/* Dosage Callout Pill */}
        {dosage && (
          <div className="dosage-callout-box">
            <Droplets size={20} className="dosage-icon" />
            <div className="dosage-text-wrap">
              <span className="dosage-label">
                {t('dosage_label') || (lang === 'pa' ? 'ਮਾਤਰਾ ਸਲਾਹ' : lang === 'hi' ? 'ਦਵਾਈ ਕੀ ਮਾਤਰਾ' : 'Dosage Recommendation')}
              </span>
              <span className="dosage-value">{dosage}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
