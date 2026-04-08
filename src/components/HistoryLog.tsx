import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

interface HistoryRow {
  snapshot_date: string
  bullish_assets: any[] | null
  portfolio_value: number | null
  daily_return_pct: number | null
  narrative_signals: any[] | null
  polymarket_signals: any[] | null
  spy_rsi: number | null
  rsi_signal: string | null
}

export default function HistoryLog() {
  const [history, setHistory] = useState<HistoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDate, setExpandedDate] = useState<string | null>(null)

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true)
      const { data, error } = await supabase
        .from('daily_snapshots')
        .select('snapshot_date, bullish_assets, portfolio_value, daily_return_pct, narrative_signals, polymarket_signals, spy_rsi, rsi_signal')
        .order('snapshot_date', { ascending: false })

      if (error) {
        console.error('Error fetching history:', error)
      }
      setHistory(data ?? [])
      setLoading(false)
    }
    fetchHistory()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-white/30">
        Loading history...
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="bg-[#0d1220] border border-white/10 rounded-xl p-8 text-center">
        <div className="text-white/30 text-lg mb-2">No history yet</div>
        <div className="text-white/20 text-sm">
          Daily snapshots will appear here as the cron job runs each day.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {history.map((row) => {
        const isExpanded = expandedDate === row.snapshot_date
        const topCalls = (row.bullish_assets ?? []).slice(0, 5)
        const dailyReturn = row.daily_return_pct ?? 0

        return (
          <div key={row.snapshot_date} className="bg-[#0d1220] border border-white/10 rounded-xl overflow-hidden">
            {/* Summary Row */}
            <button
              onClick={() => setExpandedDate(isExpanded ? null : row.snapshot_date)}
              className="w-full p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="text-sm font-medium">
                  {new Date(row.snapshot_date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                <div className="flex gap-1">
                  {topCalls.map((asset: any, i: number) => (
                    <span
                      key={i}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/50 font-medium"
                    >
                      {asset.ticker}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-white/50">
                  ${(row.portfolio_value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span
                  className={`text-sm font-medium ${
                    dailyReturn > 0
                      ? 'text-emerald-400'
                      : dailyReturn < 0
                        ? 'text-red-400'
                        : 'text-white/30'
                  }`}
                >
                  {dailyReturn > 0 ? '+' : ''}{dailyReturn.toFixed(2)}%
                </span>
                <svg
                  className={`w-4 h-4 text-white/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Expanded Detail */}
            {isExpanded && (
              <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-3">
                {/* Narrative */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                    <span className="text-xs text-violet-400 font-medium">Narrative</span>
                  </div>
                  {(row.narrative_signals ?? []).length === 0 ? (
                    <span className="text-xs text-white/20">No signals</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {(row.narrative_signals ?? []).map((s: any, i: number) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded bg-violet-500/10 text-violet-300">
                          {s.ticker} ({s.direction})
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Crowd */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span className="text-xs text-amber-400 font-medium">Crowd</span>
                  </div>
                  {(row.polymarket_signals ?? []).length === 0 ? (
                    <span className="text-xs text-white/20">No signals</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {(row.polymarket_signals ?? []).map((s: any, i: number) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300">
                          {s.market}: {(s.probability * 100).toFixed(0)}%
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quant */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span className="text-xs text-cyan-400 font-medium">Quant</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300">
                    RSI: {row.spy_rsi !== null ? Number(row.spy_rsi).toFixed(1) : '—'} ({row.rsi_signal ?? 'n/a'})
                  </span>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
