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
  { name: 'Chemicals', description: 'Specialty chems for semi packaging, tubing, US natgas-advantaged producers', tickers: ['XLE'] },
  { name: 'Whole rack', description: 'Servers, memory, CPUs, on-prem AI infrastructure', tickers: ['XSD'] },
  { name: 'Optical fiber', description: 'Networking, silicon photonics, east-west traffic', tickers: ['XSD', 'GRID'] },
  { name: 'Advanced packaging', description: 'Power semis, memory, CPUs', tickers: ['XSD'] },
  { name: 'Power', description: 'Grid, transformers, gas turbines, power semis', tickers: ['GRID', 'XLE'] },
]

export default function SignalRecap({ snapshot, theme: t }: SignalRecapProps) {
  if (!snapshot) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0', color: t.textTertiary }}>
        No snapshot data yet. Signals will appear after the first cron run.
      </div>
    )
  }

  const narrativeSignals = snapshot.narrative_signals || []
  const crowdSignals = snapshot.polymarket_signals || []
  const rsi = snapshot.spy_rsi
  const rsiSignal = snapshot.rsi_signal
  const bullishAssets = snapshot.bullish_assets || []

  return (
    <div>
      {/* Two-column layout: Narrative left, Crowd + Quant right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

        {/* LEFT: Narrative Themes — uses accent card (white in dark mode) */}
        <div style={{
          background: t.cardAccent, border: `1px solid ${t.borderAccent}`,
          borderRadius: 12, padding: '20px', transition: 'all 0.3s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6' }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: t.textOnAccentSub }}>Narrative themes</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {THEMATIC_BUCKETS.map((bucket, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 12px', background: t.accentInnerBg, borderRadius: 8,
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: t.accentInnerText }}>{bucket.name}</div>
                  <div style={{ fontSize: 11, color: t.accentInnerSub }}>{bucket.description}</div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 12 }}>
                  {bucket.tickers.map((ticker, j) => (
                    <span key={j} style={{
                      fontSize: 11, background: t.tickerBg, color: t.tickerText,
                      padding: '2px 8px', borderRadius: 4, fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    }}>
                      {ticker}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Pipeline signals below themes */}
          {narrativeSignals.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${t.borderAccent || '#e2e8f0'}` }}>
              <div style={{ fontSize: 11, color: t.accentInnerSub, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                Latest pipeline signals
              </div>
              {narrativeSignals[0]?.video_title && (
                <a
                  href={narrativeSignals[0].video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, color: '#8b5cf6', textDecoration: 'none', display: 'block', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {narrativeSignals[0].video_title}
                </a>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {narrativeSignals.map((s: any, i: number) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '6px 8px', background: t.accentInnerBg, borderRadius: 6, fontSize: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontWeight: 500, color: t.accentInnerText }}>{s.ticker}</span>
                      <span style={{ color: t.accentInnerSub }}>{s.asset}</span>
                    </div>
                    <DirectionBadge direction={s.direction} t={t} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Crowd + Quant stacked */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Crowd Signals */}
          <div style={{
            background: t.cardPrimary, border: `1px solid ${t.border}`,
            borderRadius: 12, padding: '20px', transition: 'all 0.3s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#eab308' }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: t.textSecondary }}>Crowd signals</span>
              <span style={{ fontSize: 11, color: t.textTertiary, marginLeft: 'auto' }}>{crowdSignals.length} markets</span>
            </div>

            {crowdSignals.length === 0 ? (
              <div style={{ fontSize: 13, color: t.textTertiary, padding: '16px 0' }}>No crowd signals today.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {crowdSignals.slice(0, 6).map((s: any, i: number) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: 12, padding: '8px 0',
                    borderBottom: i < Math.min(crowdSignals.length, 6) - 1 ? `1px solid ${t.crowdRowBorder}` : 'none',
                  }}>
                    <span style={{ color: t.textSecondary, flex: 1, marginRight: 12, lineHeight: 1.3 }}>{s.market}</span>
                    <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: t.textPrimary, marginRight: 12, flexShrink: 0 }}>
                      {(s.probability * 100).toFixed(0)}%
                    </span>
                    <DirectionBadge direction={s.direction} t={t} />
                  </div>
                ))}
                {crowdSignals.length > 6 && (
                  <div style={{ fontSize: 11, color: t.textTertiary, paddingTop: 8 }}>
                    +{crowdSignals.length - 6} more markets
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quant Signal */}
          <div style={{
            background: t.cardPrimary, border: `1px solid ${t.border}`,
            borderRadius: 12, padding: '20px', transition: 'all 0.3s',
          }}>
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
                  <span style={{
                    fontSize: 28, fontWeight: 500, fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    color: rsi > 70 ? t.negative : rsi < 25 ? t.positive : t.textPrimary,
                  }}>
                    {rsi.toFixed(1)}
                  </span>
                </div>

                {/* RSI Bar */}
                <div style={{ position: 'relative', height: 6, background: t.surfaceSubtle === 'rgba(255,255,255,0.03)' ? 'rgba(255,255,255,0.06)' : '#f1f5f9', borderRadius: 3, marginBottom: 6 }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, height: '100%',
                    width: `${rsi}%`, background: 'linear-gradient(90deg, #34d399, #eab308, #f87171)',
                    borderRadius: 3,
                  }} />
                  <div style={{ position: 'absolute', left: '25%', top: -2, width: 1, height: 10, background: t.border }} />
                  <div style={{ position: 'absolute', left: '70%', top: -2, width: 1, height: 10, background: t.border }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: t.textTertiary }}>
                  <span>0</span><span>Oversold &lt;25</span><span>Overbought &gt;70</span><span>100</span>
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: t.textSecondary }}>
                  {rsiSignal === 'oversold'
                    ? 'Market oversold — potential bounce. Favoring SPY, QQQ, XSD.'
                    : rsiSignal === 'overbought'
                      ? 'Market overbought — trimming risk, rotating to safety.'
                      : 'Neutral — holding current positions.'}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bullish Assets */}
      {bullishAssets.length > 0 && (
        <div style={{
          background: t.cardPrimary, border: `1px solid ${t.border}`,
          borderRadius: 12, padding: '20px', transition: 'all 0.3s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.positive }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: t.textSecondary }}>Bullish asset rankings</span>
            </div>
            <span style={{ fontSize: 11, color: t.textTertiary }}>{bullishAssets.length} tickers</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {bullishAssets.map((asset: any, i: number) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', background: t.surfaceSubtle === 'rgba(255,255,255,0.03)' ? 'rgba(255,255,255,0.03)' : '#f8f9fb',
                borderRadius: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 11, color: t.textTertiary, fontFamily: 'ui-monospace, SFMono-Regular, monospace', width: 20 }}>#{i + 1}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: t.textPrimary }}>{asset.ticker}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(asset.sources || []).map((src: string, j: number) => {
                      const srcColors: Record<string, { bg: string; text: string }> = {
                        narrative: { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa' },
                        crowd: { bg: 'rgba(234,179,8,0.15)', text: '#eab308' },
                        quant: { bg: 'rgba(6,182,212,0.15)', text: '#06b6d4' },
                      }
                      const c = srcColors[src] || srcColors.narrative
                      return (
                        <span key={j} style={{ fontSize: 10, background: c.bg, color: c.text, padding: '1px 6px', borderRadius: 3 }}>
                          {src}
                        </span>
                      )
                    })}
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 500, fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    padding: '2px 8px', borderRadius: 4,
                    background: asset.source_count >= 3 ? 'rgba(52,211,153,0.15)' : asset.source_count >= 2 ? 'rgba(234,179,8,0.15)' : t.badgeBg,
                    color: asset.source_count >= 3 ? t.positive : asset.source_count >= 2 ? '#eab308' : t.textTertiary,
                  }}>
                    {asset.convergence}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DirectionBadge({ direction, t }: { direction: string; t: Theme }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    bullish: { bg: 'rgba(52,211,153,0.15)', text: t.positive, label: 'bullish' },
    bearish: { bg: 'rgba(248,113,113,0.15)', text: t.negative, label: 'bearish' },
    neutral: { bg: t.badgeBg, text: t.badgeText, label: 'neutral' },
  }
  const c = config[direction] || config.neutral
  return (
    <span style={{ fontSize: 11, background: c.bg, color: c.text, padding: '1px 6px', borderRadius: 3, flexShrink: 0 }}>
      {c.label}
    </span>
  )
}
