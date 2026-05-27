import type { Theme } from './Dashboard'
import SignalRadar from './SignalRadar'

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
  asOf: string          // freshness stamp — when this voice last produced signal
  active: boolean        // true = feeds radar/engine; false = frozen reference card
  themes: {
    name: string
    editorial: string
    tickers: string[]
    bucket?: string      // which engine portfolio bucket these tickers map to
  }[]
}

const VOICES: VoiceSection[] = [
  {
    name: 'Visser',
    headline: 'LONG SCARCITY, SHORT ABUNDANCE',
    subtitle: 'Jordi Visser — macro framework for the physical AI upgrade',
    asOf: 'May 2026 (live)',
    active: true,
    themes: [
      {
        name: 'Power & the Physical AI Upgrade',
        editorial: 'The defining rotation: "I don\'t want to be in semis as much as I want to be in power." Data-center electricity demand is a supply crisis the grid can\'t meet — nuclear, fuel cells, and grid buildout are the binding bottleneck (Stage 3). Power semis are "going through the roof," but the parabolic AI names are where he\'s taking profits, not adding.',
        tickers: ['CEG', 'BE', 'AIPO', 'COPX', 'WGMI', 'GLW'],
        bucket: 'Power & Infrastructure',
      },
      {
        name: 'Hard Assets & Monetary Scarcity',
        editorial: 'Gold doubled and silver ran 4-5x last year, then "have been consolidating." With a regime shift toward inflation and pressure on the Fed, he wants to own the scarcity trade: "I want to be in gold. I want to be in silver." Silver is the standout — dual industrial + monetary, sixth-year supply deficit. Copper is the metal of electrification.',
        tickers: ['SLV', 'GLDM', 'COPX'],
        bucket: 'Monetary Scarcity & Tokenization',
      },
      {
        name: 'Bitcoin & Digital Scarcity',
        editorial: 'Over 100% of Bitcoin\'s cumulative returns come from one quadrant: negative real yields + an accommodative Fed — exactly the setup he sees forming. He calls BTC the "next parabola," tracing the same long consolidation Micron did before its run, and watches Bitcoin and Dogecoin as signals of when it fires.',
        tickers: ['IBIT'],
        bucket: 'Monetary Scarcity & Tokenization',
      },
      {
        name: 'Tokenization — Ownership Becomes Programmable',
        editorial: 'The next wave, building toward Stage 4. "I bought Ethereum because tokenization reality is going to set in this summer" — referencing the July launch. AI agents "need food and that food is tokens," driving demand for tokens, compute, and real-time coordination, while pressuring traditional SaaS. AI and crypto are "two parts of the same transition."',
        tickers: ['HOOD'],
        bucket: 'Monetary Scarcity & Tokenization',
      },
      {
        name: 'Optical & Semiconductors — Selective',
        editorial: 'Where memory exits and optical stays. He sold his entire Micron position — memory (Stage 1) is exhausted after its parabolic run. But optical/interconnect is still working (Stage 2): Marvell and Corning are the non-memory semis he still wants, the picks-and-shovels of the bandwidth bottleneck. Equal-weight semis capture breadth without the memory mega-cap concentration.',
        tickers: ['MRVL', 'GLW', 'XSD'],
        bucket: 'Compute',
      },
    ],
  },
  {
    name: 'Camillo',
    headline: 'BET ON WHAT PEOPLE DO, NOT WHAT MARKETS THINK',
    subtitle: 'Chris Camillo — social arbitrage and the companies AI will make dominant',
    asOf: 'Apr 2026 (reference — no recent signal)',
    active: false,
    themes: [
      {
        name: 'AI Platform Winners',
        editorial: 'Amazon is Camillo\'s biggest trade of his career — positioned at the intersection of AI automation, robotics, and logistics to turn efficiency into real-world margin at scale. Robinhood captures the retail fintech and crypto-accessibility wave. (Last reaffirmed Apr 2026; not in the live signal set.)',
        tickers: ['AMZN', 'HOOD'],
      },
      {
        name: 'Data Center Energy',
        editorial: 'Bloom Energy\'s 800-volt DC platform solves a power bottleneck utilities can\'t — on-site power faster than the grid delivers it. Camillo\'s pick-and-shovel play on AI infrastructure: the company that powers the companies that power AI. (Reference view as of Apr 2026.)',
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
                <span style={{ display: 'inline-block', marginTop: 8, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                  background: voice.active ? 'rgba(125,186,106,0.15)' : 'rgba(138,126,110,0.15)',
                  color: voice.active ? '#7dba6a' : t.textTertiary }}>
                  {voice.active ? '● Live signal' : '○ Reference'} · {voice.asOf}
                </span>
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

                  {/* Engine bucket mapping — shows how this narrative theme maps to a portfolio weighting bucket */}
                  {theme.bucket && (
                    <div style={{ marginTop: 8, fontSize: 10, color: t.textTertiary }}>
                      <span style={{ fontStyle: 'italic' }}>maps to engine bucket:</span>{' '}
                      <span style={{ fontWeight: 600, color: t.textSecondary }}>{theme.bucket}</span>
                    </div>
                  )}

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

      {/* Signal Radar — what Visser is emphasizing now (themes + stage, not weights) */}
      <SignalRadar theme={t} />
    </div>
  )
}
