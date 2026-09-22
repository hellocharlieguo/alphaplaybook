// src/data/voiceCards.ts
// AlphaPlaybook — voice ledger cards. Extracted from SignalRecap.tsx 2026-08-17
// so the weekly cycle is a one-file edit. Render logic stays in the component.
//
// Cycle 2026-09-22 freeze — '2026-09-22-v3.6-ethabind'. TICKER SET UNCHANGED at 11.
// Stage flip: ETHA working -> binding. Rejected 8/31 and 9/07 as a restated thesis;
// this week the inflection is stated as arrived and observed rather than forecast.
// Visser 9/20: "The story of the week and the story for the month is crypto... we
// are finally at the point." His 46-name index: "43 of the 46 are above the 50-day...
// This is a beginning bull market." Allocation: "I keep adding to crypto. I'm not
// adding to the AI names." Regulatory action taken: five-year SEC exemption for
// tokenized stocks. One rung, x0.92 -> x1.00.
//
// The flip barely moves ETHA (12.4 -> 12.5): stretch 26.5% above the 50-DMA crossed
// the 25% line, S5 56 -> 54, band 0.85 -> 0.75. The effect lands at trend level —
// Tokenized Rails derived timing 0.92 -> 0.96, trend weight 19.76 -> 20.39.
// AIPO and GLW reclaimed their 200-DMAs (band 0.75 -> 0.85). Entry-paused book
// 26.9% -> 16.7% (GLDM, SLV). AI Buildout override 24.70 carried (emergent 24.22).
// Turnover 3.37pp (sum |delta|) vs 2026-09-14-v3.5-asmlcut; largest move SOXX -0.8.
//
// MU-for-SOXX swap deferred from 9/14 was NOT executed: no L1 support in window —
// Visser's Micron lines are retrospective ("my famous bailout of Micron"); ZaStocks'
// MU chart is corroboration-only. Memory stays the max-demand unseated row.
//
// Technicals: pull_candidates.cjs capture 2026-09-22 19:57 UTC, three minutes before
// the close — not a Friday close. LLY, AMZN (under their 50-DMAs by 0.13% / 0.37%),
// AIPO (0.5% over its 50-DMA) and ETHA (1.2% over the 25% stretch line) sit on band
// edges; watch into next cycle.
//
// CAMILLO IS FRESH for the first time since 8/30 (capture 9/14-9/20). AMZN and HOOD
// both carry a current Camillo leg. ZaStocks' Sunday report is paywalled again.
//
// Superseded note from the 2026-09-14 cycle: FREEZE '2026-09-14-v3.5-asmlcut', 12 -> 11
// names, ASML removed under Rule B (2.49% of SOXX; GLW verified absent). AI Buildout
// override 24.70 logged. Turnover 12.61pp.
//
// SOL remains a NAMED GAP, not a seat — named by Visser as a main layer one for a
// fourth week. GSOL stretch 36.3%, 1y corr to ETHA 0.865: watch-not-seat.
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
    asOf: 'September 20, 2026',
    active: true,
    themes: [
      {
        name: 'AI Buildout',
        editorial: `A second quiet week for the hardware seats in the transcripts, and a good one on the tape. AIPO, SOXX, GLW and COPX drew no direct mention across either episode. What he did say about the trade was about his own sizing: roughly 20% of his portfolio is in AI now against about 80% before the June rotation, he is still not adding, and his two largest AI holdings remain Nvidia and Marvell, alongside Applied Optoelectronics and a Fluence position down about 80%. The one structural line is a relative ranking rather than a stage call — unlike the power and compute side, which got too big too quickly, crypto will take years. Against that he repeats that demand is greater than supply and will stay that way for a long time because it is physics, which keeps power and optical at binding. The change this cycle is price. AIPO reclaimed its 200-day at 29.31 against 27.98 and GLW at 159.47 against 147.82, so both leave the entry floor, bands 0.75 to 0.85, and take the sleeve's two largest weights at 7.0 and 6.1. SOXX, still cooling, gives up the most of any name in the book, 6.0 to 5.2. The Micron swap deferred from last week was not executed: his only Micron references were retrospective — the bailout before the top — and a ZaStocks chart cannot seat a name on its own. Memory remains the one maximum-demand sub-theme with no seat.`,
        tickers: ['AIPO', 'GLW', 'SOXX', 'COPX'],
        bucket: 'AI Buildout',
      },
      {
        name: 'AI Applied',
        editorial: `The consumer-agent wave the book advanced to on 9/07 now has shipped product behind it, which confirms the call rather than moving it. He points to Meta's Muse launch, to Instinct raising at a $2.5 billion valuation in late August, and to all seven Mag 7 names sitting above their 50-day averages together — something that has happened on only eight days this year — as the market pricing that every one of them benefits from agents. Eli Lilly got its strongest week of support since the 8/24 flag was cleared: he calls it an AI name and a big position, says biotech is part of the consumer agent trade that Lilly belongs to, and is writing on how agent swarms revalue unfinished intellectual property — Lilly buying IP and bringing biotechs into its lab is the example. None of that is a new rung; Lilly holds at working. Amazon drew no direct Visser line, but Camillo is back with a fresh leg. Both seats now sit almost exactly on their 50-day averages — Amazon 0.4% under, Lilly 0.1% under — so either one closing above it would drop its band from 0.95 to 0.85 and break the tie. Both hold at 13.1. The unseated names he raised — cyber, proprietary data vendors, Salesforce — are logged as nominations only.`,
        tickers: ['LLY', 'AMZN'],
        bucket: 'AI Applied',
      },
      {
        name: 'Tokenized Rails',
        editorial: `The settlement seat advanced to binding this week, after being held at working on 8/31 and 9/07 because the thesis was only being restated. What changed is that the inflection he dated back in May is now stated as having arrived and is visible in the numbers: the story of the week and of the month is crypto, we are finally at the point. His 46-name index is at year highs with 43 of 46 names above their 50-day averages, which he calls a beginning bull market. Quarter to date he cites Ethereum up 66% and Bitcoin up 53% against semis down 14%. He is adding to crypto and not to AI, and the regulator has granted a five-year exemption for tokenized stocks, which he says is why the stalled Clarity Act does not matter. The flip moves the trend more than the name. Ethereum ran to 26.5% above its 50-day, past the 25% stretch line, so its entry band fell to 0.75 in the same week its rung rose — ETHA goes 12.4 to 12.5 while the trend goes 19.76 to 20.39, and Robinhood picks up most of the difference at 7.8. Robinhood sits in his index next to Coinbase and Circle. The unexpressed thread is privacy and agent-to-agent payment: Zcash, Near and Hyperliquid, which he frames as where the agent economy transacts. They are watch items for a coverage audit, not seats. Solana is named a fourth week and stays watch-not-seat — stretched 36% with 0.86 correlation to ETHA.`,
        tickers: ['ETHA', 'HOOD'],
        bucket: 'Tokenized Rails',
      },
      {
        name: 'Monetary',
        editorial: `Bitcoin got the most concrete statement he has made in months: a level, with a date on it. Asked what would change his mind, he said that Bitcoin below 80,000 by the end of October means there is a problem, and that 82,000 is where the heavy volume sits and where he expects the move to stick. He also calls it the only asset he can say with certainty will grow in value for thirty years, and says rates rising while crypto rises is exactly what an innovation looks like once it is being used — a hawkish 25-basis-point hike, 10-year yields above 5% and oil above $100 all landed in a week crypto rallied. IBIT holds at 12.1, stretched 21.4%. Silver was named for the first time since 8/16, as half of what his book is now built on alongside crypto — a stated position, no rung change. Gold went a fourth week without a mention, and his one gold reference was about Bitcoin reaching a gold-like market cap. GLDM and SLV both remain below their 200-day averages and entry-paused at x0.75, together 16.7% of the book.`,
        tickers: ['IBIT', 'GLDM', 'SLV'],
        bucket: 'Monetary',
      },
    ],
  },
  {
    name: 'Camillo',
    headline: 'INFORMATION EDGE, NOT VIBES',
    subtitle: 'Chris Camillo — social arbitrage; nomination only, cannot move themes',
    asOf: 'September 20, 2026',
    active: true,
    themes: [
      {
        name: 'AI Applied',
        editorial: `First fresh capture since 30 August, and the core is unchanged: Amazon is his biggest position by a wide margin, restated on Friday. The new argument is that Amazon can get paid twice if Anthropic scales — once on its equity stake and again as the cloud revenue behind it. That is a current Camillo leg on a book name, logged to the ledger. His most-read post of the week was a process point rather than a pick: anyone who spent more than thirty seconds handicapping the Fed decision should ask what edge they had over every institution doing the same, and look for alpha where there is a chance of finding it.`,
        tickers: ['AMZN'],
        curated: true,
      },
      {
        name: 'Tokenized Rails',
        editorial: `Robinhood gets one line and it is enough: he remains perma heavy on HOOD, which third-party trackers put as his second-largest holding at about 8%. Visser placed Robinhood in his crypto index the same week, so the seat has a current leg from both voices. Tracker estimates are not his words and are not sized as evidence.`,
        tickers: ['HOOD'],
        curated: true,
      },
      {
        name: 'Adoption before allocation',
        editorial: `Both new notes are about waiting for evidence before sizing. He opened a small speculative long in Unity at the Astra release, and will add, hold or sell depending on whether current and future models actually lift Unity's adoption — not large enough yet to justify deep research. On Tesla he is explicitly not buying: even if robotaxi and Optimus work, owning it over the last few years would have cost him dearly, he estimates the stock already prices in one to two million robotaxis, and he calls humanoids still early, with the next twelve to eighteen months critical. Nomination only — U and TSLA are not book names and cannot seat on one voice.`,
        tickers: ['U', 'TSLA'],
        curated: true,
      },
    ],
  },
  {
    name: 'ZaStocks',
    headline: 'SURVIVE THE CHOP, THEN PRESS',
    subtitle: 'Technical setups via scheduled Grok task — candidates to verify, never auto-seat',
    asOf: 'wk of Sep 14 – 21 · via Grok',
    active: true,
    themes: [
      {
        name: 'Compute is still the call',
        editorial: `Every chart he posted this week was AI compute. Nvidia building an insane base under 236.54 with the view that it is not done. Micron compressing under its 1,255 high — expansion next. Intel bouncing off its shelf on the idea that moving into memory could take it to a trillion-dollar valuation. Arm after a melt-up to 452.7 and a pullback to around 275, on the thesis that CPUs are a legitimate bottleneck as agents arrive. Arm is the only one on the tracked list with a full chart and a catalyst, but Visser said nothing about CPUs and Camillo nothing about Arm, so it logs as corroboration without a leg. The Micron chart is the most relevant to the book and still cannot seat the memory row on its own.`,
        tickers: ['ARM', 'NVDA', 'MU', 'INTC'],
        curated: true,
      },
      {
        name: 'A taller wall of worry',
        editorial: `His market read was that the tape absorbed a rate hike, oil, 10-year yields, Iran and the AI slowdown story with the Nasdaq barely off its highs, and that it is rarely this coiled after four months in a range — a pressure cooker that wants to release higher. He mocked selling on the hike and buying back the next morning, and said he would take 820 on QQQ. The discipline was the familiar one: markets like this are built to drain your capital and patience before the turn, so don't just do something, stand there. His Sunday report is paywalled after the teaser, so his portfolio and his next theme are outside this capture again.`,
        tickers: ['QQQ'],
        curated: true,
      },
    ],
  },
]

export default VOICES
