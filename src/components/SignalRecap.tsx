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
    asOf: 'July 2026',
    active: true,
    themes: [
      {
        name: 'AI Compute',
        editorial: `Power is still the binding bottleneck — grid capacity is the supply crisis data-center demand can't outrun — but he's turned far more selective on the compute side. On 7/5 he said he'd "rotated the majority of my AI-infrastructure money, particularly on the semi side," out of the parabolic chip trade and into scarcity and the application layer, keeping only what's structurally working — power, optical, copper, and batteries as the near-term grid fix (he still holds Marvell and Fluence, and flags the Fluence–Nvidia deal as a capacity-unlock catalyst). His tell: the infrastructure trade is "consolidating," not leading — semis are the funding side now, not the driver.`,
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
        editorial: `The scarcity trade, now being actively accumulated into weakness. On 7/5 he said he'd "moved into a bunch of silver and Bitcoin names," buying the debasement selloff that Fed-hike repositioning drove — a move he thinks is wrong, since the dollar is crowded long and its unwind is "good for gold, good for silver, good for Bitcoin." Bitcoin is bottoming below its 200-day, echoing Micron's long base, with a clean trigger: "if we get above the 200-day, Bitcoin will probably lead." Silver stays the standout on a sixth-year industrial deficit. He still reads inflation as nearer a peak than an acceleration (expectations at a year-low), so this is conviction in structural debasement, not an inflation chase.`,
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
  {
    name: 'ZaStocks',
    headline: 'THINK BIGGER ON THE LEADERS',
    subtitle: 'ZaStocks (@ZaStocks) — technical setups and the AI market broadening beyond core semis',
    asOf: 'wk of Jun 29 – Jul 6 · via Grok',
    active: true,
    themes: [
      {
        name: 'AI Healthcare & Genomics',
        editorial: `His clearest fresh setups sit in AI healthcare and genomics, where he expects the next parabolic moves once "curing diseases" headlines hit. Tempus AI (TEM): ~27% short interest, Pelosi-disclosure attention, reclaiming its key moving averages (chart ~$50–64) inside a multi-month base. AbCellera (ABCL): explosive recent volume on a multi-year base he comps to prior runners like RKLB, PLTR, HOOD, and EOSE. Both are Watching — chart-driven candidates to run through the gates, not confirmed holds. TEM converges with our own AI Application 2nd-seat watch.`,
        tickers: ['TEM', 'ABCL'],
        curated: true,
      },
      {
        name: 'AI Compute — pre-consensus holds',
        editorial: `His held AI-Compute names, owned before they were consensus: Arm (ARM), Marvell (MRVL), and Dell (DELL) — "positions I've owned for months… they weren't consensus leaders when I bought," now choppier as leaders but he's not selling. The counterweight this week was a caution, not a buy: on SanDisk (SNDK) he warned against chasing a name already up hundreds of percent — "picking up crumbs after the feast," contrasting a $500 cost basis with buying in at $2,000+.`,
        tickers: ['ARM', 'MRVL', 'DELL', 'SNDK'],
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
    return <div style={{ textAlign: 'center', padding: '64px 0', color: t.textTertiary, fontFamily: "'Libre Baskerville', Georgia, serif", fontStyle: 'italic' }}>Awaiting first signal...</div>
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
              {stdCrowd.slice(0, 6).map((s: any, i: number) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: i < Math.min(stdCrowd.length, 6) - 1 ? `1px solid ${t.border}` : 'none' }}>
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
              {spAddSignal && spAddSignal.sp500_add && (
                <div style={{ padding: '12px 0 2px', borderTop: `1px solid ${t.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                    <span style={{ fontSize: 12, color: t.textSecondary, lineHeight: 1.3, fontFamily: "'Libre Baskerville', Georgia, serif" }}>
                      Next S&amp;P 500 additions
                      {spAddSignal.sp500_add.quarter && <span style={{ fontSize: 9, fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: ACCENT, border: `1px solid ${ACCENT}66`, borderRadius: 4, padding: '1px 5px', marginLeft: 6, verticalAlign: 1 }}>{spAddSignal.sp500_add.quarter}</span>}
                    </span>
                    {spAddSignal.close_time && <span style={{ fontSize: 10, color: t.textTertiary, flexShrink: 0, opacity: 0.9, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>resolves {new Date(spAddSignal.close_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: t.textTertiary, fontStyle: 'italic', fontFamily: "'Libre Baskerville', Georgia, serif", margin: '2px 0 8px' }}>{spAddSignal.read || 'index-inclusion odds, top 5'}</div>
                  {(spAddSignal.sp500_add.top || []).map((n: any, j: number) => (
                    <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, padding: '2.5px 0' }}>
                      <span style={{ fontSize: 12, fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: t.textSecondary }}>
                        {n.ticker}
                        <span style={{ fontSize: 11, color: t.textTertiary, marginLeft: 8, fontFamily: "'Libre Baskerville', Georgia, serif" }}>{n.company}</span>
                        {SP_ADD_TAGS[n.ticker] && <span style={{ fontSize: 9.5, marginLeft: 8, color: SP_ADD_TAGS[n.ticker].color, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>{SP_ADD_TAGS[n.ticker].label}</span>}
                      </span>
                      <span style={{ fontSize: 13, fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: t.textPrimary, flexShrink: 0 }}>{Math.round(n.prob * 100)}%</span>
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
