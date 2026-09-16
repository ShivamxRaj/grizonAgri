import React, { useState } from 'react'
import { Search, TrendingUp, TrendingDown, Volume2, MapPin, Filter } from 'lucide-react'
import { useLang } from '../i18n/LangProvider'

export default function MandiPage() {
  const { t, lang } = useLang()
  const [selectedDistrict, setSelectedDistrict] = useState('All')
  const [searchCrop, setSearchCrop] = useState('')

  const [apiMandiList, setApiMandiList] = useState([])

  React.useEffect(() => {
    fetch('/api/v1/mandi/prices')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setApiMandiList(data.map(item => ({
            id: item.id,
            district: item.district,
            market: item.market,
            crop: item.commodity,
            variety: item.variety,
            minPrice: item.min_price,
            maxPrice: item.max_price,
            modalPrice: item.modal_price,
            trend: item.trend
          })))
        }
      })
      .catch(() => {})
  }, [])

  const mandiDataPerLang = {
    pa: [
      { id: 1, district: 'ਲੁਧਿਆਣਾ', market: 'ਲੁਧਿਆਣਾ ਮੁੱਖ ਮੰਡੀ', crop: 'ਕਣਕ (Wheat)', variety: 'HD-3086', minPrice: 2250, maxPrice: 2300, modalPrice: 2275, trend: 'up' },
      { id: 2, district: 'ਬਠਿੰਡਾ', market: 'ਬਠਿੰਡਾ ਮੰਡੀ', crop: 'ਨਰਮਾ / ਕਪਾਹ', variety: 'ਦੇਸੀ BT', minPrice: 6900, maxPrice: 7250, modalPrice: 7100, trend: 'up' },
      { id: 3, district: 'ਅੰਮ੍ਰਿਤਸਰ', market: 'ਅੰਮ੍ਰਿਤਸਰ ਗ੍ਰੇਨ ਮਾਰਕੀਟ', crop: 'ਝੋਨਾ (Paddy)', variety: 'ਬਾਸਮਤੀ 1121', minPrice: 4100, maxPrice: 4450, modalPrice: 4300, trend: 'down' },
      { id: 4, district: 'ਕਰਨਾਲ', market: 'ਕਰਨਾਲ ਮੰਡੀ', crop: 'ਸਰ੍ਹੋਂ (Mustard)', variety: 'ਕਾਲੀ ਸਰ੍ਹੋਂ', minPrice: 5300, maxPrice: 5600, modalPrice: 5450, trend: 'up' },
      { id: 5, district: 'ਹਿਸਾਰ', market: 'ਹਿਸਾਰ ਮੰਡੀ', crop: 'ਕਣਕ (Wheat)', variety: 'PBW-725', minPrice: 2240, maxPrice: 2280, modalPrice: 2265, trend: 'flat' },
      { id: 6, district: 'ਜਲੰਧਰ', market: 'ਜਲੰਧਰ ਸਿਟੀ ਮੰਡੀ', crop: 'ਆਲੂ (Potato)', variety: 'ਜੋਤੀ', minPrice: 1000, maxPrice: 1250, modalPrice: 1150, trend: 'down' }
    ],
    hi: [
      { id: 1, district: 'लुधियाना', market: 'लुधियाना मुख्य मंडी', crop: 'गेहूं (Wheat)', variety: 'HD-3086', minPrice: 2250, maxPrice: 2300, modalPrice: 2275, trend: 'up' },
      { id: 2, district: 'बठिंडा', market: 'बठिंडा मंडी', crop: 'कपास (Cotton)', variety: 'देशी BT', minPrice: 6900, maxPrice: 7250, modalPrice: 7100, trend: 'up' },
      { id: 3, district: 'अमृतसर', market: 'अमृतसर गल्ला मंडी', crop: 'धान (Paddy)', variety: 'बासमती 1121', minPrice: 4100, maxPrice: 4450, modalPrice: 4300, trend: 'down' },
      { id: 4, district: 'करनाल', market: 'करनाल मंडी', crop: 'सरसों (Mustard)', variety: 'काली सरसों', minPrice: 5300, maxPrice: 5600, modalPrice: 5450, trend: 'up' },
      { id: 5, district: 'हिसार', market: 'हिसार मंडी', crop: 'गेहूं (Wheat)', variety: 'PBW-725', minPrice: 2240, maxPrice: 2280, modalPrice: 2265, trend: 'flat' },
      { id: 6, district: 'जालंधर', market: 'जालंधर मंडी', crop: 'आलू (Potato)', variety: 'ज्योति', minPrice: 1000, maxPrice: 1250, modalPrice: 1150, trend: 'down' }
    ],
    en: [
      { id: 1, district: 'Ludhiana', market: 'Ludhiana Main APMC', crop: 'Wheat', variety: 'HD-3086', minPrice: 2250, maxPrice: 2300, modalPrice: 2275, trend: 'up' },
      { id: 2, district: 'Bathinda', market: 'Bathinda APMC', crop: 'Cotton', variety: 'Desi BT', minPrice: 6900, maxPrice: 7250, modalPrice: 7100, trend: 'up' },
      { id: 3, district: 'Amritsar', market: 'Amritsar Grain Market', crop: 'Paddy', variety: 'Basmati 1121', minPrice: 4100, maxPrice: 4450, modalPrice: 4300, trend: 'down' },
      { id: 4, district: 'Karnal', market: 'Karnal APMC', crop: 'Mustard', variety: 'Kala Saron', minPrice: 5300, maxPrice: 5600, modalPrice: 5450, trend: 'up' },
      { id: 5, district: 'Hisar', market: 'Hisar APMC', crop: 'Wheat', variety: 'PBW-725', minPrice: 2240, maxPrice: 2280, modalPrice: 2265, trend: 'flat' },
      { id: 6, district: 'Jalandhar', market: 'Jalandhar City APMC', crop: 'Potato', variety: 'Jyoti', minPrice: 1000, maxPrice: 1250, modalPrice: 1150, trend: 'down' }
    ]
  }

  const currentMandiList = apiMandiList.length > 0 ? apiMandiList : (mandiDataPerLang[lang] || mandiDataPerLang.en)


  const filteredData = currentMandiList.filter((item) => {
    const matchesDistrict = selectedDistrict === 'All' || item.district === selectedDistrict
    const matchesCrop = !searchCrop || item.crop.toLowerCase().includes(searchCrop.toLowerCase()) || item.variety.toLowerCase().includes(searchCrop.toLowerCase())
    return matchesDistrict && matchesCrop
  })

  const readPricesAloud = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const text = filteredData.slice(0, 3).map(d => 
        lang === 'pa' ? `${d.district} ਮੰਡੀ ਵਿੱਚ ${d.crop} ਦਾ ਰੇਟ ₹${d.modalPrice} ਪ੍ਰਤੀ ਕੁਇੰਟਲ ਹੈ।` :
        lang === 'hi' ? `${d.district} मंडी में ${d.crop} का भाव ₹${d.modalPrice} प्रति क्विंटल है।` :
        `In ${d.district} market, ${d.crop} rate is ₹${d.modalPrice} per quintal.`
      ).join(' ')
      const speech = new SpeechSynthesisUtterance(text)
      speech.lang = lang === 'pa' ? 'pa-IN' : lang === 'hi' ? 'hi-IN' : 'en-US'
      window.speechSynthesis.speak(speech)
    }
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page-header-title">{t('mandi_rates') || 'Live Mandi Market Rates'}</h1>
          <p className="page-header-sub">
            {lang === 'pa' ? 'ਪੰਜਾਬ ਅਤੇ ਹਰਿਆਣਾ ਦੀਆਂ ਮੰਡੀਆਂ ਦੇ ਸਰਕਾਰੀ ਰੇਟ' : lang === 'hi' ? 'पंजाब और हरियाणा मंडियों के आधिकारिक भाव' : 'APMC Official Market Prices • Punjab & Haryana'}
          </p>
        </div>

        <button className="tts-play-btn" onClick={readPricesAloud}>
          <Volume2 size={16} />
          <span>{t('read_aloud') || 'Listen Rates'}</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="dock-text-input"
            style={{ width: '100%', paddingLeft: '2.25rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
            placeholder={lang === 'pa' ? 'ਫ਼ਸਲ ਜਾਂ ਕਿਸਮ ਦੀ ਖੋਜ ਕਰੋ...' : lang === 'hi' ? 'फसल या किस्म खोजें...' : 'Search crop or variety...'}
            value={searchCrop}
            onChange={(e) => setSearchCrop(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-card)', padding: '0 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <Filter size={15} style={{ color: 'var(--text-muted)' }} />
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.88rem', padding: '0.5rem 0', outline: 'none', cursor: 'pointer' }}
          >
            <option value="All">{lang === 'pa' ? 'ਸਾਰੇ ਜ਼ਿਲ੍ਹੇ (All)' : lang === 'hi' ? 'सभी ज़िले (All)' : 'All Districts'}</option>
            <option value={lang === 'pa' ? 'ਲੁਧਿਆਣਾ' : lang === 'hi' ? 'लुधियाना' : 'Ludhiana'}>Ludhiana</option>
            <option value={lang === 'pa' ? 'ਬਠਿੰਡਾ' : lang === 'hi' ? 'बठिंडा' : 'Bathinda'}>Bathinda</option>
            <option value={lang === 'pa' ? 'ਅੰਮ੍ਰਿਤਸਰ' : lang === 'hi' ? 'अमृतसर' : 'Amritsar'}>Amritsar</option>
          </select>
        </div>
      </div>

      {/* Mandi Cards Grid */}
      <div className="grid-cards">
        {filteredData.map((item) => (
          <div key={item.id} className="info-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.crop}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {lang === 'pa' ? `ਕਿਸਮ: ${item.variety}` : lang === 'hi' ? `किस्म: ${item.variety}` : `Variety: ${item.variety}`}
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: item.trend === 'up' ? 'var(--accent-agri-bg)' : 'var(--accent-danger-bg)',
                color: item.trend === 'up' ? 'var(--accent-agri)' : 'var(--accent-danger)'
              }}>
                {item.trend === 'up' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                <span>{item.trend === 'up' ? '+₹25' : item.trend === 'down' ? '-₹15' : 'Stable'}</span>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                {lang === 'pa' ? 'ਔਸਤ ਮੰਡੀ ਰੇਟ' : lang === 'hi' ? 'औसत मंडी भाव' : 'Modal APMC Rate'}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-purple)' }}>
                ₹{item.modalPrice} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {lang === 'pa' ? '/ ਕੁਇੰਟਲ' : lang === 'hi' ? '/ कुंतल' : '/ quintal'}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {lang === 'pa' ? `ਸੀਮਾ: ₹${item.minPrice} - ₹${item.maxPrice}` : lang === 'hi' ? `सीमा: ₹${item.minPrice} - ₹${item.maxPrice}` : `Range: ₹${item.minPrice} - ₹${item.maxPrice}`}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem' }}>
              <MapPin size={13} style={{ color: 'var(--accent-agri)' }} />
              <span>{item.market}, {item.district}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
