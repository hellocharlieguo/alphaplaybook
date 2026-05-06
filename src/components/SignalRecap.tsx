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
  activeVoices: Set<string>
}

interface VoiceSection {
  name: string
  headline: string
  subtitle: string
  themes: {
    name: string
    editorial: string
    tickers: string[]
  }[]
}

const VOICES: VoiceSection[] = [
  {
    name: 'Visser',
    headline: 'LONG SCARCITY, SHORT ABUNDANCE',
    subtitle: 'Jordi Visser — Macro framework for the physical AI upgrade',
    themes: [
      {
        name: 'Semiconductors',
        editorial: 'The semiconductor industry now represents 17% of the S&P 500 and growing. Visser sees the physical upgrade cycle as early innings — equal-weight exposure captures the breadth of the semi move beyond just the mega-caps, while power semis are "going through the roof" as every data center, EV, and grid node demands more silicon.',
        tickers: ['XSD'],
      },
      {
        name: 'AI Infrastructure',
        editorial: 'East-west data center traffic is exploding, driving demand for optical fiber, silicon photonics, and grid infrastructure. Corning is the dominant fiber play, repeatedly named as a core holding. The grid buildout required to power AI is a multi-year capex cycle that most investors are underestimating.',
        tickers: ['GRID', 'GLW'],
      },
      {
        name: 'Commodities & Hard Assets',
        editorial: 'Negative real yields and ongoing monetary debasement make hard assets a structural long. Gold, silver, and copper all benefit from the scarcity thesis — these are finite resources in a world printing infinite currency. Copper in particular is the metal of electrification.',
        tickers: ['GLDM', 'SLV', 'COPX'],
      },
      {
        name: 'Bitcoin & Digital Scarcity',
        editorial: 'Over 100% of Bitcoin\'s cumulative returns since 2010 have come from one quadrant: negative real yields combined with the Fed on hold or easing. When real rates are negative and the Fed is accommodative, BTC outperforms everything. The current macro setup is pointing directly at this quadrant.',
        tickers: ['IBIT'],
      },
      {
        name: 'Energy & Power',
        editorial: 'The US has a structural advantage in natural gas, making domestic chemical and energy producers attractive. Meanwhile, data center power demand is creating a supply crisis for utilities — the grid simply cannot keep up with AI\'s appetite for electricity.',
        tickers: ['XLE', 'XLU'],
      },
    ],
  },
  {
    name: 'Camillo',
    headline: 'BET ON WHAT PEOPLE DO, NOT WHAT MARKETS THINK',
    subtitle: 'Chris Camillo — Social arbitrage and the companies AI will make dominant',
    themes: [
      {
        name: 'AI Platform Winners',
        editorial: 'Amazon is Camillo\'s biggest trade of his career. His thesis: Amazon sits at the intersection of AI automation, robotics, and logistics — the company most positioned to turn AI efficiency into real-world margin expansion at unprecedented scale. Robinhood captures the retail fintech revolution and crypto accessibility for the next generation of investors.',
        tickers: ['AMZN', 'HOOD'],
      },
      {
        name: 'Data Center Energy',
        editorial: 'Bloom Energy\'s 800-volt DC power platform solves a critical bottleneck that traditional utilities cannot. Data centers need clean, reliable, on-site power faster than the grid can deliver it. Camillo sees BE as the pick-and-shovel play on AI infrastructure demand — the company that powers the companies that power AI.',
        tickers: ['BE'],
      },
    ],
  },
]

export default function SignalRecap({ snapshot, theme: t, activeVoices }: SignalRecapProps) {
  if (!snapshot) {
    return <div style={{ textAlign: 'center', padding: '64px 0', color: t.textTertiary, fontFamily: "'Libre Baskerville', Georgia, serif", fontStyle: 'italic' }}>Awaiting first signal...</div>
  }

  const crowdSignals = snapshot.polymarket_signals || []
  const rsi = snapshot.spy_rsi
  const rsiSignal = snapshot.rsi_signal
  const bullishAssets = snapshot.bullish_assets || []
  const visibleVoices = VOICES.filter(v => activeVoices.has(v.name))

  return (
    <div>
      {/* Voice Sections — newspaper columns */}
      {visibleVoices.length > 0 && (
        <div className={visibleVoices.length > 1 ? 'ap-voices-grid' : ''} style={{ marginBottom: 24 }}>
          {visibleVoices.map((voice) => (
            <div key={voice.name} style={{ background: t.cardPrimary, border: `1px solid ${t.border}`, borderRadius: 10, padding: '24px 28px', transition: 'all 0.3s' }}>
              {/* Voice headline — newspaper style */}
              <div style={{ borderBottom: `2px solid ${t.ruleLine}`, paddingBottom: 16, marginBottom: 20 }}>
                <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 900, margin: 0, lineHeight: 1.15, color: t.textPrimary, letterSpacing: 0.5 }}>
                  {voice.headline}
                </h2>
                <p style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 13, color: t.textSecondary, margin: '8px 0 0', fontStyle: 'italic' }}>
                  {voice.subtitle}
                </p>
              </div>

              {/* Theme sections — editorial style */}
              {voice.themes.map((theme, i) => (
                <div key={i} style={{ marginBottom: i < voice.themes.length - 1 ? 20 : 0 }}>
                  {/* Theme name as section header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 700, margin: 0, color: t.textPrimary }}>
                      {theme.name}
                    </h3>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {theme.tickers.map((ticker, j) => (
                        <span key={j} style={{ fontSize: 11, background: t.tickerBg, color: t.tickerText, padding: '2px 8px', borderRadius: 3, fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontWeight: 500 }}>
                          {ticker}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Editorial paragraph */}
                  <p style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 13, lineHeight: 1.7, color: t.textSecondary, margin: 0, textAlign: 'justify' }}>
                    {theme.editorial}
                  </p>

                  {/* Separator between themes */}
                  {i < voice.themes.length - 1 && (
                    <div style={{ borderBottom: `1px solid ${t.border}`, marginTop: 16 }} />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {visibleVoices.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: t.textTertiary, fontFamily: "'Libre Baskerville', Georgia, serif", fontStyle: 'italic', marginBottom: 24 }}>
          Select a voice above to see their investment thesis.
        </div>
      )}

      {/* Crowd + Quant — two column below the voice sections */}
      <div className="ap-signals-grid">
        {/* Crowd Signals */}
        <div style={{ background: t.cardPrimary, border: `1px solid ${t.border}`, borderRadius: 10, padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#c9a96e' }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: t.textSecondary, fontFamily: "'Playfair Display', Georgia, serif" }}>Crowd Signals</span>
            </div>
            <span style={{ fontSize: 11, color: t.textTertiary }}>{crowdSignals.length} markets</span>
          </div>
          {crowdSignals.length === 0 ? (
            <div style={{ fontSize: 13, color: t.textTertiary, padding: '16px 0', fontFamily: "'Libre Baskerville', Georgia, serif", fontStyle: 'italic' }}>No crowd signals today.</div>
          ) : (
            <div>
              {crowdSignals.slice(0, 6).map((s: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '8px 0', borderBottom: i < Math.min(crowdSignals.length, 6) - 1 ? `1px solid ${t.border}` : 'none' }}>
                  <span style={{ color: t.textSecondary, flex: 1, marginRight: 12, lineHeight: 1.3, fontFamily: "'Libre Baskerville', Georgia, serif" }}>{s.market}</span>
                  <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: t.textPrimary, marginRight: 12, flexShrink: 0 }}>{(s.probability * 100).toFixed(0)}%</span>
                  <span style={{ fontSize: 11, background: t.badgeBg, color: t.badgeText, padding: '1px 6px', borderRadius: 3, flexShrink: 0 }}>{s.direction}</span>
                </div>
              ))}
              {crowdSignals.length > 6 && <div style={{ fontSize: 11, color: t.textTertiary, paddingTop: 8, fontStyle: 'italic' }}>+{crowdSignals.length - 6} more</div>}
            </div>
          )}
        </div>

        {/* Quant Signal */}
        <div style={{ background: t.cardPrimary, border: `1px solid ${t.border}`, borderRadius: 10, padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#5ba3c9' }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: t.textSecondary, fontFamily: "'Playfair Display', Georgia, serif" }}>Quant Signal</span>
          </div>
          {rsi === null ? (
            <div style={{ fontSize: 13, color: t.textTertiary, padding: '16px 0', fontFamily: "'Libre Baskerville', Georgia, serif", fontStyle: 'italic' }}>No RSI data today.</div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: t.textTertiary }}>SPY RSI (14)</span>
                <span style={{ fontSize: 28, fontWeight: 500, fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: rsi > 70 ? t.negative : rsi < 25 ? t.positive : t.textPrimary }}>{rsi.toFixed(1)}</span>
              </div>
              <div style={{ position: 'relative', height: 6, background: t.sliderTrack, borderRadius: 3, marginBottom: 6 }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${rsi}%`, background: t.mode === 'dark' ? 'linear-gradient(90deg, #7dba6a, #c9a96e, #c9705a)' : 'linear-gradient(90deg, #2d8a5e, #c9a96e, #c44e4e)', borderRadius: 3 }} />
                <div style={{ position: 'absolute', left: '25%', top: -2, width: 1, height: 10, background: t.border }} />
                <div style={{ position: 'absolute', left: '70%', top: -2, width: 1, height: 10, background: t.border }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: t.textTertiary }}>
                <span>0</span><span>Oversold &lt;25</span><span>Overbought &gt;70</span><span>100</span>
              </div>
              <p style={{ marginTop: 12, fontSize: 13, color: t.textSecondary, fontFamily: "'Libre Baskerville', Georgia, serif", lineHeight: 1.6 }}>
                {rsiSignal === 'oversold' ? 'The market is oversold — historically a signal for a near-term bounce. Favoring risk-on positions.' : rsiSignal === 'overbought' ? 'The market is overbought — prudent to trim risk exposure and rotate toward safety positions until conditions normalize.' : 'Neutral positioning — the market is neither stretched nor compressed. Holding current allocations steady.'}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Bullish Assets */}
      {bullishAssets.length > 0 && (
        <div style={{ background: t.cardPrimary, border: `1px solid ${t.border}`, borderRadius: 10, padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: t.textSecondary, fontFamily: "'Playfair Display', Georgia, serif" }}>Bullish Asset Rankings</span>
            <span style={{ fontSize: 11, color: t.textTertiary }}>{bullishAssets.length} tickers</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {bullishAssets.map((asset: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: t.surfaceSubtle, borderRadius: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 11, color: t.textTertiary, fontFamily: 'ui-monospace, SFMono-Regular, monospace', width: 20 }}>#{i + 1}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: t.textPrimary }}>{asset.ticker}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, fontFamily: 'ui-monospace, SFMono-Regular, monospace', padding: '2px 8px', borderRadius: 4, background: asset.source_count >= 3 ? 'rgba(125,186,106,0.15)' : asset.source_count >= 2 ? 'rgba(201,169,110,0.15)' : t.badgeBg, color: asset.source_count >= 3 ? t.positive : asset.source_count >= 2 ? t.accent : t.textTertiary }}>{asset.convergence}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
