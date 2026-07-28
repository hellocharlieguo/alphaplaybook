import type { CSSProperties } from 'react'
import type { Theme } from './Dashboard'
import SignalRadar from './SignalRadar'

const ACCENT = '#e0915c'

// Book-overlap tags for the S&P-additions block — mirrors the voice ledger state
// (RDDT = ZaStocks-only quarantine; BE = Camillo trim-and-rotate). Hand-maintained.
const SP_ADD_TAGS: Record<string, { label: string; color: string }> = {
  RDDT: { label: 'quarantined', color: '#c9705a' },
  BE: { label: 'Camillo', color: ACCENT },
}

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
    asOf: 'July 26, 2026',
    active: true,
    themes: [
      {
        name: 'AI Compute',
        editorial: `Compute scarcity got its most structural statement yet — “the physical infrastructure cannot scale at software speed. We will forever be short compute” — and the brief loosening has reversed, with GPU availability “tightening back up” toward where it was. Google is the evidence he leans on: cloud +82% YoY, backlog $106B to $514B in a single year, free cash flow negative for the first time, and still supply-constrained enough to rent Nvidia capacity from SpaceX. The live new call is optical. He is hunting a step-up function that has not yet reached the tape — “I believe we are going to see a step up function in optical and photonics… I am looking for beats that are going to be bigger where they have to revise numbers up significantly” — with Marvell still his largest position and a second optical name, AAOI, bought this week. Memory is reinforced rather than re-rated: the AI-equals-memory paper, a small Micron position added back, and the agentic framing that persistent recall demands far more memory than inference does. On regime he is patient, not bearish — a mini bear market at roughly the 38% retracement with ~30% of names below their 20-day, buying last week and nothing this week, and an explicit reset of expectations from 60–70% to “30% a year in the AI infrastructure trade is going to be great.” One counter-signal worth logging: he twice cited Eric Schmidt approvingly that cash, not energy, is the real limit on AI growth, and named no power name across either episode.`,
        tickers: ['SOXX', 'AIPO', 'COPX', 'GLW', 'ASML'],
        bucket: 'AI Compute',
        wholeBucket: true,
      },
      {
        name: 'AI Application',
        editorial: `A genuinely new frame this cycle — “QE for the mind.” The argument is that the largest AI winners may not be the high-margin software names but the low-margin, high-headcount businesses, because operating leverage runs backwards there: “a mere 5% reduction in expenses yields a 20% EPS jump.” The deployment claim follows from it — “AI should be deployed as infrastructure, not merely software,” with agents embedded into workflows rather than handed to workers as a tool — and he notes we still “have not really seen the profit margin benefit for the majority of companies.” He ran an LLM screen against the frame and surfaced UPS, Cisco, Jabil, Centene and Walmart, but presented the output rather than endorsing any name; treat it as a screening lens, not a nomination. The Lilly and Amazon seats are untouched by this. The longer-dated caution from prior weeks stands and got sharper: by 2030 he is worried about what happens to public companies broadly, “including the infrastructure companies.”`,
        tickers: ['LLY', 'AMZN'],
        bucket: 'AI Application',
        wholeBucket: true,
      },
      {
        name: 'Tokenization',
        editorial: `Structurally emphatic, near-term patient — the catalyst slipped and he says so. The Clarity Act still prices below 50% on Kalshi and Polymarket despite Bessent putting it on “the one yard line” and Goldman’s CEO publicly pushing it through, and he is blunt that “Clarity Act needs to happen. If we don’t get past on that, then we’re going to go right back down towards the lows.” The structural side ran the other way this month: Japan, South Korea and Russia all passed crypto frameworks, S&P launched its first crypto index, and on rails he is categorical — “what is replacing SWIFT is stablecoins… there’s no way to get around stablecoin adoption.” The internal rotation signal is the one to carry: his crypto ecosystem index took out the mid-June highs while Bitcoin did not, and “Ethereum’s been outperforming Bitcoin… the market is starting to look more towards the revenue side of the equation, which would be more towards Ethereum and less towards Bitcoin.” Directional support for the ETHA-over-IBIT tilt whenever the sleeve uncaps — not an authorization to add now.`,
        tickers: ['HOOD', 'ETHA'],
        bucket: 'Tokenization',
        wholeBucket: true,
      },
      {
        name: 'Monetary Scarcity',
        editorial: `Holding, not adding — the gate is still shut and he is explicit about it. Bitcoin and Ethereum have both bounced off the lows, but “they are not out of their bear market. It is still a bear market until we can break the 200 day moving average on these.” Bitcoin sits around $64,000 and had a quiet week. The retail tell he keeps returning to is Dogecoin’s 20-day: price has been below it since the middle of May, now 67 consecutive days and “the longest in its history,” which he reads as energy in retail still being non-existent until Doge starts trending positively. Silver remains well below its own 200-day after the June break and has not reclaimed it. The debasement case is unchanged and the sovereign-adoption cascade strengthened; the discipline is unchanged too — accumulate into weakness, do not front-run the 200-day.`,
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
    asOf: 'July 2026',
    active: true,
    themes: [
      {
        name: 'AI Application',
        editorial: `Amazon is his anchor and the purest AI-efficiency bet — he keeps adding, citing AWS, in-house Trainium silicon, robotics, and logistics compounding into real-world margin; on 6/24 he called it the buildout of the largest logistics-and-digital infrastructure ecosystem “for the future of humanity.” Robinhood is his other high-conviction hold, and on 7/15 he sharpened it around agentic trading — “the biggest gamechanger I’ve ever seen for brokers like Robin Hood,” one he thinks could “100x the trading volume” as AI agents trade on behalf of every retail customer and “completely change the entire industry of online brokerage.” Still a top-30 name he’s added on every dip into the 70s.`,
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
  {
    name: 'ZaStocks',
    headline: 'THINK BIGGER ON THE LEADERS',
    subtitle: 'ZaStocks (@ZaStocks) — technical setups and the AI market broadening beyond core semis',
    asOf: 'wk of Jul 20 – Jul 27 · via Grok',
    active: true,
    themes: [
      {
        name: 'AI Healthcare & Genomics',
        editorial: `CARRIED FORWARD — no fresh posts on this theme in the Jul 20–27 window. The prior setups stand as logged: Tempus AI (TEM) with high short interest reclaiming its key moving averages inside a multi-month base, and AbCellera (ABCL) on heavy volume off a multi-year base. Both remain Watching — chart-driven candidates to run through the gates, not confirmed holds, and both are currently below their 200-day and entry-paused. TEM still converges with our own AI Application second-seat watch. Nothing here was re-affirmed this week, so treat the conviction as aging rather than current.`,
        tickers: ['TEM', 'ABCL'],
        curated: true,
      },
      {
        name: 'AI Compute — pre-consensus holds',
        editorial: `The week’s one hard conviction statement was on Marvell — a flat “I’m long” in reply on Jul 22 — which now converges with Visser calling MRVL his largest position. That is the only two-leg name in the book this cycle. Dell keeps its own chart and got the strongest framing: “$DELL is acting like your market leader when the AI trade eventually firms up. This is very reminiscent of $MU around $400.” It stays quarantined — ZaStocks-only, no Visser or Camillo leg — and is now the most extended name on our sheet at roughly double its 200-day. The rest was risk discipline rather than nomination: “your entry price and cost basis matter more than almost anything else. You can’t buy any stock at any price,” balanced against the constructive read that “bottoms don’t form when everyone is bullish and everything is great.” Intel drew an approving chart note and Micron, SanDisk and Meta appeared as comps only — mentions, not positive legs. His standing caveat carried again: “there’s going to be plenty of AI winners but more losers than winners.”`,
        tickers: ['ARM', 'MRVL', 'DELL', 'MU'],
        curated: true,
      },
      {
        name: 'Broadening: energy storage & fintech',
        editorial: `Where he sees the tape widening. Fluence (FLNC): flagged on a policy tailwind — a drafted US ban on foreign energy inverters feeding grid-security demand — as his 2nd-best BESS play, full-stack hardware/software with a ~$6B backlog and ~$2.5B TTM revenue near a ~$2.5B market cap, plus a Nvidia Rubin tie-in. Upstart (UPST): AI-plus-fintech with ~35% short interest sitting on a base. Neither is in the sleeve — broadening candidates for the watchlist, and FLNC notably corroborates Visser's own Fluence–Nvidia mention.`,
        tickers: ['FLNC', 'UPST'],
        curated: true,
      },
    ],
  },
]



export default function SignalRecap({ snapshot, theme: t, activeVoices }: SignalRecapProps) {
  if (!snapshot) {
    return <div style={{ textAlign: 'center', padding: '64px 0', color: t.textTertiary, fontFamily: "'Manrope', sans-serif", fontStyle: 'italic' }}>Awaiting first signal...</div>
  }

  const crowdSignals = snapshot.polymarket_signals || []
  const spAddSignal = (crowdSignals as any[]).find((s: any) => s.sp500_add) || null
  const stdCrowd = (crowdSignals as any[]).filter((s: any) => !s.sp500_add)
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
  // Layout: lead voice (Visser) fills the left column; the rest stack in the right column.
  const leadVoice = visibleVoices.find(v => v.name === 'Visser') ?? visibleVoices[0] ?? null
  const rightVoices = visibleVoices.filter(v => v !== leadVoice)

  const renderVoiceCard = (voice: VoiceSection) => (
    <div key={voice.name} style={{ ...glass, borderRadius: 14, padding: '24px 28px', flexGrow: 1 }}>
      {/* Voice headline — newspaper style */}
      <div style={{ borderBottom: `2px solid ${t.ruleLine}`, paddingBottom: 16, marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 26, fontWeight: 800, margin: 0, lineHeight: 1.15, color: t.textPrimary, letterSpacing: 0.5 }}>
          {voice.headline}
        </h2>
        <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, color: t.textSecondary, margin: '8px 0 0', fontStyle: 'italic' }}>
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
          <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 17, fontWeight: 700, margin: '0 0 8px', color: t.textPrimary }}>
            {theme.name}
          </h3>

          {/* Editorial paragraph */}
          <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, lineHeight: 1.7, color: t.textSecondary, margin: 0, textAlign: 'justify' }}>
            {theme.editorial}
          </p>

          {/* Separator between themes */}
          {i < voice.themes.length - 1 && (
            <div style={{ borderBottom: `1px solid ${t.border}`, marginTop: 16 }} />
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div>
      {/* Themes radar — moved to top, replaces the pillar row */}
      <SignalRadar theme={t} portfolio={snapshot?.portfolio} />

      {/* Voice Sections — Visser leads the left column; Camillo + ZaStocks stack on the right */}
      {visibleVoices.length > 0 && (
        <div className={rightVoices.length > 0 ? 'ap-voices-grid' : ''} style={{ marginBottom: 24 }}>
          {leadVoice && renderVoiceCard(leadVoice)}
          {rightVoices.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {rightVoices.map((v) => renderVoiceCard(v))}
            </div>
          )}
        </div>
      )}

      {visibleVoices.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: t.textTertiary, fontFamily: "'Manrope', sans-serif", fontStyle: 'italic', marginBottom: 24 }}>
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
              <span style={{ fontSize: 12, fontWeight: 500, color: t.textSecondary, fontFamily: "'Manrope', sans-serif" }}>Crowd Signals</span>
              <span style={{ fontSize: 10, color: t.textTertiary, fontStyle: 'italic', fontFamily: "'Manrope', sans-serif" }}>via Kalshi</span>
            </div>
            <span style={{ fontSize: 11, color: t.textTertiary }}>{crowdSignals.length} markets{(crowdSignals[0] as any)?.as_of ? ' · as of ' + new Date((crowdSignals[0] as any).as_of).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : ''}</span>
          </div>
          {crowdSignals.length === 0 ? (
            <div style={{ fontSize: 13, color: t.textTertiary, padding: '16px 0', fontFamily: "'Manrope', sans-serif", fontStyle: 'italic' }}>No crowd signals today.</div>
          ) : (
            <div>
              {stdCrowd.slice(0, 6).map((s: any, i: number) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: i < Math.min(stdCrowd.length, 6) - 1 ? `1px solid ${t.border}` : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                    <span style={{ fontSize: 12, color: t.textSecondary, flex: 1, lineHeight: 1.3, fontFamily: "'Manrope', sans-serif" }}>{s.market}</span>
                    <span style={{ fontSize: 13, fontFamily: "'Manrope', sans-serif", fontVariantNumeric: 'tabular-nums', color: t.textPrimary, flexShrink: 0 }}>{(s.probability * 100).toFixed(0)}%</span>
                  </div>
                  {(s.read || s.close_time) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginTop: 2 }}>
                    <span style={{ fontSize: 11, color: t.textTertiary, fontStyle: 'italic', fontFamily: "'Manrope', sans-serif" }}>{s.read}</span>
                    {s.close_time && <span style={{ fontSize: 10, color: t.textTertiary, flexShrink: 0, opacity: 0.9, fontFamily: "'Manrope', sans-serif", fontVariantNumeric: 'tabular-nums' }}>resolves {new Date(s.close_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</span>}
                  </div>
                )}
                </div>
              ))}
              {spAddSignal && spAddSignal.sp500_add && (
                <div style={{ padding: '12px 0 2px', borderTop: `1px solid ${t.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                    <span style={{ fontSize: 12, color: t.textSecondary, lineHeight: 1.3, fontFamily: "'Manrope', sans-serif" }}>
                      Next S&amp;P 500 additions
                      {spAddSignal.sp500_add.quarter && <span style={{ fontSize: 9, fontFamily: "'Manrope', sans-serif", fontVariantNumeric: 'tabular-nums', color: ACCENT, border: `1px solid ${ACCENT}66`, borderRadius: 4, padding: '1px 5px', marginLeft: 6, verticalAlign: 1 }}>{spAddSignal.sp500_add.quarter}</span>}
                    </span>
                    {spAddSignal.close_time && <span style={{ fontSize: 10, color: t.textTertiary, flexShrink: 0, opacity: 0.9, fontFamily: "'Manrope', sans-serif", fontVariantNumeric: 'tabular-nums' }}>resolves {new Date(spAddSignal.close_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: t.textTertiary, fontStyle: 'italic', fontFamily: "'Manrope', sans-serif", margin: '2px 0 8px' }}>{spAddSignal.read || 'index-inclusion odds, top 5'}</div>
                  {(spAddSignal.sp500_add.top || []).map((n: any, j: number) => (
                    <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, padding: '2.5px 0' }}>
                      <span style={{ fontSize: 12, fontFamily: "'Manrope', sans-serif", fontVariantNumeric: 'tabular-nums', color: t.textSecondary }}>
                        {n.ticker}
                        <span style={{ fontSize: 11, color: t.textTertiary, marginLeft: 8, fontFamily: "'Manrope', sans-serif" }}>{n.company}</span>
                        {SP_ADD_TAGS[n.ticker] && <span style={{ fontSize: 9.5, marginLeft: 8, color: SP_ADD_TAGS[n.ticker].color, fontFamily: "'Manrope', sans-serif", fontVariantNumeric: 'tabular-nums' }}>{SP_ADD_TAGS[n.ticker].label}</span>}
                      </span>
                      <span style={{ fontSize: 13, fontFamily: "'Manrope', sans-serif", fontVariantNumeric: 'tabular-nums', color: t.textPrimary, flexShrink: 0 }}>{Math.round(n.prob * 100)}%</span>
                    </div>
                  ))}
                </div>
              )}
              {stdCrowd.length > 6 && <div style={{ fontSize: 11, color: t.textTertiary, paddingTop: 8, fontStyle: 'italic' }}>+{stdCrowd.length - 6} more</div>}
            </div>
          )}
        </div>

        {/* Quant Signal — macro regime panel */}
        <div style={{ ...glass, borderRadius: 14, padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#5ba3c9' }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: t.textSecondary, fontFamily: "'Manrope', sans-serif" }}>Quant Signal</span>
          </div>
          {!hasQuant ? (
            <div style={{ fontSize: 13, color: t.textTertiary, padding: '16px 0', fontFamily: "'Manrope', sans-serif", fontStyle: 'italic' }}>No quant data today.</div>
          ) : (
            <>
              {macro?.spy && (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: t.textTertiary }}>SPY</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 22, fontWeight: 500, fontFamily: "'Manrope', sans-serif", fontVariantNumeric: 'tabular-nums', color: t.textPrimary }}>${macro.spy.price?.toFixed(2)}</span>
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
                    <span style={{ fontSize: 18, fontWeight: 500, fontFamily: "'Manrope', sans-serif", fontVariantNumeric: 'tabular-nums', color: rsi > 70 ? t.negative : rsi < 25 ? t.positive : t.textPrimary }}>{rsi.toFixed(1)}</span>
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
                      <span style={{ fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase', background: t.badgeBg, color: t.badgeText, padding: '2px 6px', borderRadius: 3, fontFamily: "'Manrope', sans-serif" }}>official</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 18, fontWeight: 500, fontFamily: "'Manrope', sans-serif", fontVariantNumeric: 'tabular-nums', color: t.textPrimary }}>{macro.cpi?.yoy != null ? `${macro.cpi.yoy.toFixed(1)}%` : '—'}</span>
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
                      <span style={{ fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase', background: 'rgba(91,163,201,0.16)', color: '#5ba3c9', padding: '2px 6px', borderRadius: 3, fontFamily: "'Manrope', sans-serif" }}>forecast</span>
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 500, fontFamily: "'Manrope', sans-serif", fontVariantNumeric: 'tabular-nums', color: macro.nowcast?.yoy != null ? (macro.nowcast.yoy >= 4 ? t.negative : t.textPrimary) : t.textTertiary }}>{macro.nowcast?.yoy != null ? `${macro.nowcast.yoy.toFixed(1)}%` : '—'}</span>
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
                          <span style={{ fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase', background: 'rgba(224,145,92,0.16)', color: '#e0915c', padding: '2px 6px', borderRadius: 3, fontFamily: "'Manrope', sans-serif" }}>market</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                          <span style={{ fontSize: 18, fontWeight: 500, fontFamily: "'Manrope', sans-serif", fontVariantNumeric: 'tabular-nums', color: macro.kalshi.point_estimate >= 4 ? t.negative : t.textPrimary }}>{macro.kalshi.point_estimate.toFixed(1)}%</span>
                          {macro.kalshi.prob_above_4 != null && (
                            <span style={{ fontSize: 11, fontFamily: "'Manrope', sans-serif", fontVariantNumeric: 'tabular-nums', color: t.textTertiary }}>P(&gt;4%) {Math.round(macro.kalshi.prob_above_4 * 100)}%</span>
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
                        <span style={{ fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: macro.regime.above ? t.negative : t.positive, fontFamily: "'Manrope', sans-serif", fontWeight: 700 }}>{macro.regime.above ? 'Above 4% regime' : 'Below 4% regime'}</span>
                        <span style={{ fontSize: 12, fontFamily: "'Manrope', sans-serif", fontVariantNumeric: 'tabular-nums', color: macro.regime.above ? t.negative : t.positive }}>{macro.regime.value?.toFixed(1)}% {macro.regime.above ? '>' : '<'} {macro.regime.threshold?.toFixed(1)}%</span>
                      </div>
                      {macro.regime.votes_above != null && macro.regime.legs_total != null && (
                        <div style={{ fontSize: 10, color: macro.regime.above ? t.negative : t.positive, fontFamily: "'Manrope', sans-serif", fontVariantNumeric: 'tabular-nums', opacity: 0.85, marginBottom: 6 }}>{macro.regime.votes_above} of {macro.regime.legs_total} legs ≥ {macro.regime.threshold?.toFixed(1)}%</div>
                      )}
                      <p style={{ margin: 0, fontSize: 12, color: t.textSecondary, fontFamily: "'Manrope', sans-serif", fontStyle: 'italic', lineHeight: 1.6 }}>{macro.regime.note}.</p>
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
