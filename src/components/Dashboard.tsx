import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import SignalRecap from './SignalRecap'
import Portfolio from './Portfolio'
import PnLTracker from './PnLTracker'
import HistoryLog from './HistoryLog'

type Tab = 'signals' | 'portfolio' | 'pnl' | 'history'
type ThemeMode = 'dark' | 'light'

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
}

export interface Theme {
  mode: ThemeMode
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

const themes: Record<ThemeMode, Theme> = {
  dark: {
    mode: 'dark',
    bg: '#1a1714',
    cardPrimary: '#242018',
    textPrimary: '#e8e0d4',
    textSecondary: '#8a7e6e',
    textTertiary: '#6b6050',
    border: 'rgba(255,255,255,0.06)',
    surfaceSubtle: 'rgba(255,255,255,0.025)',
    positive: '#7dba6a',
    negative: '#c9705a',
    tickerBg: 'rgba(176,140,214,0.12)',
    tickerText: '#b08cd6',
    badgeBg: 'rgba(255,255,255,0.04)',
    badgeText: '#6b6050',
    inputBg: '#1e1a14',
    inputBorder: 'rgba(255,255,255,0.1)',
    accent: '#c9a96e',
    accentMuted: 'rgba(201,169,110,0.15)',
    sliderTrack: 'rgba(255,255,255,0.06)',
    sliderThumb: '#c9a96e',
    ruleLine: 'rgba(201,169,110,0.25)',
  },
  light: {
    mode: 'light',
    bg: '#f5f0eb',
    cardPrimary: '#ffffff',
    textPrimary: '#1a1a1a',
    textSecondary: '#5c5a57',
    textTertiary: '#8a8784',
    border: '#e5e0da',
    surfaceSubtle: '#f0ebe5',
    positive: '#2d8a5e',
    negative: '#c44e4e',
    tickerBg: '#ede9fe',
    tickerText: '#6d28d9',
    badgeBg: '#f0ebe5',
    badgeText: '#8a8784',
    inputBg: '#ffffff',
    inputBorder: '#e5e0da',
    accent: '#8b6914',
    accentMuted: 'rgba(139,105,20,0.1)',
    sliderTrack: '#e5e0da',
    sliderThumb: '#8b6914',
    ruleLine: '#c4b99a',
  },
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('signals')
  const [latestSnapshot, setLatestSnapshot] = useState<DailySnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<ThemeMode>(() => {
    try { const s = localStorage.getItem('ap-theme'); if (s === 'light' || s === 'dark') return s } catch {} return 'dark'
  })
  const [activeVoices, setActiveVoices] = useState<Set<string>>(() => {
    try { const s = localStorage.getItem('ap-voices'); if (s) return new Set(JSON.parse(s)) } catch {}
    return new Set(['Visser', 'Camillo'])
  })

  const t = themes[mode]

  useEffect(() => { try { localStorage.setItem('ap-theme', mode) } catch {} }, [mode])
  useEffect(() => { try { localStorage.setItem('ap-voices', JSON.stringify(Array.from(activeVoices))) } catch {} }, [activeVoices])

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

  const toggleVoice = (voice: string) => {
    const next = new Set(activeVoices)
    if (next.has(voice)) next.delete(voice); else next.add(voice)
    setActiveVoices(next)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'signals', label: 'Signals' },
    { key: 'portfolio', label: 'Portfolio' },
    { key: 'pnl', label: 'Performance' },
    { key: 'history', label: 'History' },
  ]

  const cumulativeReturn = latestSnapshot?.cumulative_return_pct ?? 0
  const alpha = (latestSnapshot?.cumulative_return_pct ?? 0) - (latestSnapshot?.spy_cumulative_return_pct ?? 0)
  const spyRsi = latestSnapshot?.spy_rsi ?? null
  const signalCount = (latestSnapshot?.narrative_signals?.length ?? 0) + (latestSnapshot?.polymarket_signals?.length ?? 0) + (spyRsi !== null ? 1 : 0)
  const dateStr = latestSnapshot?.snapshot_date ? new Date(latestSnapshot.snapshot_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : ''

  return (
    <div style={{ minHeight: '100vh', background: t.bg, color: t.textPrimary, transition: 'background 0.3s, color 0.3s' }}>
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

      {/* Newspaper Masthead */}
      <header style={{ padding: '20px 0 0', borderBottom: `3px double ${t.ruleLine}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          {/* Top rule */}
          <div style={{ borderTop: `2px solid ${t.ruleLine}`, marginBottom: 12 }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            {/* Left spacer for symmetry */}
            <div style={{ width: 180 }} />

            {/* Center: Masthead */}
            <div style={{ textAlign: 'center', flex: 1 }}>
              <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 42, fontWeight: 900, margin: 0, letterSpacing: 2, lineHeight: 1, color: t.textPrimary }}>
                ALPHA PLAYBOOK
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 6 }}>
                <span style={{ fontSize: 11, color: t.textTertiary, textTransform: 'uppercase', letterSpacing: 1 }}>{dateStr}</span>
                <span style={{ color: t.ruleLine }}>✦</span>
                <span style={{ fontSize: 11, color: t.textTertiary, textTransform: 'uppercase', letterSpacing: 1 }}>Signal-Driven Investing</span>
              </div>
            </div>

            {/* Right: Contributors + theme toggle */}
            <div style={{ width: 180, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, paddingRight: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 9, color: t.textTertiary, textTransform: 'uppercase', letterSpacing: 1.5 }}>Contributors</span>
                <button onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
                  style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${t.border}`, background: t.cardPrimary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: t.textSecondary, transition: 'all 0.3s' }}
                >{mode === 'dark' ? '☀' : '☾'}</button>
              </div>
              {[{ key: 'Visser', label: 'Jordi Visser' }, { key: 'Camillo', label: 'Chris Camillo' }].map(voice => {
                const checked = activeVoices.has(voice.key)
                return (
                  <button key={voice.key} onClick={() => toggleVoice(voice.key)} style={{
                    display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  }}>
                    <div style={{ width: 13, height: 13, borderRadius: 2, border: `1.5px solid ${checked ? t.accent : t.textTertiary}`, background: checked ? t.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                      {checked && <span style={{ color: t.bg, fontSize: 8, fontWeight: 700 }}>✓</span>}
                    </div>
                    <span style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 12, color: checked ? t.textPrimary : t.textTertiary, fontStyle: 'italic', transition: 'color 0.2s' }}>{voice.label}</span>
                  </button>
                )
              })}
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
          <StatCard label="Active signals" value={String(signalCount)} color={t.textPrimary} sub="3 sources" t={t} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: `1px solid ${t.border}` }}>
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: '8px 16px', fontSize: 13, fontWeight: activeTab === tab.key ? 500 : 400,
              color: activeTab === tab.key ? t.textPrimary : t.textTertiary,
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
              {activeTab === 'portfolio' && <Portfolio snapshot={latestSnapshot} theme={t} />}
              {activeTab === 'pnl' && <PnLTracker theme={t} />}
              {activeTab === 'history' && <HistoryLog theme={t} />}
            </>
          )}
        </div>

        <footer style={{ marginTop: 48, paddingTop: 24, borderTop: `1px solid ${t.border}`, textAlign: 'center', fontSize: 11, color: t.textTertiary, paddingBottom: 32, fontFamily: "'Libre Baskerville', Georgia, serif", fontStyle: 'italic' }}>
          Not financial advice. For educational and portfolio demonstration purposes only.
        </footer>
      </div>
    </div>
  )
}

function StatCard({ label, value, color, sub, t }: { label: string; value: string; color: string; sub?: string; t: Theme }) {
  return (
    <div style={{ background: t.cardPrimary, border: `1px solid ${t.border}`, borderRadius: 8, padding: 16, transition: 'all 0.3s' }}>
      <div style={{ fontSize: 11, color: t.textTertiary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 500, color, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: t.textTertiary, marginTop: 2, textTransform: 'capitalize' }}>{sub}</div>}
    </div>
  )
}
