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
        editorial: `The compute seat moved for the first time since he called the mid-cycle slowdown. Pointing at his own agentic basket, he said this is the area where he did that slowdown, the structure is now really good, it just had its best week in months, and the infrastructure trade has a catalyst: consumer agents will drive the token numbers up significantly, which is why Intel and AMD moved. He expects those names to get back to their highs and says compute needs just went up exponentially. That is a stage call, and SOXX advances one rung from cooling to working. The point Camillo and ZaStocks made the same week, that CPUs are the bottleneck for agents, is already inside the seat: Intel and AMD are SOXX's two largest holdings at about 10% each. One caution is recorded: he is still moving his smaller AI positions into crypto, which is a statement about his allocation, not the stage. Power, optical and copper drew no direct mention; his nearest line was Blackstone's John Gray saying the limiting factor is now the physical world. The flip lifts AI Buildout to 25.0 on the engine's own number, so the 24.70 override set after the ASML cut is retired. AIPO, GLW and COPX all slipped under their 50-day averages while holding their 200s, which improves their entry bands, but AIPO sits only 0.3% above its 200-day.`,
        tickers: ['AIPO', 'GLW', 'SOXX', 'COPX'],
        bucket: 'AI Buildout',
      },
      {
        name: 'AI Applied',
        editorial: `This was the Muse week. He calls the arrival of the personal agent the thing driving the market now and, in his view, the driver of the next twelve months, and says he has handed his own agent his cards, bank accounts, fraud alerts and DMV errands. The investment read is narrower than the excitement. He expects a hype trade in the Mag 7, but says they will not outperform the S&P and that in the end all of them will go through multiple compression as AI and tokenization drive hyper-competition. He reads Amazon's standoff with Meta over Muse as that competition beginning. That is his standing view on the hyperscalers restated, not a stage call, so Amazon holds at working; its current support comes from Camillo. Eli Lilly held its support. He says healthcare and pharmaceuticals will be a major part of the agentic side and a better outcome for biology than for consumer spending, citing Insilico Medicine's work with Lilly. The weight changes this week are price. Amazon fell 3.9% under its 50-day, which puts it in its best entry band, and becomes the largest seat at 13.9. Lilly moved back above its 50-day and eases to 12.4. Amazon is now only 2.2% above its 200-day, the level to watch.`,
        tickers: ['LLY', 'AMZN'],
        bucket: 'AI Applied',
      },
      {
        name: 'Tokenized Rails',
        editorial: `The thesis got its framing this week. Agents are crypto's iPhone moment, the rails were built for fifteen years waiting for an app store, and the app store is the agent. Crypto is at the beginning of a Peter Lynch-style bull market precisely because Wall Street does not cover tokens yet, and he says the people who manage trillions are now calling him about his tokenization paper. The breadth he measures kept improving: 44 of his 46 names are above their 50-day averages, up from 43, and the index is up 31% for the month. He calls that a bull market. BlackRock published its machine-native economy paper and put model portfolios on chain the same week, and NYSE teamed with Blockchain.com on tokenization. ETHA is already at the top rung. Its stretch eased from 26.5% to 19.4%, back under the 25% line, so its entry band recovers and it rises to 13.2. Robinhood got supportive mentions: its chain is driving developer interest, and he points to Vlad Tenev as the clearest voice on tokenization. The line that something big is coming in stock tokens is an announcement, so HOOD holds at working. Solana was named again, trading at 121 and moving in a different way, and stays watch-not-seat.`,
        tickers: ['ETHA', 'HOOD'],
        bucket: 'Tokenized Rails',
      },
      {
        name: 'Monetary',
        editorial: `The monetary seats took the week's clearest downgrade. He says innovation moves from liquidity to fundamentals, that crypto is now at the fundamental stage, and that Bitcoin does not fit that argument. What is working is not a liquidity or debasement trade, which is why gold is not going higher while yields rise. On Friday he told listeners Bitcoin is not what to watch; the index is, up 31% for the month against Bitcoin's 6.5%. Two weeks after calling Bitcoin his one thirty-year certainty, he now places it below the ecosystem. That is a relative downgrade of the same kind gold took on 8/30, so IBIT moves one rung, binding to working, and falls to 11.3. It is not cooling: he still expects Bitcoin to benefit as the ecosystem benefits and calls it good that Bitcoin rose 60% in a quarter when rates also rose. His dated test from last week stands: below 80,000 by the end of October is a problem. Gold's line reinforces its 8/30 downgrade without adding a new stage call, so GLDM holds at working. Silver drew only a passing mention about deleveraging. GLDM and SLV both remain below their 200-day averages and entry-paused, 16.9% of the book.`,
        tickers: ['IBIT', 'GLDM', 'SLV'],
        bucket: 'Monetary',
      },
    ],
  },
  {
    name: 'Camillo',
    headline: 'INFORMATION EDGE, NOT VIBES',
    subtitle: 'Chris Camillo — social arbitrage; nomination only, cannot move themes',
    asOf: 'September 27, 2026',
    active: true,
    themes: [
      {
        name: 'AI Applied',
        editorial: `Amazon is still the core, and he says followers should know he wants it to go down, not up, so he can add at better prices. His Muse argument is that Amazon gets paid regardless: Meta will run a large AWS Bedrock and Graviton bill, and Amazon's logistics and fulfillment moats do not disappear because an agent sits upstream of the purchase. Agentic commerce is too early for a winner-take-all outcome, and he expects partnerships and shared economics. That refreshes his current leg on the seat, which matters more this week because Visser is negative on Mag 7 multiples. The loud trade was separate: a Meta options position opened Friday on Muse traction that he says became his second most profitable single day in twenty years. It was time-boxed, and he keeps it apart from the long book.`,
        tickers: ['AMZN', 'META'],
        curated: true,
      },
      {
        name: 'Agentic AI / CPU',
        editorial: `On Monday he bundled AMD and Intel with Amazon and Meta: what a time to be in the agentic AI and CPU business. It was a theme call rather than a detailed thesis, but it lands on the names the book already owns through SOXX, where Intel and AMD are the two largest holdings. It counts as L2 corroboration for the SOXX stage flip, not as a reason to seat either name. His process line for the week: do the weekend work on a researchable, same-week catalyst instead of arguing about robotaxi fleet sizes years out.`,
        tickers: ['AMD', 'INTC'],
        curated: true,
      },
    ],
  },
  {
    name: 'ZaStocks',
    headline: 'SURVIVE THE CHOP, THEN PRESS',
    subtitle: 'ZaStocks (@ZaStocks) — technical setups via scheduled Grok task; candidates to verify, never auto-seat',
    asOf: 'wk of Sep 21 – 27 · via Grok',
    active: true,
    themes: [
      {
        name: 'Leaders getting tight',
        editorial: `Sunday's charts were all leaders in bases. Nvidia is coiled under 236.54, and he says bull-market defining stocks rarely get this tight. Palantir is pressing toward its 207.52 high and acting like a leader again. Nebius is in a rising triangle under 299.86 with 21% short interest while raising prices on demand. Earlier in the week he posted Arm after its pullback from 452.7, with the thesis that CPUs are a legitimate bottleneck as agents arrive. That lines up with Camillo on AMD and Intel and with Visser's compute catalyst. It is corroboration for the semis seat, not a reason to add Arm. He called Muse the best consumer AI product since ChatGPT and compared the sentiment around Oracle to Meta's in 2022. None of these are book names. They are candidates only and need another voice before they count.`,
        tickers: ['NVDA', 'PLTR', 'NBIS', 'ARM'],
        curated: true,
      },
      {
        name: 'One more rally',
        editorial: `His market read stayed firmly bullish. He wants one more April to June style rally into year-end, says the Nasdaq is holding near its highs through Iran, yields, oil and the AI-slowdown story, and treats a real Iran resolution as the unlock for a second dot-com run. Space is the neglected group to watch if the tape improves: Rocket Lab is basing around 60 to 62, and he holds SPCX for exposure. The discipline was price over headlines and a reminder that the best traders walk away when conditions are not optimal. His Sunday report is paywalled after the teaser again.`,
        tickers: ['RKLB', 'SPCX'],
        curated: true,
      },
    ],
  },
]

export default VOICES
