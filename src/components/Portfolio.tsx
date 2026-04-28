import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

interface PortfolioProps {
  snapshot: {
    snapshot_date: string
    portfolio: any[] | null
    portfolio_value: number | null
  } | null
}

interface Holding {
  ticker: string
  weight_pct: number
  price: number | null
  market_value: number | null
  daily_change_pct: number | null
  signal_sources: string[] | null
  category?: string
}

// Ticker colors for donut chart — distinctive per holding
const TICKER_COLORS: Record<string, string> = {
  IBIT: '#8b5cf6',   // violet
  XSD:  '#06b6d4',   // cyan
  XLE:  '#f97316',   // orange
  GLDM: '#eab308',   // yellow/gold
  XLV:  '#10b981',   // emerald
  SLV:  '#94a3b8',   // slate/silver
  COPX: '#ef4444',   // red
  PPA:  '#3b82f6',   // blue
  GRID: '#14b8a6',   // teal
  SGOV: '#6b7280',   // gray
}

const DEFAULT_COLOR = '#64748b'

export default function Portfolio({ snapshot }: PortfolioProps) {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHoldings() {
      if (!snapshot?.snapshot_date) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('portfolio_holdings')
        .select('*')
        .eq('snapshot_date', snapshot.snapshot_date)
        .order('weight_pct', { ascending: false })

      if (error) {
        console.error('Error fetching holdings:', error)
      }

      // Merge portfolio category info from snapshot
      const portfolioInfo = snapshot.portfolio || []
      const categoryMap: Record<string, string> = {}
      for (const p of portfolioInfo) {
        categoryMap[p.ticker] = p.category
      }

      const merged = (data || []).map((h: any) => ({
        ...h,
        category: categoryMap[h.ticker] || 'unknown',
      }))

      setHoldings(merged)
      setLoading(false)
    }

    fetchHoldings()
  }, [snapshot])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-white/30">
        Loading portfolio...
      </div>
    )
  }

  if (!snapshot || holdings.length === 0) {
    return (
      <div className="text-center py-16 text-white/30">
        No portfolio data yet. Holdings will appear after the first cron run.
      </div>
    )
  }

  const portfolioValue = snapshot.portfolio_value || 250000

  // Split by category
  const conservative = holdings.filter((h) => h.category === 'conservative' || h.category === 'safety')
  const aggressive = holdings.filter((h) => h.category === 'aggressive')

  const conservativeWeight = conservative.reduce((sum, h) => sum + h.weight_pct, 0)
  const aggressiveWeight = aggressive.reduce((sum, h) => sum + h.weight_pct, 0)

  return (
    <div className="space-y-6">
      {/* Top row: Donut + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Chart */}
        <div className="lg:col-span-1 bg-[#0d1220] border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center">
          <DonutChart holdings={holdings} portfolioValue={portfolioValue} />
        </div>

        {/* Allocation Summary */}
        <div className="lg:col-span-2 bg-[#0d1220] border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-white/80">Allocation Breakdown</span>
            <span className="text-xs text-white/30">{holdings.length} holdings</span>
          </div>

          {/* Conservative vs Aggressive bar */}
          <div className="mb-5">
            <div className="flex justify-between text-xs text-white/40 mb-1.5">
              <span>Conservative {conservativeWeight.toFixed(1)}%</span>
              <span>Aggressive {aggressiveWeight.toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden flex">
              <div
                className="h-full bg-emerald-500/60 rounded-l-full"
                style={{ width: `${conservativeWeight}%` }}
              />
              <div
                className="h-full bg-violet-500/60 rounded-r-full"
                style={{ width: `${aggressiveWeight}%` }}
              />
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {holdings.map((h) => (
              <div key={h.ticker} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: TICKER_COLORS[h.ticker] || DEFAULT_COLOR }}
                />
                <div>
                  <span className="text-xs font-mono font-semibold text-white/80">{h.ticker}</span>
                  <span className="text-[10px] text-white/30 ml-1">{h.weight_pct.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-[#0d1220] border border-white/10 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <span className="text-sm font-semibold text-white/80">Holdings</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-white/30 border-b border-white/5">
                <th className="text-left px-5 py-3 font-medium">Ticker</th>
                <th className="text-right px-5 py-3 font-medium">Weight</th>
                <th className="text-right px-5 py-3 font-medium">Price</th>
                <th className="text-right px-5 py-3 font-medium">Market Value</th>
                <th className="text-right px-5 py-3 font-medium">Daily Chg</th>
                <th className="text-left px-5 py-3 font-medium">Category</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h, i) => (
                <tr
                  key={h.ticker}
                  className={`border-b border-white/5 last:border-0 ${
                    i % 2 === 0 ? 'bg-white/[0.01]' : ''
                  }`}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-2 h-2 rounded-sm"
                        style={{ backgroundColor: TICKER_COLORS[h.ticker] || DEFAULT_COLOR }}
                      />
                      <span className="text-sm font-mono font-semibold text-white/90">
                        {h.ticker}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(h.weight_pct * 5, 100)}%`,
                            backgroundColor: TICKER_COLORS[h.ticker] || DEFAULT_COLOR,
                            opacity: 0.6,
                          }}
                        />
                      </div>
                      <span className="text-sm font-mono text-white/70 w-12 text-right">
                        {h.weight_pct.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-mono text-white/70">
                    {h.price ? `$${h.price.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-mono text-white/70">
                    {h.market_value
                      ? `$${h.market_value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                      : '—'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span
                      className={`text-sm font-mono ${
                        (h.daily_change_pct || 0) > 0
                          ? 'text-emerald-400'
                          : (h.daily_change_pct || 0) < 0
                            ? 'text-red-400'
                            : 'text-white/40'
                      }`}
                    >
                      {h.daily_change_pct !== null
                        ? `${h.daily_change_pct >= 0 ? '+' : ''}${h.daily_change_pct.toFixed(2)}%`
                        : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded ${
                        h.category === 'aggressive'
                          ? 'bg-violet-500/15 text-violet-400/80'
                          : h.category === 'safety'
                            ? 'bg-gray-500/15 text-gray-400/80'
                            : 'bg-emerald-500/15 text-emerald-400/80'
                      }`}
                    >
                      {h.category}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Total row */}
            <tfoot>
              <tr className="border-t border-white/10 bg-white/[0.02]">
                <td className="px-5 py-3 text-sm font-semibold text-white/70">Total</td>
                <td className="px-5 py-3 text-right text-sm font-mono font-semibold text-white/70">
                  100%
                </td>
                <td className="px-5 py-3" />
                <td className="px-5 py-3 text-right text-sm font-mono font-semibold text-white/70">
                  ${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </td>
                <td className="px-5 py-3" />
                <td className="px-5 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SVG DONUT CHART (no external dependencies)
// ============================================================================

function DonutChart({ holdings, portfolioValue }: { holdings: Holding[]; portfolioValue: number }) {
  const size = 200
  const strokeWidth = 32
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  let cumulativePercent = 0
  const segments = holdings.map((h) => {
    const percent = h.weight_pct / 100
    const offset = circumference * (1 - cumulativePercent)
    const length = circumference * percent
    cumulativePercent += percent

    return {
      ticker: h.ticker,
      percent,
      offset,
      length,
      color: TICKER_COLORS[h.ticker] || DEFAULT_COLOR,
    }
  })

  return (
    <div className="relative">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />

        {/* Segments — drawn in reverse so first segment is on top */}
        {segments
          .slice()
          .reverse()
          .map((seg, i) => (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${seg.length} ${circumference - seg.length}`}
              strokeDashoffset={seg.offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${center} ${center})`}
              style={{ opacity: 0.8 }}
            />
          ))}
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-white/30">Portfolio</span>
        <span className="text-lg font-semibold text-white/90 font-mono">
          ${(portfolioValue / 1000).toFixed(1)}K
        </span>
      </div>
    </div>
  )
}
