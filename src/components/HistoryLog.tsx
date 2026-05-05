import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import type { Theme } from './Dashboard'

interface HistoryLogProps {
  theme: Theme
}

interface HistorySnapshot {
  snapshot_date: string
  spy_rsi: number | null
  rsi_signal: string | null
  polymarket_signals: any[] | null
  narrative_signals: any[] | null
  bullish_assets: any[] | null
  portfolio_value: number | null
  daily_return_pct: number | null
  cumulative_return_pct: number | null
}

export default function HistoryLog({ theme: t }: HistoryLogProps) {
  const [snapshots, setSnapshots] = useState<HistorySnapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDate, setExpandedDate] = useState<string | null>(null)

  useEffect(() => {
    async function fetchHistory() {
      const { data, error } = await supabase
        .from('daily_snapshots')
        .select('snapshot_date, spy_rsi, rsi_signal, polymarket_signals, narrative_signals, bullish_assets, portfolio_value, daily_return_pct, cumulative_return_pct')
        .order('snapshot_date', { ascending: false })
        .limit(60)
      if (error) console.error('Error fetching history:', error)
      setSnapshots(data || [])
      setLoading(false)
    }
    fetchHistory()
  }, [])

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256, color: t.textTertiary }}>Loading history...</div>
  if (snapshots.length === 0) return <div style={{ textAlign: 'center', padding: '64px 0', color: t.textTertiary }}>No history yet.</div>

  return (
    <div style={{ background: t.cardPrimary, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: t.textSecondary }}>Daily snapshots</span>
        <span style={{ fontSize: 11, color: t.textTertiary }}>{snapshots.length} days</span>
      </div>

      <div style={{ maxHeight: 600, overflowY: 'auto' }}>
        {snapshots.map((s) => {
          const expanded = expandedDate === s.snapshot_date
          const daily = s.daily_return_pct ?? 0
          const cum = s.cumulative_return_pct ?? 0
          const narrativeCount = s.narrative_signals?.length ?? 0
          const crowdCount = s.polymarket_signals?.length ?? 0
          const rsi = s.spy_rsi
          const totalSignals = narrativeCount + crowdCount + (rsi !== null ? 1 : 0)

          return (
            <div key={s.snapshot_date}>
              {/* Row header */}
              <button
                onClick={() => setExpandedDate(expanded ? null : s.snapshot_date)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 20px', background: 'none', border: 'none', borderBottom: `1px solid ${t.border}`,
                  cursor: 'pointer', transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = t.surfaceSubtle)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 13, fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: t.textPrimary, minWidth: 80 }}>
                    {new Date(s.snapshot_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span style={{ fontSize: 12, fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: daily >= 0 ? t.positive : t.negative, minWidth: 60, textAlign: 'right' }}>
                    {daily >= 0 ? '+' : ''}{daily.toFixed(2)}%
                  </span>
                  <span style={{ fontSize: 11, color: t.textTertiary }}>
                    {totalSignals} signals
                  </span>
                  {rsi !== null && (
                    <span style={{ fontSize: 11, fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: rsi > 70 ? t.negative : rsi < 25 ? t.positive : t.textTertiary }}>
                      RSI {rsi.toFixed(1)}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 12, color: t.textTertiary }}>{expanded ? '▲' : '▼'}</span>
              </button>

              {/* Expanded detail */}
              {expanded && (
                <div style={{ padding: '16px 20px', background: t.surfaceSubtle, borderBottom: `1px solid ${t.border}` }}>
                  <div className="ap-history-detail">
                    {/* Narrative Signals */}
                    <div>
                      <div style={{ fontSize: 11, color: t.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#a78bfa' }} />
                        Narrative ({narrativeCount})
                      </div>
                      {narrativeCount === 0 ? (
                        <div style={{ fontSize: 12, color: t.textTertiary }}>No signals</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {s.narrative_signals!.map((sig: any, i: number) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontWeight: 500, color: t.textPrimary }}>{sig.ticker}</span>
                                <span style={{ color: t.textTertiary, fontSize: 11 }}>{sig.asset}</span>
                              </div>
                              <span style={{ fontSize: 10, background: sig.direction === 'bullish' ? 'rgba(52,211,153,0.15)' : sig.direction === 'bearish' ? 'rgba(248,113,113,0.15)' : t.badgeBg, color: sig.direction === 'bullish' ? t.positive : sig.direction === 'bearish' ? t.negative : t.badgeText, padding: '1px 6px', borderRadius: 3 }}>{sig.direction}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Crowd Signals */}
                    <div>
                      <div style={{ fontSize: 11, color: t.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#eab308' }} />
                        Crowd ({crowdCount})
                      </div>
                      {crowdCount === 0 ? (
                        <div style={{ fontSize: 12, color: t.textTertiary }}>No signals</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {s.polymarket_signals!.slice(0, 5).map((sig: any, i: number) => (
                            <div key={i} style={{ fontSize: 11, color: t.textSecondary, lineHeight: 1.3 }}>
                              <span>{sig.market}</span>
                              <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: t.textPrimary, marginLeft: 6 }}>{(sig.probability * 100).toFixed(0)}%</span>
                            </div>
                          ))}
                          {crowdCount > 5 && <div style={{ fontSize: 10, color: t.textTertiary }}>+{crowdCount - 5} more</div>}
                        </div>
                      )}
                    </div>

                    {/* Quant + Summary */}
                    <div>
                      <div style={{ fontSize: 11, color: t.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#06b6d4' }} />
                        Quant
                      </div>
                      {rsi !== null ? (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                            <span style={{ fontSize: 11, color: t.textTertiary }}>SPY RSI</span>
                            <span style={{ fontSize: 18, fontWeight: 500, fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: rsi > 70 ? t.negative : rsi < 25 ? t.positive : t.textPrimary }}>{rsi.toFixed(1)}</span>
                          </div>
                          <span style={{ fontSize: 10, background: t.badgeBg, color: t.badgeText, padding: '1px 6px', borderRadius: 3 }}>{s.rsi_signal}</span>
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: t.textTertiary }}>No RSI data</div>
                      )}

                      {/* Bullish assets */}
                      {(s.bullish_assets?.length ?? 0) > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontSize: 11, color: t.textTertiary, marginBottom: 4 }}>Bullish convergence</div>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {s.bullish_assets!.map((a: any, i: number) => (
                              <span key={i} style={{ fontSize: 10, fontFamily: 'ui-monospace, SFMono-Regular, monospace', background: t.tickerBg, color: t.tickerText, padding: '2px 6px', borderRadius: 3 }}>
                                {a.ticker} {a.convergence}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Day summary */}
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 11, color: t.textTertiary, marginBottom: 4 }}>Day summary</div>
                        <div style={{ fontSize: 12, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
                          <span style={{ color: t.textTertiary }}>Daily: </span>
                          <span style={{ color: daily >= 0 ? t.positive : t.negative }}>{daily >= 0 ? '+' : ''}{daily.toFixed(2)}%</span>
                        </div>
                        <div style={{ fontSize: 12, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
                          <span style={{ color: t.textTertiary }}>Cumul: </span>
                          <span style={{ color: cum >= 0 ? t.positive : t.negative }}>{cum >= 0 ? '+' : ''}{cum.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
