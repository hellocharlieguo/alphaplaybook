import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import type { Theme } from './Dashboard'

interface PortfolioProps {
  snapshot: { snapshot_date: string; portfolio: any[] | null; portfolio_value: number | null } | null
  theme: Theme
}

// The holdings list, weights, and themes are SNAPSHOT-DRIVEN: they come from the
// nightly cron via daily_snapshots.portfolio ({ ticker, weight_pct, target_weight_pct,
// category }), and live (close) prices from portfolio_holdings. weight_pct is the LIVE
// DRIFTED weight at the last close (winners gain weight between rebalances);
// target_weight_pct is the engine base weight it drifts from. The tab shows current +
// a delta vs target. Manual weight sliders are gone — weights are engine output
// ("fix scores, not weights"). The only static metadata here is per-ticker display
// name + color and per-theme color/voice. A new ticker still renders with a sensible
// fallback (its symbol + neutral dot); add it to TICKER_META for a nicer label.

const TICKER_META: Record<string, { name: string; color: string }> = {
  // AI Hardware Bottleneck
  GLW:  { name: 'Corning (Optical Fiber)',           color: '#f97316' },
  COHR: { name: 'Coherent (Optical / Photonics)',    color: '#fb923c' },
  ENTG: { name: 'Entegris (Semi Chemicals)',         color: '#ec4899' },
  MU:   { name: 'Micron (Memory)',                   color: '#3b82f6' },
  // Power & Infrastructure
  AIPO: { name: 'Defiance AI & Power Infra ETF',     color: '#14b8a6' },
  // Physical Scarcity
  COPX: { name: 'Copper Miners ETF',                 color: '#ef4444' },
  SLV:  { name: 'Silver ETF',                        color: '#94a3b8' },
  // Tokenization
  HOOD: { name: 'Robinhood (Tokenization)',          color: '#22c55e' },
  ETHA: { name: 'Ethereum ETF',                      color: '#6366f1' },
  // AI Application
  LLY:  { name: 'Eli Lilly (Peptides / AI-pharma)',  color: '#0ea5e9' },
  // Monetary Scarcity
  IBIT: { name: 'Bitcoin ETF',                       color: '#8b5cf6' },
  GLDM: { name: 'Gold ETF',                          color: '#eab308' },
  // Cash
  SGOV: { name: 'T-Bills / Cash',                    color: '#6b7280' },
  // --- legacy (kept so older snapshots still render nicely) ---
  CEG:  { name: 'Constellation (Nuclear)',           color: '#10b981' },
  WGMI: { name: 'Bitcoin Miners ETF (\u2192 AI Compute)', color: '#a855f7' },
  TXN:  { name: 'Texas Instruments (Power Semis)',   color: '#0284c7' },
  FLNC: { name: 'Fluence Energy (Batteries)',        color: '#84cc16' },
  BE:   { name: 'Bloom Energy (Fuel Cells)',         color: '#f59e0b' },
  MRVL: { name: 'Marvell (Optical / Interconnect)',  color: '#2563eb' },
  XSD:  { name: 'Equal-Weight Semis ETF',            color: '#06b6d4' },
}

const THEME_META: Record<string, { color: string; voices: string[] }> = {
  'AI Hardware Bottleneck':            { color: '#06b6d4', voices: ['Visser'] },
  'Power & Infrastructure':            { color: '#10b981', voices: ['Visser'] },
  'Physical Scarcity':                 { color: '#f59e0b', voices: ['Visser'] },
  'Tokenization':                      { color: '#8b5cf6', voices: ['Visser'] },
  'AI Application':                    { color: '#3b82f6', voices: ['Visser'] },
  'Monetary Scarcity':                 { color: '#eab308', voices: ['Visser'] },
  'Cash':                              { color: '#6b7280', voices: [] },
  // legacy theme labels (older snapshots)
  'Compute':                           { color: '#06b6d4', voices: ['Visser'] },
  'Monetary Scarcity & Tokenization':  { color: '#8b5cf6', voices: ['Visser'] },
}

// Preferred theme order; any theme not listed is appended in first-seen order.
const THEME_ORDER = [
  'AI Hardware Bottleneck', 'Power & Infrastructure', 'Physical Scarcity',
  'Tokenization', 'AI Application', 'Monetary Scarcity', 'Cash',
]

const VOICE_COLORS: Record<string, { bg: string; text: string }> = {
  Visser: { bg: 'rgba(139,92,246,0.12)', text: '#a78bfa' },
  Camillo: { bg: 'rgba(234,179,8,0.12)', text: '#eab308' },
}

const tickerName = (s: string) => TICKER_META[s]?.name ?? s
const tickerColor = (s: string) => TICKER_META[s]?.color ?? '#64748b'
const themeColor = (name: string) => THEME_META[name]?.color ?? '#64748b'
const themeVoices = (name: string) => THEME_META[name]?.voices ?? ['Visser']

// --- trend pill + momentum tag (unchanged) ---
const PILL_STYLE: Record<string, { bg: string; text: string }> = {
  uptrend:   { bg: 'rgba(34,197,94,0.13)',  text: '#22c55e' },
  pullback:  { bg: 'rgba(148,163,184,0.14)', text: '#94a3b8' },
  recovery:  { bg: 'rgba(96,165,250,0.14)',  text: '#60a5fa' },
  downtrend: { bg: 'rgba(245,158,11,0.14)',  text: '#f59e0b' },
}

function trendPill(symbol: string, price: number | null, tech: any): { label: string; state: keyof typeof PILL_STYLE } | null {
  if (symbol === 'SGOV') return null
  if (!tech || price === null || tech.dma200 == null || tech.dma50 == null) return null
  if (price < tech.dma200) {
    // below the 200 but back above the 50 = reclaiming, not yet confirmed
    return price >= tech.dma50
      ? { label: 'Recovery', state: 'recovery' }
      : { label: 'Downtrend', state: 'downtrend' }
  }
  if (price >= tech.dma50) return { label: 'Uptrend', state: 'uptrend' }
  return { label: 'Pullback', state: 'pullback' }
}


// v5: sliders + weightOverrides removed (weights are engine output now). State kept:
// theme filter + the mock portfolio value used for $-alloc / share sizing.
const STORAGE_KEY = 'ap-portfolio-v5'

interface SavedState { uncheckedThemes: string[]; portfolioValue: number }

function loadState(): SavedState {
  try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r) } catch {}
  return { uncheckedThemes: [], portfolioValue: 100000 }
}
function saveState(s: SavedState) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch {} }

function roundShares(raw: number): number {
  if (raw < 1) return 0
  if (raw < 5) return Math.floor(raw)
  return Math.floor(raw / 5) * 5
}

const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 0 })

interface ModelHolding { symbol: string; theme: string; modelWeight: number; targetWeight: number }

export default function Portfolio({ snapshot, theme: t }: PortfolioProps) {
  const [saved] = useState(loadState)
  const [uncheckedThemes, setUncheckedThemes] = useState<Set<string>>(new Set(saved.uncheckedThemes))
  const [portfolioValue, setPortfolioValue] = useState(saved.portfolioValue)
  const [portfolioInput, setPortfolioInput] = useState(saved.portfolioValue.toLocaleString('en-US'))
  const [livePrices, setLivePrices] = useState<Record<string, number>>({})
  const [technicals, setTechnicals] = useState<Record<string, any>>({})

  // Build model holdings straight from the cron's snapshot. weight_pct is the live
  // DRIFTED weight; target_weight_pct is the engine target it drifts from (fallback to
  // weight_pct on older snapshots that predate the target field).
  const modelHoldings: ModelHolding[] = (snapshot?.portfolio ?? [])
    .map((h: any) => ({
      symbol: String(h.ticker),
      theme: String(h.category ?? 'Other'),
      modelWeight: Number(h.weight_pct) || 0,
      targetWeight: Number(h.target_weight_pct ?? h.weight_pct) || 0,
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
      const { data } = await supabase.from('portfolio_holdings').select('ticker, price').eq('snapshot_date', snapshot.snapshot_date)
      if (data) {
        const prices: Record<string, number> = {}
        for (const row of data) { if (row.price) prices[row.ticker] = row.price }
        setLivePrices(prices)
      }
      const { data: snapRows } = await supabase.from('daily_snapshots').select('technicals').eq('snapshot_date', snapshot.snapshot_date).limit(1)
      if (snapRows && snapRows[0]?.technicals) setTechnicals(snapRows[0].technicals)
    }
    fetchData()
  }, [snapshot])

  useEffect(() => { saveState({ uncheckedThemes: Array.from(uncheckedThemes), portfolioValue }) }, [uncheckedThemes, portfolioValue])

  const activeTickers = useCallback(() => {
    const out: { symbol: string; name: string; price: number | null; theme: string; voices: string[]; weight: number; target: number }[] = []
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
        weight: h.modelWeight,           // drifted engine weight (no override)
        target: h.targetWeight,          // engine base weight it drifts from
      })
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uncheckedThemes, livePrices, snapshot])

  const tickers = activeTickers()

  const allocations = tickers.map(tk => {
    const weight = tk.weight || 0
    const dollarAlloc = (weight / 100) * portfolioValue
    const hasPrice = tk.price !== null
    const rawShares = hasPrice ? dollarAlloc / (tk.price as number) : 0
    const shares = hasPrice ? roundShares(rawShares) : 0
    const actualCost = hasPrice ? shares * (tk.price as number) : 0
    return { ...tk, weight, dollarAlloc, shares, actualCost }
  })

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
  const totalWeight = allocations.reduce((s, a) => s + a.weight, 0)

  // Momentum sleeve = the above-200-DMA subset of Thematic (Uptrend + Pullback both
  // count; Downtrend / below-200 excluded). Cash (SGOV) always rides along. We
  // renormalize the live DRIFTED Thematic weights across that included set to 100%.
  const inMomentum = (a: typeof allocations[number]): boolean =>
    a.symbol === 'SGOV' ||
    (a.price !== null && technicals[a.symbol]?.dma200 != null && a.price >= technicals[a.symbol].dma200)
  const momentumDenom = allocations.reduce((s, a) => s + (inMomentum(a) ? a.weight : 0), 0) || 1
  const momentumWeight = (a: typeof allocations[number]): number | null =>
    inMomentum(a) ? (a.weight / momentumDenom) * 100 : null
  const momentumTotal = allocations.reduce((s, a) => s + (momentumWeight(a) ?? 0), 0)

  const toggleTheme = (name: string) => {
    const next = new Set(uncheckedThemes)
    if (next.has(name)) next.delete(name); else next.add(name)
    setUncheckedThemes(next)
  }

  const handlePortfolioSubmit = () => {
    const val = parseFloat(portfolioInput.replace(/[^0-9.]/g, ''))
    if (!isNaN(val) && val > 0) {
      setPortfolioValue(val)
      setPortfolioInput(val.toLocaleString('en-US'))
    } else {
      setPortfolioInput(portfolioValue.toLocaleString('en-US'))
    }
  }

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
            Sizing only — weights are live engine output
          </div>
        </div>
      </div>

      {/* Holdings table */}
      <div style={{ background: t.cardPrimary, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: `1px solid ${t.border}` }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: t.textSecondary }}>Holdings ({allocations.length})</span>
          <span style={{ fontSize: 11, color: t.textTertiary }}>Weights drift with price · reset on rescore · delta = vs engine target</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                <th style={{ textAlign: 'left', padding: '8px 16px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>Ticker</th>
                <th style={{ textAlign: 'left', padding: '8px 16px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>Trend</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>Thematic</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 400, fontSize: 11, color: '#2dd4bf' }}>Momentum</th>
                <th style={{ textAlign: 'right', padding: '8px 16px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>Price</th>
                <th style={{ textAlign: 'right', padding: '8px 16px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>50-DMA</th>
                <th style={{ textAlign: 'right', padding: '8px 16px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>200-DMA</th>
                <th style={{ textAlign: 'right', padding: '8px 16px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>RSI</th>
                <th style={{ textAlign: 'right', padding: '8px 16px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>$ Alloc</th>
                <th style={{ textAlign: 'right', padding: '8px 16px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>Shares</th>
                <th style={{ textAlign: 'left', padding: '8px 16px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>Theme</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map((a, i) => {
                const tech = technicals[a.symbol]
                const pill = trendPill(a.symbol, a.price, tech)
                const rsi = tech?.rsi14
                const rsiColor = rsi == null ? t.textTertiary : rsi > 70 ? t.negative : rsi < 25 ? t.positive : t.textSecondary
                const momDown = !!tech?.mom?.down
                const drift = a.weight - a.target
                const momWt = momentumWeight(a)
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
                    <td style={{ padding: '8px 16px' }}>
                      {pill ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: PILL_STYLE[pill.state].bg, color: PILL_STYLE[pill.state].text }}>{pill.label}</span>
                          {momDown && <span style={{ fontSize: 9, color: t.negative, fontWeight: 500 }}>↓ 20D</span>}
                        </div>
                      ) : <span style={{ color: t.textTertiary }}>—</span>}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 12, color: t.textSecondary }}>{a.weight.toFixed(1)}%</span>
                        {a.symbol === 'SGOV'
                          ? <span style={{ fontSize: 9, color: t.textTertiary }}>cash</span>
                          : Math.abs(drift) >= 0.05
                            ? <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 9, color: drift >= 0 ? t.positive : t.negative }}>{drift >= 0 ? '+' : ''}{drift.toFixed(1)} vs {a.target.toFixed(1)}</span>
                            : <span style={{ fontSize: 9, color: t.textTertiary }}>at target</span>}
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
                      {momWt == null
                        ? <span style={{ color: t.textTertiary, fontSize: 11 }}>— <span style={{ fontSize: 9 }}>excl.</span></span>
                        : <span style={{ color: '#2dd4bf', fontWeight: 500 }}>{momWt.toFixed(1)}%</span>}
                    </td>
                    <td style={{ padding: '8px 16px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: t.textSecondary }}>{a.price !== null ? `$${a.price.toFixed(2)}` : '—'}</td>
                    <td style={{ padding: '8px 16px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: t.textTertiary }}>{tech?.dma50 != null ? `$${tech.dma50.toFixed(2)}` : '—'}</td>
                    <td style={{ padding: '8px 16px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: t.textTertiary }}>{tech?.dma200 != null ? `$${tech.dma200.toFixed(2)}` : '—'}</td>
                    <td style={{ padding: '8px 16px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: rsiColor }}>
                      {rsi == null ? '—' : rsi.toFixed(1)}
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
                <td style={{ padding: '10px 16px' }} />
                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                  <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 12, fontWeight: 500, color: totalWeight > 100.5 ? t.negative : t.textSecondary }}>{totalWeight.toFixed(1)}%</span>
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                  <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 12, fontWeight: 500, color: '#2dd4bf' }}>{momentumTotal.toFixed(1)}%</span>
                </td>
                <td style={{ padding: '10px 16px' }} />
                <td style={{ padding: '10px 16px' }} />
                <td style={{ padding: '10px 16px' }} />
                <td style={{ padding: '10px 16px' }} />
                <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontWeight: 500, color: t.textSecondary }}>${fmt(portfolioValue)}</td>
                <td style={{ padding: '10px 16px' }} />
                <td style={{ padding: '10px 16px' }} />
              </tr>
              {cashRemainder > 0 && (
                <tr><td colSpan={11} style={{ padding: '8px 16px', fontSize: 11, color: t.textTertiary }}>${fmt(cashRemainder)} uninvested (from rounding) — consider adding to SGOV</td></tr>
              )}
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
