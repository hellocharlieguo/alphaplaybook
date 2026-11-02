// src/data/voiceCards.ts
// AlphaPlaybook — voice ledger cards. Extracted from SignalRecap.tsx 2026-08-17
// so the weekly cycle is a one-file edit. Render logic stays in the component.
//
// 10/01: cards rewritten as pure summaries of what each voice said — no portfolio weights,
// no 'we' reactions (C). Book changes live in the worksheet and Portfolio tab, not here.
// Visser card headline 10/01: 'LONG SCARCITY, SHORT ABUNDANCE' -> 'LONG SPEED, SHORT FRICTION'.
//
// 2026-11-02 weekly cycle — FREEZE v3.15 (LITE removed after the Marvell-Lumentum deal; single-stock cap off).
// New transcripts (Project files): Visser 10/31 (Pomp) and 10/31 (solo). Camillo: Grok 10/26-11/1.
// ZaStocks RETIRED as a voice (C, 11/02) — his card is removed; the renderer needs no change
// (SignalRecap stacks whatever voices follow Visser in the right column).
// Cards stay pure summaries of what each voice said.
//
// Prior cycle notes (10/05 and earlier) are in git history for this file.
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
    headline: 'LONG SPEED, SHORT FRICTION',
    subtitle: 'Jordi Visser — macro framework for the AI and crypto economy',
    asOf: 'October 31, 2026',
    active: true,
    themes: [
      {
        name: 'The framework',
        editorial: `"The market structure has completely changed and it is forever changed." October felt like a crash but the S&P 500 ended the month down less than 1%, nine of eleven sectors rose and most stocks gained. Morgan Stanley's prime brokerage called it the largest hedge-fund pullback it has seen; he compares it to the GameStop-era unwind in a healthy economy, not to a bear market. His lesson is "strikeout, strikeout, strikeout, home run": nearly all of Nvidia's gain over 30 months came in one four-month stretch, so selling on bubble fears means missing it. Next week: the Treasury's November 4 refunding (he thinks it may cut long-bond sales), the midterms, Iran, and the Anthropic IPO.`,
        tickers: [],
        curated: true,
      },
      {
        name: 'AI Buildout',
        editorial: `"Guys, go buy memory names. Trust me." SK hynix's results were strong, memory makers keep signing contracts out to 2030, and Elon Musk says robots will need more memory than everything else on earth; he expects robots to be the next wave of AI, starting next year. On optical networking, Corning says demand is pressing against its capacity and connections per chip could grow tenfold; he bought optical stocks three times this week, and does not like Marvell buying Lumentum. Computing power is getting scarcer: the price to rent future chip capacity is rising. Oracle pledged to raise no more than $20 billion through 2030, a sign that outside financing for AI may be near its peak. His advice: hold less of the giant cloud companies and more of the companies building AI computing.`,
        tickers: ['MU', 'GLW', 'MRVL'],
        curated: true,
      },
      {
        name: 'AI Applied',
        editorial: `Eli Lilly, now his largest position, grew revenue 39% to $24.4 billion and raised its outlook; he still expects it to become the largest company in the S&P 500 before the end of 2030. Anthropic's IPO filing showed $132 billion in cash and half of the Fortune 500 as customers, yet a tiny share of their spending, so in his view business adoption of AI agents has barely started. Microsoft offering buyouts to 60,000 employees, 27% of its staff, is "stage one of the AI productivity boom," and the fight between workers and capital comes next. The only software company he owns is Palantir; cybersecurity stocks are expensive and could go nowhere for a year and a half even as attacks rise.`,
        tickers: ['LLY', 'PLTR'],
        curated: true,
      },
      {
        name: 'Tokenized Rails',
        editorial: `Tokenization "continues": the DTCC's tokenization service is live, tokenized real-world assets on Solana hit a record, and Google is building crypto custody for institutions. Stripe's agent-driven payments will "only grow from here." He reads the Binance hack as the growing pains of a new market, like the Nasdaq's electronic-trading breakdowns in 1999; now that banks are involved and promote crypto to clients, security problems get fixed faster.`,
        tickers: ['SOL', 'HOOD'],
        curated: true,
      },
      {
        name: 'Monetary',
        editorial: `Binance lost about $6 billion to hackers, the largest theft on record, and Bitcoin fell only about 4% on the week: "You can't even tell that something happened." He thinks Bitcoin is at "the beginning of a major move," and his favorite trade is owning Bitcoin against the Nasdaq-100. Quantum: one company says it can break Bitcoin's encryption by 2028; his own research puts that near 15%. High real interest rates have weighed on Bitcoin and silver all year; he expects that to ease next year as the energy, tariff and memory-price effects on inflation fade. He still owns silver for the robotics phase.`,
        tickers: ['BTC', 'SLV'],
        curated: true,
      },
    ],
  },
  {
    name: 'Camillo',
    headline: 'INFORMATION EDGE, NOT VIBES',
    subtitle: 'Chris Camillo — social arbitrage; a supporting voice that can point to ideas but not change themes',
    asOf: 'wk of Oct 26 – Nov 1 · via Grok',
    active: true,
    themes: [
      {
        name: 'Amazon, Bloom and Robinhood',
        editorial: `Amazon is by far his largest position and he added aggressively around its October 29 earnings, calling it misunderstood: cloud, AI efficiency, advertising and scale. He cut his leverage before the report and added back after it. He added to Bloom Energy on October 26 for AI data-center power, and on October 30 said he was "meaningfully long" Amazon, Bloom Energy and Robinhood.`,
        tickers: ['AMZN', 'BE', 'HOOD'],
        curated: true,
      },
      {
        name: 'Lessons',
        editorial: `"This is a time to think like a long term investor." He loves leverage but calls this fearful market a dangerous place to use it. Fear creates mispricing: five years from now, young investors will likely see this as an extraordinary chance to buy strong businesses, and he favors established companies over speculative ones while fear is high. Red days are "part of the game." The value in his posts is the reasoning, not copying his trades.`,
        tickers: [],
        curated: true,
      },
    ],
  },
]

export default VOICES
