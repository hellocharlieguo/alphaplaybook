import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

interface SnapshotRow {
  snapshot_date: string
  portfolio_value: number | null
  spy_value: number | null
  cumulative_return_pct: number | null
  spy_cumulative_return_pct: number | null
  daily_return_pct: number | null
}

export default function PnLTracker() {
  const [snapshots, setSnapshots] = useState<SnapshotRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true)
      const { data, error } = await supabase
        .from('daily_snapshots')
        .select('snapshot_date, portfolio_value, spy_value, cumulative_return_pct, spy_cumulative_return_pct, daily_return_pct')
        .order('snapshot_date', { ascending: true })

      if (error) {
        console.error('Error fetching P&L:', error)
      }
      setSnapshots(data ?? [])
      setLoading(false)
    }
    fetchHistory()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-white/30">
        Loading P&L data...
      </div>
    )
  }

  if (snapshots.length === 0) {
    return (
      <div className="bg-[#0d1220] border border-white/10 rounded-xl p-8 text-center">
        <div className="text-white/30 text-lg mb-2">No P&L data yet</div>
        <div className="text-white/20 text-sm">
          The equity curve will build day by day as the cron job runs. After 30 days you'll have a meaningful chart.
        </div>
      </div>
    )
  }

  const latest = snapshots[snapshots.length - 1]
  const cumulativeReturn = latest?.cumulative_return_pct ?? 0
  const spyCumulativeReturn = latest?.spy_cumulative_return_pct ?? 0
  const alpha = cumulativeReturn - spyCumulativeReturn
  const daysSinceInception = snapshots.length

  // Calculate max drawdown
  let maxDrawdown = 0
  let peak = -Infinity
  for (const snap of snapshots) {
    const val = snap.cumulative_return_pct ?? 0
    if (val > peak) peak = val
    const drawdown = peak - val
    if (drawdown > maxDrawdown) maxDrawdown = drawdown
  }

  // Simple SVG chart
  const chartWidth = 800
  const chartHeight = 300
  const padding = { top: 20, right: 20, bottom: 40, left: 60 }
  const innerWidth = chartWidth - padding.left - padding.right
  const innerHeight = chartHeight - padding.top - padding.bottom

  const allValues = snapshots.flatMap((s) => [
    s.cumulative_return_pct ?? 0,
    s.spy_cumulative_return_pct ?? 0,
  ])
  const minVal = Math.min(...allValues, 0)
  const maxVal = Math.max(...allValues, 1)
  const range = maxVal - minVal || 1

  function toX(i: number) {
    return padding.left + (i / Math.max(snapshots.length - 1, 1)) * innerWidth
  }
  function toY(val: number) {
    return padding.top + innerHeight - ((val - minVal) / range) * innerHeight
  }

  const portfolioPath = snapshots
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(s.cumulative_return_pct ?? 0)}`)
    .join(' ')

  const spyPath = snapshots
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(s.spy_cumulative_return_pct ?? 0)}`)
    .join(' ')

  return (
    <div className="space-y-4">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat
          label="Total Return"
          value={`${cumulativeReturn >= 0 ? '+' : ''}${cumulativeReturn.toFixed(2)}%`}
          color={cumulativeReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}
        />
        <MiniStat
          label="Alpha vs SPY"
          value={`${alpha >= 0 ? '+' : ''}${alpha.toFixed(2)}%`}
          color={alpha >= 0 ? 'text-emerald-400' : 'text-red-400'}
        />
        <MiniStat
          label="Max Drawdown"
          value={`-${maxDrawdown.toFixed(2)}%`}
          color="text-red-400"
        />
        <MiniStat
          label="Days Since Inception"
          value={`${daysSinceInception}`}
          color="text-white"
        />
      </div>

      {/* Equity Curve */}
      <div className="bg-[#0d1220] border border-white/10 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white/60">Equity Curve</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-emerald-400 rounded" />
              <span className="text-[10px] text-white/40">Portfolio</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-white/30 rounded" />
              <span className="text-[10px] text-white/40">SPY</span>
            </div>
          </div>
        </div>

        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = padding.top + innerHeight * (1 - pct)
            const val = minVal + range * pct
            return (
              <g key={pct}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="rgba(255,255,255,0.2)"
                  fontSize="10"
                >
                  {val.toFixed(1)}%
                </text>
              </g>
            )
          })}

          {/* Zero line */}
          <line
            x1={padding.left}
            y1={toY(0)}
            x2={chartWidth - padding.right}
            y2={toY(0)}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
            strokeDasharray="4,4"
          />

          {/* SPY line */}
          <path d={spyPath} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />

          {/* Portfolio line */}
          <path d={portfolioPath} fill="none" stroke="#34d399" strokeWidth="2" />

          {/* Date labels */}
          {snapshots
            .filter((_, i) => i === 0 || i === snapshots.length - 1 || i === Math.floor(snapshots.length / 2))
            .map((s) => {
              const idx = snapshots.indexOf(s)
              return (
                <text
                  key={s.snapshot_date}
                  x={toX(idx)}
                  y={chartHeight - 10}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.2)"
                  fontSize="10"
                >
                  {new Date(s.snapshot_date + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </text>
              )
            })}
        </svg>
      </div>
    </div>
  )
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  return (
    <div className="bg-[#0d1220] border border-white/10 rounded-xl p-4">
      <div className="text-xs text-white/40 mb-1">{label}</div>
      <div className={`text-lg font-semibold ${color}`}>{value}</div>
    </div>
  )
}
