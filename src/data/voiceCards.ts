// src/data/voiceCards.ts
// AlphaPlaybook — voice ledger cards. Extracted from SignalRecap.tsx 2026-08-17
// so the weekly cycle is a one-file edit. Render logic stays in the component.
//
// Cycle 2026-09-07 — NOT FROZEN. The cron still runs '2026-08-31-v3.4.1-stageflip'.
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
    asOf: 'September 6, 2026',
    active: true,
    themes: [
      {
        name: 'AI Buildout',
        editorial: `The tape got worse and his call got firmer, and he is explicit that those are not in conflict. Semiconductors are down 14% quarter to date against the S&P up three and the Nasdaq down three; the SMH sits below its 50-day and the slope is pointed down. He states that as a fact rather than arguing with it, and then tells you to ignore the people reading it as a top: this stuff is bottoming after this, and what looks like a breakdown is a consolidation. His test for the bears is a consistency check rather than a chart — if a technician is bearish on semiconductors, go see whether they are also bearish on yields and on Bitcoin, because a single position wearing three costumes is an endgame bias, not three pieces of analysis. The structural argument is unchanged and now stated more sharply: interest rates are a rounding error on inference P&L, so the rate panic attached to this sleeve is misdirected. Three companies matter — Anthropic, OpenAI and Nvidia — and Nvidia is the head of the circular finance, selling to everyone whose revenue depends on compute, which is what lets Dell and Marvell and Micron stop worrying about hardware cost. Nvidia is approaching new all-time highs while the basket sits 14% down, and he uses that divergence as the argument: you do not call semiconductors a bubble while the name everything else follows is breaking out. Revisions are running at 88% and the PEG is at its lowest since the late nineties. The one risk he names explicitly is model price compression, and he says it is not happening yet. On the physical side, from 9/5: friction is good right now — not enough memory, data centres being pushed back — because the alternative is things moving faster than anyone can absorb. The bottleneck is intact; the tape is just unpleasant.`,
        tickers: ['AIPO', 'GLW', 'ASML', 'SOXX', 'COPX'],
        bucket: 'AI Buildout',
      },
      {
        name: 'AI Applied',
        editorial: `This is the week the adoption wave moved, and he marks it in one sentence: we went to the coding agents, but now we are in the personal and the workflow agents. The example he gives is concrete rather than aspirational — a personal workflow agent that reads, summarises, compares, recommends and asks permission — and he notes the compute demand on that is massively larger than on what came before. The consequence he draws is the connective one for the whole book: that means we need financial agents, and that is what is beginning to happen now. The corroboration is shipped product rather than roadmap. Grok now lets users buy or lend crypto through a MoonPay integration; Stripe integrations keep arriving weekly; and he cites the Gavin Baker segment describing Grokbot-style agents as a new consumption shock. His own use has changed shape too — first typing, then chatting and collaborating, and now sending agents off to build things and come back for a staff meeting. From 9/5, the framing for why rates do not govern this: four years of model capability improvement is compressing into next year, and this is all about agents, consumer agents, enterprise adoption and profit margins rather than about the discount rate. He tells people working jobs who have not learned agentic workflows that the time is gone, and he means it as an urgency claim about the final four months of the year. Note what this card does NOT contain: no Visser mention of Amazon or Eli Lilly in either episode. Both seats rest on prior weeks — LLY on the 8/23 flag clearance, AMZN on Camillo's now-stale coverage.`,
        tickers: ['LLY', 'AMZN'],
        bucket: 'AI Applied',
      },
      {
        name: 'Tokenized Rails',
        editorial: `He gave the cleanest statement of the thesis he has produced, and it is a split into three roles rather than one trade: Bitcoin as collateral and store of value, Ethereum for the trust that has to exist before people build on it, and Solana for the speed. That is where he has ended up, and he adds that other tokens will outperform and he does not care. He is more certain than ever that the financial guardrails are needed. The reason crypto is rallying, in his framing, is not liquidity — crypto did not lack a use case, it lacked a native user, and AI creates one. AI is the crypto killer app: the first phase of crypto was building something humans would embrace, but agents are what actually need digital payments, stablecoins and tokenization. On Robinhood he is specific in a way he has not been: it was upgraded by multiple shops partly on its new layer-2 chain, it is heavily involved in stock-token trades, and a billion and a half dollars of those trades cleared in six weeks — something that sounded like science fiction two years ago. The RWA market has grown eighteen times. He notes the shape looks like the token expansion curve in AI, and that Robinhood sits inside his 46-name crypto portfolio of six stocks and forty tokens. Ethereum's 200-day has turned up, matching Bitcoin, and ETH is up 56% quarter to date against Solana 38% and Bitcoin 36% — he still ranks Ethereum first. The gap this card records: the speed role has no seat in the book. Solana's 200-day has also turned up and it is consolidating higher, and he says he will show all three every week. Watch-not-seat until correlations exist.`,
        tickers: ['ETHA', 'HOOD'],
        bucket: 'Tokenized Rails',
      },
      {
        name: 'Monetary',
        editorial: `Gold and silver got zero airtime across both episodes for a second consecutive week, which is the most important thing this card can record. The 8/30 relative de-rate — gold higher but not the fastest horse, not in the top hundred, because gold will not be part of the economy going forward — stands unrefreshed and continues to govern GLDM's working classification. Silver has not been named since 8/16. Neither absence is a stage call, and neither moved anything: no quote, no timing change. Bitcoin is where the week's conviction went. He puts it in Elliott terms — a great trade starting before consensus is his third wave start, the most powerful wave in crypto — and the evidence he wants for it is the doubt itself. That is the silent IPO thesis: he needs believers to stop believing, and he is getting it, from dinner conversations with people who were major winners and have reduced significantly, and from Mark Cuban saying on television that he is pretty much done with it. The ideologues have bailed and the people who missed the move are waiting for a retest to the sixties that he does not think arrives. The tape supports rather than merely accompanies it: the 200-day has turned up, and the pattern is a large advance followed by sideways action he reads as bullish consolidation. The macro frame is the double debasement story — crypto takes a rising share of fiat assets over five years because of AI disruption and because the government cannot let rates run. He is candid about the ceiling: earnings are growing 30% a year and these are growing at half that, so this is a flows-and-adoption argument, not an earnings one.`,
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
    asOf: 'wk of Sep 1 – 7 · via Grok',
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
        editorial: `Robinhood is again the only book name he touched, and this week it is fundamental rather than technical: Robinhood is releasing more products and innovating faster than just about any non-AI company in the market. No chart, no moving averages, no level, no stated position — so it stays Mentioned. It does not corroborate, either: his leg only counts when Visser or Camillo point at the same name, Visser did not name it in either episode, and no Camillo capture exists for this window. HOOD then ran 19.1% on the week to 122.11, which pushed stretch from 1.3% to 19.2% and moved S5 from 58 to 56 — the entry brake engaging on this name for the first time, trimming it 8.0 to 7.4. Worth noticing that the brake is currently working against the leg carrying the freshest independent evidence. That is the design behaving correctly, not a fault. Nothing else from the book appeared: he explicitly did not name AIPO, SOXX, GLW, COPX, ASML, LLY, AMZN, ETHA, SLV, GLDM or IBIT.`,
        tickers: ['HOOD', 'SOFI', 'COIN'],
        curated: true,
      },
      {
        name: 'Expensive stocks are often the best',
        editorial: `The week's dividing line is quality against speculation: a lot of speculative AI has topped permanently, while quality AI still looks good and earnings show no slowdown — only price pays. Early week was exhausted chop and poor sentiment; midweek he said today felt different and that the Nasdaq's chart is something. He holds Dell from the $150s and frames it as a multi-month swing rather than an investment, and he is in Marvell with no level given. Those are the only two carried positions. The rest is chart work on names outside the book — Nvidia near highs as the king, Intel basing around 88–90 on a US-manufacturing overlay, CoreWeave working under a descending trendline on its customer list, and Vistra flagged for its buyers rather than his own fill. Vistra is the one that would tempt: tracked name, dedicated weekly chart, notable holders. It fails twice — AIPO is already the book's power bet, and at 149.30 against a 157.76 200-day it is entry-paused at S5 45 with zero lenses pointing. The psychology he repeated is worth keeping: the best trade is often the one you are already in that is working, boredom is why people overtrade, and selling every 10% move means never catching a multi-bagger. His Sunday Substack remains paywalled and outside the capture.`,
        tickers: ['PLTR', 'META', 'NET'],
        curated: true,
      },
    ],
  },
]

export default VOICES
