import React from 'react'
import { Sun, CloudRain, CloudSun, Wind, Droplets, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useLang } from '../i18n/LangProvider'

export default function WeatherPage() {
  const { t, lang } = useLang()

  const [apiWeather, setApiWeather] = React.useState(null)

  React.useEffect(() => {
    fetch(`/api/v1/weather/forecast?district=Ludhiana&language=${lang === 'pa' ? 'pa-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN'}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.forecast) {
          setApiWeather(data)
        }
      })
      .catch(() => {})
  }, [lang])

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


  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 className="page-header-title">{t('weather_forecast') || 'Weather & Spray Advisory'}</h1>
        <p className="page-header-sub">
          {lang === 'pa' ? 'ਲੁਧਿਆਣਾ, ਪੰਜਾਬ • ਖੇਤੀਬਾੜੀ ਮੌਸਮ ਵਿਭਾਗ' : lang === 'hi' ? 'लुधियाना, पंजाब • कृषि मौसम स्टेशन' : 'Ludhiana, Punjab • Agricultural Meteorological Station'}
        </p>
      </div>

      {/* Spray Window Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1.25rem',
        borderRadius: 'var(--radius-xl)',
        backgroundColor: 'var(--accent-agri-bg)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--accent-agri)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <CheckCircle2 size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-agri)', marginBottom: '0.2rem' }}>
            {lang === 'pa' ? 'ਅੱਜ ਫਸਲ ਤੇ ਛਿੜਕਾਅ ਦੀ ਸਲਾਹ: ਸੁਰੱਖਿਅਤ (SAFE)' : lang === 'hi' ? 'आज फसल पर छिड़काव की सलाह: सुरक्षित (SAFE)' : "Today's Spray Conditions: IDEAL / SAFE"}
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
            {lang === 'pa' ? 'ਹਵਾ ਦੀ ਗਤੀ 12 km/h ਹੈ ਅਤੇ ਮੀਂਹ ਦੀ ਕੋਈ ਸੰਭਾਵਨਾ ਨਹੀਂ। ਸਵੇਰੇ 11 ਵਜੇ ਤੋਂ ਪਹਿਲਾਂ ਛਿੜਕਾਅ ਪੂਰਾ ਕਰੋ।' : lang === 'hi' ? 'हवा की गति 12 km/h है और बारिश की संभावना नहीं है। सुबह 11 बजे से पहले छिड़काव पूरा करें।' : 'Wind speed is optimal at 12 km/h with 0% rain probability. Complete spraying before 11:00 AM for maximum absorption.'}
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
