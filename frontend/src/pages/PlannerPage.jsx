import React, { useState, useEffect } from 'react'
import { Calendar, CheckCircle2, Clock, AlertCircle, Sparkles, ChevronRight, Plus } from 'lucide-react'
import { useLang } from '../i18n/LangProvider'

export default function PlannerPage() {
  const { t, lang } = useLang()
  const [selectedCrop, setSelectedCrop] = useState('Wheat')
  const [acreage, setAcreage] = useState('2.5')
  const [sowingDate, setSowingDate] = useState('2025-11-10')
  const [loading, setLoading] = useState(false)
  const [planData, setPlanData] = useState(null)

  const fetchPlan = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop: selectedCrop,
          acreage: parseFloat(acreage) || 2.5,
          sowing_date: sowingDate,
          language: lang === 'pa' ? 'pa-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN'
        })
      })
      if (res.ok) {
        const data = await res.json()
        setPlanData(data)
      } else {
        throw new Error('API Error')
      }
    } catch (e) {
      // Fallback local plan
      setPlanData({
        crop: selectedCrop,
        variety: 'HD-3086 / Recommended',
        acreage: parseFloat(acreage) || 2.5,
        season: 'Rabi',
        sowing_date: sowingDate,
        expected_harvest: '2026-03-30',
        total_stages: 5,
        tasks: [
          { stage_name: lang === 'pa' ? 'ਬੀਜ ਸੋਧ ਅਤੇ ਬੀਜਾਈ' : 'Sowing & Seed Treatment', days_after_sowing: 0, scheduled_date: sowingDate, action_item: lang === 'pa' ? '45 ਕਿੱਲੋ ਬੀਜ ਪ੍ਰਤੀ ਏਕੜ Raxil 2gm ਨਾਲ ਸੋਧ ਕੇ ਬੀਜੋ।' : 'Drill 45kg seed/acre with Raxil treatment.', dosage_recommendation: '45 kg Seed + 50 kg DAP / acre', status: 'COMPLETED' },
          { stage_name: lang === 'pa' ? 'ਪਹਿਲੀ ਸਿੰਚਾਈ (CRI Stage)' : 'First Irrigation (CRI Stage)', days_after_sowing: 21, scheduled_date: '2025-12-01', action_item: lang === 'pa' ? 'ਜੜ੍ਹਾਂ ਬਣਨ ਸਮੇਂ ਪਹਿਲਾ ਪਾਣੀ ਲਾਓ। ਪਾਣੀ ਤੋਂ ਬਾਅਦ ਯੂਰੀਆ ਪਾਓ।' : 'Apply 1st irrigation at Crown Root stage.', dosage_recommendation: '45 kg Urea / acre', status: 'UPCOMING' },
          { stage_name: lang === 'pa' ? 'ਨਦੀਨ ਰੋਕਥਾਮ' : 'Weed Control', days_after_sowing: 35, scheduled_date: '2025-12-15', action_item: lang === 'pa' ? 'ਅੈਕਸੀਅਲ (Pinoxaden 5 EC) 400ml ਛਿੜਕੋ।' : 'Spray Pinoxaden for Phalaris minor control.', dosage_recommendation: '400 ml in 150L water / acre', status: 'PENDING' },
          { stage_name: lang === 'pa' ? 'ਪੀਲੀ ਕੁੰਗੀ ਰੋਕਥਾਮ' : 'Yellow Rust Prevention', days_after_sowing: 75, scheduled_date: '2026-01-24', action_item: lang === 'pa' ? 'Tilt 25 EC 200ml ਦਾ ਪ੍ਰਤੀਬੰਧਕ ਛਿੜਕਾਅ ਕਰੋ।' : 'Proactive spray of Tilt 25 EC.', dosage_recommendation: '200 ml / 200L water', status: 'PENDING' },
          { stage_name: lang === 'pa' ? 'ਕਟਾਈ (Harvest)' : 'Combine Harvest', days_after_sowing: 140, scheduled_date: '2026-03-30', action_item: lang === 'pa' ? 'ਫ਼ਸਲ ਸੁੱਕਣ ਤੇ ਕੰਬਾਈਨ ਨਾਲ ਕਟਾਈ ਕਰੋ।' : 'Harvest when moisture reaches 12-14%.', dosage_recommendation: 'Target: 22-25 Quintals/acre', status: 'PENDING' }
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlan()
  }, [lang])

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 className="page-header-title">
          {lang === 'pa' ? 'ਸਮਾਰਟ ਫਸਲ ਯੋਜਨਾਕਾਰ' : lang === 'hi' ? 'स्मार्ट फसल योजनाकार' : 'Smart Crop Planner'}
        </h1>
        <p className="page-header-sub">
          {lang === 'pa' ? 'ਬੀਜਾਈ ਤੋਂ ਕਟਾਈ ਤੱਕ ਖੇਤੀ ਗਤੀਵਿਧੀਆਂ ਅਤੇ ਖਾਦ ਦਾ ਸ਼ੈਡਿਊਲ' : lang === 'hi' ? 'बुवाई से कटाई तक कृषि गतिविधियों और उर्वरक का शेड्यूल' : 'Field activities & fertilizer schedule from sowing to harvest'}
        </p>
      </div>

      {/* Input Controls Panel */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        padding: '1.25rem',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-color)',
        marginBottom: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'flex-end'
      }}>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
            {lang === 'pa' ? 'ਫ਼ਸਲ (Crop)' : lang === 'hi' ? 'फसल (Crop)' : 'Crop'}
          </label>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.8rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }}
          >
            <option value="Wheat">{lang === 'pa' ? 'ਕਣਕ (Wheat)' : 'Wheat (गेहूं)'}</option>
            <option value="Paddy">{lang === 'pa' ? 'ਝੋਨਾ (Paddy / Rice)' : 'Paddy (धान)'}</option>
            <option value="Cotton">{lang === 'pa' ? 'ਨਰਮਾ / ਕਪਾਹ (Cotton)' : 'Cotton (कपास)'}</option>
            <option value="Mustard">{lang === 'pa' ? 'ਸਰ੍ਹੋਂ (Mustard)' : 'Mustard (सरसों)'}</option>
          </select>
        </div>

        <div style={{ width: '130px' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
            {lang === 'pa' ? 'ਖੇਤ (ਏਕੜ)' : lang === 'hi' ? 'खेत (एकड़)' : 'Acreage'}
          </label>
          <input
            type="number"
            value={acreage}
            onChange={(e) => setAcreage(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.8rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }}
          />
        </div>

        <div style={{ flex: 1, minWidth: '160px' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
            {lang === 'pa' ? 'ਬੀਜਾਈ ਮਿਤੀ (Sowing Date)' : lang === 'hi' ? 'बुवाई तिथि (Sowing Date)' : 'Sowing Date'}
          </label>
          <input
            type="date"
            value={sowingDate}
            onChange={(e) => setSowingDate(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.8rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }}
          />
        </div>

        <button
          onClick={fetchPlan}
          disabled={loading}
          style={{
            padding: '0.65rem 1.25rem',
            backgroundColor: 'var(--accent-agri)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Sparkles size={16} />
          <span>{loading ? 'Generating...' : (lang === 'pa' ? 'ਯੋਜਨਾ ਬਣਾਓ' : 'Generate Schedule')}</span>
        </button>
      </div>

      {/* Timeline Steps Display */}
      {planData && (
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                🌾 {planData.crop} • {planData.acreage} {lang === 'pa' ? 'ਏਕੜ' : 'Acres'}
              </h2>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {lang === 'pa' ? `ਅਨੁਮਾਨਿਤ ਕਟਾਈ: ${planData.expected_harvest}` : `Expected Harvest: ${planData.expected_harvest}`}
              </span>
            </div>
            <span style={{ backgroundColor: 'var(--accent-agri-bg)', color: 'var(--accent-agri)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-pill)', fontSize: '0.8rem', fontWeight: 700 }}>
              {planData.total_stages || planData.tasks.length} {lang === 'pa' ? 'ਮੁੱਖ ਪੜਾਅ' : 'Key Stages'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {planData.tasks.map((t, idx) => (
              <div key={idx} style={{
                display: 'flex',
                gap: '1rem',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: t.status === 'COMPLETED' ? 'var(--accent-agri)' : t.status === 'UPCOMING' ? 'var(--accent-purple)' : 'var(--bg-card)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  flexShrink: 0
                }}>
                  {idx + 1}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t.stage_name}</h3>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      📅 {t.scheduled_date} ({t.days_after_sowing} DAS)
                    </span>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                    {t.action_item}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--accent-agri)', fontWeight: 600 }}>
                    <span>💊 {t.dosage_recommendation}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
