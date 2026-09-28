// src/data/voiceCards.ts
// AlphaPlaybook — voice ledger cards. Extracted from SignalRecap.tsx 2026-08-17
// so the weekly cycle is a one-file edit. Render logic stays in the component.
//
// Cycle 2026-09-28 freeze — '2026-09-28-v3.7-ibitsoxx'. TICKER SET UNCHANGED at 11.
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
    headline: 'LONG SCARCITY, SHORT ABUNDANCE',
    subtitle: 'Jordi Visser — macro framework for the physical AI upgrade',
    asOf: 'September 27, 2026',
    active: true,
    themes: [
      {
        name: 'AI Buildout',
        editorial: `For the first time since he called a mid-cycle slowdown in AI hardware over the summer, Visser said the slowdown looks finished. His view is that consumer AI assistants like Meta's Muse will use far more computing power than anyone planned for. That is why chipmakers like Intel and AMD jumped this week, and he expects the group to get back to its highs. We raised our view on chips as a result. Our chip fund already holds Intel and AMD as its two largest positions, so the point Camillo and ZaStocks also made, that processors are becoming the bottleneck for AI assistants, is already covered. One caution: Visser is still moving some of his own smaller AI holdings into crypto. Power, fiber optics and copper got no direct mention; his closest comment was that the physical world is now the limiting factor for AI. With chips upgraded, the AI Buildout theme rises to 25% of the portfolio.`,
        tickers: ['AIPO', 'GLW', 'SOXX', 'COPX'],
        bucket: 'AI Buildout',
      },
      {
        name: 'AI Applied',
        editorial: `This was the week Meta launched Muse, its personal AI assistant. Visser calls it the biggest market driver right now and expects it to set the tone for the next year. He has handed his own assistant his cards, bank accounts, fraud alerts and paperwork. He is more cautious about what it means for the big tech stocks. He expects excitement in the short run, but thinks competition from AI and tokenization will push their valuations down over time, and he reads Amazon's dispute with Meta over Muse as the start of that competition. That is a view he has held for a while, so our position on Amazon is unchanged; Camillo remains its strongest supporter. On Eli Lilly he was positive again, saying healthcare and drug discovery will be among the biggest beneficiaries of AI. This week's changes to the portfolio come from prices. Amazon's pullback makes it more attractive to add to, and it becomes the largest holding at 13.9%. Lilly's recovery trims it slightly, to 12.4%.`,
        tickers: ['LLY', 'AMZN'],
        bucket: 'AI Applied',
      },
      {
        name: 'Tokenized Rails',
        editorial: `Visser's framing this week: AI assistants are to crypto what the iPhone was to the internet. The payment rails were built over fifteen years, and assistants are finally the users who need them. He thinks crypto is early in a long bull market, partly because Wall Street still doesn't cover it, and says managers of very large funds are now calling him about tokenization. His 46-name crypto index is up 31% this month, with 44 of the 46 names in uptrends. BlackRock published a paper on AI and digital assets and moved some of its portfolios onto the blockchain, and the New York Stock Exchange announced a tokenization partnership. Ethereum was already our highest-conviction holding here; after cooling off from a sharp run, it rises to 13.2%. He spoke well of Robinhood's blockchain work, but its hint that "something big is coming" is only an announcement, so our view there is unchanged. He mentioned Solana again; we are tracking it but not buying.`,
        tickers: ['ETHA', 'HOOD'],
        bucket: 'Tokenized Rails',
      },
      {
        name: 'Monetary',
        editorial: `This theme got the week's clearest downgrade. Visser says crypto has moved past a trade driven by easy money and into one driven by real use, and that Bitcoin doesn't fit that story the way the rest of crypto does. It is also why gold isn't rising even as interest rates climb. His advice was to stop watching Bitcoin and watch the broader crypto index instead, which rose 31% this month against Bitcoin's 6.5%. Two weeks ago he called Bitcoin the one thing he was certain of for thirty years. Now he ranks it behind the rest of crypto, much as he ranked gold behind other assets in late August. We lowered our view on Bitcoin one step, and it falls from 12.1% to 11.3%. He still expects Bitcoin to rise as crypto grows, and his test still stands: Bitcoin below $80,000 by the end of October would be a problem. Gold stays where we had it. Silver got only a passing mention. Both are well off their highs, and we are not adding to either for now.`,
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
        editorial: `Amazon is still his biggest holding, and he says he would rather see it fall so he can buy more at a lower price. His case is that Amazon wins either way from Muse: Meta will pay Amazon a lot to run it on Amazon's cloud, and Amazon's warehouses and delivery network still matter when an AI assistant does the shopping. He thinks it is too early to crown a winner in AI shopping and expects companies to partner rather than compete. That support matters more this week, because Visser is more doubtful about big tech. His biggest trade of the week was a short-term options bet on Meta around the Muse launch, which he calls his second most profitable single day in twenty years. He keeps it separate from his long-term holdings.`,
        tickers: ['AMZN', 'META'],
        curated: true,
      },
      {
        name: 'Agentic AI / CPU',
        editorial: `On Monday he grouped AMD and Intel with Amazon and Meta: "what a time to be in the agentic AI / CPU biz." It was a theme rather than a detailed case, but it points at the same chipmakers Visser highlighted. Both are already the two largest positions in our chip fund, so we are not adding them separately. His lesson for the week: spend the weekend researching a catalyst you can act on now, rather than debating what AI might look like years from now.`,
        tickers: ['AMD', 'INTC'],
        curated: true,
      },
    ],
  },
  {
    name: 'ZaStocks',
    headline: 'SURVIVE THE CHOP, THEN PRESS',
    subtitle: 'ZaStocks (@ZaStocks) — chart-based trade ideas, gathered weekly; ideas to check, never buys on their own',
    asOf: 'wk of Sep 21 – 27 · via Grok',
    active: true,
    themes: [
      {
        name: 'Leaders getting tight',
        editorial: `His charts this week were market leaders holding just below their highs, which he reads as a sign of strength. Nvidia is trading in an unusually tight range for a stock that has defined this bull market. Palantir is acting like a leader again as it nears $200. Nebius is raising prices on strong demand while 21% of its shares are sold short. He also posted Arm, arguing that processors are becoming the bottleneck for AI assistants. That matches what Camillo and Visser said about chipmakers this week, and it supports our view on chips without adding a new holding. He called Meta's Muse the best consumer AI product since ChatGPT. None of these are portfolio holdings; we count them only when another voice agrees.`,
        tickers: ['NVDA', 'PLTR', 'NBIS', 'ARM'],
        curated: true,
      },
      {
        name: 'One more rally',
        editorial: `His market view stayed bullish. He expects one more strong rally into year-end, like April to June, and notes that tech stocks are holding near their highs despite worries about Iran, interest rates, oil and an AI slowdown. A real resolution with Iran, he says, could set off a second dot-com-style run. He flagged space stocks as an overlooked group if the market strengthens: he is watching Rocket Lab and owns a space fund. His discipline this week was to follow price over headlines, and to step aside when conditions aren't right. His full Sunday report is paywalled again.`,
        tickers: ['RKLB', 'SPCX'],
        curated: true,
      },
    ],
  },
]

export default VOICES
