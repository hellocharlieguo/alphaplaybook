import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../supabase'
import type { Theme } from './Dashboard'

// Frosted-glass surface — matches Signals tab (obsidian recipe).
const glass: CSSProperties = {
  background: 'rgba(30,29,27,0.38)',
  backdropFilter: 'blur(32px) saturate(132%)',
  WebkitBackdropFilter: 'blur(32px) saturate(132%)',
  border: '1px solid rgba(255,255,255,0.11)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
}

interface PnLTrackerProps {
  theme: Theme
}

interface Snapshot {
  snapshot_date: string
  portfolio_value: number | null
  spy_value: number | null
  spy_rsi: number | null
  daily_return_pct: number | null
  cumulative_return_pct: number | null
  spy_cumulative_return_pct: number | null
  momentum_value: number | null
  momentum_cumulative_return_pct: number | null
  momentum_daily_return_pct: number | null
}

const PORTFOLIO_BASE = 100000

export default function PnLTracker({ theme: t }: PnLTrackerProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSnapshots() {
      const { data, error } = await supabase
        .from('daily_snapshots')
        .select('snapshot_date, portfolio_value, spy_value, spy_rsi, daily_return_pct, cumulative_return_pct, spy_cumulative_return_pct, momentum_value, momentum_cumulative_return_pct, momentum_daily_return_pct')
        .not('portfolio_value', 'is', null)
        .order('snapshot_date', { ascending: true })
      if (error) console.error('Error fetching snapshots:', error)
      setSnapshots(data || [])
      setLoading(false)
    }
    fetchSnapshots()
  }, [])

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256, color: t.textTertiary }}>Loading performance data...</div>
  if (snapshots.length === 0) return <div style={{ textAlign: 'center', padding: '64px 0', color: t.textTertiary }}>No performance data yet. Data will appear after the cron runs.</div>

  const latest = snapshots[snapshots.length - 1]
  const cumulativeReturn = latest.cumulative_return_pct ?? 0
  const spyCumulativeReturn = latest.spy_cumulative_return_pct ?? 0
  const alpha = cumulativeReturn - spyCumulativeReturn
  // Prefer the stored portfolio_value (exact, compounded off unrounded daily returns);
  // fall back to the computed value only if the field is null (older rows).
  const currentValue = latest.portfolio_value ?? PORTFOLIO_BASE * (1 + cumulativeReturn / 100)
  const daysSinceInception = snapshots.length

  // Calculate max drawdown
  let peak = -Infinity
  let maxDrawdown = 0
  for (const s of snapshots) {
    const val = s.cumulative_return_pct ?? 0
    if (val > peak) peak = val
    const dd = peak - val
    if (dd > maxDrawdown) maxDrawdown = dd
  }

  // Best and worst days
  const dailyReturns = snapshots.filter(s => s.daily_return_pct !== null).map(s => ({ date: s.snapshot_date, ret: s.daily_return_pct! }))
  const bestDay = dailyReturns.length > 0 ? dailyReturns.reduce((best, d) => d.ret > best.ret ? d : best) : null
  const worstDay = dailyReturns.length > 0 ? dailyReturns.reduce((worst, d) => d.ret < worst.ret ? d : worst) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stat Cards */}
      <div className="ap-pnl-stats">
        <PnLStatCard label="Thematic Value" value={`$${currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} color={t.textPrimary} t={t} />
        <PnLStatCard label="Thematic Return" value={`${cumulativeReturn >= 0 ? '+' : ''}${cumulativeReturn.toFixed(2)}%`} color={cumulativeReturn >= 0 ? t.positive : t.negative} t={t} />
        <PnLStatCard label="Thematic Alpha" value={`${alpha >= 0 ? '+' : ''}${alpha.toFixed(2)}%`} color={alpha >= 0 ? t.positive : t.negative} t={t} />
        <PnLStatCard label="Max Drawdown" value={`-${maxDrawdown.toFixed(2)}%`} color={t.negative} t={t} />
        <PnLStatCard label="Days Tracked" value={String(daysSinceInception)} color={t.textPrimary} t={t} />
      </div>

      {/* Equity Curve Chart */}
      <div style={{ ...glass, borderRadius: 12, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: t.textSecondary }}>Equity curve — Thematic vs SPY</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 3, borderRadius: 2, background: t.accent }} />
              <span style={{ fontSize: 11, color: t.textTertiary }}>Thematic</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 3, borderRadius: 2, background: t.textTertiary, opacity: 0.5 }} />
              <span style={{ fontSize: 11, color: t.textTertiary }}>SPY</span>
            </div>
          </div>
        </div>

        <EquityCurve snapshots={snapshots} t={t} />
      </div>

      {/* Daily Returns Table */}
      <div style={{ ...glass, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${t.border}` }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: t.textSecondary }}>Daily returns</span>
        </div>
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.border}`, position: 'sticky', top: 0, background: t.cardPrimary }}>
                <th style={{ textAlign: 'left', padding: '8px 20px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>Date</th>
                <th style={{ textAlign: 'right', padding: '8px 20px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>Thematic Daily</th>
                <th style={{ textAlign: 'right', padding: '8px 20px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>Thematic Cumul.</th>
                <th style={{ textAlign: 'right', padding: '8px 20px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>SPY Cumul.</th>
                <th style={{ textAlign: 'right', padding: '8px 20px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>Alpha</th>
                <th style={{ textAlign: 'right', padding: '8px 20px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>RSI</th>
              </tr>
            </thead>
            <tbody>
              {[...snapshots].reverse().map((s, i) => {
                const daily = s.daily_return_pct ?? 0
                const cum = s.cumulative_return_pct ?? 0
                const spyCum = s.spy_cumulative_return_pct ?? 0
                const a = cum - spyCum
                const rsi = s.spy_rsi
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${t.border}` }}>
                    <td style={{ padding: '8px 20px', fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: t.textSecondary }}>
                      {new Date(s.snapshot_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td style={{ padding: '8px 20px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: daily >= 0 ? t.positive : t.negative }}>
                      {daily >= 0 ? '+' : ''}{daily.toFixed(2)}%
                    </td>
                    <td style={{ padding: '8px 20px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: cum >= 0 ? t.positive : t.negative }}>
                      {cum >= 0 ? '+' : ''}{cum.toFixed(2)}%
                    </td>
                    <td style={{ padding: '8px 20px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: spyCum >= 0 ? t.positive : t.negative }}>
                      {spyCum >= 0 ? '+' : ''}{spyCum.toFixed(2)}%
                    </td>
                    <td style={{ padding: '8px 20px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontWeight: 500, color: a >= 0 ? t.positive : t.negative }}>
                      {a >= 0 ? '+' : ''}{a.toFixed(2)}%
                    </td>
                    <td style={{ padding: '8px 20px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: rsi === null ? t.textTertiary : rsi > 70 ? t.negative : rsi < 25 ? t.positive : t.textSecondary }}>
                      {rsi === null ? '—' : rsi.toFixed(1)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Best/Worst Days */}
      {bestDay && worstDay && (
        <div className="ap-bestworst">
          <div style={{ ...glass, borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 11, color: t.textTertiary, marginBottom: 4 }}>Best day</div>
            <div style={{ fontSize: 18, fontWeight: 500, color: t.positive, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>+{bestDay.ret.toFixed(2)}%</div>
            <div style={{ fontSize: 11, color: t.textTertiary, marginTop: 2 }}>{new Date(bestDay.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
          </div>
          <div style={{ ...glass, borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 11, color: t.textTertiary, marginBottom: 4 }}>Worst day</div>
            <div style={{ fontSize: 18, fontWeight: 500, color: t.negative, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>{worstDay.ret.toFixed(2)}%</div>
            <div style={{ fontSize: 11, color: t.textTertiary, marginTop: 2 }}>{new Date(worstDay.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
          </div>
        </div>
      )}
    </div>
  )
}

function PnLStatCard({ label, value, color, t }: { label: string; value: string; color: string; t: Theme }) {
  return (
    <div style={{ ...glass, borderRadius: 10, padding: 16 }}>
      <div style={{ fontSize: 11, color: t.textTertiary, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 500, color, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>{value}</div>
    </div>
  )
}

// SVG Equity Curve — no dependencies
function EquityCurve({ snapshots, t }: { snapshots: Snapshot[]; t: Theme }) {
  if (snapshots.length < 2) return <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textTertiary, fontSize: 13 }}>Need at least 2 days of data for chart</div>

  const width = 800
  const height = 250
  const padX = 50
  const padY = 30
  const chartW = width - padX * 2
  const chartH = height - padY * 2

  const portfolioReturns = snapshots.map(s => s.cumulative_return_pct ?? 0)
  const spyReturns = snapshots.map(s => s.spy_cumulative_return_pct ?? 0)

  const allVals = [...portfolioReturns, ...spyReturns]
  const minVal = Math.min(...allVals, 0)
  const maxVal = Math.max(...allVals, 0)
  const range = maxVal - minVal || 1

  const toX = (i: number) => padX + (i / (snapshots.length - 1)) * chartW
  const toY = (val: number) => padY + chartH - ((val - minVal) / range) * chartH

  const portfolioPath = snapshots.map((_, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(portfolioReturns[i]).toFixed(1)}`).join(' ')
  const spyPath = snapshots.map((_, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(spyReturns[i]).toFixed(1)}`).join(' ')

  // Zero line
  const zeroY = toY(0)

  // Y-axis labels
  const ySteps = 5
  const yLabels: { val: number; y: number }[] = []
  for (let i = 0; i <= ySteps; i++) {
    const val = minVal + (range * i) / ySteps
    yLabels.push({ val, y: toY(val) })
  }

  // X-axis labels (show first, last, and a few in between)
  const xLabelIndices = [0, Math.floor(snapshots.length / 3), Math.floor(snapshots.length * 2 / 3), snapshots.length - 1].filter((v, i, a) => a.indexOf(v) === i)

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      {/* Grid lines */}
      {yLabels.map((yl, i) => (
        <g key={i}>
          <line x1={padX} y1={yl.y} x2={width - padX} y2={yl.y} stroke={t.border} strokeWidth={0.5} />
          <text x={padX - 8} y={yl.y + 3} textAnchor="end" fill={t.textTertiary} fontSize={10} fontFamily="ui-monospace, SFMono-Regular, monospace">
            {yl.val.toFixed(1)}%
          </text>
        </g>
      ))}

      {/* Zero line */}
      <line x1={padX} y1={zeroY} x2={width - padX} y2={zeroY} stroke={t.textTertiary} strokeWidth={0.5} strokeDasharray="4,4" />

      {/* X-axis labels */}
      {xLabelIndices.map(idx => (
        <text key={idx} x={toX(idx)} y={height - 5} textAnchor="middle" fill={t.textTertiary} fontSize={10} fontFamily="ui-monospace, SFMono-Regular, monospace">
          {new Date(snapshots[idx].snapshot_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </text>
      ))}

      {/* SPY line */}
      <path d={spyPath} fill="none" stroke={t.textTertiary} strokeWidth={1.5} strokeOpacity={0.4} />

      {/* Portfolio line */}
      <path d={portfolioPath} fill="none" stroke={t.accent} strokeWidth={2.5} />

      {/* Portfolio endpoint dot */}
      <circle cx={toX(snapshots.length - 1)} cy={toY(portfolioReturns[portfolioReturns.length - 1])} r={4} fill={t.accent} />

      {/* SPY endpoint dot */}
      <circle cx={toX(snapshots.length - 1)} cy={toY(spyReturns[spyReturns.length - 1])} r={3} fill={t.textTertiary} fillOpacity={0.5} />
    </svg>
  )
}
