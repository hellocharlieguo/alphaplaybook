// src/data/voiceCards.ts
// AlphaPlaybook — voice ledger cards. Extracted from SignalRecap.tsx 2026-08-17
// so the weekly cycle is a one-file edit. Render logic stays in the component.
//
// 10/01: cards rewritten as pure summaries of what each voice said — no portfolio weights,
// no 'we' reactions (C). Book changes live in the worksheet and Portfolio tab, not here.
// Visser card headline 10/01: 'LONG SCARCITY, SHORT ABUNDANCE' -> 'LONG SPEED, SHORT FRICTION'
// (his framing at the DC Freedom Tech talk, repeated 9/26 Pomp and 9/27 solo). Added a
// 'The framework' entry explaining it in plain language; scarcity kept as the compute half.
//
// 2026-10-05 weekly cycle — '2026-10-05-v3.10-stageflip'. GLDM cooling -> exhausted, COPX
// working -> cooling (Visser 10/4). No add: NVDA is inside SOXX, same sub-theme (C 10/05).
// New transcripts: Visser 10/3 (Pomp), 10/4 (solo); back-fills 9/10 (Raoul Pal), 9/18 (Brunell),
// 9/22 (Substack). Camillo capture 9/28-10/5 has new items only through 9/29. ZaStocks 9/28-10/4.
// Cards stay pure summaries of what each voice said — no weights, no portfolio reactions.
//
// Superseded: 2026-10-01 mid-week freeze — '2026-10-01-v3.9-glwmu'. GLW out, MU in (memory as part of
// compute: 'chips and power'). AI Buildout held at 27.1. Book: IBIT 12.3, LLY 12.4, ETHA 9.1,
// AMZN 9.0, AIPO 8.1, GLDM 8.0, COIN 7.5, HOOD 7.5, SLV 7.2, SOXX 6.7, MU 6.3, COPX 5.9.
// asOf unchanged: no new transcripts since 9/27.
//
// Superseded: 2026-09-30 mid-week freeze — '2026-09-30-v3.8-coinamzn'. TICKER SET 11 -> 12: COIN added
// (workflow 5.11, derived from Visser's tokenization and agent-payment themes, 9/26-27).
// AMZN quality leader -> contested. No new transcripts since 9/27, so every asOf stays put;
// only the portfolio figures quoted in the editorials were refreshed.
// C's 9/30 worksheet edits applied (timing, quality and three trend convictions).
// Book: IBIT 12.3, LLY 11.8, AMZN 9.5, ETHA 9.1, AIPO 8.5, GLDM 8.0, HOOD 7.5, COIN 7.5,
// SLV 7.2, SOXX 7.0, COPX 6.1, GLW 5.5. Trends 27.2 / 21.3 / 24.1 / 27.4. Turnover 23.6pp vs v3.7.
//
// Superseded note from 2026-09-28-v3.7-ibitsoxx (ticker set 11):
// Two stage flips, one rung each:
//   IBIT binding -> working. Visser 9/26: "we're at the fundamental stage now. Bitcoin
//   doesn't fit in that fundamental argument"; "This is not a liquidity debasement
//   trade." 9/27: "Bitcoin is not what you watch right now. You want to watch the
//   index." Relative de-rate, same shape as GLDM 8/30. IBIT 12.1 -> 11.3.
//   SOXX cooling -> working. Visser 9/27: "I think the infrastructure trade has a
//   catalyst... that's the reason why you've seen Intel, AMD"; "I think we're at the
//   beginning." SOXX's top two holdings are INTC 10.20% and AMD 9.58% (as of 9/24),
//   so the CPU-bottleneck call Camillo and ZaStocks also made sits inside the seat.
// AI Buildout override 24.70 RETIRED: emergent is 25.00 after the SOXX flip, so the
// override would now cut the trend. Trend weights: Buildout 25.00 / Applied 26.32 /
// Rails 20.52 / Monetary 28.16. Turnover 4.0pp vs 2026-09-22-v3.6-ethabind.
//
// Price moved more than judgment: AMZN 3.9% under its 50-DMA (band 0.95) -> 13.9,
// largest seat; ETHA stretch 26.5% -> 19.4% (band 0.75 -> 0.85) -> 13.2; LLY back
// over its 50-DMA (band 0.95 -> 0.85) -> 12.4. Entry-paused: GLDM, SLV = 16.9%.
//
// Technicals: pull_candidates.cjs capture 2026-09-28 20:52 UTC, after the close.
// Band edges to watch: AIPO 0.3% over its 200-DMA, GLW 1.6%, AMZN 2.2%.
//
// HELD: GLDM at working ("gold's not going higher" confirms 8/30, no new stage call);
// AMZN at working despite Visser's multiple-compression view on the Mag 7.
// META named by all three voices; Visser is against it as an investment ("I think
// the disappointment will come") — watch-not-seat. SOL named again — watch-not-seat.
//
// All three voices fresh this cycle. ZaStocks' Sunday report paywalled again.
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
    asOf: 'October 4, 2026',
    active: true,
    themes: [
      {
        name: 'The framework',
        editorial: `"You want to be long speed. You want to be short friction." Speed means what AI agents need and use: computing power, meaning chips, memory and the electricity to run them, and crypto, which he sees as how agents will pay each other. Friction means businesses that sit in the middle and charge for it. This week he took on the worry about rising interest rates and weak market breadth head-on and called the doom talk overdone. His case: this is a different economy. Nvidia and Micron alone now take in more revenue than Ford, GM and the four largest homebuilders combined, which were about twenty times their size in 2015, and technology companies make up roughly 56% of the S&P 500. Those companies do not depend on cheap borrowing. The stocks hitting new lows are the rate-sensitive ones, such as consumer staples, utilities and real estate, which he says have been losing to AI for years. Ten-year yields, in his view, are returning to normal rather than breaking: nominal growth is about 6.5%, and he would only worry if yields moved well above 7%. A weaker jobs report, softer inflation and the New York Fed's John Williams ruling out an October hike could let rates settle.`,
        tickers: [],
      },
      {
        name: 'AI Buildout',
        editorial: `Micron's results were his centerpiece. He read from the company's call that it sees no point at which supply catches up with demand, because larger models, longer context and more AI agents keep raising the need for memory. He called this "the micron moment": a reminder of how badly people underestimate how fast this moves. He said the next stage is about efficiency and power use as Nvidia's Vera Rubin chips arrive, and pointed to Marvell and to Rogers, a materials company that raised its long-term targets sharply because heat and power density are becoming problems inside data centers. He also said AI is moving to the edge: phones, laptops, wearables and, sooner than people expect, robots and self-driving cars, all of which need more computing power. The founder of the personal-assistant app Instinct said his compute needs are doubling roughly every week and that he spends much of his time just finding capacity. Visser's summary: "The usage is going to skyrocket and we don't have enough compute."`,
        tickers: ['AIPO', 'SOXX', 'MU', 'COPX'],
        bucket: 'AI Buildout',
      },
      {
        name: 'AI Applied',
        editorial: `Visser says personal AI assistants are as important a turning point as the arrival of coding agents last November. Meta's Muse, Grok's assistant, OpenAI's new Dots and apps like Instinct, which already handles about a billion dollars of annual transactions, are launching at once, and he expects billions of people to use them within five years. He is less sure the big tech companies win: they used to have their own lanes and will now fight over the same customers, which he calls "very, very difficult." Meta "didn't win anything," and he would trust Apple more on security. On OpenAI and Anthropic, he agreed their fastest growth is behind them but said they will keep growing, and that their combined revenue this year should exceed the entire software industry's. He also expects banks to go through what software companies went through, with AI agents moving money to wherever fees are lowest.`,
        tickers: ['LLY', 'AMZN'],
        bucket: 'AI Applied',
      },
      {
        name: 'Tokenized Rails',
        editorial: `His argument this week was about trust. AI agents will move money at machine speed, and he says slow settlement is now a safety risk as well as a cost: a wire sent Friday afternoon sits somewhere until Monday, which leaves time for hackers and rogue agents. Instant settlement on crypto rails is the defense. He sees no chance that Visa and Mastercard are the long-run winners, comparing them to the BlackBerry. He leaned on three people he spoke with: NEAR's founder, who in 2023 described agents as "the economic actors of the future"; William Mougayar; and SharpLink's Joseph Chalom, who calls Ethereum the trust and settlement layer for future finance. Visser described Ethereum as "effectively the internet." He listed Goldman Sachs, Morgan Stanley's new digital-asset lab, Citi's Coinbase partnership and Franklin Templeton's tokenized money funds as signs Wall Street is moving, along with Robinhood's agent-driven trading. He says big money is coming to Ethereum, Solana and Bitcoin, and that asset managers are now calling him about crypto.`,
        tickers: ['ETHA', 'HOOD', 'COIN'],
        bucket: 'Tokenized Rails',
      },
      {
        name: 'Monetary',
        editorial: `Visser said Bitcoin moving above $82,000 confirmed its bull trend, "I think we're in that," and that it is "about to kind of take off." He expects new buyers to arrive in the fourth quarter, when large investors set their plans for the next year. His crypto index is up about 50% this year against a small loss for Bitcoin, which he reads as the wider ecosystem leading. On gold he was negative: it "broke down," and if this were a money-printing trade Bitcoin would have fallen with it, but it did not, because agents are what is driving crypto now. He also said the commodities trade is not working, calling copper an "obvious trade" where you "can't make any money." He did not mention silver by name this week. Earlier, he argued that robots working in mines could eventually make commodities more plentiful.`,
        tickers: ['IBIT', 'GLDM', 'SLV'],
        bucket: 'Monetary',
      },
    ],
  },
  {
    name: 'Camillo',
    headline: 'INFORMATION EDGE, NOT VIBES',
    subtitle: 'Chris Camillo — social arbitrage; a supporting voice that can point to ideas but not change themes',
    asOf: 'September 29, 2026',
    active: true,
    themes: [
      {
        name: 'The two he keeps buying',
        editorial: `Amazon and Robinhood are the core of his portfolio. Amazon is his highest-conviction holding, and he says a drop would make it more attractive, not less, because AI shopping assistants still need Amazon's warehouses, delivery network and cloud. He expects partnerships rather than one winner. Robinhood is the second, with crypto and tokenization as a possible new engine of growth.`,
        tickers: ['AMZN', 'HOOD'],
        curated: true,
      },
      {
        name: 'Human data is running out',
        editorial: `His new trade was Reddit. His case is that AI companies are running short of real human writing to train on, and Reddit owns a large, licensed archive of real conversations. Licensing deals and their renewals are the thesis.`,
        tickers: ['RDDT'],
        curated: true,
      },
      {
        name: 'Lessons',
        editorial: `His most-shared post argued that Wall Street sells people on low volatility by treating price swings as risk, when the real risk for a long-term investor is losing money for good. Smoothing the ride gives up compounding: "The goal isn't the smoothest path." He also warned that investors have never had more information and done less work with it: "The confidence-to-effort ratio is off the charts."`,
        tickers: [],
        curated: true,
      },
    ],
  },
  {
    name: 'ZaStocks',
    headline: 'STAY WITH THE TREND',
    subtitle: 'ZaStocks (@ZaStocks) — chart-based trade ideas, gathered weekly',
    asOf: 'wk of Sep 28 – Oct 4 · via Grok',
    active: true,
    themes: [
      {
        name: 'Compute is not slowing',
        editorial: `He called Micron's results "monster earnings yet again" and thinks forecasts are still too low, since robots and self-driving cars need memory too. He calls Nvidia cheap with no sign of slowing: "If the AI trade is going to work Nvidia is going to work." He posted CoreWeave coiled in an unusually tight range, Ouster's long base ("the robots and autonomous vehicles need to see somehow"), and insider and political buying in Vistra. He bought SpaceX after it launched Google's AI chips into orbit, calling it expensive but one of a kind.`,
        tickers: ['MU', 'NVDA', 'CRWV', 'OUST', 'VST', 'SPCX'],
        curated: true,
      },
      {
        name: 'New highs, no reason to turn bearish',
        editorial: `The Nasdaq made new all-time highs despite war, high oil, rising yields and rate fears, and he wants oil and yields to ease so the market can run. He refuses to turn bearish just to look balanced. His lessons: in a choppy market, buy pullbacks rather than chase breakouts; holding a big winner means sitting through shakeouts; and newer traders should stick to shares rather than options. His Sunday report was paywalled again.`,
        tickers: ['QQQ'],
        curated: true,
      },
    ],
  },
]

export default VOICES
