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
    asOf: 'August 9, 2026',
    active: true,
    themes: [
      {
        name: 'AI Compute',
        editorial: `He called it: “The bottom is in as far as I’m concerned on a probability basis.” The four-day rally off the Situational Awareness low ran close to 10% on the Nasdaq — larger than the entire May-to-July pennant it broke out of — and the follow-through landed exactly where his day-4-to-10 test wanted it. On the week the S&P added 3.6%, the Nasdaq 5%, and his own 100-name thematic portfolio 6.5%, its second-best week of the year. Confirmation is broad rather than narrow: the S&P is up 13% year to date with every sector green, and the equal-weight S&P, IWM and the NYSE Composite all printed new all-time highs alongside the DAX and the FTSE. Korea, the market people kept telling him was the problem, is up 61% year to date with its technology sector up 116%. Factor volatility collapsed, the VIX sits at its lowest since January, and CDX never moved — there was no credit event underneath any of it. He expects new all-time highs in many AI names by year-end. The seat-level news is where he has shifted: “the area I’m probably most focused on at this point is the optical names,” and the reason is Vera Rubin, with Eaton and Schneider both reporting this week as electrical participants in it. He carries a good-sized Nvidia position added over the prior three weeks, on Gavin Baker’s point that it now trades at its lowest forward P/E in a decade. The scarcity number that matters: the same B200 cluster that rented near $2 per GPU-hour seven months ago is now expected to rent just under $4. The structural caution is unchanged and sharper — he is calling peak gross leverage, which keeps factor volatility structurally higher and means index puts no longer hedge this book; his replacement tool is the 50-day rate of change on the thematic index, which topped near +50% in May and bottomed near −10%.`,
        tickers: ['SOXX', 'AIPO', 'COPX', 'GLW', 'ASML'],
        bucket: 'AI Compute',
        wholeBucket: true,
      },
      {
        name: 'AI Application',
        editorial: `Palantir is the proof-of-adoption print, and it is both the only software name he owns personally and a seat in the thematic portfolio: commercial revenue of $764M against $306M a year ago, with 220 deals of at least $1M, 98 of at least $5M and 78 of at least $10M closed in the quarter. He also flagged Cadence and Synopsys, the software-design pair inside his index, as names he expects to be talking about soon. The framing underneath is unchanged and still hostile to most of this sleeve: adoption is accelerating because agents are tireless, which compresses economic time, makes terminal value unknowable, and takes companies from a 30 multiple to a 20 in a very short amount of time. Google is the live example — Jeff Dean gone after 27 years, Demis moved into another role, another $25B of debt issued this week — and his read is simply that if you don’t know, the multiple should compress. He extends it into a class call: negative on public equities by 2030, with bureaucracy the killer and AI-native single-employee companies the competition, and new business formations already going parabolic. The labour data is the same story from the other side — average hourly earnings down to 3.2% year over year, aggregate weekly payrolls at their weakest six-month rate of change since 2012 excluding COVID, and no job creation at all once healthcare is stripped out. Neither Lilly nor Amazon drew direct commentary this window, so both seats carry forward on prior conviction rather than fresh sponsorship.`,
        tickers: ['LLY', 'AMZN'],
        bucket: 'AI Application',
        wholeBucket: true,
      },
      {
        name: 'Tokenization',
        editorial: `The gate has not opened and he is explicit about it — “Bitcoin is still in a bear market until we get above there,” meaning the 200-day, and anything below it is a trading vehicle rather than an investment. What changed is the quality of the tape underneath. Bitcoin absorbed a genuinely bad news week and held: the Clarity Act’s odds of being signed this year fell from roughly 50% three weeks ago to 40% and then to 17%, Strategy sold more Bitcoin, and a Coldcard exploit hit cold-storage confidence — and he reads that non-reaction as the setup rather than the warning. The larger call is that the last ten trading days will be looked back on as the inflection, with the yen intervention as proof the tool cupboard is bare. He is committing to the view structurally, not just in the book: a crypto vertical joins his paid research in late September into early October, timed to when traditional finance is both forced and intrigued into the space. The forward mechanism is unchanged — this year is AI agents, next year is consumer agents, which means transaction volume through stablecoins, and he argues that happens regardless of the Clarity Act, with the SEC and CFTC expected to supplement it. His 40-name token index ecosystem is behaving well. Discipline holds for our seats: both sit below their 200-day, so the thesis is binding while the entry gate stays shut, and paused is not sold.`,
        tickers: ['HOOD', 'ETHA'],
        bucket: 'Tokenization',
        wholeBucket: true,
      },
      {
        name: 'Monetary Scarcity',
        editorial: `This is the week the debasement trade stopped being dormant. The trigger was the first coordinated US-BOJ intervention in the yen since 1998, financed in a way he calls unprecedented, with Bessent leaning on the Fed to lift the FIMA repo cap and the Treasury’s exchange stabilisation fund already out of ammunition — “we’re running hot into a scarcity of tools for the Fed.” The market answered immediately. Gold rose 7.2%, its third-biggest week in sixteen years, and closed back above its 50-day for the first time since March after the third-longest stretch below it on record. Platinum broke its 50-day. Silver closed above its 50-day on Friday. He bought silver again on Monday morning, and the framing is now explicitly dual-axis, which is exactly how this book carries it: “I have a good size position in silver because of the AI side, but I like it now because of the debasement side.” Positioning is fuel rather than resistance — dollar longs at their most crowded reading with the dollar already broken down. The cross-current is that the market still prices a 45% chance of a September Fed hike and 63% from the BOJ, which he thinks is badly wrong given average hourly earnings at 3.2% and Trueflation’s core reading collapsing over the last four weeks while CPI core has not caught up. Thirty-year yields sit near multi-decade highs in the US, UK, Japan and Germany at once, and the conclusion is Lyn Alden’s: nothing stops this train, because equity drawdowns cut corporate tax receipts into a 5-6% deficit and force the response every time.`,
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
    asOf: 'August 8, 2026',
    active: true,
    themes: [
      {
        name: 'AI Application',
        editorial: `Amazon is still his anchor and the purest AI-efficiency bet — AWS, in-house Trainium silicon, robotics and logistics compounding into real-world margin — and the 8/8 robotics session reinforced the robotics leg specifically: Amazon is not chasing the humanoid form factor as aggressively as others, but has so much happening in robotics that “you cannot count out Amazon by any means.” Robinhood is the other high-conviction hold, sharpened on 7/15 around agentic trading as “the biggest gamechanger I’ve ever seen for brokers like Robin Hood,” one he thinks could 100x trading volume; still a top-30 name he has added on every dip into the 70s. The new material this window is humanoids, and the headline is a timeline extension rather than an acceleration. Tesla remains, in his words, the only meaningful public-market play; everything real is private — Figure, Apptronik, 1X, Skild, Physical Intelligence and Sunday — with Boston Dynamics folding further into Hyundai and Agility coming public via SPAC, which he does not love. His pragmatic schedule: very small deployments late this year, small deployments through 2027, first scale deployments in 2028, and an IPO window in 2028 — “it’s not now, it’s not 26.” Two structural points worth logging. The new ruling bans all non-US bots, requiring 65% of bill-of-materials cost to be made domestically and rising toward 80% by the early 2030s; Optimus’s supply chain is believed to be largely Chinese, which he suspects is a real part of Elon’s delay, and it makes in-house actuation design the moat skill. And early deployment will be wheeled rather than bipedal — cheaper, materially safer, good for roughly 80% of early use cases, and sharing an identical upper body so the learning carries across. Read against our own book, this is a hold-the-line confirmation for Stage 5, not a call to seat it.`,
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
    asOf: 'wk of Aug 3 – 10 · via Grok',
    active: true,
    themes: [
      {
        name: 'AI Healthcare & Genomics',
        editorial: `Palantir is the fresh block and it is the one that converges. He frames it as “over one year of building a base after a big advance,” with the earnings candle reclaiming its moving averages and breaking the downtrend from the highs — around 172 against a 50-day SMA of 154.73 and a 20-day EMA of 138.39, with the prior high at 207 — and calls it one of the original leaders of this bull market for good reason, second only to Nvidia on execution. That gives PLTR two legs this window, since Visser owns it personally and carries it in his thematic portfolio; under the tiered model that is a genuine cross-voice convergence, though the wiring remains display-only. ServiceNow was a lighter mention on the Jensen endorsement angle, around 124.88 and still below its 50-day SMA of 132.67 — an observation, not a setup. The carried names have now aged out: Tempus AI and AbCellera were last affirmed in the June 26 to July 2 window and sit beyond the 45-day ZaStocks decay, so treat that conviction as expired rather than merely aging. Neither has been re-affirmed since, and TEM’s convergence with our own AI Application second-seat watch lapses with it.`,
        tickers: ['TEM', 'ABCL'],
        curated: true,
      },
      {
        name: 'AI Compute — pre-consensus holds',
        editorial: `A full week of charts after the silence, and the stance is constructive but deliberately unhurried — the Nasdaq is still a three-month range, and “overtrading in a choppy or sideways market can do more damage than trading infrequently during a downtrend.” Nvidia is the anchor: “hard to get bearish when the AI king looks like this,” a monster base consolidating near 223.96 above rising averages, with horizontal resistance near 220, a 20-day EMA of 202.61 and a 50-day SMA of 190.94 — plus his corollary that every major AI earnings call still routes back to it. Intel is the new name, built on a stated $100 level with the chart near 101.65 against a 50-day SMA of 95.24, and the catalyst is Terafab: “SpaceX choosing Intel as a key partner feels like a bigger deal than anyone thinks.” HPE is now a stated position rather than a wish — the framework name he has quoted all month, “stocks that don’t breakdown during weakness often lead during strength,” trading near 47.90 above a 20-day EMA of 44.26 and a 50-day SMA of 39.16. Dell stays as declared ownership with no level given. SPCX draws his most enthusiastic language on the Elon posting flow and the SpaceX-absorbs-Tesla narrative, and stays exactly where we put it — off-thesis, no pillar fit, no gateable technicals as a new listing. Oracle did not reappear this window.`,
        tickers: ['ARM', 'MRVL', 'DELL', 'MU'],
        curated: true,
      },
      {
        name: 'Broadening: energy storage & fintech',
        editorial: `Uber is the only genuinely new name outside compute, and it is a long-horizon setup rather than a trigger: the 200-week moving average, with that line near 64.79 while price trades around 75.02 and still well below a 50-day SMA of 80.51 — a base reclaim in progress, with the Pelosi-bought framing attached as colour. Neither Fluence nor Upstart reappeared for a third straight window, so FLNC stays watch-not-seat with its own tape the binding constraint rather than the thesis. The ledger note that keeps mattering: this is the fifth consecutive window in which he has named zero of our book holdings — no AIPO, SOXX, GLW, ASML, SKHY, COPX, SLV, GLDM, IBIT, LLY, AMZN, HOOD or ETHA. The psychology he published is worth keeping directly next to the Visser bottom call, because it is the more cautious of the two: “the first signs of weakness after a rally off a low says more about the market than the rally itself,” and if that weakness isn’t bought, the move was a temporary bounce — which makes relative strength and standout performance the thing to track, not the index.`,
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
