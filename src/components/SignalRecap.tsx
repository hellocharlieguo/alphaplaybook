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
    asOf: 'August 2, 2026',
    active: true,
    themes: [
      {
        name: 'AI Compute',
        editorial: `The July rout was a leverage event, not a thesis event, and he spent both episodes making that case with other people's numbers. His own ranking is unambiguous — compute demand is insatiable is the one call he says to keep if everything else he says is wrong: “compute demand is insatiable… if I'm wrong about everything, number eight's the most important thing.” The evidence is the hyperscaler prints, which went the opposite way from the tape: they raised capex rather than cutting it, and every one of them said the same thing on the call — Microsoft “customer demand continues to exceed available capacity,” Google “we continue to be supply constrained,” Meta “nowhere near enough compute for all the demand,” and Amazon flagging that “the lion's share of AWS 2027 compute capacity is already reserved.” Contracted backlog across the cloud names now runs past $2T. Memory is the sleeve that actually re-rated, and it re-rated down a notch rather than out: “the easiest part of the AI trade is over officially” and “we just went from 60 to 1,200. We've pulled back to 850. If we're lucky, we'll get to 5,000 — over the next 5 years, 6 years. We're not doing another one.” That is a second-derivative call, not a top — DRAM contract prices are still rising every week, just decelerating, and he bought Micron back below 900 at roughly a fifth of his May size. Corning got singled out as one of his ten concentrated names, back to where it closed on the Meta $6B announcement after holding its 200-day, with a separate Nvidia partnership behind it. He also added AAOI on the optical side. The structural caution he keeps attached to all of it: leverage is not coming back, so expect more speed crashes.`,
        tickers: ['SOXX', 'AIPO', 'COPX', 'GLW', 'ASML'],
        bucket: 'AI Compute',
        wholeBucket: true,
      },
      {
        name: 'AI Application',
        editorial: `The frame sharpened into something close to a warning. He now splits the cycle in two — “we're actually entering the boring part, which is the productivity part. The exciting part is the buildout part” — and is explicit that the seats here are no longer the high-beta trade: “no company is going to get revenues growing big enough because the enterprises can't do that,” with the payoff arriving through expense reduction rather than top-line. That is the constructive read. The destructive one runs underneath it and applies to every name with a multiple: “AI turns everyone from a growth company into a cyclical company because eventually you get your head knocked off by AI,” which he ties directly to the multiple compression already visible — S&amp;P earnings growing above 20% while the index is not. Companies that lose terminal value “should trade at a single-digit multiple.” Read that as a valuation-risk headwind on the application sleeve specifically, since compute has physical scarcity as a defence and software does not. Amazon is the exception inside the seat: he read its call approvingly, with a ~$500B backlog and capacity already reserved into 2027. Lilly is untouched by any of this cycle's commentary.`,
        tickers: ['LLY', 'AMZN'],
        bucket: 'AI Application',
        wholeBucket: true,
      },
      {
        name: 'Tokenization',
        editorial: `The clearest new thesis statement of the cycle, and it moves this sleeve from forward catalyst to live: “the only thing left in the buildout is the financial guardrails to deal with the AI agents. That is the next trade.” He put a full Substack behind it — Billions Served: Why AI Needs Crypto Financial Guardrails — arguing that billions of autonomous agents cannot transact through a financial system built around banking hours and manual approval, and that stablecoins, programmable wallets, cryptographic identity and smart contracts are the architecture they will require. The Stripe bid for PayPal is the industry tell he points at. On expression he is specific and it favours the smaller seat: Ethereum is “the safest of the Solanas, the Suis” for institutional money, and “I think Ethereum's going to benefit the most” from stablecoin adoption and consumer agents. ETH outperforming Bitcoin, alongside his 40-name token index also outperforming, is the ecosystem-energy signal he is reading. Timing: consumer agents become the story roughly a year out. The discipline note stands regardless — both seats here are trading below their 200-day, so the thesis is binding while the entry gate is not open.`,
        tickers: ['HOOD', 'ETHA'],
        bucket: 'Tokenization',
        wholeBucket: true,
      },
      {
        name: 'Monetary Scarcity',
        editorial: `Holding, not adding, and the near-term commentary got more cautious rather than less. The tell is retail: the energy that drove this complex is gone and he does not expect it back soon — “you need the energy of retail, and we're just not going to get back to that anytime soon. I talked about that with silver, gold, and Bitcoin.” Asked directly what else qualifies as a store of value alongside Bitcoin, he named gold and stopped there; silver did not come up, and its industrial leg went unmentioned across both episodes. The one constructive cross-current is positioning — crowded long dollar at four-year highs, with the dollar already softening, which he notes is usually good for gold and silver. Macro backdrop is neutral to slightly unhelpful: the Fed held, inflation expectations for the August print sit near zero, and CPI has come back down, which keeps the debasement trigger dormant rather than firing. The structural case is unchanged and, if anything, he leans on it harder — deflationary AI pressure making terminal value unknowable is precisely why he wants something that cannot be competed away. The gate discipline is unchanged too: every seat in this sleeve is below its 200-day, so accumulate into weakness, do not front-run the reclaim.`,
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
    asOf: 'wk of Jul 27 – Aug 3 · via Grok',
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
        editorial: `A near-silent week by design — he went defensive and posted almost nothing, which is itself the signal. He reads the Situational Awareness liquidation as the moment the excess leverage came out of the AI trade, drawing the LTCM parallel directly, and is watching for confirmation rather than acting: market health still weak, with the tell being that “none of the heavy hitters were bought this season” on earnings. Two new charts. HPE is the cleanest expression of his framework — “stocks that don't breakdown during weakness often lead during strength” — consolidating near its highs above rising averages. Oracle is the contrarian one: “everyone seems convinced Oracle is dead. I'm not,” testing longer-term support after a multi-month unwind. Dell keeps the strongest framing and stays quarantined — “there's still no other AI stock that looks like this. If the AI trade bounces back, this is arguably the leader” — ZaStocks-only, no Visser or Camillo leg, and the most extended name on our sheet at roughly double its 200-day. Marvell remains the one genuine convergence with Visser, but it sits inside SOXX rather than earning a standalone seat. Tesla and SanDisk were asides, not legs. The ledger note that matters: this is the fourth consecutive window in which he has named zero book holdings.`,
        tickers: ['ARM', 'MRVL', 'DELL', 'MU'],
        curated: true,
      },
      {
        name: 'Broadening: energy storage & fintech',
        editorial: `Nothing new here this window — and the absence is worth logging rather than papering over. Neither Fluence nor Upstart reappeared, and no fresh broadening candidate was nominated; his output was three AI-compute charts and risk discipline. FLNC accordingly stays where it was — watch, not seat — with its own tape now the binding constraint rather than the thesis. The psychology he did publish is the useful part, and it maps onto the current setup: “most money is made in the middle 80% of the move, not the first or last 10%,” with people obsessed with calling the exact bottom often having no capital left when it arrives, and “you don't need to catch the bottom to make a ton of money.” Paired with his standing caveat about there being more AI losers than winners, that is a broadening lens on hold rather than a broadening lens firing.`,
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
