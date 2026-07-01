import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import SignalRecap from './SignalRecap'
import Portfolio from './Portfolio'
import PnLTracker from './PnLTracker'
import basaltBg from '../assets/Basalt.jpg'

type Tab = 'signals' | 'portfolio' | 'pnl'

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
  const activeVoices = new Set(['Visser', 'Camillo'])

  // Portfolio value lives here so it can render in the top stat row on the Portfolio tab.
  const [portfolioValue, setPortfolioValue] = useState<number>(() => {
    try { const s = localStorage.getItem('ap-portfolio-value'); if (s) { const n = parseFloat(s); if (!isNaN(n) && n > 0) return n } } catch {}
    return 100000
  })
  const [portfolioInput, setPortfolioInput] = useState(() => portfolioValue.toLocaleString('en-US'))
  useEffect(() => { try { localStorage.setItem('ap-portfolio-value', String(portfolioValue)) } catch {} }, [portfolioValue])
  const handlePortfolioSubmit = () => {
    const val = parseFloat(portfolioInput.replace(/[^0-9.]/g, ''))
    if (!isNaN(val) && val > 0) { setPortfolioValue(val); setPortfolioInput(val.toLocaleString('en-US')) }
    else { setPortfolioInput(portfolioValue.toLocaleString('en-US')) }
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
  ]

  const cumulativeReturn = latestSnapshot?.cumulative_return_pct ?? 0
  const alpha = (latestSnapshot?.cumulative_return_pct ?? 0) - (latestSnapshot?.spy_cumulative_return_pct ?? 0)
  const spyRsi = latestSnapshot?.spy_rsi ?? null
  const signalCount = (latestSnapshot?.narrative_signals?.length ?? 0) + (latestSnapshot?.polymarket_signals?.length ?? 0) + (spyRsi !== null ? 1 : 0)
  const dateStr = latestSnapshot?.snapshot_date ? new Date(latestSnapshot.snapshot_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : ''

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: t.bg, color: t.textPrimary }}>
      {/* Full-page basalt backdrop + neutral scrim (fixed, content scrolls over) */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: `url(${basaltBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, background: 'linear-gradient(180deg, rgba(14,14,16,0.52) 0%, rgba(14,14,16,0.30) 26%, rgba(14,14,16,0.34) 70%, rgba(14,14,16,0.42) 100%)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
        <style>{`
          input[type="range"] { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px; background: ${t.sliderTrack}; outline: none; cursor: pointer; }
          input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 50%; background: ${t.sliderThumb}; border: 2px solid ${t.bg}; cursor: pointer; }
          input[type="range"]::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: ${t.sliderThumb}; border: 2px solid ${t.bg}; cursor: pointer; }
          input[type="range"]::-moz-range-track { height: 4px; border-radius: 2px; background: ${t.sliderTrack}; }
          .ap-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
          .ap-signals-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
          .ap-portfolio-grid { display: grid; grid-template-columns: 1fr auto; gap: 16px; }
          .ap-donut-grid { display: grid; grid-template-columns: 200px 1fr; gap: 16px; }
          .ap-pnl-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
          .ap-history-detail { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
          .ap-bestworst { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .ap-voices-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
          .ap-tabs { display: flex; gap: 2px; flex-wrap: wrap; }
          @media (max-width: 768px) {
            .ap-stats { grid-template-columns: repeat(2, 1fr); }
            .ap-signals-grid { grid-template-columns: 1fr; }
            .ap-portfolio-grid { grid-template-columns: 1fr; }
            .ap-donut-grid { grid-template-columns: 1fr; }
            .ap-pnl-stats { grid-template-columns: repeat(2, 1fr); }
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
                <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 42, fontWeight: 900, margin: 0, letterSpacing: 2, lineHeight: 1, color: t.textPrimary, textShadow: '0 2px 18px rgba(0,0,0,0.5)' }}>
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
            <StatCard label="SPY RSI (14)" value={spyRsi !== null ? spyRsi.toFixed(1) : '—'} color={spyRsi !== null ? (spyRsi > 70 ? t.negative : spyRsi < 25 ? t.positive : t.textPrimary) : t.textTertiary} sub={latestSnapshot?.rsi_signal ?? undefined} t={t} />
            {activeTab === 'portfolio' ? (
              <PortfolioValueCard input={portfolioInput} onInput={setPortfolioInput} onCommit={handlePortfolioSubmit} t={t} />
            ) : (
              <StatCard label="Active signals" value={String(signalCount)} color={t.textPrimary} sub="3 sources" t={t} />
            )}
          </div>

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
              </>
            )}
          </div>

          <footer style={{ marginTop: 48, paddingTop: 24, borderTop: `1px solid ${t.border}`, textAlign: 'center', fontSize: 11, color: t.textTertiary, paddingBottom: 32, fontFamily: "'Libre Baskerville', Georgia, serif", fontStyle: 'italic' }}>
            Not financial advice. For educational and portfolio demonstration purposes only.
          </footer>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color, sub, t }: { label: string; value: string; color: string; sub?: string; t: Theme }) {
  return (
    <div style={{ background: 'rgba(30,29,27,0.38)', backdropFilter: 'blur(32px) saturate(132%)', WebkitBackdropFilter: 'blur(32px) saturate(132%)', border: '1px solid rgba(255,255,255,0.11)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 11, color: t.textTertiary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 500, color, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: t.textTertiary, marginTop: 2, textTransform: 'capitalize' }}>{sub}</div>}
    </div>
  )
}

function PortfolioValueCard({ input, onInput, onCommit, t }: { input: string; onInput: (v: string) => void; onCommit: () => void; t: Theme }) {
  return (
    <div style={{ background: 'rgba(30,29,27,0.38)', backdropFilter: 'blur(32px) saturate(132%)', WebkitBackdropFilter: 'blur(32px) saturate(132%)', border: '1px solid rgba(255,255,255,0.11)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 11, color: t.textTertiary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Portfolio value</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 20, fontWeight: 500, color: t.textTertiary, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>$</span>
        <input type="text" inputMode="numeric" value={input} onChange={(e) => onInput(e.target.value)} onBlur={onCommit} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
          style={{ flex: 1, minWidth: 0, fontSize: 20, fontWeight: 500, fontFamily: 'ui-monospace, SFMono-Regular, monospace', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 6, padding: '2px 8px', color: t.textPrimary, outline: 'none' }} />
      </div>
      <div style={{ fontSize: 11, color: t.textTertiary, marginTop: 4, fontStyle: 'italic' }}>Sizing only — live engine weights</div>
    </div>
  )
}
