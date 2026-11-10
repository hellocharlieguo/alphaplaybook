// src/data/voiceCards.ts
// AlphaPlaybook — voice ledger cards. Extracted from SignalRecap.tsx 2026-08-17
// so the weekly cycle is a one-file edit. Render logic stays in the component.
//
// 10/01: cards rewritten as pure summaries of what each voice said — no portfolio weights,
// no 'we' reactions (C). Book changes live in the worksheet and Portfolio tab, not here.
// Visser card headline 10/01: 'LONG SCARCITY, SHORT ABUNDANCE' -> 'LONG SPEED, SHORT FRICTION'.
//
// 2026-11-10 weekly cycle — CONFIRM THE BOOK (v3.16 unchanged).
// New transcripts (Project files): Visser 11/05 (Natalie Brunell), 11/07 (Pomp), 11/08 (solo).
// Camillo: Grok 11/3-11/9. Cards stay pure summaries of what each voice said.
//
// 2026-11-02 weekly cycle — FREEZE v3.15 (LITE removed after the Marvell-Lumentum deal; single-stock cap off).
// ZaStocks RETIRED as a voice (C, 11/02) — his card is removed; the renderer needs no change
// (SignalRecap stacks whatever voices follow Visser in the right column).
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
    asOf: 'November 8, 2026',
    active: true,
    themes: [
      {
        name: 'The framework',
        editorial: `"Two weeks ago the AI bubble didn't pop, hedge fund leverage did." The Democrats' midterm sweep, including a surprise win for governor in Texas, set off a week of forced selling: JPMorgan estimated trend-following funds and leveraged ETFs cut more than $70 billion of stock exposure in 90 minutes on Thursday, and Goldman's panic gauge hit 9.57 out of 10. Yet the equal-weight S&P 500 and the S&P 500 without AI stocks both made record highs that week, which he reads as a rotation, not a recession. He calls it buying "into a falling knife," and is doing it. His new frame, borrowed from Marc Andreessen: the S&P 500 is 492 bonds and eight call options, and big public companies with large workforces will stop growing by 2030.`,
        tickers: [],
        curated: true,
      },
      {
        name: 'AI Buildout',
        editorial: `"The AI demand is insatiable." The name he bought most this week was Micron, along with Marvell and Nvidia; Micron now trades near three times earnings, and the semiconductor ETF is still up 29% for the year after falling 11% in the week. He expects the new Texas governor and stricter states to slow data-center building over the next two years, but "I don't think this changes the demand side of compute," and the roughly $1.5 trillion raised this year already funds building through 2027. In his view the midterms removed the risk of a bubble by slowing the race. Memory price growth has peaked, which he expects to help bring inflation down.`,
        tickers: ['MU', 'MRVL', 'NVDA'],
        curated: true,
      },
      {
        name: 'AI Applied',
        editorial: `He expects Eli Lilly to be "the biggest company in the world" within five years. Health care has started to beat the market, as it did after the dot-com bust, and he thinks longevity becomes a major story next year. Lilly is making new highs alongside Apple and Berkshire Hathaway. Microsoft offering buyouts to 27% of its staff is "a major warning sign": the split between workers and capital is reaching a boiling point, and he expects governments to tax corporations and cut taxes for individuals. Cyber risk has reached "extreme" levels and big public companies are the targets. Anthropic's October results beat expectations as it prepares to go public.`,
        tickers: ['LLY'],
        curated: true,
      },
      {
        name: 'Tokenized Rails',
        editorial: `"There's no doubt in my mind that tokenization, that agentic commerce... are going to happen over the course of the next two years." Tokenization will turn illiquid assets liquid, so he expects the money supply to "explode through tokenization, not through government printing." Private companies will raise money without public markets, and the public is learning crypto faster than Wall Street: "Everyone, including my son, knows more about crypto than people on Wall Street."`,
        tickers: ['HOOD'],
        curated: true,
      },
      {
        name: 'Monetary',
        editorial: `The pressures that held Bitcoin and gold back this year are lifting. Brent crude fell about $20 in three days after Iran signaled it was ready to talk, inflation expectations dropped below where the year began, fears of Fed rate hikes eased, and he expects a sharply negative inflation reading for November. Shares outstanding in the Bitcoin ETF hit a record even with prices well off their highs. He calls Bitcoin's pullback "almost textbook," holding in the mid-$70,000s. Gold, silver, platinum and palladium all had a big week, and he expects Bitcoin to move with gold on the way up.`,
        tickers: ['BTC', 'SLV'],
        curated: true,
      },
    ],
  },
  {
    name: 'Camillo',
    headline: 'INFORMATION EDGE, NOT VIBES',
    subtitle: 'Chris Camillo — social arbitrage; a supporting voice that can point to ideas but not change themes',
    asOf: 'wk of Nov 3 – Nov 9 · via Grok',
    active: true,
    themes: [
      {
        name: 'Bloom, Amazon and Robinhood',
        editorial: `"The more irrational the selloff gets the more $BE I buy." Bloom Energy is his strongest call this week: AI faces a real electricity shortage, and he says stricter energy policy and limits on data-center power help the case for its fuel cells. He took his borrowing up a little to buy more, while accepting that a very large drop is possible. Amazon remains his largest position after he added aggressively around its October earnings, and he is still meaningfully long Robinhood. He changed his view on Take-Two: games made by AI could cap the upside even if GTA 6 launches well.`,
        tickers: ['BE', 'AMZN', 'HOOD'],
        curated: true,
      },
      {
        name: 'Lessons',
        editorial: `"Investing is a game of probabilities not certainties." Fear creates mispricing, and the edge is in the strongest businesses rather than speculative ones. Size a position knowing the worst case up front, keep risky bets in a separate bucket, and do not confuse short-term noise with a long-term thesis. He changes his mind openly when new information arrives.`,
        tickers: [],
        curated: true,
      },
    ],
  },
]

export default VOICES
