import type { CSSProperties } from 'react'
import type { Theme } from './Dashboard'
import SignalRadar from './SignalRadar'

const ACCENT = '#e0915c'

// Frosted-glass surface shared by the cards on this tab.
const glass: CSSProperties = {
  background: 'rgba(30,29,27,0.38)',
  backdropFilter: 'blur(32px) saturate(132%)',
  WebkitBackdropFilter: 'blur(32px) saturate(132%)',
  border: '1px solid rgba(255,255,255,0.11)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
}

interface SignalRecapProps {
  snapshot: {
    snapshot_date: string
    spy_rsi: number | null
    rsi_signal: string | null
    polymarket_signals: any[] | null
    narrative_signals: any[] | null
    bullish_assets: any[] | null
    macro_signals?: any | null
    portfolio?: any[] | null   // live engine holdings (ticker, weight_pct, category) — single source for theme chips
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
    tickers: string[]      // curated list; ALSO the fallback when no live portfolio is in the snapshot
    curated?: boolean       // true: always show these tickers verbatim (social-arb picks not in the book)
    bucket?: string         // which engine portfolio bucket these tickers map to
    wholeBucket?: boolean    // true: chips = ALL live holdings in `bucket` (auto add/drop). false/undefined: chips = `tickers` pruned to what's actually held.
  }[]
}

const VOICES: VoiceSection[] = [
  {
    name: 'Visser',
    headline: 'LONG SCARCITY, SHORT ABUNDANCE',
    subtitle: 'Jordi Visser — macro framework for the physical AI upgrade',
    asOf: 'June 2026 (live)',
    active: true,
    themes: [
      {
        name: 'AI Compute',
        editorial: `Power is still the binding bottleneck — data-center demand is a supply crisis the grid can't meet, and he frames the tape as "running hot into scarcity." He's scaled out of the parabolic chip names (effectively all of Micron) and leans on what's still working — optical, copper, and increasingly batteries and storage as the near-term grid fix, flagging the Fluence–Nvidia deal as the kind of catalyst that unlocks capacity.`,
        tickers: ['SOXX', 'AIPO', 'COPX', 'GLW', 'ASML'],
        bucket: 'AI Compute',
        wholeBucket: true,
      },
      {
        name: 'AI Application',
        editorial: `His loudest June conviction — money rotating up the stack to the application layer. In his Eli Lilly paper he argues LLY could be the largest company in the US by the end of the decade, "larger than Nvidia": peptides are "this decade's API keys," and the Lily Pod (1,000+ Blackwells trained on Lilly's own data, not the internet) makes it, in his words, the most important AI company in the world. His tell: "we are moving into the application side right now — hardware is now more of a risk."`,
        tickers: ['LLY', 'AMZN'],
        bucket: 'AI Application',
        wholeBucket: true,
      },
      {
        name: 'Tokenization',
        editorial: `Building toward Stage 4. He's telling listeners to "start listening to everything I'm talking about in crypto," arguing tokenization will unleash two-thirds of dormant real-world assets — real estate, private credit, PE, VC — as the next leg on-chain. He bought Ethereum for the tokenization reality he expects to set in over the summer, watching the BTC/ETH 50-day as the trigger.`,
        tickers: ['HOOD', 'ETHA'],
        bucket: 'Tokenization',
        wholeBucket: true,
      },
      {
        name: 'Monetary Scarcity',
        editorial: `The scarcity trade, now held with patience. He still wants gold, silver, and Bitcoin — silver the standout on a sixth-year industrial deficit, BTC the "next parabola" echoing Micron's long base — accumulating on weakness while the three consolidate. But his June macro read softened: inflation swaps just posted their biggest drop since 2022 and the June CPI nowcast sits near zero, so he's calling inflation nearer a peak than an acceleration — patient accumulation, not a chase.`,
        tickers: ['SLV', 'GLDM', 'IBIT'],
        bucket: 'Monetary Scarcity',
        wholeBucket: true,
      },
    ],
  },
  {
    name: 'Camillo',
    headline: 'BET ON WHAT PEOPLE DO, NOT WHAT MARKETS THINK',
    subtitle: 'Chris Camillo — social arbitrage and the companies AI will make dominant',
    asOf: 'June 2026',
    active: true,
    themes: [
      {
        name: 'AI Application',
        editorial: `Amazon is his anchor and the purest AI-efficiency bet — he keeps adding, citing AWS, in-house Trainium silicon, robotics, and logistics compounding into real-world margin; on 6/24 he called it the buildout of the largest logistics-and-digital infrastructure ecosystem "for the future of humanity." Robinhood is his other high-conviction hold — a top-30 position he's added on every dip into the 70s and expects to become one of the largest financial institutions in the world over 20 years (last reaffirmed 5/24).`,
        tickers: ['AMZN', 'HOOD'],
        curated: true,
      },
      {
        name: 'AI Compute',
        editorial: `Bloom Energy is still one of the biggest trades of his career and, in his framing, the fastest way to scale a data center — on-site power where turbines and grid hookups are the bottleneck. But it's now a held winner he's been trimming for concentration, and on 6/24 he openly flagged the eventual rotation from single-name power plays toward the mega-caps spending $100–200B a year in capex — direction clear, timing unknown.`,
        tickers: ['BE'],
        curated: true,
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
  const macro = snapshot.macro_signals || null
  const hasQuant = rsi !== null || !!(macro && (macro.spy || macro.cpi || macro.nowcast))
  const fmtMonth = (m: string | null | undefined) => {
    if (!m) return ''
    const [y, mo] = m.split('-')
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${names[parseInt(mo, 10) - 1]} ${y}`
  }
  const visibleVoices = VOICES.filter(v => activeVoices.has(v.name))

  return (
    <div>
      {/* Themes radar — moved to top, replaces the pillar row */}
      <SignalRadar theme={t} portfolio={snapshot?.portfolio} />

      {/* Voice Sections — newspaper columns */}
      {visibleVoices.length > 0 && (
        <div className={visibleVoices.length > 1 ? 'ap-voices-grid' : ''} style={{ marginBottom: 24 }}>
          {visibleVoices.map((voice) => (
            <div key={voice.name} style={{ ...glass, borderRadius: 14, padding: '24px 28px' }}>
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
                  <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 700, margin: '0 0 8px', color: t.textPrimary }}>
                    {theme.name}
                  </h3>

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
        <div style={{ ...glass, borderRadius: 14, padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: ACCENT }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: t.textSecondary, fontFamily: "'Playfair Display', Georgia, serif" }}>Crowd Signals</span>
              <span style={{ fontSize: 10, color: t.textTertiary, fontStyle: 'italic', fontFamily: "'Libre Baskerville', Georgia, serif" }}>via Kalshi</span>
            </div>
            <span style={{ fontSize: 11, color: t.textTertiary }}>{crowdSignals.length} markets{(crowdSignals[0] as any)?.as_of ? ' · as of ' + new Date((crowdSignals[0] as any).as_of).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : ''}</span>
          </div>
          {crowdSignals.length === 0 ? (
            <div style={{ fontSize: 13, color: t.textTertiary, padding: '16px 0', fontFamily: "'Libre Baskerville', Georgia, serif", fontStyle: 'italic' }}>No crowd signals today.</div>
          ) : (
            <div>
              {crowdSignals.slice(0, 6).map((s: any, i: number) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: i < Math.min(crowdSignals.length, 6) - 1 ? `1px solid ${t.border}` : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                    <span style={{ fontSize: 12, color: t.textSecondary, flex: 1, lineHeight: 1.3, fontFamily: "'Libre Baskerville', Georgia, serif" }}>{s.market}</span>
                    <span style={{ fontSize: 13, fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: t.textPrimary, flexShrink: 0 }}>{(s.probability * 100).toFixed(0)}%</span>
                  </div>
                  {(s.read || s.close_time) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginTop: 2 }}>
                    <span style={{ fontSize: 11, color: t.textTertiary, fontStyle: 'italic', fontFamily: "'Libre Baskerville', Georgia, serif" }}>{s.read}</span>
                    {s.close_time && <span style={{ fontSize: 10, color: t.textTertiary, flexShrink: 0, opacity: 0.9, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>resolves {new Date(s.close_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</span>}
                  </div>
                )}
                </div>
              ))}
              {crowdSignals.length > 6 && <div style={{ fontSize: 11, color: t.textTertiary, paddingTop: 8, fontStyle: 'italic' }}>+{crowdSignals.length - 6} more</div>}
            </div>
          )}
        </div>

        {/* Quant Signal — macro regime panel */}
        <div style={{ ...glass, borderRadius: 14, padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#5ba3c9' }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: t.textSecondary, fontFamily: "'Playfair Display', Georgia, serif" }}>Quant Signal</span>
          </div>
          {!hasQuant ? (
            <div style={{ fontSize: 13, color: t.textTertiary, padding: '16px 0', fontFamily: "'Libre Baskerville', Georgia, serif", fontStyle: 'italic' }}>No quant data today.</div>
          ) : (
            <>
              {macro?.spy && (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: t.textTertiary }}>SPY</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 22, fontWeight: 500, fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: t.textPrimary }}>${macro.spy.price?.toFixed(2)}</span>
                      {macro.spy.pct_off_ath != null && (
                        <span style={{ fontSize: 12, color: macro.spy.pct_off_ath > -1 ? t.negative : t.textTertiary, marginLeft: 8 }}>{Math.abs(macro.spy.pct_off_ath).toFixed(1)}% off ATH</span>
                      )}
                    </div>
                  </div>
                  {macro.spy.ath != null && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                      <span style={{ fontSize: 11, color: t.textTertiary }}>ATH ${macro.spy.ath?.toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}

              {rsi !== null && (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: t.textTertiary }}>SPY RSI (14)</span>
                    <span style={{ fontSize: 18, fontWeight: 500, fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: rsi > 70 ? t.negative : rsi < 25 ? t.positive : t.textPrimary }}>{rsi.toFixed(1)}</span>
                  </div>
                  <div style={{ position: 'relative', height: 6, background: t.sliderTrack, borderRadius: 3, marginBottom: 4 }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${rsi}%`, background: 'linear-gradient(90deg, #7dba6a, #e0915c, #c9705a)', borderRadius: 3 }} />
                    <div style={{ position: 'absolute', left: '25%', top: -2, width: 1, height: 10, background: t.border }} />
                    <div style={{ position: 'absolute', left: '70%', top: -2, width: 1, height: 10, background: t.border }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: t.textTertiary, marginBottom: 16 }}>
                    <span>0</span><span>Oversold &lt;25</span><span>Overbought &gt;70</span><span>100</span>
                  </div>
                </>
              )}

              {macro && (macro.cpi || macro.nowcast) && (
                <div style={{ borderTop: rsi !== null || macro?.spy ? `1px solid ${t.border}` : 'none', paddingTop: rsi !== null || macro?.spy ? 16 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 13, color: t.textTertiary }}>CPI</span>
                      <span style={{ fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase', background: t.badgeBg, color: t.badgeText, padding: '2px 6px', borderRadius: 3, fontFamily: "'Playfair Display', Georgia, serif" }}>official</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 18, fontWeight: 500, fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: t.textPrimary }}>{macro.cpi?.yoy != null ? `${macro.cpi.yoy.toFixed(1)}%` : '—'}</span>
                      {macro.cpi?.yoy != null && <span style={{ fontSize: 11, color: t.textTertiary, marginLeft: 4 }}>YoY</span>}
                    </div>
                  </div>
                  {macro.cpi?.data_month && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                      <span style={{ fontSize: 11, color: t.textTertiary }}>{fmtMonth(macro.cpi.data_month)}{macro.cpi.release_date ? ` · ${macro.cpi.release_approx ? '~' : ''}released ${fmtMonth(macro.cpi.release_date.slice(0, 7))}` : ''}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 13, color: t.textTertiary }}>Cleveland Fed nowcast</span>
                      <span style={{ fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase', background: 'rgba(91,163,201,0.16)', color: '#5ba3c9', padding: '2px 6px', borderRadius: 3, fontFamily: "'Playfair Display', Georgia, serif" }}>forecast</span>
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 500, fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: macro.nowcast?.yoy != null ? (macro.nowcast.yoy >= 4 ? t.negative : t.textPrimary) : t.textTertiary }}>{macro.nowcast?.yoy != null ? `${macro.nowcast.yoy.toFixed(1)}%` : '—'}</span>
                  </div>
                  {macro.nowcast?.data_month && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                      <span style={{ fontSize: 11, color: t.textTertiary }}>{fmtMonth(macro.nowcast.data_month)} est{macro.nowcast.as_of ? ` · as of ${fmtMonth(macro.nowcast.as_of.slice(0, 7))}` : ''}</span>
                    </div>
                  )}

                  {macro.kalshi?.point_estimate != null && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ fontSize: 13, color: t.textTertiary }}>Kalshi</span>
                          <span style={{ fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase', background: 'rgba(224,145,92,0.16)', color: '#e0915c', padding: '2px 6px', borderRadius: 3, fontFamily: "'Playfair Display', Georgia, serif" }}>market</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                          <span style={{ fontSize: 18, fontWeight: 500, fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: macro.kalshi.point_estimate >= 4 ? t.negative : t.textPrimary }}>{macro.kalshi.point_estimate.toFixed(1)}%</span>
                          {macro.kalshi.prob_above_4 != null && (
                            <span style={{ fontSize: 11, fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: t.textTertiary }}>P(&gt;4%) {Math.round(macro.kalshi.prob_above_4 * 100)}%</span>
                          )}
                        </div>
                      </div>
                      {macro.kalshi.data_month && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                          <span style={{ fontSize: 11, color: t.textTertiary }}>{fmtMonth(macro.kalshi.data_month)} CPI{macro.kalshi.close_time ? ` · resolves ${new Date(macro.kalshi.close_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}` : ''}{macro.kalshi.as_of ? ` · as of ${new Date(macro.kalshi.as_of).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}` : ''}</span>
                        </div>
                      )}
                    </>
                  )}

                  {macro.regime && (
                    <div style={{ background: macro.regime.above ? 'rgba(201,112,90,0.13)' : 'rgba(125,186,106,0.12)', border: `1px solid ${macro.regime.above ? 'rgba(201,112,90,0.3)' : 'rgba(125,186,106,0.3)'}`, borderRadius: 7, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                        <span style={{ fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: macro.regime.above ? t.negative : t.positive, fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}>{macro.regime.above ? 'Above 4% regime' : 'Below 4% regime'}</span>
                        <span style={{ fontSize: 12, fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: macro.regime.above ? t.negative : t.positive }}>{macro.regime.value?.toFixed(1)}% {macro.regime.above ? '>' : '<'} {macro.regime.threshold?.toFixed(1)}%</span>
                      </div>
                      {macro.regime.votes_above != null && macro.regime.legs_total != null && (
                        <div style={{ fontSize: 10, color: macro.regime.above ? t.negative : t.positive, fontFamily: 'ui-monospace, SFMono-Regular, monospace', opacity: 0.85, marginBottom: 6 }}>{macro.regime.votes_above} of {macro.regime.legs_total} legs ≥ {macro.regime.threshold?.toFixed(1)}%</div>
                      )}
                      <p style={{ margin: 0, fontSize: 12, color: t.textSecondary, fontFamily: "'Libre Baskerville', Georgia, serif", fontStyle: 'italic', lineHeight: 1.6 }}>{macro.regime.note}.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

    </div>
  )
}
