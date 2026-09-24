import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import SignalRecap from './SignalRecap'
import Portfolio from './Portfolio'
import PnLTracker from './PnLTracker'
import TradingTab from './TradingTab'
import SystemTab from './SystemTab'
import basaltBg from '../assets/Basalt.jpg'

type Tab = 'signals' | 'portfolio' | 'pnl' | 'trading' | 'system'

interface DailySnapshot {
  snapshot_date: string
  spy_rsi: number | null
  rsi_signal: string | null
  polymarket_signals: any[] | null
  narrative_signals: any[] | null
  bullish_assets: any[] | null
  portfolio: any[] | null
  portfolio_value: number | null
  spy_value: number | null
  daily_return_pct: number | null
  cumulative_return_pct: number | null
  spy_cumulative_return_pct: number | null
  capex_yoy_pct?: number | null
  visser_stage?: number | null
  macro_signals?: any | null
  // written by the cron (server/daily-cron.cjs) and returned by select('*');
  // typed here so the System tab can compare it against BASE_PORTFOLIO.
  portfolio_version?: string | null
}

export interface Theme {
  mode: 'dark'
  bg: string
  cardPrimary: string
  textPrimary: string
  textSecondary: string
  textTertiary: string
  border: string
  surfaceSubtle: string
  positive: string
  negative: string
  tickerBg: string
  tickerText: string
  badgeBg: string
  badgeText: string
  inputBg: string
  inputBorder: string
  accent: string
  accentMuted: string
  sliderTrack: string
  sliderThumb: string
  ruleLine: string
}

// Dark-only, cool/neutral grey identity, copper accent. Stone-photo backdrop. 6/27/26.
const t: Theme = {
  mode: 'dark',
  bg: '#141416',
  cardPrimary: '#1c1c1f',
  textPrimary: '#e8e8ea',
  textSecondary: '#a2a2a6',
  textTertiary: '#6e6e72',
  border: 'rgba(255,255,255,0.07)',
  surfaceSubtle: 'rgba(255,255,255,0.03)',
  positive: '#7dba6a',
  negative: '#c9705a',
  tickerBg: 'rgba(176,140,214,0.12)',
  tickerText: '#b08cd6',
  badgeBg: 'rgba(255,255,255,0.04)',
  badgeText: '#6e6e72',
  inputBg: '#1a1a1d',
  inputBorder: 'rgba(255,255,255,0.1)',
  accent: '#e0915c',
  accentMuted: 'rgba(224,145,92,0.18)',
  sliderTrack: 'rgba(255,255,255,0.06)',
  sliderThumb: '#e0915c',
  ruleLine: 'rgba(224,145,92,0.30)',
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('signals')
  const [latestSnapshot, setLatestSnapshot] = useState<DailySnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  // Both voice cards always render; the contributor toggle UI was removed (the cards name their own author).
  const activeVoices = new Set(['Visser', 'Camillo', 'ZaStocks'])

  // Portfolio value lives here so it can render in the top stat row on the Portfolio tab.
  const [portfolioValue, setPortfolioValue] = useState<number>(() => {
    try { const s = localStorage.getItem('ap-portfolio-value'); if (s) { const n = parseFloat(s); if (!isNaN(n) && n > 0) return n } } catch {}
    return 100000
  })
  // Always starts empty so the box reads "Enter". Sizing still defaults to
  // 100k via portfolioValue; the basis is deliberately not shown as a number.
  const [portfolioInput, setPortfolioInput] = useState('')
  const [fgOpen, setFgOpen] = useState(false)
  useEffect(() => { try { localStorage.setItem('ap-portfolio-value', String(portfolioValue)) } catch {} }, [portfolioValue])
  const handlePortfolioSubmit = () => {
    const val = parseFloat(portfolioInput.replace(/[^0-9.]/g, ''))
    if (!isNaN(val) && val > 0) { setPortfolioValue(val); setPortfolioInput(val.toLocaleString('en-US')) }
    else { setPortfolioInput('') }
  }

  useEffect(() => {
    async function fetchLatest() {
      setLoading(true)
      const { data, error } = await supabase.from('daily_snapshots').select('*').order('snapshot_date', { ascending: false }).limit(1).single()
      if (error && error.code !== 'PGRST116') console.error('Error:', error)
      setLatestSnapshot(data)
      setLoading(false)
    }
    fetchLatest()
  }, [])

  const tabs: { key: Tab; label: string }[] = [
    { key: 'signals', label: 'Signals' },
    { key: 'portfolio', label: 'Portfolio' },
    { key: 'pnl', label: 'Performance' },
    { key: 'system', label: 'System' },
    // { key: 'trading', label: 'Trading' }, // hidden 7/23 — uncomment to restore
  ]

  const cumulativeReturn = latestSnapshot?.cumulative_return_pct ?? 0
  const alpha = (latestSnapshot?.cumulative_return_pct ?? 0) - (latestSnapshot?.spy_cumulative_return_pct ?? 0)

  // Market sentiment — Kalshi KXFEAR, market-implied CNN Fear & Greed band at the
  // nearest Friday settle. Display-only; feeds no score. Null-safe: the cron skips
  // on an incomplete ladder, in which case card 4 falls back to Active signals.
  const fg = latestSnapshot?.macro_signals?.fear_greed ?? null
  const fgSide = fg && fg.side_prob != null
    ? `${String(fg.band).includes('Fear') ? 'Fear' : 'Greed'}-side ${Math.round(fg.side_prob * 100)}% · `
    : ''
  const fgSub = fg ? `${fgSide}implied ${fg.implied} · via Kalshi` : ''
  const dateStr = latestSnapshot?.snapshot_date ? new Date(latestSnapshot.snapshot_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : ''

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: t.bg, color: t.textPrimary }}>
      {/* Full-page basalt backdrop + neutral scrim (fixed, content scrolls over) */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: `url(${basaltBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, background: 'linear-gradient(180deg, rgba(14,14,16,0.52) 0%, rgba(14,14,16,0.30) 26%, rgba(14,14,16,0.34) 70%, rgba(14,14,16,0.42) 100%)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <style>{`
          * { font-family: 'Manrope', -apple-system, 'Segoe UI', Roboto, sans-serif; }
          body, input, button { font-family: 'Manrope', -apple-system, 'Segoe UI', Roboto, sans-serif; }
          input[type="range"] { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px; background: ${t.sliderTrack}; outline: none; cursor: pointer; }
          input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 50%; background: ${t.sliderThumb}; border: 2px solid ${t.bg}; cursor: pointer; }
          input[type="range"]::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: ${t.sliderThumb}; border: 2px solid ${t.bg}; cursor: pointer; }
          input[type="range"]::-moz-range-track { height: 4px; border-radius: 2px; background: ${t.sliderTrack}; }
          .ap-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 24px; }
          .ap-signals-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
          .ap-portfolio-grid { display: grid; grid-template-columns: 1fr auto; gap: 16px; }
          .ap-donut-grid { display: grid; grid-template-columns: 200px 1fr; gap: 16px; }
          .ap-pnl-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
          .ap-history-detail { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
          .ap-bestworst { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .ap-voices-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
          .ap-tabs { display: flex; gap: 2px; flex-wrap: wrap; }
          @media (max-width: 768px) {
            .ap-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .ap-signals-grid { grid-template-columns: 1fr; }
            .ap-portfolio-grid { grid-template-columns: 1fr; }
            .ap-donut-grid { grid-template-columns: 1fr; }
            .ap-pnl-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .ap-history-detail { grid-template-columns: 1fr; }
            .ap-bestworst { grid-template-columns: 1fr; }
            .ap-voices-grid { grid-template-columns: 1fr; }
          }
        `}</style>

        {/* Masthead */}
        <header style={{ padding: '28px 0 0' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', position: 'relative', marginBottom: 8 }}>
              <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 40, fontWeight: 800, margin: 0, letterSpacing: 2, lineHeight: 1, color: t.textPrimary, textShadow: '0 2px 18px rgba(0,0,0,0.5)' }}>
                  ALPHA PLAYBOOK
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: 1, textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>{dateStr}</span>
                  <span style={{ color: t.accent }}>✦</span>
                  <span style={{ fontSize: 11, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: 1, textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>Signal-Driven Investing</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 48px' }}>
          {/* Stat Cards */}
          <div className="ap-stats">
            <StatCard label="Cumulative return" value={`${cumulativeReturn >= 0 ? '+' : ''}${cumulativeReturn.toFixed(2)}%`} color={cumulativeReturn >= 0 ? t.positive : t.negative} t={t} />
            <StatCard label="Alpha vs SPY" value={`${alpha >= 0 ? '+' : ''}${alpha.toFixed(2)}%`} color={alpha >= 0 ? t.positive : t.negative} t={t} />
            <InflationRegimeCard regime={latestSnapshot?.macro_signals?.regime ?? null} t={t} />
            {activeTab === 'portfolio' ? (
              <PortfolioValueCard input={portfolioInput} onInput={setPortfolioInput} onCommit={handlePortfolioSubmit} t={t} />
            ) : fg ? (
              <StatCard
                label="Market sentiment"
                value={`${Math.round((fg.prob ?? 0) * 100)}% ${fg.band}`}
                color={String(fg.band).includes('Fear') ? t.negative
                     : String(fg.band).includes('Greed') ? t.positive
                     : t.textPrimary}
                sub={fgSub}
                t={t}
                onClick={() => setFgOpen(o => !o)}
                expanded={fgOpen}
              />
            ) : (
              <StatCard label="Market sentiment" value="—" color={t.textTertiary} sub="awaiting Kalshi quote" t={t} />
            )}
          </div>
          {activeTab !== 'portfolio' && fg && fgOpen && <FearGreedPanel fg={fg} t={t} />}

          {/* Tabs */}
          <div className="ap-tabs" style={{ marginBottom: 24, borderBottom: `1px solid ${t.border}` }}>
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                padding: '8px 16px', fontSize: 13, fontWeight: activeTab === tab.key ? 500 : 400,
                color: activeTab === tab.key ? t.textPrimary : '#aeaeb2',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: activeTab === tab.key ? `2px solid ${t.accent}` : '2px solid transparent',
                transition: 'all 0.2s',
              }}>{tab.label}</button>
            ))}
          </div>

          {/* Content */}
          <div style={{ minHeight: 400 }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256, color: t.textTertiary }}>Loading signals...</div>
            ) : (
              <>
                {activeTab === 'signals' && <SignalRecap snapshot={latestSnapshot} theme={t} activeVoices={activeVoices} />}
                {activeTab === 'portfolio' && <Portfolio snapshot={latestSnapshot} theme={t} portfolioValue={portfolioValue} />}
                {activeTab === 'pnl' && <PnLTracker theme={t} />}
                {activeTab === 'trading' && <TradingTab theme={t} />}
                {activeTab === 'system' && <SystemTab theme={t} snapshot={latestSnapshot} />}
              </>
            )}
          </div>

          <footer style={{ marginTop: 48, paddingTop: 24, borderTop: `1px solid ${t.border}`, textAlign: 'center', fontSize: 11, color: t.textTertiary, paddingBottom: 32, fontFamily: "'Manrope', sans-serif", fontStyle: 'italic' }}>
            Not financial advice. For educational and portfolio demonstration purposes only.
          </footer>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color, sub, t, onClick, expanded }: { label: string; value: string; color: string; sub?: string; t: Theme; onClick?: () => void; expanded?: boolean }) {
  const clickable = !!onClick
  return (
    <div
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-expanded={clickable ? !!expanded : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick!() } } : undefined}
      style={{ background: 'rgba(30,29,27,0.38)', backdropFilter: 'blur(32px) saturate(132%)', WebkitBackdropFilter: 'blur(32px) saturate(132%)', border: `1px solid ${expanded ? 'rgba(255,255,255,0.26)' : 'rgba(255,255,255,0.11)'}`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, cursor: clickable ? 'pointer' : undefined, userSelect: clickable ? 'none' : undefined, transition: 'border-color 0.15s' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ fontSize: 11, color: t.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
        {clickable && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.textTertiary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden
            style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, color, fontFamily: "'Manrope', sans-serif", fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: t.textTertiary, marginTop: 2, textTransform: 'capitalize' }}>{sub}</div>}
    </div>
  )
}

// Kalshi KXFEAR explainer — opened by clicking the Market sentiment card.
// Reads only what the cron already stores in macro_signals.fear_greed.
// Measurement date comes from the EVENT TICKER (KXFEAR-26SEP25 -> Sep 25, 4:00 PM ET),
// NOT close_time: Kalshi's close_time is a one-week backstop (e.g. Oct 2) and the
// market expires early once the index value is known.
const FG_PANEL_BANDS: { key: string; range: string; side: 'fear' | 'neutral' | 'greed' }[] = [
  { key: 'Extreme Fear', range: '0–24', side: 'fear' },
  { key: 'Fear', range: '25–44', side: 'fear' },
  { key: 'Neutral', range: '45–55', side: 'neutral' },
  { key: 'Greed', range: '56–75', side: 'greed' },
  { key: 'Extreme Greed', range: '76–100', side: 'greed' },
]
const FG_MONTHS: Record<string, number> = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 }

function fgMeasureTime(event: string | null | undefined): Date | null {
  const m = String(event || '').match(/-(\d{2})([A-Z]{3})(\d{2})$/)
  if (!m || FG_MONTHS[m[2]] === undefined) return null
  const y = 2000 + Number(m[1]), mo = FG_MONTHS[m[2]], d = Number(m[3])
  // 4:00 PM ET = 20:00 UTC in daylight time, 21:00 UTC in standard time.
  const edt = new Date(Date.UTC(y, mo, d, 20, 0, 0))
  const hr = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false }).format(edt)
  return Number(hr) === 16 ? edt : new Date(Date.UTC(y, mo, d, 21, 0, 0))
}

function fgEt(d: Date, withWeekday = true): string {
  return d.toLocaleString('en-US', { timeZone: 'America/New_York', ...(withWeekday ? { weekday: 'short' } : {}), month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' ET'
}

function fgTimeLeft(target: Date | null): string {
  if (!target) return '—'
  const ms = target.getTime() - Date.now()
  if (ms <= 0) return 'Measured — awaiting settle'
  const hrs = Math.floor(ms / 3600000)
  const days = Math.floor(hrs / 24), rem = hrs % 24
  if (days === 0) return `${Math.max(rem, 1)} hr${rem === 1 ? '' : 's'}`
  return `${days} day${days === 1 ? '' : 's'}${rem ? `, ${rem} hr${rem === 1 ? '' : 's'}` : ''}`
}

function FearGreedPanel({ fg, t }: { fg: any; t: Theme }) {
  const bands: Record<string, number> = fg?.bands ?? {}
  const measure = fgMeasureTime(fg?.event)
  const close = fg?.close_time ? new Date(fg.close_time) : null
  const asOf = fg?.as_of ? new Date(fg.as_of) : null
  const titleDate = measure ? measure.toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric' }) : null
  const isFearSide = String(fg?.band).includes('Fear')
  const pct = (x: number | null | undefined, dp = 1) => (x == null ? '—' : `${(x * 100).toFixed(dp)}%`)
  const sideColor = (side: string) => (side === 'fear' ? t.negative : side === 'greed' ? t.positive : t.textTertiary)
  const k = { fontSize: 11, color: t.textTertiary, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 }
  const v = { fontSize: 14, color: t.textPrimary, fontVariantNumeric: 'tabular-nums' as const }
  const rule = { borderTop: '1px solid rgba(255,255,255,0.09)' }

  return (
    <div style={{ background: 'rgba(30,29,27,0.46)', backdropFilter: 'blur(32px) saturate(132%)', WebkitBackdropFilter: 'blur(32px) saturate(132%)', border: '1px solid rgba(255,255,255,0.11)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)', borderRadius: 12, padding: '18px 22px', marginTop: -12, marginBottom: 24, fontFamily: "'Manrope', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: t.textPrimary }}>Fear &amp; Greed Index on {titleDate ?? 'the next Friday settle'}?</span>
        <span style={{ fontSize: 12, color: t.textTertiary, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{fg?.event ?? 'KXFEAR'}</span>
      </div>
      <p style={{ fontSize: 13, color: t.textSecondary, lineHeight: 1.6, margin: '6px 0 16px' }}>
        Kalshi prediction market on CNN's Fear &amp; Greed Index (0–100). Five mutually exclusive contracts, one per band; the winning band pays $1.00, the rest pay $0. Each contract's price is the crowd's probability that the index closes in that band.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 16 }}>
        <div><div style={k}>Measured</div><div style={v}>{measure ? fgEt(measure) : '—'}</div></div>
        <div><div style={k}>Time left</div><div style={v}>{fgTimeLeft(measure)}</div></div>
        <div><div style={k}>Kalshi backstop close</div><div style={v}>{close ? fgEt(close) : '—'}</div></div>
      </div>

      <div style={{ ...rule, paddingTop: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 70px minmax(0, 1fr) 60px', gap: 12, fontSize: 11, color: t.textTertiary, textTransform: 'uppercase', letterSpacing: 0.4, padding: '2px 0 4px' }}>
          <span>Band</span><span>Index</span><span /><span style={{ textAlign: 'right' }}>Odds</span>
        </div>
        {FG_PANEL_BANDS.map(b => {
          const p = bands[b.key] ?? 0
          const top = b.key === fg?.band
          return (
            <div key={b.key} style={{ display: 'grid', gridTemplateColumns: '120px 70px minmax(0, 1fr) 60px', gap: 12, alignItems: 'center', fontSize: 13, padding: '5px 0', color: top ? t.textPrimary : t.textSecondary, fontWeight: top ? 600 : 400 }}>
              <span>{b.key}</span>
              <span style={{ color: t.textTertiary, fontWeight: 400 }}>{b.range}</span>
              <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)' }}>
                <div style={{ width: `${Math.min(100, Math.max(0, p * 100))}%`, height: 8, borderRadius: 4, background: sideColor(b.side), opacity: top ? 1 : 0.6 }} />
              </div>
              <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{pct(p)}</span>
            </div>
          )
        })}
      </div>

      <div style={{ ...rule, marginTop: 10, paddingTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
        <div><div style={k}>{Math.round((fg?.prob ?? 0) * 100)}% {fg?.band}</div><div style={{ fontSize: 12, color: t.textSecondary, lineHeight: 1.5 }}>Most likely band</div></div>
        <div>
          <div style={k}>{fg?.side_prob != null ? `${isFearSide ? 'Fear' : 'Greed'}-side ${Math.round(fg.side_prob * 100)}%` : 'Side —'}</div>
          <div style={{ fontSize: 12, color: t.textSecondary, lineHeight: 1.5 }}>{fg?.side_prob != null ? (isFearSide ? 'Extreme Fear + Fear' : 'Greed + Extreme Greed') : 'Neutral leads; no side'}</div>
        </div>
        <div><div style={k}>Implied {fg?.implied ?? '—'}</div><div style={{ fontSize: 12, color: t.textSecondary, lineHeight: 1.5 }}>Odds-weighted band midpoint (12.5 / 35 / 50 / 65 / 87.5)</div></div>
      </div>

      <p style={{ fontSize: 11, color: t.textTertiary, margin: '14px 0 0', lineHeight: 1.6 }}>
        {fg?.total_oi ? `${Math.round(fg.total_oi).toLocaleString('en-US')} contracts open · ` : ''}bid/ask midpoints, normalized to 100% · display-only, feeds no score
        {asOf ? ` · snapshot ${fgEt(asOf, false)}` : ''} · rolls to the next Friday contract after settle
      </p>
    </div>
  )
}

function PortfolioValueCard({ input, onInput, onCommit, t }: { input: string; onInput: (v: string) => void; onCommit: () => void; t: Theme }) {
  return (
    <div style={{ background: 'rgba(30,29,27,0.38)', backdropFilter: 'blur(32px) saturate(132%)', WebkitBackdropFilter: 'blur(32px) saturate(132%)', border: '1px solid rgba(255,255,255,0.11)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 11, color: t.textTertiary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Portfolio value</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 22, fontWeight: 600, color: t.textTertiary, fontFamily: "'Manrope', sans-serif" }}>$</span>
        <input type="text" inputMode="numeric" placeholder="Enter" value={input} onChange={(e) => onInput(e.target.value)} onBlur={onCommit} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
          style={{ flex: 1, minWidth: 0, fontSize: 22, fontWeight: 600, fontFamily: "'Manrope', sans-serif", fontVariantNumeric: 'tabular-nums', background: t.inputBg, border: 'none', borderRadius: 6, padding: '0 8px', color: t.textPrimary, outline: 'none' }} />
      </div>
      <div style={{ fontSize: 11, color: t.textTertiary, marginTop: 2, fontStyle: 'italic' }}>Sizing only — live engine weights</div>
    </div>
  )
}

function InflationRegimeCard({ regime, t }: { regime: any; t: Theme }) {
  const has = regime && typeof regime.above === 'boolean'
  const above = !!regime?.above
  const val = typeof regime?.value === 'number' ? regime.value : null
  const color = has ? (above ? t.negative : t.positive) : t.textTertiary
  const value = val != null ? `${val.toFixed(1)}%` : '—'
  const pill = above ? 'BEARISH' : 'BULLISH'
  const pillColors = above
    ? { text: '#d98e79', bg: 'rgba(201,112,90,0.16)', border: 'rgba(201,112,90,0.34)' }
    : { text: '#8fd07e', bg: 'rgba(125,186,106,0.16)', border: 'rgba(125,186,106,0.34)' }
  const sub = has ? `${above ? 'Above' : 'Below'} 4% line · S&P ${above ? 'hist. negative' : '+12%/yr'}` : 'Awaiting CPI data'
  return (
    <div style={{ background: 'rgba(30,29,27,0.38)', backdropFilter: 'blur(32px) saturate(132%)', WebkitBackdropFilter: 'blur(32px) saturate(132%)', border: '1px solid rgba(255,255,255,0.11)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 11, color: t.textTertiary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Inflation regime</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 22, fontWeight: 600, color, fontFamily: "'Manrope', sans-serif", fontVariantNumeric: 'tabular-nums' }}>{value}</span>
        {has && (
          <span style={{ alignSelf: 'center', fontSize: 9.5, letterSpacing: 0.5, color: pillColors.text, background: pillColors.bg, border: `1px solid ${pillColors.border}`, padding: '2px 7px', borderRadius: 5 }}>{pill}</span>
        )}
      </div>
      <div style={{ fontSize: 11, color: t.textTertiary, marginTop: 2 }}>{sub}</div>
    </div>
  )
}
