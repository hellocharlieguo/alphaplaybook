import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import type { Theme } from './Dashboard'

interface PortfolioProps {
  snapshot: { snapshot_date: string; portfolio: any[] | null; portfolio_value: number | null } | null
  theme: Theme
}

interface ThemeDef {
  name: string
  voices: string[]
  tickers: { symbol: string; name: string; defaultWeight: number; action: string }[]
}

// ============================================================================
// AGGRESSIVE sleeve — Decision Engine v2.0 conviction weights (2026-05-20)
// Conviction-proportional (top ~18%, 2% floor, no single-stock cap).
// Anti-momentum; two scarcity spines (AI power + hard money).
// `action` = engine entry signal shown in the Action column.
// ============================================================================
const THEMES: ThemeDef[] = [
  { name: 'Power & Infrastructure', voices: ['Visser', 'Aschenbrenner', 'Camillo'], tickers: [
    { symbol: 'CEG', name: 'Constellation (Nuclear)', defaultWeight: 18, action: 'Strong Entry' },
    { symbol: 'BE', name: 'Bloom Energy (Fuel Cells)', defaultWeight: 9, action: 'Enter' },
    { symbol: 'AIPO', name: 'Defiance AI & Power Infrastructure ETF', defaultWeight: 9, action: 'Strong Entry' },
    { symbol: 'COPX', name: 'Copper Miners ETF', defaultWeight: 7, action: 'Enter' },
    { symbol: 'WGMI', name: 'Bitcoin Miners ETF (Power Real Estate)', defaultWeight: 6.5, action: 'Enter' },
    { symbol: 'GLW', name: 'Corning (Optical Fiber)', defaultWeight: 3.5, action: 'Enter' },
  ]},
  { name: 'Compute', voices: ['Visser', 'Aschenbrenner'], tickers: [
    { symbol: 'CRWV', name: 'CoreWeave (Neocloud)', defaultWeight: 3.5, action: 'Starter / Watch' },
    { symbol: 'MU', name: 'Micron (Memory)', defaultWeight: 3, action: 'Starter / Watch' },
    { symbol: 'XSD', name: 'Equal-Weight Semis ETF', defaultWeight: 2.5, action: 'Starter / Watch' },
  ]},
  { name: 'Monetary Scarcity & Tokenization', voices: ['Visser', 'Camillo'], tickers: [
    { symbol: 'SLV', name: 'Silver ETF', defaultWeight: 15, action: 'Strong Entry' },
    { symbol: 'IBIT', name: 'Bitcoin ETF', defaultWeight: 9, action: 'Enter' },
    { symbol: 'GLDM', name: 'Gold ETF', defaultWeight: 6, action: 'Enter' },
    { symbol: 'HOOD', name: 'Robinhood (Tokenization)', defaultWeight: 3.5, action: 'Starter / Watch' },
  ]},
]
const TICKER_COLORS: Record<string, string> = {
  CEG: '#10b981', BE: '#f59e0b', AIPO: '#14b8a6', SLV: '#94a3b8', GLDM: '#eab308',
  IBIT: '#8b5cf6', COPX: '#ef4444', WGMI: '#a855f7', GLW: '#f97316', CRWV: '#06b6d4',
  MU: '#3b82f6', XSD: '#0ea5e9', HOOD: '#22c55e', SGOV: '#6b7280',
}

const THEME_COLORS: Record<string, string> = {
  'Power & Infrastructure': '#10b981',
  'Compute': '#06b6d4',
  'Monetary Scarcity & Tokenization': '#eab308',
}

const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
  'Strong Entry':    { bg: 'rgba(16,185,129,0.15)',  text: '#34d399' },
  'Enter':           { bg: 'rgba(16,185,129,0.10)',  text: '#6ee7b7' },
  'Starter / Watch': { bg: 'rgba(234,179,8,0.12)',   text: '#eab308' },
  'Hold':            { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8' },
}

const VOICE_COLORS: Record<string, { bg: string; text: string }> = {
  Visser: { bg: 'rgba(139,92,246,0.12)', text: '#a78bfa' },
  Camillo: { bg: 'rgba(234,179,8,0.12)', text: '#eab308' },
  Aschenbrenner: { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa' },
}

const STORAGE_KEY = 'ap-portfolio-v7'

interface SavedState { checkedThemes: string[]; portfolioValue: number; weightOverrides: Record<string, number> }

function loadState(): SavedState {
  try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r) } catch {}
  return { checkedThemes: THEMES.map(t => t.name), portfolioValue: 100000, weightOverrides: {} }
}
function saveState(s: SavedState) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch {} }

function roundShares(raw: number): number {
  if (raw < 1) return 0
  if (raw < 5) return Math.floor(raw)
  return Math.floor(raw / 5) * 5
}

const PRICE_STALENESS_DAYS = 3

function isPriceFresh(snapshotDate: string): boolean {
  const snap = new Date(snapshotDate + 'T00:00:00Z')
  const now = new Date()
  const ageDays = (now.getTime() - snap.getTime()) / (1000 * 60 * 60 * 24)
  return ageDays <= PRICE_STALENESS_DAYS
}

export default function Portfolio({ snapshot, theme: t }: PortfolioProps) {
  const [saved] = useState(loadState)
  const [checkedThemes, setCheckedThemes] = useState<Set<string>>(new Set(saved.checkedThemes))
  const [portfolioValue, setPortfolioValue] = useState(saved.portfolioValue)
  const [portfolioInput, setPortfolioInput] = useState(saved.portfolioValue.toLocaleString('en-US'))
  const [weightOverrides, setWeightOverrides] = useState<Record<string, number>>(saved.weightOverrides)
  const [livePrices, setLivePrices] = useState<Record<string, number>>({})
  const [priceStale, setPriceStale] = useState(false)

  useEffect(() => {
    async function fetchPrices() {
      if (!snapshot?.snapshot_date) return
      const fresh = isPriceFresh(snapshot.snapshot_date)
      setPriceStale(!fresh)
      if (!fresh) {
        setLivePrices({})
        return
      }
      const { data } = await supabase
        .from('portfolio_holdings')
        .select('ticker, price')
        .eq('snapshot_date', snapshot.snapshot_date)
      if (data) {
        const prices: Record<string, number> = {}
        for (const row of data) { if (row.price && row.price > 0) prices[row.ticker] = row.price }
        setLivePrices(prices)
      }
    }
    fetchPrices()
  }, [snapshot])

  useEffect(() => { saveState({ checkedThemes: Array.from(checkedThemes), portfolioValue, weightOverrides }) }, [checkedThemes, portfolioValue, weightOverrides])

  const activeTickers = useCallback(() => {
    const tickers: { symbol: string; name: string; price: number | undefined; theme: string; voices: string[]; defaultWeight: number; action: string }[] = []
    for (const theme of THEMES) {
      if (!checkedThemes.has(theme.name)) continue
      for (const ticker of theme.tickers) {
        const existing = tickers.find(t => t.symbol === ticker.symbol)
        if (existing) continue
        const price = livePrices[ticker.symbol]
        tickers.push({ symbol: ticker.symbol, name: ticker.name, price, theme: theme.name, voices: [...theme.voices], defaultWeight: ticker.defaultWeight, action: ticker.action })
      }
    }
    if (!tickers.find(t => t.symbol === 'SGOV')) {
      tickers.push({ symbol: 'SGOV', name: 'T-Bills / Cash', price: livePrices['SGOV'] || 100, theme: 'Cash', voices: [], defaultWeight: 4.5, action: 'Hold' })
    }
    return tickers
  }, [checkedThemes, livePrices])

  const tickers = activeTickers()

  const computeWeights = useCallback(() => {
    const raw: Record<string, number> = {}
    for (const tk of tickers) {
      raw[tk.symbol] = weightOverrides[tk.symbol] !== undefined ? weightOverrides[tk.symbol] : tk.defaultWeight
    }

    const SGOV_FLOOR = 4.5
    const sgovRaw = raw['SGOV'] !== undefined ? raw['SGOV'] : 0
    const nonSgov = Object.entries(raw).filter(([k]) => k !== 'SGOV')
    const nonSgovTotal = nonSgov.reduce((s, [, w]) => s + w, 0)

    const sgovTarget = Math.max(SGOV_FLOOR, sgovRaw)
    const nonSgovBudget = 100 - sgovTarget

    const weights: Record<string, number> = {}
    if (nonSgovTotal > 0 && nonSgov.length > 0) {
      const scale = nonSgovBudget / nonSgovTotal
      let assigned = 0
      for (let i = 0; i < nonSgov.length; i++) {
        const [sym, w] = nonSgov[i]
        if (i === nonSgov.length - 1) {
          weights[sym] = Math.round((nonSgovBudget - assigned) * 10) / 10
        } else {
          const scaled = Math.round(w * scale * 10) / 10
          weights[sym] = scaled
          assigned += scaled
        }
      }
    } else {
      for (const [sym] of nonSgov) weights[sym] = 0
    }
    weights['SGOV'] = sgovTarget
    return weights
  }, [tickers, weightOverrides])

  const weights = computeWeights()

  const allocations = tickers.map(tk => {
    const weight = weights[tk.symbol] || 0
    const dollarAlloc = (weight / 100) * portfolioValue
    const rawShares = tk.price ? dollarAlloc / tk.price : 0
    const shares = roundShares(rawShares)
    const actualCost = tk.price ? shares * tk.price : 0
    return { ...tk, weight, dollarAlloc, shares, actualCost }
  })

  const nonSgovCost = allocations.filter(a => a.symbol !== 'SGOV').reduce((s, a) => s + a.actualCost, 0)
  const sgovAlloc = allocations.find(a => a.symbol === 'SGOV')
  if (sgovAlloc && sgovAlloc.price) {
    const remainingCash = portfolioValue - nonSgovCost
    const sgovShares = Math.max(0, Math.floor(remainingCash / sgovAlloc.price))
    sgovAlloc.shares = sgovShares
    sgovAlloc.actualCost = sgovShares * sgovAlloc.price
  }

  const totalActualCost = allocations.reduce((s, a) => s + a.actualCost, 0)
  const cashRemainder = Math.max(0, portfolioValue - totalActualCost)
  const totalWeight = Object.values(weights).reduce((s, w) => s + w, 0)

  const toggleTheme = (name: string) => {
    const next = new Set(checkedThemes)
    if (next.has(name)) next.delete(name); else next.add(name)
    setCheckedThemes(next)
    const newOverrides = { ...weightOverrides }
    const nextTickers = new Set<string>()
    for (const theme of THEMES) { if (next.has(theme.name)) theme.tickers.forEach(tk => nextTickers.add(tk.symbol)) }
    nextTickers.add('SGOV')
    for (const key of Object.keys(newOverrides)) { if (!nextTickers.has(key)) delete newOverrides[key] }
    setWeightOverrides(newOverrides)
  }

  const handleSlider = (symbol: string, newValue: number) => {
    newValue = Math.max(0, newValue)
    const currentWeights: Record<string, number> = {}
    for (const tk of tickers) {
      currentWeights[tk.symbol] = weightOverrides[tk.symbol] !== undefined ? weightOverrides[tk.symbol] : tk.defaultWeight
    }
    const others = tickers.filter(tk => tk.symbol !== symbol)
    const othersTotal = others.reduce((s, tk) => s + (currentWeights[tk.symbol] || 0), 0)
    if (others.length === 0) return
    const remaining = Math.max(0, 100 - newValue)
    const newOverrides: Record<string, number> = { [symbol]: newValue }
    if (othersTotal === 0) {
      const each = remaining / others.length
      for (const tk of others) newOverrides[tk.symbol] = Math.max(0, Math.round(each * 10) / 10)
    } else {
      let assigned = 0
      for (let i = 0; i < others.length; i++) {
        const tk = others[i]
        const currentW = currentWeights[tk.symbol] || 0
        if (i === others.length - 1) {
          newOverrides[tk.symbol] = Math.max(0, Math.round((remaining - assigned) * 10) / 10)
        } else {
          const scaled = (currentW / othersTotal) * remaining
          const rounded = Math.max(0, Math.round(scaled * 10) / 10)
          newOverrides[tk.symbol] = rounded
          assigned += rounded
        }
      }
    }
    setWeightOverrides(newOverrides)
  }
  const resetWeights = () => setWeightOverrides({})
  const handlePortfolioSubmit = () => {
    const cleaned = portfolioInput.replace(/,/g, '').replace(/[^0-9.]/g, '')
    const val = parseFloat(cleaned)
    if (!isNaN(val) && val > 0) {
      setPortfolioValue(val)
      setPortfolioInput(val.toLocaleString('en-US'))
    } else {
      setPortfolioInput(portfolioValue.toLocaleString('en-US'))
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {priceStale && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: `1px solid rgba(245,158,11,0.3)`, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#f59e0b' }}>
          ⚠️ Price data is more than {PRICE_STALENESS_DAYS} days old. Live prices will refresh after the next daily cron run.
        </div>
      )}

      <div className="ap-portfolio-grid">
        <div style={{ background: t.cardPrimary, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: t.textSecondary, marginBottom: 12 }}>Select themes</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {THEMES.map(theme => {
              const checked = checkedThemes.has(theme.name)
              const themeColor = THEME_COLORS[theme.name] || '#64748b'
              return (
                <button key={theme.name} onClick={() => toggleTheme(theme.name)} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8,
                  border: `1px solid ${checked ? themeColor : t.border}`,
                  background: checked ? `${themeColor}15` : 'transparent', cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${checked ? themeColor : t.textTertiary}`, background: checked ? themeColor : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {checked && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: checked ? t.textPrimary : t.textTertiary }}>{theme.name}</span>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {theme.voices.map((v, j) => {
                      const vc = VOICE_COLORS[v] || { bg: t.badgeBg, text: t.badgeText }
                      return <span key={j} style={{ fontSize: 9, background: vc.bg, color: vc.text, padding: '1px 5px', borderRadius: 3 }}>{v}</span>
                    })}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ background: t.cardPrimary, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20, minWidth: 200 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: t.textSecondary, marginBottom: 12 }}>Portfolio value</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 500, color: t.textTertiary }}>$</span>
            <input type="text" value={portfolioInput} onChange={e => setPortfolioInput(e.target.value)}
              onBlur={handlePortfolioSubmit} onKeyDown={e => e.key === 'Enter' && handlePortfolioSubmit()}
              style={{ width: 140, fontSize: 18, fontWeight: 500, fontFamily: 'ui-monospace, SFMono-Regular, monospace', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 6, padding: '6px 10px', color: t.textPrimary, outline: 'none' }} />
          </div>
          <div style={{ fontSize: 11, color: t.textTertiary, marginTop: 8 }}>
            Invested: ${totalActualCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} · Remainder: ${cashRemainder.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div style={{ fontSize: 10, color: t.textTertiary, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${t.border}`, fontStyle: 'italic', lineHeight: 1.4 }}>
            Illustrative portfolio — for educational purposes only. Not investment advice.
          </div>
        </div>
      </div>

      <div className="ap-donut-grid">
        <div style={{ background: t.cardPrimary, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DonutChart data={allocations.filter(a => a.weight > 0)} t={t} />
        </div>

        <div style={{ background: t.cardPrimary, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: `1px solid ${t.border}` }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: t.textSecondary }}>Holdings ({allocations.length})</span>
            <button onClick={resetWeights} style={{ fontSize: 11, color: t.textTertiary, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Reset weights</button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                  <th style={{ textAlign: 'left', padding: '8px 16px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>Ticker</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 400, fontSize: 11, color: t.textTertiary, width: 200 }}>Weight</th>
                  <th style={{ textAlign: 'right', padding: '8px 16px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>Price</th>
                  <th style={{ textAlign: 'right', padding: '8px 16px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>$ Alloc</th>
                  <th style={{ textAlign: 'right', padding: '8px 16px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>Shares</th>
                  <th style={{ textAlign: 'right', padding: '8px 16px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>Cost</th>
                  <th style={{ textAlign: 'left', padding: '8px 16px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>Theme</th>
                  <th style={{ textAlign: 'left', padding: '8px 16px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map((a, i) => (
                  <tr key={a.symbol} style={{ borderBottom: i < allocations.length - 1 ? `1px solid ${t.border}` : 'none' }}>
                    <td style={{ padding: '8px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: TICKER_COLORS[a.symbol] || '#64748b' }} />
                        <div>
                          <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontWeight: 500, color: t.textPrimary }}>{a.symbol}</div>
                          <div style={{ fontSize: 10, color: t.textTertiary }}>{a.name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input type="range" min={0} max={50} step={0.5} value={a.weight}
                          onChange={e => handleSlider(a.symbol, parseFloat(e.target.value))}
                          style={{ width: 120, cursor: 'pointer' }} />
                        <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 12, color: t.textSecondary, minWidth: 40, textAlign: 'right' }}>{a.weight.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '8px 16px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: t.textSecondary }}>{a.price ? `$${a.price.toFixed(2)}` : '—'}</td>
                    <td style={{ padding: '8px 16px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: t.textSecondary }}>${a.dollarAlloc.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td style={{ padding: '8px 16px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontWeight: 500, color: t.textPrimary }}>{a.shares}</td>
                    <td style={{ padding: '8px 16px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: t.textSecondary }}>${a.actualCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td style={{ padding: '8px 16px' }}>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: a.theme === 'Cash' ? t.badgeBg : `${THEME_COLORS[a.theme] || '#64748b'}20`, color: a.theme === 'Cash' ? t.badgeText : THEME_COLORS[a.theme] || '#64748b' }}>{a.theme}</span>
                    </td>
                    <td style={{ padding: '8px 16px' }}>
                      {a.action && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: (ACTION_COLORS[a.action] || ACTION_COLORS['Hold']).bg, color: (ACTION_COLORS[a.action] || ACTION_COLORS['Hold']).text }}>{a.action}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: `2px solid ${t.border}` }}>
                  <td style={{ padding: '10px 16px', fontWeight: 500, color: t.textSecondary }}>Total</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 12, fontWeight: 500, color: totalWeight > 100.5 ? t.negative : t.textSecondary }}>{totalWeight.toFixed(1)}%</span>
                  </td>
                  <td style={{ padding: '10px 16px' }} />
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontWeight: 500, color: t.textSecondary }}>${portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td style={{ padding: '10px 16px' }} />
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontWeight: 500, color: t.textSecondary }}>${totalActualCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td style={{ padding: '10px 16px' }} />
                  <td style={{ padding: '10px 16px' }} />
                </tr>
                {cashRemainder > 0 && (
                  <tr><td colSpan={8} style={{ padding: '8px 16px', fontSize: 11, color: t.textTertiary }}>${cashRemainder.toLocaleString(undefined, { maximumFractionDigits: 0 })} uninvested (from rounding) — consider adding to SGOV</td></tr>
                )}
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function DonutChart({ data, t }: { data: { symbol: string; weight: number }[]; t: Theme }) {
  const size = 180, strokeWidth = 28, radius = (size - strokeWidth) / 2, circumference = 2 * Math.PI * radius, center = size / 2
  const total = data.reduce((s, d) => s + d.weight, 0)
  let cum = 0
  const segments = data.map(d => {
    const pct = total > 0 ? d.weight / total : 0
    const offset = circumference * (1 - cum), length = circumference * pct
    cum += pct
    return { symbol: d.symbol, offset, length, color: TICKER_COLORS[d.symbol] || '#64748b' }
  })

  return (
    <div style={{ position: 'relative' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke={t.sliderTrack} strokeWidth={strokeWidth} />
        {segments.slice().reverse().map((seg, i) => (
          <circle key={i} cx={center} cy={center} r={radius} fill="none" stroke={seg.color} strokeWidth={strokeWidth}
            strokeDasharray={`${seg.length} ${circumference - seg.length}`} strokeDashoffset={seg.offset}
            strokeLinecap="butt" transform={`rotate(-90 ${center} ${center})`} style={{ opacity: 0.8 }} />
        ))}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 11, color: t.textTertiary }}>Tickers</span>
        <span style={{ fontSize: 20, fontWeight: 500, color: t.textPrimary, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>{data.length}</span>
      </div>
    </div>
  )
}
