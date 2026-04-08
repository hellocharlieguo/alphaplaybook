import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import SignalRecap from './SignalRecap'
import Portfolio from './Portfolio'
import PnLTracker from './PnLTracker'
import HistoryLog from './HistoryLog'

type Tab = 'signals' | 'portfolio' | 'pnl' | 'history'

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

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('signals')
  const [latestSnapshot, setLatestSnapshot] = useState<DailySnapshot | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLatest() {
      setLoading(true)
      const { data, error } = await supabase
        .from('daily_snapshots')
        .select('*')
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching snapshot:', error)
      }
      setLatestSnapshot(data)
      setLoading(false)
    }
    fetchLatest()
  }, [])

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'signals', label: 'Signal Recap', icon: '📡' },
    { key: 'portfolio', label: 'Portfolio', icon: '💼' },
    { key: 'pnl', label: 'P&L Tracker', icon: '📈' },
    { key: 'history', label: 'History', icon: '📋' },
  ]

  const portfolioValue = latestSnapshot?.portfolio_value ?? 250000
  const dailyReturn = latestSnapshot?.daily_return_pct ?? 0
  const cumulativeReturn = latestSnapshot?.cumulative_return_pct ?? 0
  const alpha = (latestSnapshot?.cumulative_return_pct ?? 0) - (latestSnapshot?.spy_cumulative_return_pct ?? 0)
  const spyRsi = latestSnapshot?.spy_rsi ?? null
  const signalCount = latestSnapshot?.bullish_assets?.length ?? 0

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0d1220]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center font-bold text-sm text-black">
              α
            </div>
            <h1 className="text-lg font-semibold tracking-tight">
              Alpha<span className="text-emerald-400">Playbook</span>
            </h1>
          </div>
          <div className="text-sm text-white/40">
            {latestSnapshot?.snapshot_date
              ? `Last updated: ${new Date(latestSnapshot.snapshot_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
              : 'Awaiting first signal...'}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <StatCard
            label="Portfolio Value"
            value={`$${portfolioValue.toLocaleString()}`}
            sub={null}
          />
          <StatCard
            label="Daily Return"
            value={`${dailyReturn >= 0 ? '+' : ''}${dailyReturn.toFixed(2)}%`}
            sub={null}
            color={dailyReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}
          />
          <StatCard
            label="Cumulative Return"
            value={`${cumulativeReturn >= 0 ? '+' : ''}${cumulativeReturn.toFixed(2)}%`}
            sub={null}
            color={cumulativeReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}
          />
          <StatCard
            label="Alpha vs SPY"
            value={`${alpha >= 0 ? '+' : ''}${alpha.toFixed(2)}%`}
            sub={null}
            color={alpha >= 0 ? 'text-emerald-400' : 'text-red-400'}
          />
          <StatCard
            label="SPY RSI (14)"
            value={spyRsi !== null ? spyRsi.toFixed(1) : '—'}
            sub={latestSnapshot?.rsi_signal ?? null}
            color={
              spyRsi !== null
                ? spyRsi < 30
                  ? 'text-emerald-400'
                  : spyRsi > 70
                    ? 'text-red-400'
                    : 'text-white'
                : 'text-white/50'
            }
          />
        </div>

        {/* Three Plays Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <PlayCard
            play="Play 1"
            title="Narrative"
            source="Visser / Pomp"
            count={latestSnapshot?.narrative_signals?.length ?? 0}
            color="from-violet-500/20 to-violet-600/5"
            borderColor="border-violet-500/30"
            dotColor="bg-violet-400"
          />
          <PlayCard
            play="Play 2"
            title="Crowd"
            source="Polymarket"
            count={latestSnapshot?.polymarket_signals?.length ?? 0}
            color="from-amber-500/20 to-amber-600/5"
            borderColor="border-amber-500/30"
            dotColor="bg-amber-400"
          />
          <PlayCard
            play="Play 3"
            title="Quant"
            source="SPY RSI"
            count={spyRsi !== null ? 1 : 0}
            color="from-cyan-500/20 to-cyan-600/5"
            borderColor="border-cyan-500/30"
            dotColor="bg-cyan-400"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-[#0d1220] p-1 rounded-xl border border-white/10 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-white/30">
              Loading signals...
            </div>
          ) : (
            <>
              {activeTab === 'signals' && <SignalRecap snapshot={latestSnapshot} />}
              {activeTab === 'portfolio' && <Portfolio snapshot={latestSnapshot} />}
              {activeTab === 'pnl' && <PnLTracker />}
              {activeTab === 'history' && <HistoryLog />}
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-white/10 text-center text-xs text-white/20 pb-8">
          Not financial advice. For educational and portfolio demonstration purposes only.
          <br />
          Data: YouTube Data API · Polymarket Gamma API · Alpha Vantage
        </footer>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  color = 'text-white',
}: {
  label: string
  value: string
  sub: string | null
  color?: string
}) {
  return (
    <div className="bg-[#0d1220] border border-white/10 rounded-xl p-4">
      <div className="text-xs text-white/40 mb-1">{label}</div>
      <div className={`text-xl font-semibold tracking-tight ${color}`}>{value}</div>
      {sub && (
        <div className="text-xs text-white/30 mt-1 capitalize">{sub}</div>
      )}
    </div>
  )
}

function PlayCard({
  play,
  title,
  source,
  count,
  color,
  borderColor,
  dotColor,
}: {
  play: string
  title: string
  source: string
  count: number
  color: string
  borderColor: string
  dotColor: string
}) {
  return (
    <div className={`bg-gradient-to-br ${color} border ${borderColor} rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span className="text-xs text-white/50 font-medium">{play}</span>
        </div>
        <span className="text-xs text-white/30">{count} signal{count !== 1 ? 's' : ''}</span>
      </div>
      <div className="text-base font-semibold">{title}</div>
      <div className="text-xs text-white/40">{source}</div>
    </div>
  )
}
