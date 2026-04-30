import type { Theme } from './Dashboard'

interface SignalRecapProps {
  snapshot: {
    snapshot_date: string
    spy_rsi: number | null
    rsi_signal: string | null
    polymarket_signals: any[] | null
    narrative_signals: any[] | null
    bullish_assets: any[] | null
  } | null
  theme: Theme
}

const THEMATIC_BUCKETS = [
  { name: 'Semiconductors', description: 'Equal-weight semis + power semis — the core of the physical upgrade', tickers: ['XSD', 'PSI'] },
  { name: 'AI Infrastructure', description: 'Grid buildout, optical fiber, silicon photonics — east-west traffic explosion', tickers: ['GRID', 'GLW', 'MRVL'] },
  { name: 'Commodities / Hard Assets', description: 'Gold, silver, copper — scarcity + inflation hedge on negative real yields', tickers: ['GLDM', 'SLV', 'COPX'] },
  { name: 'Bitcoin / Digital Scarcity', description: '100% of BTC cumulative returns from negative real yields + Fed on hold/easing', tickers: ['IBIT'] },
  { name: 'Energy', description: 'US natgas-advantaged chemicals, utility operators powering data centers', tickers: ['XLE', 'XLU'] },
]

export default function SignalRecap({ snapshot, theme: t }: SignalRecapProps) {
  if (!snapshot) {
    return <div style={{ textAlign: 'center', padding: '64px 0', color: t.textTertiary }}>No snapshot data yet.</div>
  }

  const narrativeSignals = snapshot.narrative_signals || []
  const crowdSignals = snapshot.polymarket_signals || []
  const rsi = snapshot.spy_rsi
  const rsiSignal = snapshot.rsi_signal
  const bullishAssets = snapshot.bullish_assets || []

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* LEFT: Narrative Themes */}
        <div style={{ background: t.cardPrimary, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20, transition: 'all 0.3s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6' }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: t.textSecondary }}>Narrative themes</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {THEMATIC_BUCKETS.map((bucket, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: t.surfaceSubtle, borderRadius: 8 }}>
                <div style={{ flex: 1, marginRight: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: t.textPrimary }}>{bucket.name}</div>
                  <div style={{ fontSize: 11, color: t.textTertiary, lineHeight: 1.4 }}>{bucket.description}</div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {bucket.tickers.map((ticker, j) => (
                    <span key={j} style={{ fontSize: 11, background: t.tickerBg, color: t.tickerText, padding: '2px 8px', borderRadius: 4, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>{ticker}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {narrativeSignals.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${t.border}` }}>
              <div style={{ fontSize: 11, color: t.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Latest pipeline signals</div>
              {narrativeSignals[0]?.video_title && (
                <a href={narrativeSignals[0].video_url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, color: '#8b5cf6', textDecoration: 'none', display: 'block', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {narrativeSignals[0].video_title}
                </a>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {narrativeSignals.map((s: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: t.surfaceSubtle, borderRadius: 6, fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontWeight: 500, color: t.textPrimary }}>{s.ticker}</span>
                      <span style={{ color: t.textTertiary }}>{s.asset}</span>
                    </div>
                    <span style={{ fontSize: 11, background: s.direction === 'bullish' ? 'rgba(52,211,153,0.15)' : s.direction === 'bearish' ? 'rgba(248,113,113,0.15)' : t.badgeBg, color: s.direction === 'bullish' ? t.positive : s.direction === 'bearish' ? t.negative : t.badgeText, padding: '1px 6px', borderRadius: 3 }}>{s.direction}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Crowd + Quant */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Crowd */}
          <div style={{ background: t.cardPrimary, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20, transition: 'all 0.3s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#eab308' }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: t.textSecondary }}>Crowd signals</span>
              <span style={{ fontSize: 11, color: t.textTertiary, marginLeft: 'auto' }}>{crowdSignals.length} markets</span>
            </div>
            {crowdSignals.length === 0 ? (
              <div style={{ fontSize: 13, color: t.textTertiary, padding: '16px 0' }}>No crowd signals today.</div>
            ) : (
              <div>
                {crowdSignals.slice(0, 6).map((s: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '8px 0', borderBottom: i < Math.min(crowdSignals.length, 6) - 1 ? `1px solid ${t.border}` : 'none' }}>
                    <span style={{ color: t.textSecondary, flex: 1, marginRight: 12, lineHeight: 1.3 }}>{s.market}</span>
                    <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: t.textPrimary, marginRight: 12, flexShrink: 0 }}>{(s.probability * 100).toFixed(0)}%</span>
                    <span style={{ fontSize: 11, background: t.badgeBg, color: t.badgeText, padding: '1px 6px', borderRadius: 3, flexShrink: 0 }}>{s.direction}</span>
                  </div>
                ))}
                {crowdSignals.length > 6 && <div style={{ fontSize: 11, color: t.textTertiary, paddingTop: 8 }}>+{crowdSignals.length - 6} more</div>}
              </div>
            )}
          </div>

          {/* Quant */}
          <div style={{ background: t.cardPrimary, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20, transition: 'all 0.3s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#06b6d4' }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: t.textSecondary }}>Quant signal</span>
            </div>
            {rsi === null ? (
              <div style={{ fontSize: 13, color: t.textTertiary, padding: '16px 0' }}>No RSI data today.</div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: t.textTertiary }}>SPY RSI (14)</span>
                  <span style={{ fontSize: 28, fontWeight: 500, fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: rsi > 70 ? t.negative : rsi < 25 ? t.positive : t.textPrimary }}>{rsi.toFixed(1)}</span>
                </div>
                <div style={{ position: 'relative', height: 6, background: t.surfaceSubtle, borderRadius: 3, marginBottom: 6 }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${rsi}%`, background: 'linear-gradient(90deg, #34d399, #eab308, #f87171)', borderRadius: 3 }} />
                  <div style={{ position: 'absolute', left: '25%', top: -2, width: 1, height: 10, background: t.border }} />
                  <div style={{ position: 'absolute', left: '70%', top: -2, width: 1, height: 10, background: t.border }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: t.textTertiary }}>
                  <span>0</span><span>Oversold &lt;25</span><span>Overbought &gt;70</span><span>100</span>
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: t.textSecondary }}>
                  {rsiSignal === 'oversold' ? 'Market oversold — potential bounce.' : rsiSignal === 'overbought' ? 'Market overbought — trimming risk, rotating to safety.' : 'Neutral — holding current positions.'}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bullish Assets */}
      {bullishAssets.length > 0 && (
        <div style={{ background: t.cardPrimary, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.positive }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: t.textSecondary }}>Bullish asset rankings</span>
            </div>
            <span style={{ fontSize: 11, color: t.textTertiary }}>{bullishAssets.length} tickers</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {bullishAssets.map((asset: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: t.surfaceSubtle, borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 11, color: t.textTertiary, fontFamily: 'ui-monospace, SFMono-Regular, monospace', width: 20 }}>#{i + 1}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: t.textPrimary }}>{asset.ticker}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, fontFamily: 'ui-monospace, SFMono-Regular, monospace', padding: '2px 8px', borderRadius: 4, background: asset.source_count >= 3 ? 'rgba(52,211,153,0.15)' : asset.source_count >= 2 ? 'rgba(234,179,8,0.15)' : t.badgeBg, color: asset.source_count >= 3 ? t.positive : asset.source_count >= 2 ? '#eab308' : t.textTertiary }}>{asset.convergence}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
