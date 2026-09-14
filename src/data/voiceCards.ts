// src/data/voiceCards.ts
// AlphaPlaybook — voice ledger cards. Extracted from SignalRecap.tsx 2026-08-17
// so the weekly cycle is a one-file edit. Render logic stays in the component.
//
// Cycle 2026-09-14 freeze — '2026-09-14-v3.5-asmlcut'. TICKER SET 12 -> 11.
// ASML removed under Rule B: holding #17 in SOXX at 2.49% (34-name list dated
// 2026-08-20), so the lithography seat sat inside the semis basket seat. GLW was
// checked against the same list and is ABSENT — Corning is glass and optical, not
// a semiconductor — so the optical seat is not redundant and stays. ASML also
// carried a standing NO VOICE SUPPORT flag: zero mentions in over a month.
//
// AI Buildout trend weight OVERRIDDEN to 24.70 — a logged discretionary override
// per workflow 5.1, not engine output. Breadth falls 1.7458 -> 1.6716 on the
// removal, which would cut the sleeve to 24.43. +0.27pp. Derived timing RISES
// 0.9040 -> 0.9300 because the removed name was `cooling`.
//
// No classification changed. Three entry bands moved on 9/11 closes: AIPO and GLW
// both broke BELOW their 200-DMAs (band 0.95 -> 0.75, still `binding` — the rung
// is the bottleneck, the band is the price), AMZN fell below its 50-DMA into base
// 72 (0.85 -> 0.95). 26.9% of the book is now entry-paused, up from 16.9%.
// Turnover 12.61pp, of which 5.0 is the ASML removal.
//
// CAMILLO IS STALE FOR A SECOND WEEK. No capture since 8/24-8/30. AMZN's lenses=2
// convergence flag runs on <=120d ledger history, not current evidence.
//
// Superseded note from the 2026-09-07 cycle: The cron still runs '2026-08-31-v3.4.1-stageflip'.
// No §5d criterion fired: ticker set unchanged at 12, no stage flip survived, no
// candidate cleared the L2 gate. One input moved — the adoption wave, coding agents
// → consumer agents (Visser 9/6). Canonical worksheet drift vs deployed is 3.13pp.
//
// ETHA working→binding was considered and REJECTED for a second week: the 8/31 flip
// already consumed that evidence (Visser 8/30, 'this is the catalyst point'), and
// the 9/6 language restates it rather than escalating. One rung at a time.
//
// CAMILLO IS STALE. No capture exists for 8/31-9/7; his card below still describes
// the 8/24-8/30 window and asOf is unchanged on purpose. AMZN's lenses=2 convergence
// flag is running on ≤120d ledger history, not on this week's evidence.
//
// SOL is a NAMED GAP, not a seat. Visser 9/5 splits crypto into three roles —
// Bitcoin collateral, Ethereum trust, Solana speed — and the book expresses two.
// BSOL/GSOL added to the correlation and candidate pulls 9/07; watch-not-seat until
// measured. Seating SOL as a third Rails sub-theme would cost ETHA 3.3-4.3pp.
//
// Theme names below use v3.4 trend vocabulary — AI Buildout / AI Applied /
// Tokenized Rails / Monetary — matching daily-cron.cjs BASE_PORTFOLIO.

export interface VoiceSection {
  name: string
  headline: string
  subtitle: string
  asOf: string          // freshness stamp — when this voice last produced signal
  active: boolean        // true = feeds radar/engine; false = frozen reference card
  themes: {
    name: string
    editorial: string
    tickers: string[]      // DEAD as of 9/02 audit — SignalRecap renders name + editorial only
    curated?: boolean       // true: always show these tickers verbatim (social-arb picks not in the book)
    bucket?: string         // which engine portfolio bucket these tickers map to
    wholeBucket?: boolean    // DEAD — grep for wholeBucket returns zero readers anywhere in src/. Kept as the spec for ticker chips, a feature specced here but never built. Do not trust these four fields to describe rendering.
  }[]
}

export const VOICES: VoiceSection[] = [
  {
    name: 'Visser',
    headline: 'LONG SCARCITY, SHORT ABUNDANCE',
    subtitle: 'Jordi Visser — macro framework for the physical AI upgrade',
    asOf: 'September 13, 2026',
    active: true,
    themes: [
      {
        name: 'AI Buildout',
        editorial: `The sleeve went quiet in the transcripts and loud in the tape, and those point the same way. Across both episodes AIPO, SOXX, GLW and COPX drew one alias-level mention each and no stage call — the buildout got almost none of his airtime in a week he spent on crypto and the Fed. Meanwhile AIPO broke below its 200-day at 27.43 against 27.81, and GLW broke below its at 143.72 against 145.81. Both remain classified binding, because the rung describes the bottleneck and the entry band handles the price, but both now sit on the ×0.75 floor and 26.9% of the book is entry-paused. The structural change this week is a removal rather than a call: ASML is out. It is holding number seventeen inside SOXX at 2.49%, so the lithography seat was partly a second helping of the semis basket seat — the same reasoning that de-seated Micron and Marvell under Rule B back in v3.3. Corning was checked against the same 34-name list and is absent, which is why the optical seat survives the cut while the lithography one does not. ASML had also carried a NO VOICE SUPPORT flag for over a month, so nothing in the transcripts argued for keeping it. Where he did engage with hardware, it was Micron, and the framing was deliberately deflationary: he does not expect another five-bagger, he sketches 1,600 to 2,000 from roughly a thousand as the realistic range, and he notes he got out of it before the top last cycle. Memory remains the only maximum-demand sub-theme with no seat, and Rule B bars the one vehicle he actually names.`,
        tickers: ['AIPO', 'GLW', 'ASML', 'SOXX', 'COPX'],
        bucket: 'AI Buildout',
      },
      {
        name: 'AI Applied',
        editorial: `The wave did not move this week, and that is the finding. The structural-language sweep across both episodes turned up no role-assignment statement and no wave transition, so the book stays on consumer agents with the same demand table it carried last week. Neither Amazon nor Eli Lilly drew a Visser mention — AMZN appears six times and almost all of it is other people's context — so both seats continue to rest on prior weeks, and with Camillo dark for a second week AMZN's convergence flag is running on ledger history rather than current evidence. What moved was price. Amazon slipped below its 50-day at 253.57 against 255.47, which under the entry ladder raises its band from 0.85 to 0.95 and lifts it into a tie with Lilly at 13.2 — the first time the distribution seat has matched the proprietary-data one. That is the anti-momentum brake working as designed: the name got cheaper relative to its own trend and the engine bought more of it, with no change in what anyone said about it. His broader framing carried over intact from last week — agents force infrastructure, and the interesting agents are now personal and workflow rather than coding.`,
        tickers: ['LLY', 'AMZN'],
        bucket: 'AI Applied',
      },
      {
        name: 'Tokenized Rails',
        editorial: `This was the loudest sleeve of the week by a distance — Robinhood, Ethereum and Bitcoin together account for most of his airtime across both episodes — and the single most useful sentence is a stage marker rather than a price call. On what Robinhood has built: the chain running on Ethereum through Arbitrum is, in his words, literally saying we are at the beginning of tokenization. The beginning. That phrasing is why the settlement seat holds at working for a third consecutive week rather than advancing — a thesis restated, even emphatically, is not a rung, and he is explicitly describing an early stage rather than a binding constraint. He expects network effects to compound from here and spent the week researching a valuation framework for chains as ecosystems, borrowing the comparison to the internet itself, with a source who has worked on both the Ethereum and Solana foundations. Solana itself drew only two passing mentions, materially weaker than the three-horsemen framing of the prior week, so the speed role stays a named gap rather than a candidate — though GSOL now has clean correlation data whenever it is worth scoring. Robinhood ran into the week and then gave some back, stretch easing from 19.2% to 10.5%, which lifts nothing: the seat trims to 7.4 on the trend's fixed share.`,
        tickers: ['ETHA', 'HOOD'],
        bucket: 'Tokenized Rails',
      },
      {
        name: 'Monetary',
        editorial: `Third consecutive week with no Visser mention of gold or silver, which is now the most durable fact on this card. The 8/30 relative de-rate — higher, but not the fastest horse, and not in the top hundred, because gold will not be part of the economy going forward — still governs GLDM's working classification a month later, unrefreshed. Silver has not been named since 8/16. Neither absence is a stage call and neither moved anything; silence ages a classification rather than changing it. Both remain below their 200-day averages and entry-paused at ×0.75, together 16.9% of the book sitting on the floor. Bitcoin is where the conviction went. The Pomp episode ran under the title that crypto wins regardless of what the Fed does, and his argument is the same double-debasement structure he has been building: crypto takes a rising share of fiat assets because AI disrupts the earning power behind the old assets and because the government cannot let rates run ahead of the midterms. He adds an ecosystem argument — what matters most to him is the system as a whole, and Bitcoin can keep going higher and drag the rest along. IBIT's stretch eased from 18.8% to 14.5% without changing bands, so the seat holds flat at 12.2.`,
        tickers: ['IBIT', 'GLDM', 'SLV'],
        bucket: 'Monetary',
      },
    ],
  },
  {
    name: 'Camillo',
    headline: 'INFORMATION EDGE, NOT VIBES',
    subtitle: 'Chris Camillo — social arbitrage; nomination only, cannot move themes',
    asOf: 'August 30, 2026',
    active: true,
    themes: [
      {
        name: 'AI Applied',
        editorial: `Amazon remains the core, high-conviction mega-position and the anchor of everything he says. On 30 August he addressed the rate-hike risk directly and dismissed it as known short-term noise that changes nothing about the larger thesis — that the market still underestimates Amazon's role in the AI infrastructure buildout. Unofficial trackers continue to put it at a large majority of his estimated public exposure. The methodological point he made this week is the one worth keeping: he warned people sizing up Nvidia into earnings that conviction without an information edge is just confidence dressed up as research. He is not against earnings trades; he is against doing them without the work.`,
        tickers: ['AMZN'],
        curated: true,
      },
      {
        name: 'Consumer product cycle',
        editorial: `The new and active idea is Take-Two. He bought after the leaked GTA VI gameplay on 21 August and posted through the week: unpolished footage showing a leap in world density, NPC behaviour and systemic depth — the world feels alive — which he read as a possible generational leap rather than a graphics upgrade. He has traded GTA cycles since 1999. He framed it explicitly as speculative with real downside if the game does not land with players, and pushed back on the priced-in objection for arriving without numbers, units or ARPU attached. The process note underneath is his standard one: go to primary sources, small accounts and actual consumers, because algorithms surface the consensus take rather than the ground truth. Nomination only — TTWO is not a book name and cannot seat on one voice.`,
        tickers: ['TTWO'],
        curated: true,
      },
      {
        name: 'AI Buildout',
        editorial: `Bloom Energy carries forward from 9 August and was not named again this window. The re-rate then was on entry quality rather than thesis: BE fell from roughly $300 to $165, about −45%, on forced flow — a margin call on an estimated $10B+ position alongside the simultaneous liquidation of essentially every levered South Korean fund, where BE is among the most actively traded names. He added into it at roughly 1x against the forced seller's 4x. One voice leg, no convergence, and the coverage overlap against AIPO is unresolved — watch, not seat.`,
        tickers: ['BE'],
        curated: true,
      },
    ],
  },
  {
    name: 'ZaStocks',
    headline: 'SURVIVE THE CHOP, THEN PRESS',
    subtitle: 'Technical setups via scheduled Grok task — candidates to verify, never auto-seat',
    asOf: 'wk of Sep 7 – 14 · via Grok',
    active: true,
    themes: [
      {
        name: 'Four months sideways, waiting on a catalyst',
        editorial: `The Nasdaq has chopped sideways since early May and he treats both Nvidia earnings and Jackson Hole as nothing-burgers that failed to resolve it. He is explicitly not pressing tech in the chop — pressing when conditions are choppy is how you end up blowing up — and frames the job as surviving the grind so you can capitalise when sentiment actually turns. He remains Adding-Holding on Nvidia after what he called another monster quarter proving demand is not slowing, though he posted no new chart this window. The genuinely new name is Super Micro, back on his radar after earnings, with a long-base monthly setup around $37 against a descending trendline and the 20-EMA near 36.4. His stated caveat is unusual candour for a chartist: absent the fraud and accounting history the stock would be several times higher.`,
        tickers: ['NVDA', 'SMCI', 'SPCX'],
        curated: true,
      },
      {
        name: 'Fintech tightens — and he is long one of ours',
        editorial: `A wide week with almost nothing in the book. His named tickers were META, GOOGL and TSLA, all logged Watching with chart levels and no stated position, plus Palantir on the framing that it wins whichever way the AI race resolves. None of that seats anything: he is corroboration-only, and corroboration requires Visser or Camillo pointing at the same name in the same window. Visser named none of them and Camillo is dark for a second week, so every one of them stays a nomination. Of the twelve names in the book before this freeze he touched essentially none with a chart. The watchlist names he did work through — Micron, Nvidia, Coinbase, Vistra, Circle — are already tracked and none cleared a gate. Worth recording that the unseated names he raises are increasingly the mega-cap application layer rather than the infrastructure layer, which is a different bet from the one this book expresses.`,
        tickers: ['HOOD', 'SOFI', 'COIN'],
        curated: true,
      },
      {
        name: 'Expensive stocks are often the best',
        editorial: `The framing he returned to is that it does not much matter who wins the AI race, because the infrastructure and application layers get paid either way — offered around Palantir and Alphabet rather than as a portfolio claim. On Alphabet specifically he reads a weekly triangle tightening under the 408.61 high with price near 338.50 at the apex, and notes that if OpenAI and its peers slow down it is not obviously bad for Google. Meta gets a bounce toward a descending trendline off the 796.25 high. Tesla is filed under robotics, coiling under 498.83 with price around 365 sitting on its 20-EMA. All Watching, no positions, no seats. His Sunday Substack remains paywalled and outside the capture, which continues to mean the portfolio and his stated favourite setup are not visible to this lens.`,
        tickers: ['PLTR', 'META', 'NET'],
        curated: true,
      },
    ],
  },
]

export default VOICES
