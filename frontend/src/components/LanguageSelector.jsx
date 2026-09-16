import React from 'react'
import { Globe } from 'lucide-react'
import { useLang } from '../i18n/LangProvider'

export default function LanguageSelector() {
  const { lang, setLang } = useLang()

  const languages = [
    { code: 'pa', label: 'ਪੰਜਾਬੀ' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'en', label: 'English' },
  ]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'var(--bg-card)', padding: '0.2rem 0.4rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-color)' }}>
      <Globe size={14} style={{ color: 'var(--accent-purple)', marginLeft: '0.3rem' }} />
      <div style={{ display: 'flex', gap: '2px' }}>
        {languages.map(({ code, label }) => (
          <button
            key={code}
            onClick={() => setLang(code)}
            style={{
              background: lang === code ? 'var(--accent-purple)' : 'transparent',
              color: lang === code ? '#FFFFFF' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              padding: '0.2rem 0.55rem',
              fontSize: '0.75rem',
              fontWeight: lang === code ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
