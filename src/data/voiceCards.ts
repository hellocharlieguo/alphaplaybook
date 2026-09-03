// src/data/voiceCards.ts
// AlphaPlaybook — voice ledger cards. Extracted from SignalRecap.tsx 2026-08-17
// so the weekly cycle is a one-file edit. Render logic stays in the component.
//
// Cycle 2026-08-31 — FROZEN as '2026-08-31-v3.4.1-stageflip'. 12 names, ticker
// set unchanged from v3.4. Two stage flips: ETHA forward→working (Visser 8/29–8/30),
// GLDM binding→working (Visser 8/30, relative de-rate). Three entry bands moved on
// Friday 8/28 closes: LLY 0.85→0.95, GLDM 0.85→0.75, SLV 0.60→0.75. 4.06pp turnover.
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
    asOf: 'August 30, 2026',
    active: true,
    themes: [
      {
        name: 'AI Buildout',
        editorial: `Nvidia delivered the quarter and the stock did nothing, and he treats that gap as the whole lesson. Revenue is now running past a billion dollars a day, guidance points to roughly 70% growth next year against a street looking for 44%, and 2028 estimates sit near $20 of earnings on a $220 stock — the inverse, he argues, of Cisco at 100 times earnings in the dot-com comparison people keep reaching for. He calls the tape the Nvidia mudstorm: up 9% one day, back down 4 or 5% the next, the multiple compressing faster than the earnings rise. He says plainly it is going to happen to a lot of the AI semiconductor names, because they are over-owned in the hedge fund world by people who have already made their money. Marvell reported into the same tape, ran from 180 to 240 on a good number, then gave it all back. The demand case is unchanged and he leans on the Dwarkesh Patel and Dylan Patel conversation to make it: OpenAI and Anthropic are centralising global compute because their margins let them outbid everyone, open source does not commoditise compute when compute itself is scarce, and neither of them treats open source as a competitive threat at all. Compute flows to whoever can monetise it best, which is circular in their favour — better models earn more revenue, more revenue buys more compute. Hyperscaler issuance is now about 9% of all investment-grade supply, double last year, with Broadcom alone bringing a $70B deal and triple-C spreads widening underneath. The sentence that governs this sleeve's size rather than its direction: he still expects these names to beat the S&P over twelve months, but there are no longer 10 and 20 baggers in them in a year — the firework show is over. Breadth agrees. Only 29% of his thematic names sit above their 50-day, the slope of the 50-day is turning down, the book is 25% off its highs, and tech momentum has made new lows. He expects the mud to last until the midterms.`,
        tickers: ['AIPO', 'GLW', 'ASML', 'SOXX', 'COPX'],
        bucket: 'AI Buildout',
      },
      {
        name: 'AI Applied',
        editorial: `His mindset has evolved since June, and he says so directly: the focus has moved to the application side and the rise of agent applications. The next year, in his framing, is about software that uses agents — and he names Eli Lilly in that same breath as a company that needs agents rather than one that sells them. That is the distinction the sleeve is built on. He has been consistent that 2026 was the year of AI agents and that consumer agents become the 2027 story, which is the wave the buildout is currently priced against. The observable marker this week was Grokbot: Musk backed a promise that xAI will make a user whole if the agent loses money while running their bank account. He reads that as the starting gun for consumer agents rather than a gimmick — you do not underwrite an agent's losses unless you intend it to touch real accounts. He is running a growing stack of his own agents daily and treats that as research rather than novelty. Underneath, software has recovered toward its highs after being destroyed in the first quarter and then caught in the July momentum unwind, and he notes the same forces cut both ways: the unwind covered shorts in software while reducing longs in semis. The connective thesis is that agents force infrastructure — the way agentic workloads forced memory and inference demand, they now force programmable money.`,
        tickers: ['LLY', 'AMZN'],
        bucket: 'AI Applied',
      },
      {
        name: 'Tokenized Rails',
        editorial: `This is the week the dated Stage 4 became a started one, and he says the words: this is the catalyst point. Tokenization is now, in his phrasing, the most important thing to be spending time on along with payment rails generally. The mechanism is specific rather than atmospheric — AI agents cannot transact without programmable money, tokenized assets make better collateral, and settlement speed becomes a competitive issue between countries rather than between exchanges. Japan is starting stocks and bonds tokenization plans this year and Korea is moving too, which he reads as a race already underway; his analogy is BlackBerry against the iPhone, a system that could not compete once the rails changed underneath it. On Ethereum specifically he is more direct than he has been: it is the root settlement layer for a new financial operating system, and its edge is trust at scale rather than raw speed, because financial systems are won on liquidity, standards, developer activity and institutional comfort rather than on technology alone. He states a position — he owns Bitmine because he believes in Ethereum, and he thinks Ethereum should outperform Bitcoin. The tape corroborates rather than merely accompanies the call: an ETH/BTC breakout, Solana up 46% month to date, and a tokenized index outperforming Bitcoin year to date while Bitcoin is still down. His argument for why this crypto winter ended differently is that the use case matured rather than that speculation returned — no FTX, no meme coins leading, fundamentals improving all year while price did not. And the reason he thinks there is time: nobody has done the homework. He compares it explicitly to Micron early last year, when the work was unstarted and the move had not happened yet.`,
        tickers: ['ETHA', 'HOOD'],
        bucket: 'Tokenized Rails',
      },
      {
        name: 'Monetary',
        editorial: `The most consequential sentence for this sleeve is a relative one, not a directional one. Asked about gold — and he notes that gold was the only thing macro people asked him about all week, in a week when crypto was exploding — he says he expects it higher and then immediately de-rates it: gold is not going to be the fastest horse in the race, and he does not think it finishes in the top hundred, because gold will not be part of the economy going forward. Direction intact, ranking cut. He also rejects the framing most people attach to the position: the debasement trade is a narrative, and what is actually happening is scarcity. Bitcoin has been chosen as the digital store of value and gold as the store of value, and the case for both strengthens as AI pushes everything replicable toward abundance. On the macro clock he is following actions rather than statements. Bessent intervened in the yen, changed the refunding language, introduced and then expanded the buyback framework, and floated tapping the TGA — a pattern, not a set of opinions. Warsh sounded hawkish at Jackson Hole and the market moved to roughly 60% odds of a hike, yet long yields backed up anyway, which he reads as evidence that the pressure on the long end is coming from the capital needs of AI rather than from Fed messaging. Ten-year yields sit far below a nominal GDP running near 6.5%; the honest level is arguably north of 8%, and the administration has made clear it will not permit that ahead of the midterms. On Bitcoin's own tape, the 200-day slope has turned up after more than a hundred days pointing down, a configuration that has occurred four times before and never once revisited the prior lows. His sizing rule stays a probability rather than a number: hold in Bitcoin whatever odds you assign to your own investments being disrupted by AI.`,
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
    asOf: 'wk of Aug 24 – 31 · via Grok',
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
        editorial: `Robinhood is the only book name he is actively constructive on, and it is the closest thing to convergence this window produced. He describes a weekly chart tightening into a triangle after reclaiming all key moving averages just as crypto gets going again, with price near $104–110 against a descending trendline and the reclaimed averages clustered at roughly $95–101. He notes he has been a longtime bull on the company. Alongside it he flagged SoFi still forming a mini-base against $20 — a level he thinks eventually gives way, and a chart he compares to how Robinhood looked earlier — and Coinbase on a multi-month base with $150 and the 200-week average marked as the levels that matter. Neither carries a stated position, so both stay Mentioned.`,
        tickers: ['HOOD', 'SOFI', 'COIN'],
        curated: true,
      },
      {
        name: 'Expensive stocks are often the best',
        editorial: `His framing rule this week, offered alongside Palantir, CrowdStrike and Cloudflare as the examples — quality rarely gets cheap, and waiting for it to is how the entry disappears. The related observation: if you are waiting for a stock to be all over your feed before buying, it is probably late. On Meta he is more specific, arguing vertical integration in AI is becoming the thing that matters and that the fear campaign around it resolves higher the way it has for prior hyperscalers. None of this seats anything. Of the twelve book names, he named exactly one — HOOD — and searches explicitly returned nothing for AIPO, SOXX, GLW, COPX, ASML, LLY, AMZN, ETHA, SLV, GLDM or IBIT. His Sunday Substack, which contains the actual portfolio and his stated favourite setup, is paywalled and not visible to the capture.`,
        tickers: ['PLTR', 'META', 'NET'],
        curated: true,
      },
    ],
  },
]

export default VOICES
