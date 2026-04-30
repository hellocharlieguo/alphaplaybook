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
}

const themes: Record<ThemeMode, Theme> = {
  dark: {
    mode: 'dark',
    bg: '#111827',
    cardPrimary: '#1e293b',
    textPrimary: '#f1f5f9',
    textSecondary: '#94a3b8',
    textTertiary: '#64748b',
    border: 'rgba(255,255,255,0.08)',
    surfaceSubtle: 'rgba(255,255,255,0.04)',
    positive: '#34d399',
    negative: '#f87171',
    tickerBg: 'rgba(139,92,246,0.15)',
    tickerText: '#a78bfa',
    badgeBg: 'rgba(255,255,255,0.06)',
    badgeText: '#64748b',
    inputBg: '#0f172a',
    inputBorder: 'rgba(255,255,255,0.12)',
  },
  light: {
    mode: 'light',
    bg: '#f8f9fb',
    cardPrimary: '#ffffff',
    textPrimary: '#1a1a2e',
    textSecondary: '#64748b',
    textTertiary: '#94a3b8',
    border: '#e2e8f0',
    surfaceSubtle: '#f1f5f9',
    positive: '#10b981',
    negative: '#ef4444',
    tickerBg: '#ede9fe',
    tickerText: '#6d28d9',
    badgeBg: '#f1f5f9',
    badgeText: '#94a3b8',
    inputBg: '#ffffff',
    inputBorder: '#e2e8f0',
  },
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('signals')
  const [latestSnapshot, setLatestSnapshot] = useState<DailySnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('alphaplaybook-theme')
      if (saved === 'light' || saved === 'dark') return saved
    } catch {}
    return 'dark'
  })

  const t = themes[mode]

  useEffect(() => {
    try { localStorage.setItem('alphaplaybook-theme', mode) } catch {}
  }, [mode])

  useEffect(() => {
    async function fetchLatest() {
      setLoading(true)
      const { data, error } = await supabase
        .from('daily_snapshots')
        .select('*')
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single()
      if (error && error.code !== 'PGRST116') console.error('Error fetching snapshot:', error)
      setLatestSnapshot(data)
      setLoading(false)
    }
    fetchLatest()
  }, [])

  const tabs: { key: Tab; label: string }[] = [
    { key: 'signals', label: 'Signals' },
    { key: 'portfolio', label: 'Portfolio' },
    { key: 'pnl', label: 'Performance' },
    { key: 'history', label: 'History' },
  ]

  const cumulativeReturn = latestSnapshot?.cumulative_return_pct ?? 0
  const alpha = (latestSnapshot?.cumulative_return_pct ?? 0) - (latestSnapshot?.spy_cumulative_return_pct ?? 0)
  const spyRsi = latestSnapshot?.spy_rsi ?? null
  const signalCount = (latestSnapshot?.narrative_signals?.length ?? 0) +
    (latestSnapshot?.polymarket_signals?.length ?? 0) +
    (spyRsi !== null ? 1 : 0)

  return (
    <div style={{ minHeight: '100vh', background: t.bg, color: t.textPrimary, transition: 'background 0.3s, color 0.3s' }}>
      <header style={{ borderBottom: `1px solid ${t.border}`, padding: '16px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #34d399, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14, color: '#000' }}>α</div>
            <span style={{ fontSize: 18, fontWeight: 500 }}>Alpha<span style={{ color: '#34d399' }}>Playbook</span></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 12, color: t.textTertiary }}>
              {latestSnapshot?.snapshot_date
                ? new Date(latestSnapshot.snapshot_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : ''}
            </span>
            <button
              onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
              style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${t.border}`, background: t.cardPrimary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: t.textSecondary, transition: 'all 0.3s' }}
              title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >{mode === 'dark' ? '☀' : '☾'}</button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 48px' }}>
        {/* North Star */}
        <div style={{ background: t.cardPrimary, border: `1px solid ${t.border}`, borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6' }} />
            <span style={{ fontSize: 11, color: t.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 }}>North star thesis</span>
          </div>
          <p style={{ fontSize: 22, fontWeight: 500, margin: 0, color: t.textPrimary, lineHeight: 1.4 }}>"Long scarcity, short abundance"</p>
          <p style={{ fontSize: 13, color: t.textTertiary, margin: '6px 0 0' }}>5 themes · Jordi Visser macro framework</p>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
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
              borderBottom: activeTab === tab.key ? '2px solid #34d399' : '2px solid transparent',
              transition: 'all 0.2s',
            }}>{tab.label}</button>
          ))}
        </div>

        <div style={{ minHeight: 400 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256, color: t.textTertiary }}>Loading signals...</div>
          ) : (
            <>
              {activeTab === 'signals' && <SignalRecap snapshot={latestSnapshot} theme={t} />}
              {activeTab === 'portfolio' && <Portfolio snapshot={latestSnapshot} theme={t} />}
              {activeTab === 'pnl' && <PnLTracker />}
              {activeTab === 'history' && <HistoryLog />}
            </>
          )}
        </div>

        <footer style={{ marginTop: 48, paddingTop: 24, borderTop: `1px solid ${t.border}`, textAlign: 'center', fontSize: 11, color: t.textTertiary, paddingBottom: 32 }}>
          Not financial advice. For educational and portfolio demonstration purposes only.
          <br />Data: YouTube Data API · Polymarket Gamma API · Alpha Vantage
        </footer>
      </div>
    </div>
  )
}

function StatCard({ label, value, color, sub, t }: { label: string; value: string; color: string; sub?: string; t: Theme }) {
  return (
    <div style={{ background: t.cardPrimary, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16, transition: 'all 0.3s' }}>
      <div style={{ fontSize: 12, color: t.textTertiary, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 500, color, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: t.textTertiary, marginTop: 2, textTransform: 'capitalize' }}>{sub}</div>}
    </div>
  )
}
