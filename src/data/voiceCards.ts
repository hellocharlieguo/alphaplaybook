// src/data/voiceCards.ts
// AlphaPlaybook — voice ledger cards. Extracted from SignalRecap.tsx 2026-08-17
// so the weekly cycle is a one-file edit. Render logic stays in the component.
//
// 10/01: cards rewritten as pure summaries of what each voice said — no portfolio weights,
// no 'we' reactions (C). Book changes live in the worksheet and Portfolio tab, not here.
// Visser card headline 10/01: 'LONG SCARCITY, SHORT ABUNDANCE' -> 'LONG SPEED, SHORT FRICTION'.
//
// 2026-11-16 weekly cycle — CONFIRM THE BOOK pending the 11/16 packet (v3.16).
// New transcripts (private repo alphaplaybook-transcripts): Visser 11/14 (Pomp), 11/15 (solo, crypto);
// Camillo: Grok 11/9-11/15 and the 11/4 Decoded Genius interview. Cards stay pure summaries.
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
    asOf: 'November 15, 2026',
    active: true,
    themes: [
      {
        name: 'The framework',
        editorial: `"AI is inevitable. Tokenization is inevitable. Agentic commerce is inevitable." In under a week Jensen Huang went from scandal to resignation at Nvidia, and Fed governor Christopher Waller floated a half-point hike that drove the largest weekly jump in two-year Treasury yields since 2022. The S&P 500 still finished about 2.5% from its record, and he reads a market that shrugs off bad news as a good sign. His lesson from 2007 to 2022: once the iPhone arrived, following the Fed and the daily macro news made no one money; exponential innovation carried everything. He sees a bottom forming. Over two days, safe "quality" stocks lagged riskier ones by about 16%, a swing he has seen only in March 2009, March and June 2020, and November 2022. Taiwan and Korea stepped in to support their stock markets, which need higher prices to raise money for AI. He calls the Democrats' sweep bullish because it takes away the risk of a bubble and pushes Asia to move faster. Next up: Anthropic's IPO, Nvidia's earnings and the December Fed meeting.`,
        tickers: [],
        curated: true,
      },
      {
        name: 'AI Buildout',
        editorial: `He compares Huang's exit to Steve Jobs, who was already ill when the iPhone launched; the product carried Apple regardless. Analysts cut their Nvidia price targets but "no one changed their earnings forecasts," and he expects the story to fade if the company keeps delivering. He had put "a good amount of money" into his chip names the week before. In his view the fall in AI stocks since the summer came from a flood of new shares hitting investors who were already fully invested — Google's roughly $80 billion sale, SpaceX, and now Anthropic coming at about $1.5 trillion, well below earlier talk of $2 to $3 trillion — not from a bubble bursting. If the U.S. slows data-center building, he says other countries will take it in exchange for access to the computing power. Memory chip prices are now about 250% above a year ago, down from about 900% earlier this year, and still falling.`,
        tickers: ['NVDA'],
        curated: true,
      },
      {
        name: 'AI Applied',
        editorial: `Hackers now use AI to get through layered defenses in days rather than months, so he expects "AI fighting with AI" to become the only workable defense, with swarms of AI agents hunting for breaches as they happen. He tied the $6 billion Binance theft to human error as much as to code. His bigger claim: AI will slow the growth of most public companies and make them more volatile. "There are no safe companies against AI." As agents move from writing code to personal assistants that shop and pay, he expects a "Mag Billion" of tokenized companies raising money on blockchains to take over from the Magnificent Seven.`,
        tickers: [],
        curated: true,
      },
      {
        name: 'Tokenized Rails',
        editorial: `"Tokenization is the most important thing for me for moving assets on chain." He calls AI and crypto "exactly the same trade": neither tokenization nor agent-driven commerce can grow without both. The question is how part of roughly $900 trillion in traditional assets moves into a $3 to $4 trillion crypto market, and his answer is a reason to use it, not demographics: pensions, insurers and fund managers putting assets on chain. Activity on Robinhood's blockchain is still growing, and he says more is coming. Andreessen Horowitz dropping "crypto" from its fund names fits his view that AI, crypto and traditional finance are merging. He bought Zcash, a privacy coin, on the dip.`,
        tickers: ['HOOD'],
        curated: true,
      },
      {
        name: 'Monetary',
        editorial: `Bitcoin fell to about $69,000. It has moved with gold since March, and both are held back by rising rates. He sees no need for a half-point Fed hike: oil is back where it was 175 days ago, livestock and crop futures have fallen since September, two-year inflation expectations are at the year's lows, and Goldman expects inflation to fall about 1.1 points next year. Markets give a half-point move only a 10% to 13% chance, so a quarter-point hike in December would count as good news. Japanese bond yields falling back to May levels tells him the worst of the rate pressure is passing. He still calls Bitcoin "the purest AI trade" and thinks crypto bottomed this week. Strategy's removal from some stock indexes matters for trading, not for the long run.`,
        tickers: ['BTC'],
        curated: true,
      },
    ],
  },
  {
    name: 'Camillo',
    headline: 'INFORMATION EDGE, NOT VIBES',
    subtitle: 'Chris Camillo — social arbitrage; a supporting voice that can point to ideas but not change themes',
    asOf: 'wk of Nov 9 – Nov 15 · via Grok + Nov 4 interview',
    active: true,
    themes: [
      {
        name: 'Amazon, Bloom and Robinhood',
        editorial: `Amazon is still his largest position, confirmed on November 10. His thesis is an "AI efficiency wave": once intelligence is nearly free, every company can use it to cut costs and grow, and the winners are the ones with distribution that takes decades to build, which is why he picks Amazon. He made more than $10 million over a couple of days on Amazon's earnings after months of work on AWS demand and pricing, and says he should have bet bigger. Bloom Energy is "the quickest way to provide energy to the data centers" now that operators are told to bring their own power, and he keeps buying its selloffs. Robinhood is "the best managed financial institution in the world," with a shot at becoming the largest within 20 years. He is still long Nvidia and holds a small Take-Two position that he will add to or short depending on how gamers react to GTA 6 gameplay.`,
        tickers: ['AMZN', 'BE', 'HOOD'],
        curated: true,
      },
      {
        name: 'Robots, Bitcoin and lessons',
        editorial: `He calls general-purpose robots the largest market he has ever seen, but expects deployment to move "meaningfully slower than anybody understands," because every warehouse and factory needs years of change. He expects a humanoid ready for commercial scale in 2027, scaling from 2028, and robots in homes in five to ten years. It will not be winner-take-all, and Tesla holds the pole position only if it executes. On Bitcoin he ignores the usual arguments: younger investors favor it and about $100 trillion will pass to them, so it has a strong tailwind unless security fears break trust. Lessons: keep a separate high-risk bucket for leverage and options, never get attached to a stock, buy irrational selloffs, and earn conviction through your own hours of work.`,
        tickers: [],
        curated: true,
      },
    ],
  },
]

export default VOICES
