import React from 'react'
import { useLang } from '../i18n/LangProvider'
import { useNavigate } from 'react-router-dom'

const tiles = [
  { key: 'crop',    icon: '🌾', labelKey: 'tile_crop',    subKey: 'tile_crop_sub',    className: 'tile--crop',    path: '/crop' },
  { key: 'weather', icon: '🌤️', labelKey: 'tile_weather', subKey: 'tile_weather_sub', className: 'tile--weather', path: '/weather' },
  { key: 'mandi',   icon: '💰', labelKey: 'tile_mandi',   subKey: 'tile_mandi_sub',   className: 'tile--mandi',   path: '/mandi' },
  { key: 'disease', icon: '🔬', labelKey: 'tile_disease', subKey: 'tile_disease_sub', className: 'tile--disease', path: '/disease' },
]

export default function TileGrid() {
  const { t } = useLang()
  const navigate = useNavigate()

  return (
    <div className="tile-grid">
      {tiles.map(({ key, icon, labelKey, subKey, className, path }) => (
        <button
          key={key}
          className={`tile ${className}`}
          onClick={() => navigate(path)}
          aria-label={t(labelKey)}
        >
          <span className="tile__icon" role="img" aria-hidden="true">{icon}</span>
          <span className="tile__label">{t(labelKey)}</span>
          <span className="tile__sublabel">{t(subKey)}</span>
        </button>
      ))}
    </div>
  )
}
