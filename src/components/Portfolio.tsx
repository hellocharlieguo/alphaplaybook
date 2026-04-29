import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import type { Theme } from './Dashboard'

interface PortfolioProps {
  snapshot: {
    snapshot_date: string
    portfolio: any[] | null
    portfolio_value: number | null
  } | null
  theme: Theme
}

interface Holding {
  ticker: string
  weight_pct: number
  price: number | null
  market_value: number | null
  daily_change_pct: number | null
  signal_sources: string[] | null
  source: string
}

const TICKER_COLORS: Record<string, string> = {
  IBIT: '#8b5cf6', XSD: '#06b6d4', XLE: '#f97316', GLDM: '#eab308',
  XLV: '#10b981', SLV: '#94a3b8', COPX: '#ef4444', PPA: '#3b82f6',
  GRID: '#14b8a6', SGOV: '#6b7280',
}

const TICKER_SOURCE: Record<string, string> = {
  IBIT: 'narrative', XSD: 'narrative', XLE: 'narrative', GLDM: 'narrative',
  XLV: 'narrative', SLV: 'narrative', COPX: 'narrative', GRID: 'narrative',
  PPA: 'crowd', SGOV: 'quant',
}

const SOURCE_STYLES: Record<string, { bg: string; text: string }> = {
  narrative: { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa' },
  crowd: { bg: 'rgba(234,179,8,0.15)', text: '#eab308' },
  quant: { bg: 'rgba(6,182,212,0.15)', text: '#06b6d4' },
}

export default function Portfolio({ snapshot, theme: t }: PortfolioProps) {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHoldings() {
      if (!snapshot?.snapshot_date) { setLoading(false); return }
      const { data, error } = await supabase
        .from('portfolio_holdings')
        .select('*')
        .eq('snapshot_date', snapshot.snapshot_date)
        .order('weight_pct', { ascending: false })
      if (error) console.error('Error fetching holdings:', error)
      const merged = (data || []).map((h: any) => ({
        ...h, source: TICKER_SOURCE[h.ticker] || 'narrative',
      }))
      setHoldings(merged)
      setLoading(false)
    }
    fetchHoldings()
  }, [snapshot])

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256, color: t.textTertiary }}>Loading portfolio...</div>
  if (!snapshot || holdings.length === 0) return <div style={{ textAlign: 'center', padding: '64px 0', color: t.textTertiary }}>No portfolio data yet.</div>

  const narrativeWeight = holdings.filter(h => h.source === 'narrative').reduce((s, h) => s + h.weight_pct, 0)
  const crowdWeight = holdings.filter(h => h.source === 'crowd').reduce((s, h) => s + h.weight_pct, 0)
  const quantWeight = holdings.filter(h => h.source === 'quant').reduce((s, h) => s + h.weight_pct, 0)
  const innerBg = t.bg === '#111827' ? 'rgba(255,255,255,0.03)' : '#f8f9fb'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top: Donut + Allocation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        {/* Donut */}
        <div style={{ background: t.cardPrimary, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
          <DonutChart holdings={holdings} t={t} />
        </div>

        {/* Allocation Summary */}
        <div style={{ background: t.cardPrimary, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24, transition: 'all 0.3s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: t.textSecondary }}>Allocation by signal source</span>
            <span style={{ fontSize: 11, color: t.textTertiary }}>{holdings.length} holdings</span>
          </div>

          {/* Source bar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
              <span style={{ color: '#a78bfa' }}>Narrative {narrativeWeight.toFixed(1)}%</span>
              <span style={{ color: '#eab308' }}>Crowd {crowdWeight.toFixed(1)}%</span>
              <span style={{ color: '#06b6d4' }}>Quant {quantWeight.toFixed(1)}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: innerBg, overflow: 'hidden', display: 'flex' }}>
              <div style={{ height: '100%', background: 'rgba(139,92,246,0.5)', width: `${narrativeWeight}%` }} />
              <div style={{ height: '100%', background: 'rgba(234,179,8,0.5)', width: `${crowdWeight}%` }} />
              <div style={{ height: '100%', background: 'rgba(6,182,212,0.5)', width: `${quantWeight}%`, borderRadius: '0 3px 3px 0' }} />
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {holdings.map((h) => (
              <div key={h.ticker} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: TICKER_COLORS[h.ticker] || '#64748b', flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: 12, fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontWeight: 500, color: t.textPrimary }}>{h.ticker}</span>
                  <span style={{ fontSize: 10, color: t.textTertiary, marginLeft: 4 }}>{h.weight_pct.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div style={{ background: t.cardPrimary, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden', transition: 'all 0.3s' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}` }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: t.textSecondary }}>Holdings</span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${t.border}` }}>
              <th style={{ textAlign: 'left', padding: '10px 20px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>Ticker</th>
              <th style={{ textAlign: 'right', padding: '10px 20px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>Weight</th>
              <th style={{ textAlign: 'right', padding: '10px 20px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>Price</th>
              <th style={{ textAlign: 'right', padding: '10px 20px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>Daily chg</th>
              <th style={{ textAlign: 'left', padding: '10px 20px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>Source</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h, i) => {
              const src = SOURCE_STYLES[h.source] || SOURCE_STYLES.narrative
              return (
                <tr key={h.ticker} style={{ borderBottom: i < holdings.length - 1 ? `1px solid ${t.border}` : 'none' }}>
                  <td style={{ padding: '10px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: TICKER_COLORS[h.ticker] || '#64748b' }} />
                      <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontWeight: 500, color: t.textPrimary }}>{h.ticker}</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                      <div style={{ width: 48, height: 4, borderRadius: 2, background: innerBg, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 2, width: `${Math.min(h.weight_pct * 5, 100)}%`, background: TICKER_COLORS[h.ticker] || '#64748b', opacity: 0.6 }} />
                      </div>
                      <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: t.textSecondary, minWidth: 40, textAlign: 'right' }}>{h.weight_pct.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 20px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: t.textSecondary }}>
                    {h.price ? `$${h.price.toFixed(2)}` : '—'}
                  </td>
                  <td style={{ padding: '10px 20px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: (h.daily_change_pct || 0) > 0 ? t.positive : (h.daily_change_pct || 0) < 0 ? t.negative : t.textTertiary }}>
                    {h.daily_change_pct !== null ? `${h.daily_change_pct >= 0 ? '+' : ''}${h.daily_change_pct.toFixed(2)}%` : '—'}
                  </td>
                  <td style={{ padding: '10px 20px' }}>
                    <span style={{ fontSize: 11, background: src.bg, color: src.text, padding: '2px 8px', borderRadius: 4 }}>
                      {h.source}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `1px solid ${t.border}` }}>
              <td style={{ padding: '10px 20px', fontWeight: 500, color: t.textSecondary }}>Total</td>
              <td style={{ padding: '10px 20px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontWeight: 500, color: t.textSecondary }}>100%</td>
              <td style={{ padding: '10px 20px' }} />
              <td style={{ padding: '10px 20px' }} />
              <td style={{ padding: '10px 20px' }} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function DonutChart({ holdings, t }: { holdings: Holding[]; t: Theme }) {
  const size = 200
  const strokeWidth = 32
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  let cum = 0
  const segments = holdings.map((h) => {
    const pct = h.weight_pct / 100
    const offset = circumference * (1 - cum)
    const length = circumference * pct
    cum += pct
    return { ticker: h.ticker, offset, length, color: TICKER_COLORS[h.ticker] || '#64748b' }
  })

  return (
    <div style={{ position: 'relative' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke={t.bg === '#111827' ? 'rgba(255,255,255,0.05)' : '#f1f5f9'} strokeWidth={strokeWidth} />
        {segments.slice().reverse().map((seg, i) => (
          <circle key={i} cx={center} cy={center} r={radius} fill="none" stroke={seg.color} strokeWidth={strokeWidth}
            strokeDasharray={`${seg.length} ${circumference - seg.length}`} strokeDashoffset={seg.offset}
            strokeLinecap="butt" transform={`rotate(-90 ${center} ${center})`} style={{ opacity: 0.8 }} />
        ))}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 11, color: t.textTertiary }}>Allocation</span>
        <span style={{ fontSize: 18, fontWeight: 500, color: t.textPrimary, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>{holdings.length} tickers</span>
      </div>
    </div>
  )
}
