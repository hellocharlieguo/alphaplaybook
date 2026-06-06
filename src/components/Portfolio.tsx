import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import type { Theme } from './Dashboard'

interface PortfolioProps {
  snapshot: { snapshot_date: string; portfolio: any[] | null; portfolio_value: number | null } | null
  theme: Theme
}

// The holdings list, weights, and themes are SNAPSHOT-DRIVEN: they come from the
// nightly cron via daily_snapshots.portfolio ({ ticker, weight_pct, category }), and
// live prices from portfolio_holdings. Changing the sleeve now means editing ONLY the
// cron — this tab follows on the next snapshot. The only things kept static here are
// the per-ticker display name + color and per-theme color/voice (cosmetic metadata
// the cron doesn't store). A new ticker still renders with a sensible fallback name
// (its symbol) and a neutral dot; add it to TICKER_META when you want a nicer label.

const TICKER_META: Record<string, { name: string; color: string }> = {
  // Power & Infrastructure
  CEG:  { name: 'Constellation (Nuclear)',           color: '#10b981' },
  WGMI: { name: 'Bitcoin Miners ETF (→ AI Compute)', color: '#a855f7' },
  AIPO: { name: 'Defiance AI & Power Infra ETF',     color: '#14b8a6' },
  TXN:  { name: 'Texas Instruments (Power Semis)',   color: '#0ea5e9' },
  FLNC: { name: 'Fluence Energy (Batteries)',        color: '#84cc16' },
  BE:   { name: 'Bloom Energy (Fuel Cells)',         color: '#f59e0b' },
  COPX: { name: 'Copper Miners ETF',                 color: '#ef4444' },
  // Compute
  GLW:  { name: 'Corning (Optical Fiber)',           color: '#f97316' },
  MRVL: { name: 'Marvell (Optical / Interconnect)',  color: '#3b82f6' },
  ENTG: { name: 'Entegris (Semi Chemicals)',         color: '#ec4899' },
  XSD:  { name: 'Equal-Weight Semis ETF',            color: '#06b6d4' },
  // Monetary Scarcity & Tokenization
  SLV:  { name: 'Silver ETF',                        color: '#94a3b8' },
  IBIT: { name: 'Bitcoin ETF',                       color: '#8b5cf6' },
  GLDM: { name: 'Gold ETF',                          color: '#eab308' },
  ETHA: { name: 'Ethereum ETF',                      color: '#6366f1' },
  HOOD: { name: 'Robinhood (Tokenization)',          color: '#22c55e' },
  // Cash
  SGOV: { name: 'T-Bills / Cash',                    color: '#6b7280' },
}

const THEME_META: Record<string, { color: string; voices: string[] }> = {
  'Power & Infrastructure':            { color: '#10b981', voices: ['Visser'] },
  'Compute':                           { color: '#06b6d4', voices: ['Visser'] },
  'Monetary Scarcity & Tokenization':  { color: '#8b5cf6', voices: ['Visser'] },
  'Cash':                              { color: '#6b7280', voices: [] },
}

// Preferred theme order; any theme not listed is appended in first-seen order.
const THEME_ORDER = ['Power & Infrastructure', 'Compute', 'Monetary Scarcity & Tokenization', 'Cash']

const VOICE_COLORS: Record<string, { bg: string; text: string }> = {
  Visser: { bg: 'rgba(139,92,246,0.12)', text: '#a78bfa' },
  Camillo: { bg: 'rgba(234,179,8,0.12)', text: '#eab308' },
}

const tickerName = (s: string) => TICKER_META[s]?.name ?? s
const tickerColor = (s: string) => TICKER_META[s]?.color ?? '#64748b'
const themeColor = (name: string) => THEME_META[name]?.color ?? '#64748b'
const themeVoices = (name: string) => THEME_META[name]?.voices ?? ['Visser']

// --- Step 3: action pill + momentum tag ---
// Pill = where the LIVE price sits vs the 50/200-DMA trend (from daily_snapshots.technicals):
//   Add   — price above both 50 & 200-DMA: uptrend intact, fine to move toward target.
//   Hold  — above 200, below 50: pullback within an uptrend; don't chase, don't cut.
//   Watch — below the 200-DMA: under the entry gate — "paused, not sold" (NO auto-trim).
// There is intentionally NO "Trim". A static DMA position can't tell a structural
// winner riding above its averages from a blow-off (the anti-momentum trap), so trim
// is left to a future velocity/engine signal. SGOV (cash) and missing data get no pill.
// The momentum tag (↓ mom) is a SEPARATE 20-DMA read (multi-day break + 20-DMA turning
// down); it's informational and never changes the pill state.
const PILL_STYLE: Record<string, { bg: string; text: string }> = {
  add:   { bg: 'rgba(34,197,94,0.13)',  text: '#22c55e' },
  hold:  { bg: 'rgba(148,163,184,0.14)', text: '#94a3b8' },
  watch: { bg: 'rgba(245,158,11,0.14)',  text: '#f59e0b' },
}

function actionPill(symbol: string, price: number | null, tech: any): { label: string; state: keyof typeof PILL_STYLE } | null {
  if (symbol === 'SGOV') return null
  if (!tech || price === null || tech.dma200 == null || tech.dma50 == null) return null
  if (price < tech.dma200) return { label: 'Watch', state: 'watch' }
  if (price >= tech.dma50) return { label: 'Add', state: 'add' }
  return { label: 'Hold', state: 'hold' }
}

const vs200Pct = (price: number | null, tech: any): number | null =>
  (price !== null && tech?.dma200) ? ((price - tech.dma200) / tech.dma200) * 100 : null

// Bumped to v4 + now tracks UNCHECKED themes (default = all checked). This way a new
// theme arriving from a fresh snapshot shows up checked without another key bump.
const STORAGE_KEY = 'ap-portfolio-v4'

interface SavedState { uncheckedThemes: string[]; portfolioValue: number; weightOverrides: Record<string, number> }

function loadState(): SavedState {
  try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r) } catch {}
  return { uncheckedThemes: [], portfolioValue: 100000, weightOverrides: {} }
}
function saveState(s: SavedState) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch {} }

function roundShares(raw: number): number {
  if (raw < 1) return 0
  if (raw < 5) return Math.floor(raw)
  return Math.floor(raw / 5) * 5
}

const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 0 })

interface ModelHolding { symbol: string; theme: string; modelWeight: number }

export default function Portfolio({ snapshot, theme: t }: PortfolioProps) {
  const [saved] = useState(loadState)
  const [uncheckedThemes, setUncheckedThemes] = useState<Set<string>>(new Set(saved.uncheckedThemes))
  const [portfolioValue, setPortfolioValue] = useState(saved.portfolioValue)
  const [portfolioInput, setPortfolioInput] = useState(saved.portfolioValue.toLocaleString('en-US'))
  const [weightOverrides, setWeightOverrides] = useState<Record<string, number>>(saved.weightOverrides)
  const [livePrices, setLivePrices] = useState<Record<string, number>>({})
  const [technicals, setTechnicals] = useState<Record<string, any>>({})

  // Build model holdings straight from the cron's snapshot.
  const modelHoldings: ModelHolding[] = (snapshot?.portfolio ?? [])
    .map((h: any) => ({
      symbol: String(h.ticker),
      theme: String(h.category ?? 'Other'),
      modelWeight: Number(h.weight_pct) || 0,
    }))
    .filter((h: ModelHolding) => h.symbol && h.symbol !== 'undefined')

  // Distinct themes present in the snapshot, in preferred order.
  const presentThemes: string[] = (() => {
    const seen: string[] = []
    for (const h of modelHoldings) if (!seen.includes(h.theme)) seen.push(h.theme)
    const ordered = THEME_ORDER.filter(x => seen.includes(x))
    const extras = seen.filter(x => !THEME_ORDER.includes(x))
    return [...ordered, ...extras]
  })()

  const isThemeChecked = useCallback((name: string) => !uncheckedThemes.has(name), [uncheckedThemes])

  useEffect(() => {
    async function fetchData() {
      if (!snapshot?.snapshot_date) return
      // Live prices from portfolio_holdings.
      const { data } = await supabase.from('portfolio_holdings').select('ticker, price').eq('snapshot_date', snapshot.snapshot_date)
      if (data) {
        const prices: Record<string, number> = {}
        for (const row of data) { if (row.price) prices[row.ticker] = row.price }
        setLivePrices(prices)
      }
      // Technicals (10/20/50/200 DMAs + momentum) from the snapshot's jsonb blob.
      const { data: snapRows } = await supabase.from('daily_snapshots').select('technicals').eq('snapshot_date', snapshot.snapshot_date).limit(1)
      if (snapRows && snapRows[0]?.technicals) setTechnicals(snapRows[0].technicals)
    }
    fetchData()
  }, [snapshot])

  useEffect(() => { saveState({ uncheckedThemes: Array.from(uncheckedThemes), portfolioValue, weightOverrides }) }, [uncheckedThemes, portfolioValue, weightOverrides])

  const activeTickers = useCallback(() => {
    const out: { symbol: string; name: string; price: number | null; theme: string; voices: string[]; defaultWeight: number }[] = []
    for (const h of modelHoldings) {
      if (uncheckedThemes.has(h.theme)) continue
      if (out.find(o => o.symbol === h.symbol)) continue
      const lp = livePrices[h.symbol]
      out.push({
        symbol: h.symbol,
        name: tickerName(h.symbol),
        price: typeof lp === 'number' && lp > 0 ? lp : null,
        theme: h.theme,
        voices: themeVoices(h.theme),
        defaultWeight: h.modelWeight,
      })
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uncheckedThemes, livePrices, snapshot])

  const tickers = activeTickers()

  const computeWeights = useCallback(() => {
    const weights: Record<string, number> = {}
    // Model weight from the snapshot, overridden by slider changes (overlay).
    for (const tk of tickers) {
      weights[tk.symbol] = weightOverrides[tk.symbol] !== undefined ? weightOverrides[tk.symbol] : tk.defaultWeight
    }
    return weights
  }, [tickers, weightOverrides])

  const weights = computeWeights()

  const allocations = tickers.map(tk => {
    const weight = weights[tk.symbol] || 0
    const dollarAlloc = (weight / 100) * portfolioValue
    const hasPrice = tk.price !== null
    const rawShares = hasPrice ? dollarAlloc / (tk.price as number) : 0
    const shares = hasPrice ? roundShares(rawShares) : 0
    const actualCost = hasPrice ? shares * (tk.price as number) : 0
    return { ...tk, weight, dollarAlloc, shares, actualCost }
  })

  // Add cash remainder to SGOV (only if SGOV is present and has a live price)
  const nonSgovCost = allocations.filter(a => a.symbol !== 'SGOV').reduce((s, a) => s + a.actualCost, 0)
  const sgovAlloc = allocations.find(a => a.symbol === 'SGOV')
  if (sgovAlloc && sgovAlloc.price !== null) {
    const remainingCash = portfolioValue - nonSgovCost
    const sgovShares = Math.max(0, Math.floor(remainingCash / (sgovAlloc.price as number)))
    sgovAlloc.shares = sgovShares
    sgovAlloc.actualCost = sgovShares * (sgovAlloc.price as number)
  }

  const totalActualCost = allocations.reduce((s, a) => s + a.actualCost, 0)
  const cashRemainder = Math.max(0, portfolioValue - totalActualCost)
  const totalWeight = Object.values(weights).reduce((s, w) => s + w, 0)

  const toggleTheme = (name: string) => {
    const next = new Set(uncheckedThemes)
    if (next.has(name)) next.delete(name); else next.add(name)
    setUncheckedThemes(next)
    // Drop overrides for tickers no longer in any checked theme
    const stillActive = new Set<string>()
    for (const h of modelHoldings) { if (!next.has(h.theme)) stillActive.add(h.symbol) }
    const newOverrides = { ...weightOverrides }
    for (const key of Object.keys(newOverrides)) { if (!stillActive.has(key)) delete newOverrides[key] }
    setWeightOverrides(newOverrides)
  }

  const handleSlider = (symbol: string, newValue: number) => {
    // Prevent slider from going below 0
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
    const val = parseFloat(portfolioInput.replace(/[^0-9.]/g, ''))
    if (!isNaN(val) && val > 0) {
      setPortfolioValue(val)
      setPortfolioInput(val.toLocaleString('en-US'))
    } else {
      setPortfolioInput(portfolioValue.toLocaleString('en-US'))
    }
  }

  // Empty state — snapshot not loaded yet or has no portfolio
  if (modelHoldings.length === 0) {
    return (
      <div style={{ background: t.cardPrimary, border: `1px solid ${t.border}`, borderRadius: 12, padding: 40, textAlign: 'center', color: t.textTertiary, fontSize: 13 }}>
        Waiting for today's portfolio snapshot…
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Theme Checkboxes + Portfolio Value */}
      <div className="ap-portfolio-grid">
        <div style={{ background: t.cardPrimary, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: t.textSecondary, marginBottom: 12 }}>Select themes</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {presentThemes.map(name => {
              const checked = isThemeChecked(name)
              const tc = themeColor(name)
              return (
                <button key={name} onClick={() => toggleTheme(name)} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8,
                  border: `1px solid ${checked ? tc : t.border}`,
                  background: checked ? `${tc}15` : 'transparent', cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${checked ? tc : t.textTertiary}`, background: checked ? tc : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {checked && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: checked ? t.textPrimary : t.textTertiary }}>{name}</span>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {themeVoices(name).map((v, j) => {
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
            <input type="text" inputMode="numeric" value={portfolioInput} onChange={e => setPortfolioInput(e.target.value)}
              onBlur={handlePortfolioSubmit} onKeyDown={e => e.key === 'Enter' && handlePortfolioSubmit()}
              style={{ width: 120, fontSize: 18, fontWeight: 500, fontFamily: 'ui-monospace, SFMono-Regular, monospace', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 6, padding: '6px 10px', color: t.textPrimary, outline: 'none' }} />
          </div>
          <div style={{ fontSize: 11, color: t.textTertiary, marginTop: 8, fontStyle: 'italic' }}>
            Mock value — for illustration only
          </div>
        </div>
      </div>

      {/* Holdings table (full width — donut removed) */}
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
                <th style={{ textAlign: 'right', padding: '8px 16px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>50-DMA</th>
                <th style={{ textAlign: 'right', padding: '8px 16px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>200-DMA</th>
                <th style={{ textAlign: 'right', padding: '8px 16px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>vs 200</th>
                <th style={{ textAlign: 'left', padding: '8px 16px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>Action</th>
                <th style={{ textAlign: 'right', padding: '8px 16px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>$ Alloc</th>
                <th style={{ textAlign: 'right', padding: '8px 16px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>Shares</th>
                <th style={{ textAlign: 'left', padding: '8px 16px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>Theme</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map((a, i) => {
                const tech = technicals[a.symbol]
                const pill = actionPill(a.symbol, a.price, tech)
                const v200 = vs200Pct(a.price, tech)
                const momDown = !!tech?.mom?.down
                return (
                  <tr key={a.symbol} style={{ borderBottom: i < allocations.length - 1 ? `1px solid ${t.border}` : 'none' }}>
                    <td style={{ padding: '8px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: tickerColor(a.symbol) }} />
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
                    <td style={{ padding: '8px 16px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: t.textSecondary }}>{a.price !== null ? `$${a.price.toFixed(2)}` : '—'}</td>
                    <td style={{ padding: '8px 16px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: t.textTertiary }}>{tech?.dma50 != null ? `$${tech.dma50.toFixed(2)}` : '—'}</td>
                    <td style={{ padding: '8px 16px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: t.textTertiary }}>{tech?.dma200 != null ? `$${tech.dma200.toFixed(2)}` : '—'}</td>
                    <td style={{ padding: '8px 16px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: v200 === null ? t.textTertiary : (v200 >= 0 ? t.positive : t.negative) }}>
                      {v200 === null ? '—' : `${v200 >= 0 ? '+' : ''}${v200.toFixed(1)}%`}
                    </td>
                    <td style={{ padding: '8px 16px' }}>
                      {pill ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: PILL_STYLE[pill.state].bg, color: PILL_STYLE[pill.state].text }}>{pill.label}</span>
                          {momDown && <span style={{ fontSize: 9, color: t.negative, fontWeight: 500 }}>↓ mom</span>}
                        </div>
                      ) : <span style={{ color: t.textTertiary }}>—</span>}
                    </td>
                    <td style={{ padding: '8px 16px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: t.textSecondary }}>${fmt(a.dollarAlloc)}</td>
                    <td style={{ padding: '8px 16px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontWeight: 500, color: t.textPrimary }}>{a.price !== null ? a.shares : '—'}</td>
                    <td style={{ padding: '8px 16px' }}>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: a.theme === 'Cash' ? t.badgeBg : `${themeColor(a.theme)}20`, color: a.theme === 'Cash' ? t.badgeText : themeColor(a.theme) }}>{a.theme}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: `2px solid ${t.border}` }}>
                <td style={{ padding: '10px 16px', fontWeight: 500, color: t.textSecondary }}>Total</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 12, fontWeight: 500, color: totalWeight > 100.5 ? t.negative : t.textSecondary }}>{totalWeight.toFixed(1)}%</span>
                </td>
                <td style={{ padding: '10px 16px' }} />
                <td style={{ padding: '10px 16px' }} />
                <td style={{ padding: '10px 16px' }} />
                <td style={{ padding: '10px 16px' }} />
                <td style={{ padding: '10px 16px' }} />
                <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontWeight: 500, color: t.textSecondary }}>${fmt(portfolioValue)}</td>
                <td style={{ padding: '10px 16px' }} />
                <td style={{ padding: '10px 16px' }} />
              </tr>
              {cashRemainder > 0 && (
                <tr><td colSpan={10} style={{ padding: '8px 16px', fontSize: 11, color: t.textTertiary }}>${fmt(cashRemainder)} uninvested (from rounding) — consider adding to SGOV</td></tr>
              )}
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
