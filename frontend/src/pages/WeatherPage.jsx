import React from 'react'
import { Sun, CloudRain, CloudSun, Wind, Droplets, CheckCircle2, AlertTriangle, MapPin, Search } from 'lucide-react'
import { useLang } from '../i18n/LangProvider'

export default function WeatherPage() {
  const { t, lang } = useLang()

  const [selectedDistrict, setSelectedDistrict] = React.useState('Khanna')
  const [apiWeather, setApiWeather] = React.useState(null)
  const [isLoading, setIsLoading] = React.useState(false)

  const districtOptions = [
    'Khanna', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 
    'Mohali', 'Chandigarh', 'Hoshiarpur', 'Gurdaspur', 'Firozpur', 'Sangrur', 
    'Mansa', 'Barnala', 'Faridkot', 'Muktsar', 'Moga', 'Kapurthala', 'Tarn Taran', 
    'Pathankot', 'Fazilka', 'Karnal', 'Hisar', 'Ambala', 'Delhi'
  ]

  React.useEffect(() => {
    setIsLoading(true)
    fetch(`/api/v1/weather/forecast?district=${encodeURIComponent(selectedDistrict)}&language=${lang === 'pa' ? 'pa-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN'}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.forecast) {
          setApiWeather(data)
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [selectedDistrict, lang])

  const weatherDataPerLang = {
    pa: [
      { day: 'ਅੱਜ (Today)', temp: '32°C / 21°C', icon: Sun, condition: 'ਸਾਫ਼ ਧੁੱਪ', humidity: '45%', wind: '12 km/h', spray: 'safe', sprayText: 'ਛਿੜਕਾਅ ਲਈ ਵਧੀਆ ਮੌਸਮ' },
      { day: 'ਕੱਲ੍ਹ (Tomorrow)', temp: '30°C / 20°C', icon: CloudSun, condition: 'ਹਲਕੇ ਬਾਦਲ', humidity: '55%', wind: '14 km/h', spray: 'safe', sprayText: 'ਛਿੜਕਾਅ ਕੀਤਾ ਜਾ ਸਕਦਾ ਹੈ' },
      { day: 'ਪਰਸੋਂ (Day 3)', temp: '27°C / 18°C', icon: CloudRain, condition: 'ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ', humidity: '80%', wind: '22 km/h', spray: 'avoid', sprayText: '⚠️ ਛਿੜਕਾਅ ਨਾ ਕਰੋ! ਮੀਂਹ ਪਵੇਗਾ' },
      { day: 'ਸ਼ੁੱਕਰਵਾਰ (Day 4)', temp: '28°C / 19°C', icon: CloudRain, condition: 'ਹਲਕੀ ਬੂੰਦਾ-ਬਾਂਦੀ', humidity: '72%', wind: '18 km/h', spray: 'caution', sprayText: 'ਸਾਵਧਾਨੀ ਨਾਲ ਛਿੜਕਾਅ ਕਰੋ' },
      { day: 'ਸ਼ਨਿੱਚਰਵਾਰ (Day 5)', temp: '31°C / 22°C', icon: Sun, condition: 'ਧੁੱਪ', humidity: '40%', wind: '10 km/h', spray: 'safe', sprayText: 'ਛਿੜਕਾਅ ਲਈ ਢੁਕਵਾਂ' }
    ],
    hi: [
      { day: 'आज (Today)', temp: '32°C / 21°C', icon: Sun, condition: 'साफ़ धूप', humidity: '45%', wind: '12 km/h', spray: 'safe', sprayText: 'छिड़काव के लिए उत्तम मौसम' },
      { day: 'कल (Tomorrow)', temp: '30°C / 20°C', icon: CloudSun, condition: 'हल्के बादल', humidity: '55%', wind: '14 km/h', spray: 'safe', sprayText: 'छिड़काव किया जा सकता है' },
      { day: 'परसों (Day 3)', temp: '27°C / 18°C', icon: CloudRain, condition: 'बारिश की संभावना', humidity: '80%', wind: '22 km/h', spray: 'avoid', sprayText: '⚠️ छिड़काव न करें! बारिश होगी' },
      { day: 'शुक्रवार (Day 4)', temp: '28°C / 19°C', icon: CloudRain, condition: 'हल्की बूंदाबांदी', humidity: '72%', wind: '18 km/h', spray: 'caution', sprayText: 'सावधानी से छिड़काव करें' },
      { day: 'शनिवार (Day 5)', temp: '31°C / 22°C', icon: Sun, condition: 'धूप व साफ़', humidity: '40%', wind: '10 km/h', spray: 'safe', sprayText: 'छिड़काव के लिए अनुकूल' }
    ],
    en: [
      { day: 'Today', temp: '32°C / 21°C', icon: Sun, condition: 'Clear Sunshine', humidity: '45%', wind: '12 km/h', spray: 'safe', sprayText: 'Good Time to Spray' },
      { day: 'Tomorrow', temp: '30°C / 20°C', icon: CloudSun, condition: 'Partly Cloudy', humidity: '55%', wind: '14 km/h', spray: 'safe', sprayText: 'Safe for Spraying' },
      { day: 'Day 3', temp: '27°C / 18°C', icon: CloudRain, condition: 'Rain Expected', humidity: '80%', wind: '22 km/h', spray: 'avoid', sprayText: '⚠️ Do NOT Spray! Rain Expected' },
      { day: 'Day 4', temp: '28°C / 19°C', icon: CloudRain, condition: 'Light Drizzle', humidity: '72%', wind: '18 km/h', spray: 'caution', sprayText: 'Spray with Caution' },
      { day: 'Day 5', temp: '31°C / 22°C', icon: Sun, condition: 'Sunny & Warm', humidity: '40%', wind: '10 km/h', spray: 'safe', sprayText: 'Ideal for Fertilizer Spray' }
    ]
  }

  const forecastDays = apiWeather?.forecast ? apiWeather.forecast.map(f => ({
    day: f.day,
    temp: f.temp,
    icon: f.spray_status === 'avoid' ? CloudRain : (f.spray_status === 'caution' ? CloudSun : Sun),
    condition: f.condition,
    humidity: f.humidity,
    wind: f.wind,
    spray: f.spray_status,
    sprayText: f.spray_text
  })) : (weatherDataPerLang[lang] || weatherDataPerLang.en)

  const isTodayAvoid = apiWeather?.today_status === 'AVOID'
  const isTodayCaution = apiWeather?.today_status === 'CAUTION'

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page-header-title">{t('weather_forecast') || 'Weather & Spray Advisory'}</h1>
          <p className="page-header-sub">
            <MapPin size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
            {apiWeather?.district || selectedDistrict}, {apiWeather?.state || 'Punjab'} • {lang === 'pa' ? 'ਖੇਤੀਬਾੜੀ ਮੌਸਮ ਵਿਭਾਗ (Live OWM)' : lang === 'hi' ? 'कृषि मौसम स्टेशन (Live OWM)' : 'Agricultural Meteorological Station (Live OWM)'}
          </p>
        </div>

        {/* District Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--card-bg)', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {districtOptions.map((dist) => (
              <option key={dist} value={dist} style={{ backgroundColor: '#1e293b', color: '#fff' }}>
                {dist}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Spray Window Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1.25rem',
        borderRadius: 'var(--radius-xl)',
        backgroundColor: isTodayAvoid ? 'var(--accent-danger-bg)' : isTodayCaution ? 'rgba(245, 158, 11, 0.15)' : 'var(--accent-agri-bg)',
        border: `1px solid ${isTodayAvoid ? 'rgba(239, 68, 68, 0.3)' : isTodayCaution ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
        marginBottom: '1.5rem'
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: isTodayAvoid ? 'var(--accent-danger)' : isTodayCaution ? '#f59e0b' : 'var(--accent-agri)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {isTodayAvoid ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
        </div>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: isTodayAvoid ? 'var(--accent-danger)' : isTodayCaution ? '#f59e0b' : 'var(--accent-agri)', marginBottom: '0.2rem' }}>
            {apiWeather?.today_status ? `${apiWeather.district}: Today Spray Status: ${apiWeather.today_status}` : (lang === 'pa' ? 'ਅੱਜ ਫਸਲ ਤੇ ਛਿੜਕਾਅ ਦੀ ਸਲਾਹ' : 'Today Spray Conditions')}
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
            {apiWeather?.today_advisory || (lang === 'pa' ? 'ਮੌਸਮ ਡਾਟਾ ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...' : 'Loading weather forecast...')}
          </p>
        </div>
      </div>

      {/* 5-Day Forecast Grid */}
      <div className="grid-cards">
        {forecastDays.map((f, idx) => {
          const IconComp = f.icon
          const isAvoid = f.spray === 'avoid'
          return (
            <div key={idx} className="info-card" style={{ borderColor: isAvoid ? 'var(--accent-danger)' : undefined }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{f.day}</span>
                <IconComp size={22} style={{ color: isAvoid ? 'var(--accent-danger)' : 'var(--accent-purple)' }} />
              </div>

              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                {f.temp}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
                {f.condition}
              </div>

              <div style={{ display: 'flex', gap: '0.85rem', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Droplets size={13} style={{ color: 'var(--accent-purple)' }} />
                  <span>{f.humidity}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Wind size={13} style={{ color: 'var(--accent-agri)' }} />
                  <span>{f.wind}</span>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                padding: '0.4rem 0.65rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isAvoid ? 'var(--accent-danger-bg)' : 'var(--accent-agri-bg)',
                color: isAvoid ? 'var(--accent-danger)' : 'var(--accent-agri)'
              }}>
                {isAvoid ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
                <span>{f.sprayText}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

