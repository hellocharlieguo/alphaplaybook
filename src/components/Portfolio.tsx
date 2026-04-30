import { useState, useEffect, useCallback } from 'react'
import type { Theme } from './Dashboard'

interface PortfolioProps {
  snapshot: {
    snapshot_date: string
    portfolio: any[] | null
    portfolio_value: number | null
  } | null
  theme: Theme
}

// Theme definitions with tickers and approximate prices
// Prices are approximate — in future, fetch live from Alpha Vantage
interface ThemeDef {
  name: string
  tickers: { symbol: string; name: string; price: number }[]
}

const THEMES: ThemeDef[] = [
  {
    name: 'Semiconductors',
    tickers: [
      { symbol: 'XSD', name: 'Equal-Weight Semis ETF', price: 425 },
      { symbol: 'PSI', name: 'Power Semis ETF', price: 65 },
    ],
  },
  {
    name: 'AI Infrastructure',
    tickers: [
      { symbol: 'GRID', name: 'Grid / Clean Energy ETF', price: 185 },
      { symbol: 'GLW', name: 'Corning (Optical Fiber)', price: 48 },
      { symbol: 'MRVL', name: 'Marvell (Silicon Photonics)', price: 75 },
    ],
  },
  {
    name: 'Commodities / Hard Assets',
    tickers: [
      { symbol: 'GLDM', name: 'Gold ETF', price: 95 },
      { symbol: 'SLV', name: 'Silver ETF', price: 68 },
      { symbol: 'COPX', name: 'Copper Miners ETF', price: 87 },
    ],
  },
  {
    name: 'Bitcoin / Digital Scarcity',
    tickers: [
      { symbol: 'IBIT', name: 'Bitcoin ETF', price: 43 },
    ],
  },
  {
    name: 'Energy',
    tickers: [
      { symbol: 'XLE', name: 'Energy Sector ETF', price: 55 },
      { symbol: 'XLU', name: 'Utilities ETF', price: 82 },
    ],
  },
]

const TICKER_COLORS: Record<string, string> = {
  XSD: '#06b6d4', PSI: '#818cf8', GRID: '#14b8a6', GLW: '#f97316', MRVL: '#a78bfa',
  GLDM: '#eab308', SLV: '#94a3b8', COPX: '#ef4444', IBIT: '#8b5cf6',
  XLE: '#f97316', XLU: '#10b981', SGOV: '#6b7280',
}

const THEME_COLORS: Record<string, string> = {
  'Semiconductors': '#06b6d4',
  'AI Infrastructure': '#14b8a6',
  'Commodities / Hard Assets': '#eab308',
  'Bitcoin / Digital Scarcity': '#8b5cf6',
  'Energy': '#f97316',
}

const STORAGE_KEY = 'alphaplaybook-portfolio'

interface SavedState {
  checkedThemes: string[]
  portfolioValue: number
  weightOverrides: Record<string, number>
}

function loadState(): SavedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {
    checkedThemes: THEMES.map(t => t.name),
    portfolioValue: 10000,
    weightOverrides: {},
  }
}

function saveState(state: SavedState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
}

function roundShares(raw: number): number {
  if (raw < 1) return 0
  if (raw < 5) return Math.floor(raw)
  return Math.floor(raw / 5) * 5
}

export default function Portfolio({ snapshot: _snapshot, theme: t }: PortfolioProps) {
  const [saved] = useState(loadState)
  const [checkedThemes, setCheckedThemes] = useState<Set<string>>(new Set(saved.checkedThemes))
  const [portfolioValue, setPortfolioValue] = useState(saved.portfolioValue)
  const [portfolioInput, setPortfolioInput] = useState(String(saved.portfolioValue))
  const [weightOverrides, setWeightOverrides] = useState<Record<string, number>>(saved.weightOverrides)

  // Persist state
  useEffect(() => {
    saveState({ checkedThemes: Array.from(checkedThemes), portfolioValue, weightOverrides })
  }, [checkedThemes, portfolioValue, weightOverrides])

  // Build active tickers from checked themes + always include SGOV
  const activeTickers = useCallback(() => {
    const tickers: { symbol: string; name: string; price: number; theme: string }[] = []
    for (const theme of THEMES) {
      if (!checkedThemes.has(theme.name)) continue
      for (const ticker of theme.tickers) {
        if (!tickers.find(t => t.symbol === ticker.symbol)) {
          tickers.push({ ...ticker, theme: theme.name })
        }
      }
    }
    // Always add SGOV
    if (!tickers.find(t => t.symbol === 'SGOV')) {
      tickers.push({ symbol: 'SGOV', name: 'T-Bills / Cash', price: 100, theme: 'Cash' })
    }
    return tickers
  }, [checkedThemes])

  const tickers = activeTickers()

  // Compute weights: use overrides if set, otherwise equal weight
  const computeWeights = useCallback(() => {
    const n = tickers.length
    if (n === 0) return {}

    const weights: Record<string, number> = {}
    let overrideTotal = 0
    let overrideCount = 0

    // Apply any slider overrides
    for (const tk of tickers) {
      if (weightOverrides[tk.symbol] !== undefined) {
        weights[tk.symbol] = weightOverrides[tk.symbol]
        overrideTotal += weightOverrides[tk.symbol]
        overrideCount++
      }
    }

    // Distribute remaining weight equally among non-overridden tickers
    const remaining = 100 - overrideTotal
    const nonOverridden = n - overrideCount
    const equalShare = nonOverridden > 0 ? Math.max(0, remaining / nonOverridden) : 0

    for (const tk of tickers) {
      if (weights[tk.symbol] === undefined) {
        weights[tk.symbol] = Math.round(equalShare * 100) / 100
      }
    }

    return weights
  }, [tickers, weightOverrides])

  const weights = computeWeights()

  // Compute allocations
  const allocations = tickers.map(tk => {
    const weight = weights[tk.symbol] || 0
    const dollarAlloc = (weight / 100) * portfolioValue
    const rawShares = dollarAlloc / tk.price
    const shares = roundShares(rawShares)
    const actualCost = shares * tk.price
    return { ...tk, weight, dollarAlloc, shares, actualCost }
  })

  const totalActualCost = allocations.reduce((s, a) => s + a.actualCost, 0)
  const cashRemainder = portfolioValue - totalActualCost

  // Toggle theme
  const toggleTheme = (name: string) => {
    const next = new Set(checkedThemes)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    setCheckedThemes(next)
    // Clear overrides for removed tickers
    const newOverrides = { ...weightOverrides }
    const nextTickers = new Set<string>()
    for (const theme of THEMES) {
      if (next.has(theme.name)) theme.tickers.forEach(tk => nextTickers.add(tk.symbol))
    }
    nextTickers.add('SGOV')
    for (const key of Object.keys(newOverrides)) {
      if (!nextTickers.has(key)) delete newOverrides[key]
    }
    setWeightOverrides(newOverrides)
  }

  // Handle slider change
  const handleSlider = (symbol: string, value: number) => {
    setWeightOverrides(prev => ({ ...prev, [symbol]: value }))
  }

  // Reset weights
  const resetWeights = () => setWeightOverrides({})

  // Handle portfolio value input
  const handlePortfolioSubmit = () => {
    const val = parseFloat(portfolioInput)
    if (!isNaN(val) && val > 0) setPortfolioValue(val)
  }

  // Donut chart data
  const donutData = allocations.filter(a => a.weight > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Row 1: Theme Checkboxes + Portfolio Value */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16 }}>
        {/* Theme checkboxes */}
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
                  background: checked ? (t.mode === 'dark' ? `${themeColor}15` : `${themeColor}10`) : 'transparent',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: 4, border: `2px solid ${checked ? themeColor : t.textTertiary}`,
                    background: checked ? themeColor : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}>
                    {checked && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: checked ? t.textPrimary : t.textTertiary }}>{theme.name}</span>
                  <span style={{ fontSize: 11, color: t.textTertiary }}>({theme.tickers.length})</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Portfolio value input */}
        <div style={{ background: t.cardPrimary, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20, minWidth: 200 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: t.textSecondary, marginBottom: 12 }}>Portfolio value</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 500, color: t.textTertiary }}>$</span>
            <input
              type="text"
              value={portfolioInput}
              onChange={e => setPortfolioInput(e.target.value)}
              onBlur={handlePortfolioSubmit}
              onKeyDown={e => e.key === 'Enter' && handlePortfolioSubmit()}
              style={{
                width: 120, fontSize: 18, fontWeight: 500, fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 6, padding: '6px 10px',
                color: t.textPrimary, outline: 'none',
              }}
            />
          </div>
          <div style={{ fontSize: 11, color: t.textTertiary, marginTop: 8 }}>
            Invested: ${totalActualCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} · Cash remainder: ${cashRemainder.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Row 2: Donut + Allocation Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16 }}>
        {/* Donut */}
        <div style={{ background: t.cardPrimary, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DonutChart data={donutData} t={t} />
        </div>

        {/* Holdings table with sliders */}
        <div style={{ background: t.cardPrimary, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: `1px solid ${t.border}` }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: t.textSecondary }}>Holdings ({allocations.length} tickers)</span>
            <button onClick={resetWeights} style={{ fontSize: 11, color: t.textTertiary, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Reset to equal weight</button>
          </div>

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
                      <input
                        type="range"
                        min={0}
                        max={50}
                        step={0.5}
                        value={a.weight}
                        onChange={e => handleSlider(a.symbol, parseFloat(e.target.value))}
                        style={{ width: 120, accentColor: TICKER_COLORS[a.symbol] || '#64748b', cursor: 'pointer' }}
                      />
                      <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 12, color: t.textSecondary, minWidth: 40, textAlign: 'right' }}>{a.weight.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '8px 16px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: t.textSecondary }}>
                    ${a.price.toFixed(0)}
                  </td>
                  <td style={{ padding: '8px 16px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: t.textSecondary }}>
                    ${a.dollarAlloc.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td style={{ padding: '8px 16px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontWeight: 500, color: t.textPrimary }}>
                    {a.shares}
                  </td>
                  <td style={{ padding: '8px 16px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: t.textSecondary }}>
                    ${a.actualCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td style={{ padding: '8px 16px' }}>
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 4,
                      background: a.theme === 'Cash' ? t.badgeBg : `${THEME_COLORS[a.theme] || '#64748b'}20`,
                      color: a.theme === 'Cash' ? t.badgeText : THEME_COLORS[a.theme] || '#64748b',
                    }}>{a.theme}</span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: `2px solid ${t.border}` }}>
                <td style={{ padding: '10px 16px', fontWeight: 500, color: t.textSecondary }}>Total</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 12, fontWeight: 500, color: Object.values(weights).reduce((s, w) => s + w, 0) > 100.5 ? t.negative : t.textSecondary }}>
                    {Object.values(weights).reduce((s, w) => s + w, 0).toFixed(1)}%
                  </span>
                </td>
                <td style={{ padding: '10px 16px' }} />
                <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontWeight: 500, color: t.textSecondary }}>
                  ${portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td style={{ padding: '10px 16px' }} />
                <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontWeight: 500, color: t.textSecondary }}>
                  ${totalActualCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td style={{ padding: '10px 16px' }} />
              </tr>
              {cashRemainder > 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '8px 16px', fontSize: 11, color: t.textTertiary }}>
                    ${cashRemainder.toLocaleString(undefined, { maximumFractionDigits: 0 })} uninvested cash (from share rounding) — consider adding to SGOV
                  </td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}

// Donut chart
function DonutChart({ data, t }: { data: { symbol: string; weight: number }[]; t: Theme }) {
  const size = 180
  const strokeWidth = 28
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  const total = data.reduce((s, d) => s + d.weight, 0)
  let cum = 0
  const segments = data.map(d => {
    const pct = total > 0 ? d.weight / total : 0
    const offset = circumference * (1 - cum)
    const length = circumference * pct
    cum += pct
    return { symbol: d.symbol, offset, length, color: TICKER_COLORS[d.symbol] || '#64748b' }
  })

  return (
    <div style={{ position: 'relative' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke={t.surfaceSubtle} strokeWidth={strokeWidth} />
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
