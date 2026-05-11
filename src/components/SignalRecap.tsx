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
        editorial: 'The AI buildout runs on two physical bottlenecks: bandwidth and electricity. Corning is the dominant fiber play — east-west data center traffic is exploding, and optical glass is what carries it. Meanwhile, the grid required to power AI is a multi-year capex cycle most investors are underestimating. AIPO captures that full vertical: grid construction (Quanta), gas turbines (GE Vernova), data center cooling (Vertiv), electrical equipment (Eaton), nuclear (Cameco, Constellation), and distributed power (Bloom Energy — a Camillo overlay name). Together, GLW and AIPO are the picks-and-shovels basket for the physical AI capex cycle.',
        tickers: ['GLW', 'AIPO'],
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
        name: 'Utilities',
        editorial: 'Data center power demand is creating a supply crisis for regulated utilities — the grid simply cannot keep up with AI\'s appetite for electricity. XLU captures the broad utilities sector as the regulated counterpart to the unregulated AI power names inside AIPO.',
        tickers: ['XLU'],
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
    ],
  },
]

// Rich thesis context per ticker — shown in bullish asset descriptions
const TICKER_THESIS: Record<string, string> = {
  IBIT: 'Visser thesis: over 100% of Bitcoin\'s cumulative returns since 2010 come from negative real yields + Fed on hold/easing. Current macro setup points directly at this quadrant.',
  XSD: 'Visser thesis: semiconductors are now 17% of the S&P 500 and growing. The physical AI upgrade cycle is in early innings — equal-weight captures the breadth beyond mega-caps.',
  AIPO: 'Visser + Camillo convergence: the AI Power Stack. Captures grid buildout (Quanta), gas turbines (GE Vernova), data center cooling (Vertiv), electrical equipment (Eaton), nuclear (Cameco, Constellation), and distributed power (Bloom Energy) — the full picks-and-shovels basket for the multi-year AI capex cycle.',
  GLW: 'Visser thesis: Corning is the dominant fiber play. East-west data center traffic is exploding, driving demand for optical fiber and silicon photonics.',
  GLDM: 'Visser thesis: negative real yields and monetary debasement make gold a structural long. Finite resource in a world printing infinite currency.',
  SLV: 'Visser thesis: silver benefits from the same scarcity dynamics as gold, with additional industrial demand from electrification and solar.',
  COPX: 'Visser thesis: copper is the metal of electrification. Every EV, data center, and grid upgrade requires massive copper input — supply cannot keep up.',
  XLU: 'Visser thesis: data center power demand is creating a supply crisis for utilities. The grid cannot keep up with AI\'s appetite for electricity.',
  AMZN: 'Camillo thesis: Amazon sits at the intersection of AI automation, robotics, and logistics — the company most positioned to turn AI efficiency into real-world margin expansion.',
  HOOD: 'Camillo thesis: Robinhood captures the retail fintech revolution and crypto accessibility for the next generation of investors.',
  SGOV: 'Quant-driven cash allocation. Increases when RSI signals overbought conditions to reduce portfolio risk.',
  SPY: 'Broad market proxy. Appears in rankings when narrative or quant signals reference overall market conditions.',
}

// Crowd signal context per ticker
const CROWD_CONTEXT: Record<string, string> = {
  IBIT: 'Low probability of forced Bitcoin selling by major holders is supportive for price stability and continued accumulation.',
  GLDM: 'Prediction markets on inflation, Fed policy, or geopolitical risk have implications for gold demand as a safe haven.',
  XSD: 'Trade policy or tech sector prediction markets mapped to semiconductor exposure.',
  AIPO: 'Energy demand and AI infrastructure prediction markets (oil prices, data center power, grid capacity) mapped to the AI Power Stack basket.',
  SPY: 'Broad macro prediction markets (recession probability, GDP, employment) mapped to S&P 500.',
  COPX: 'Commodity-related prediction markets mapped to copper exposure.',
  SLV: 'Precious metals and inflation-related prediction markets mapped to silver.',
}

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
        <div style={{ background: t.cardPrimary, border: `1px solid ${t.border}`, borderRadius: 10, padding: '20px 24px', marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: t.textPrimary, fontFamily: "'Playfair Display', Georgia, serif" }}>Bullish Asset Rankings</span>
            <span style={{ fontSize: 11, color: t.textTertiary }}>{bullishAssets.length} tickers</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bullishAssets.map((asset: any, i: number) => {
              const sourceColors: Record<string, { bg: string; text: string; label: string }> = {
                narrative: { bg: 'rgba(176,140,214,0.12)', text: '#b08cd6', label: 'Narrative' },
                crowd: { bg: 'rgba(201,169,110,0.12)', text: t.accent, label: 'Crowd' },
                quant: { bg: 'rgba(91,163,201,0.12)', text: '#5ba3c9', label: 'Quant' },
              }

              return (
                <div key={i} style={{ padding: '12px 14px', background: t.surfaceSubtle, borderRadius: 8 }}>
                  {/* Top row: rank, ticker, convergence */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, color: t.textTertiary, fontFamily: 'ui-monospace, SFMono-Regular, monospace', width: 20 }}>#{i + 1}</span>
                      <span style={{ fontSize: 16, fontWeight: 600, fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: t.textPrimary }}>{asset.ticker}</span>
                      {/* Source badges */}
                      <div style={{ display: 'flex', gap: 4 }}>
                        {(asset.sources || []).map((src: string, j: number) => {
                          const sc = sourceColors[src] || sourceColors.narrative
                          return <span key={j} style={{ fontSize: 10, background: sc.bg, color: sc.text, padding: '2px 7px', borderRadius: 3 }}>{sc.label}</span>
                        })}
                      </div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, fontFamily: 'ui-monospace, SFMono-Regular, monospace', padding: '2px 8px', borderRadius: 4, background: asset.source_count >= 3 ? 'rgba(125,186,106,0.15)' : asset.source_count >= 2 ? 'rgba(201,169,110,0.15)' : t.badgeBg, color: asset.source_count >= 3 ? t.positive : asset.source_count >= 2 ? t.accent : t.textTertiary }}>{asset.convergence}</span>
                  </div>

                  {/* Signal descriptions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 32 }}>
                    {(asset.signals || []).map((sig: any, k: number) => {
                      const sc = sourceColors[sig.source] || sourceColors.narrative
                      const conviction = sig.conviction || 'medium'
                      const convictionExplain = conviction === 'high'
                        ? 'High conviction — strong bullish language detected ("pounding the table", "biggest opportunity", "generational")'
                        : conviction === 'medium'
                          ? 'Medium conviction — bullish language present but no extreme phrases'
                          : 'Low conviction — mentioned but without strong directional language'

                      let description: { main: string; context: string } = { main: '', context: '' }

                      if (sig.source === 'narrative') {
                        const videoTitle = sig.video_title || sig.quote || ''
                        const thesisContext = TICKER_THESIS[asset.ticker] || ''
                        description = {
                          main: videoTitle
                            ? `Visser's latest: "${videoTitle}"`
                            : `${sig.asset || asset.ticker} detected in narrative pipeline`,
                          context: thesisContext
                            ? `${thesisContext} ${convictionExplain}.`
                            : `${convictionExplain}.`,
                        }
                      } else if (sig.source === 'crowd') {
                        const prob = ((sig.probability || 0) * 100).toFixed(0)
                        const marketQ = sig.market || 'Polymarket signal'
                        const crowdContext = CROWD_CONTEXT[asset.ticker] || `Prediction market activity mapped to ${asset.ticker}.`
                        description = {
                          main: `"${marketQ}" at ${prob}%`,
                          context: crowdContext,
                        }
                      } else if (sig.source === 'quant') {
                        const indicator = sig.indicator || 'SPY RSI'
                        description = {
                          main: `${indicator}`,
                          context: conviction === 'medium'
                            ? 'RSI below 25 signals market is oversold — historically a bounce follows within days. Favoring risk-on positions.'
                            : 'RSI signal active — monitoring for positioning opportunity.',
                        }
                      }

                      return (
                        <div key={k} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, lineHeight: 1.6 }}>
                          <span style={{ color: sc.text, flexShrink: 0, marginTop: 2 }}>•</span>
                          <div style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}>
                            <span style={{ color: t.textPrimary }}>{description.main}</span>
                            {description.context && (
                              <span style={{ color: t.textSecondary }}> — {description.context}</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
