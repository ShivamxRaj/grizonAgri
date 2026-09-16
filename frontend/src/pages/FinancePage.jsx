import React, { useState, useEffect } from 'react'
import { Calculator, DollarSign, TrendingUp, PieChart, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react'
import { useLang } from '../i18n/LangProvider'

export default function FinancePage() {
  const { t, lang } = useLang()
  const [crop, setCrop] = useState('Wheat')
  const [acreage, setAcreage] = useState('5.0')
  const [expectedYield, setExpectedYield] = useState('22.5')
  const [mandiPrice, setMandiPrice] = useState('2275')
  const [loading, setLoading] = useState(false)
  const [financeData, setFinanceData] = useState(null)

  const calculateFinance = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/finance/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop,
          acreage: parseFloat(acreage) || 5.0,
          expected_yield_quintals_per_acre: parseFloat(expectedYield) || 22.5,
          mandi_price_per_quintal: parseFloat(mandiPrice) || 2275.0
        })
      })
      if (res.ok) {
        const data = await res.json()
        setFinanceData(data)
      } else {
        throw new Error('API Error')
      }
    } catch (e) {
      // Local fallback calculation
      const acres = parseFloat(acreage) || 5.0
      const yieldPerAcre = parseFloat(expectedYield) || 22.5
      const price = parseFloat(mandiPrice) || 2275.0

      const costPerAcre = 12100.0
      const totalCost = costPerAcre * acres
      const grossRevenue = yieldPerAcre * acres * price
      const netProfit = grossRevenue - totalCost
      const profitPerAcre = netProfit / acres
      const roi = (netProfit / totalCost) * 100

      setFinanceData({
        crop,
        acreage: acres,
        total_cost: totalCost,
        cost_per_acre: costPerAcre,
        gross_revenue: grossRevenue,
        net_profit: netProfit,
        profit_per_acre: profitPerAcre,
        roi_percentage: roi.toFixed(1),
        expenses: [
          { category: 'Seeds & Seed Treatment', amount_per_acre: 1400, total_amount: 1400 * acres },
          { category: 'Fertilizers (DAP, Urea, Zinc)', amount_per_acre: 3200, total_amount: 3200 * acres },
          { category: 'Pesticides & Fungicides', amount_per_acre: 1800, total_amount: 1800 * acres },
          { category: 'Tractor Tillage & Combine Harvesting', amount_per_acre: 4500, total_amount: 4500 * acres },
          { category: 'Tubewell Irrigation & Power', amount_per_acre: 1200, total_amount: 1200 * acres },
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    calculateFinance()
  }, [])

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 className="page-header-title">
          {lang === 'pa' ? 'ਖੇਤੀ ਹਿਸਾਬ-ਕਿਤਾਬ ਅਤੇ ਮੁਨਾਫ਼ਾ' : lang === 'hi' ? 'कृषि आय-व्यय एवं लाभ' : 'Farm Financial Assistance'}
        </h1>
        <p className="page-header-sub">
          {lang === 'pa' ? 'ਫ਼ਸਲ ਦੀ ਲਾਗਤ, ਕੁੱਲ ਆਮਦਨ ਅਤੇ ਪ੍ਰਤੀ ਏਕੜ ਮੁਨਾਫ਼ੇ ਦਾ ਅਨੁਮਾਨ' : lang === 'hi' ? 'फसल की लागत, कुल आय और प्रति एकड़ लाभ का अनुमान' : 'Production cost, yield revenue & net profit per acre analytics'}
        </p>
      </div>

      {/* Input Parameters Box */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        padding: '1.25rem',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-color)',
        marginBottom: '1.5rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        alignItems: 'end'
      }}>
        <div>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
            {lang === 'pa' ? 'ਫ਼ਸਲ (Crop)' : 'Crop'}
          </label>
          <select
            value={crop}
            onChange={(e) => setCrop(e.target.value)}
            style={{ width: '100%', padding: '0.65rem 0.8rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }}
          >
            <option value="Wheat">{lang === 'pa' ? 'ਕਣਕ (Wheat)' : 'Wheat'}</option>
            <option value="Paddy">{lang === 'pa' ? 'ਝੋਨਾ (Paddy)' : 'Paddy'}</option>
            <option value="Cotton">{lang === 'pa' ? 'ਨਰਮਾ (Cotton)' : 'Cotton'}</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
            {lang === 'pa' ? 'ਕੁੱਲ ਏਕੜ (Acres)' : 'Total Acres'}
          </label>
          <input
            type="number"
            value={acreage}
            onChange={(e) => setAcreage(e.target.value)}
            style={{ width: '100%', padding: '0.65rem 0.8rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
            {lang === 'pa' ? 'ਝਾੜ (ਕੁਇੰਟਲ / ਏਕੜ)' : 'Yield (Qtl/Acre)'}
          </label>
          <input
            type="number"
            value={expectedYield}
            onChange={(e) => setExpectedYield(e.target.value)}
            style={{ width: '100%', padding: '0.65rem 0.8rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
            {lang === 'pa' ? 'ਮੰਡੀ ਰੇਟ (₹ / ਕੁਇੰਟਲ)' : 'Mandi Rate (₹/Qtl)'}
          </label>
          <input
            type="number"
            value={mandiPrice}
            onChange={(e) => setMandiPrice(e.target.value)}
            style={{ width: '100%', padding: '0.65rem 0.8rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }}
          />
        </div>

        <button
          onClick={calculateFinance}
          disabled={loading}
          style={{
            padding: '0.7rem 1.25rem',
            backgroundColor: 'var(--accent-purple)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem'
          }}
        >
          <Calculator size={16} />
          <span>{loading ? 'Calculating...' : (lang === 'pa' ? 'ਹਿਸਾਬ ਲਾਓ' : 'Calculate')}</span>
        </button>
      </div>

      {/* KPI Cards Summary */}
      {financeData && (
        <>
          <div className="grid-cards" style={{ marginBottom: '1.5rem' }}>
            <div className="info-card" style={{ borderColor: 'var(--accent-agri)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {lang === 'pa' ? 'ਸ਼ੁੱਧ ਮੁਨਾਫ਼ਾ (Net Profit)' : 'Net Profit'}
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-agri)', marginTop: '0.25rem' }}>
                ₹{financeData.net_profit?.toLocaleString()}
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--accent-agri)', fontWeight: 600 }}>
                +{financeData.roi_percentage}% ROI
              </span>
            </div>

            <div className="info-card">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {lang === 'pa' ? 'ਪ੍ਰਤੀ ਏਕੜ ਮੁਨਾਫ਼ਾ' : 'Profit / Acre'}
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-purple)', marginTop: '0.25rem' }}>
                ₹{financeData.profit_per_acre?.toLocaleString()}
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {lang === 'pa' ? 'ਸਾਰਾ ਖਰਚਾ ਕੱਢ ਕੇ' : 'After all expenses'}
              </span>
            </div>

            <div className="info-card">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {lang === 'pa' ? 'ਕੁੱਲ ਖਰਚਾ (Total Cost)' : 'Total Cost'}
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-danger)', marginTop: '0.25rem' }}>
                ₹{financeData.total_cost?.toLocaleString()}
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                ₹{financeData.cost_per_acre?.toLocaleString()} / {lang === 'pa' ? 'ਏਕੜ' : 'acre'}
              </span>
            </div>
          </div>

          {/* Expense Breakdown List */}
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              📊 {lang === 'pa' ? 'ਖਰਚਿਆਂ ਦਾ ਵੇਰਵਾ (Cost Breakdown)' : 'Production Cost Breakdown'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {financeData.expenses.map((exp, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 500 }}>{exp.category}</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                      ₹{exp.total_amount?.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ₹{exp.amount_per_acre} / acre
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
