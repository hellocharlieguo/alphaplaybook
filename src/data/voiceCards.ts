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
// 2026-10-01 mid-week freeze — '2026-10-01-v3.9-glwmu'. GLW out, MU in (memory as part of
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
    asOf: 'September 27, 2026',
    active: true,
    themes: [
      {
        name: 'The framework',
        editorial: `"You want to be long speed. You want to be short friction." That was the theme of Visser's talk in Washington in late September, and he repeated it on both podcasts that week. His argument is that AI has made the world move at machine speed while much of the economy still runs at human speed. Speed means the things AI agents need and use: computing power, meaning chips, memory and the electricity to run them, and crypto, which he sees as how agents will pay each other. Friction means businesses that sit in the middle and charge for it, such as payment networks and software subscriptions, along with companies that depend on cheap borrowing. He calls the result "a bear market inside a bull market": the fast side keeps rising while the slow side gets squeezed. It updates his earlier framing of long scarcity, short abundance. The physical bottlenecks of building AI still matter and are the compute half of speed, but crypto now sits alongside compute, and gold and silver matter less because, in his words, this is "not a liquidity debasement trade."`,
        tickers: [],
      },
      {
        name: 'AI Buildout',
        editorial: `Visser said the mid-cycle slowdown he called in AI hardware over the summer looks finished. Pointing to his own basket of AI infrastructure stocks, he said it just had its best week in months, more of its names are trending up, and "the infrastructure trade has a catalyst." The catalyst is consumer AI assistants like Meta's Muse, which he expects to use far more computing power than anyone planned for: "the compute needs just went up exponentially." That is why he says Intel and AMD jumped, and he expects the group to get back to its highs. He tied it back to memory chips, the trade he says the smartest investors missed last year because they did not understand compute: "This trade is still the same. You want to be long compute speed." On the physical side, he cited Blackstone's John Gray that the limiting factor for AI is now the physical world. One caution: he is still moving some of his own smaller AI holdings into crypto, which he sees as the bigger story.`,
        tickers: ['AIPO', 'SOXX', 'MU', 'COPX'],
        bucket: 'AI Buildout',
      },
      {
        name: 'AI Applied',
        editorial: `This was the week Meta launched Muse, its personal AI assistant. Visser calls it the biggest market driver right now and expects it to set the tone for the next twelve months. He has handed his own assistant his cards, bank accounts, fraud alerts and paperwork, and says people who have not used one cannot judge it yet. He is more cautious about what it means for the big tech stocks. He expects excitement in the short run but not outperformance, and believes competition from AI and tokenization will push their valuations down over time: "in the end, I believe all of them will go through multiple compression." He reads Amazon's standoff with Meta over Muse as the start of that competition. He was positive on healthcare, saying drug discovery and biology will be among the biggest beneficiaries of AI and citing Insilico Medicine's work with Eli Lilly. He also doubts the advertising model will survive, because AI agents will choose on price and reviews rather than ads.`,
        tickers: ['LLY', 'AMZN'],
        bucket: 'AI Applied',
      },
      {
        name: 'Tokenized Rails',
        editorial: `Visser's framing: AI assistants are to crypto what the iPhone was to the internet. The payment rails were built over fifteen years, and agents are finally the users who need them. He thinks crypto is early in a long bull market, partly because Wall Street still does not cover it, and says managers of very large funds are now calling him about tokenization. "This, my friends, is a bull market." He pointed to BlackRock's paper on AI and digital assets and its move to put model portfolios on the blockchain, the New York Stock Exchange's tokenization partnership, and Coinbase being tradable through Muse. He spoke well of Robinhood's blockchain and pointed listeners to its CEO as the clearest voice on tokenization. He mentioned Solana moving independently, and highlighted Stripe and payment protocols built for machine-to-machine transactions.`,
        tickers: ['ETHA', 'HOOD', 'COIN'],
        bucket: 'Tokenized Rails',
      },
      {
        name: 'Monetary',
        editorial: `Visser says crypto has moved from a trade driven by easy money to one driven by real use, and that Bitcoin does not fit that story the way the rest of crypto does: "Bitcoin doesn't fit in that fundamental argument." His advice was to watch the broader crypto index rather than Bitcoin, which rose 6.5% this month against the index's 31%. He still expects Bitcoin to benefit as the ecosystem grows, and noted it rose about 60% in a quarter when interest rates also rose. He set a test the week before: Bitcoin below $80,000 by the end of October would be a problem. On gold he was blunt: "gold's not going higher. This is not a liquidity debasement trade. This is a fundamental trade." Silver got only a passing mention, in the context of investors being rattled by the recent selloff in precious metals.`,
        tickers: ['IBIT', 'GLDM', 'SLV'],
        bucket: 'Monetary',
      },
    ],
  },
  {
    name: 'Camillo',
    headline: 'INFORMATION EDGE, NOT VIBES',
    subtitle: 'Chris Camillo — social arbitrage; a supporting voice that can point to ideas but not change themes',
    asOf: 'September 27, 2026',
    active: true,
    themes: [
      {
        name: 'AI Applied',
        editorial: `Amazon is still his biggest holding, and he says he would rather see it fall so he can buy more at a lower price. His case is that Amazon wins either way from Muse: Meta will pay Amazon a lot to run it on Amazon's cloud, and Amazon's warehouses and delivery network still matter when an AI assistant does the shopping. He thinks it is too early to crown a winner in AI shopping and expects companies to partner rather than compete. His biggest trade of the week was a short-term options bet on Meta around the Muse launch, which he calls his second most profitable single day in twenty years. He keeps it separate from his long-term holdings.`,
        tickers: ['AMZN', 'META'],
        curated: true,
      },
      {
        name: 'Agentic AI / CPU',
        editorial: `On Monday he grouped AMD and Intel with Amazon and Meta: "what a time to be in the agentic AI / CPU biz." It was a theme rather than a detailed case. His lesson for the week: spend the weekend researching a catalyst you can act on now, rather than debating what AI might look like years from now, and remember that taking considered risks is how big returns are made.`,
        tickers: ['AMD', 'INTC'],
        curated: true,
      },
    ],
  },
  {
    name: 'ZaStocks',
    headline: 'SURVIVE THE CHOP, THEN PRESS',
    subtitle: 'ZaStocks (@ZaStocks) — chart-based trade ideas, gathered weekly',
    asOf: 'wk of Sep 21 – 27 · via Grok',
    active: true,
    themes: [
      {
        name: 'Leaders getting tight',
        editorial: `His charts this week were market leaders holding just below their highs, which he reads as a sign of strength. Nvidia is trading in an unusually tight range for a stock that has defined this bull market. Palantir is acting like a leader again as it nears $200. Nebius is raising prices on strong demand while 21% of its shares are sold short. He also posted Arm, arguing that processors are becoming the bottleneck for AI assistants. He called Meta's Muse the best consumer AI product since ChatGPT, and compared the gloom around Oracle to the sentiment on Meta in 2022.`,
        tickers: ['NVDA', 'PLTR', 'NBIS', 'ARM'],
        curated: true,
      },
      {
        name: 'One more rally',
        editorial: `His market view stayed bullish. He expects one more strong rally into year-end, like April to June, and notes that tech stocks are holding near their highs despite worries about Iran, interest rates, oil and an AI slowdown. A real resolution with Iran, he says, could set off a second dot-com-style run. He flagged space stocks as an overlooked group if the market strengthens, with Rocket Lab basing after its pullback. His discipline this week was to follow price over headlines, and to step aside when conditions are not right. His full Sunday report is paywalled again.`,
        tickers: ['RKLB', 'SPCX'],
        curated: true,
      },
    ],
  },
]

export default VOICES
