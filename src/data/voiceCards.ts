// src/data/voiceCards.ts
// AlphaPlaybook — voice ledger cards. Extracted from SignalRecap.tsx 2026-08-17
// so the weekly cycle is a one-file edit. Render logic stays in the component.
//
// Cycle 2026-08-17 — NO FREEZE. Ticker set unchanged (v3.3 '2026-07-15-v3.3-coresat').
// No stage flip. CPI 3.4% → cap_multiple 1.0 dormant. CapEx GREEN ×1.00.

export interface VoiceSection {
  name: string
  headline: string
  subtitle: string
  asOf: string          // freshness stamp — when this voice last produced signal
  active: boolean        // true = feeds radar/engine; false = frozen reference card
  themes: {
    name: string
    editorial: string
    tickers: string[]      // curated list; ALSO the fallback when no live portfolio is in the snapshot
    curated?: boolean       // true: always show these tickers verbatim (social-arb picks not in the book)
    bucket?: string         // which engine portfolio bucket these tickers map to
    wholeBucket?: boolean    // true: chips = ALL live holdings in `bucket` (auto add/drop). false/undefined: chips = `tickers` pruned to what's actually held.
  }[]
}

export const VOICES: VoiceSection[] = [
  {
    name: 'Visser',
    headline: 'LONG SCARCITY, SHORT ABUNDANCE',
    subtitle: 'Jordi Visser — macro framework for the physical AI upgrade',
    asOf: 'August 16, 2026',
    active: true,
    themes: [
      {
        name: 'AI Compute',
        editorial: `The scarcity argument hardened into a supply schedule this week. CoreWeave disclosed that the A100 — introduced in 2020 — is now contracted through 2029, and the useful-life assumption moved from the two-to-three years originally guided to six-to-nine, for the plain reason that replacement capacity cannot be built fast enough to retire anything. His framing: “It is impossible to get enough compute for all of the billions of agents that are coming online.” The compute step-function he keeps drawing is 10-to-100× for coding agents over last year’s chatbots, then another 10×, then another. The capital has now organised itself around that shortage rather than merely reacting to it — Apollo, BlackRock, Blackstone, Brookfield, Goldman and KKR are standing up financing platforms to mobilise over half a trillion dollars of third-party capital, Morgan Stanley is facilitating a $1.5T infrastructure initiative, Alphabet raised $25B in the week and Intel priced a $15B offering that then traded above the issue. That is balance-sheet capacity moving off the hyperscalers and into structured vehicles, which is what a durable buildout looks like rather than a spending spike. The seat-level consequence is unchanged and he restated it directly: he wants to be long the receivers of the capital, not the model developers. Google is the object lesson — roughly $200B of capex this year earning a documented 30% ROIC with near-certain demand, against model development that needs tens of billions at high variance and no guaranteed return, so the talent chasing AGI leaves and the multiple compresses. Jeff Dean gone, Hassabis reportedly a flight risk, and Alex’s line that those who can’t compete on the frontier go toward compute. Data-center delays exist but he waves them off, and the reason matters for our memory seat: the delays are arguably helpful “because we don’t have enough memory anyway,” so the revenue simply pushes right rather than disappearing. On memory he is now positioned, not just talking — DRAM contract prices have gone higher, the long-term agreements with hyperscalers break the old cyclical earnings pattern, and he rebought Micron with a seven-handle around $700 after exiting in the 900s. Modest week on the tape: S&P +40bp, IWM and the Nasdaq +1%, his own thematic portfolio +3% and outperforming again, with S&P earnings growth above 30% and sales +15% year over year.`,
        tickers: ['SOXX', 'AIPO', 'COPX', 'GLW', 'ASML', 'SKHY'],
        bucket: 'AI Compute',
        wholeBucket: true,
      },
      {
        name: 'AI Application',
        editorial: `Neither Lilly nor Amazon drew direct commentary for the second straight window, so both seats carry on prior conviction rather than fresh sponsorship — Amazon’s live sponsor this cycle is Camillo, not Visser. What he did supply is the mechanism that governs the whole sleeve, and it is the time argument rather than an adoption argument. Agents run 24/7/365, which means a year-over-year comparison is a human measurement applied to a non-human production function: “we’re now doing effectively two times what it used to take in one year,” and eventually three and four. That is his explanation for why S&P earnings are compounding above 30% with global EPS up roughly 47% while hiring is flat to negative — aggregate weekly payrolls at their weakest six-month rate of change since 2012, labour-force participation still falling, average hourly earnings down to 3.2%, and no job creation at all once healthcare and leisure are stripped out. The investment consequence is hostile to most of this sleeve and he is blunt about it: the risk is not that growth fails but that it decelerates, because terminal value re-rates the moment a company stops growing near the pace of AI. He applies it to Anthropic’s own IPO math — the danger is not missing a trillion-dollar ARR but landing at $200B next year, at which point the valuation comes down sharply. Palantir gets cited at 149% revenue growth as the counter-example that is still clearing the bar. Google gets cited as a bureaucracy growing revenue above 30% and still losing, which is the whole thesis in one company. The second-order read for us is the deflation leg: if margins improve everywhere and competitors pass it through — his example is startup insurers underpricing incumbents — the disinflation shows up sooner than the Fed expects, which is the same argument doing work on the monetary card below.`,
        tickers: ['LLY', 'AMZN'],
        bucket: 'AI Application',
        wholeBucket: true,
      },
      {
        name: 'Tokenization',
        editorial: `He put a date on it for the first time, and that is the material change this cycle. “Beginning in September, the next constraint is not physical, it’s financial” — the guardrails, consumer agents, settlement, stablecoins, tokenization. The sequencing he now works to is enterprise agents next year, consumer agents in the back half of it, and agents cannot transact without wallets, rails and settlement, so the crypto layer stops being a parallel theme and becomes the dependency. Figure is the proof print he leans on: consumer-loan marketplace volume of $4.3B, up 132% year over year, with the tokenised Figure Connect marketplace expected to approach 70% of volume, and revenue above 100% growth against EBITDA above 50% — the “rule of 150” that he says perhaps two other large public companies clear. His argument for why it compounds is friction: a 30-to-60-day mortgage close is dead capital, and collapsing it toward same-day raises transaction velocity, which raises measured GDP and earnings without raising prices. He is committing his own franchise to it — Substack drops to roughly monthly, the crypto work moves behind the subscriber wall, and a dedicated crypto video goes twice-monthly from September and weekly thereafter. The index he is building runs about 45 names across ten verticals, and the public expressions he names are Figure, Robinhood, PayPal and Coinbase. Supporting flow: stablecoin card spending volume up another 16%, and the US bank regulator opening national charters to Bitcoin and crypto firms while Congress is still stuck on the Clarity Act — his point being that the SEC moves regardless and there is no sell-the-news to wait for. For our seats this is an S2 upgrade candidate, not an executed one: Stage 4 has moved from undated forward-catalyst to a dated September start, which under the timing rubric argues for re-rating HOOD and ETHA out of the one-stage-out band. Holding it for an observable cadence shift rather than an announced one — he has said “next year” about tokenization before.`,
        tickers: ['HOOD', 'ETHA'],
        bucket: 'Tokenization',
        wholeBucket: true,
      },
      {
        name: 'Monetary Scarcity',
        editorial: `The most explicit hard-money instruction he has given this quarter, and it lands in the same week the engine’s trigger moved further out of reach — which makes this the widest voice-versus-engine gap currently in the book. His words: “I happen to believe this is a mistake by the markets and you should be buying the debasement trade. You should be buying gold, buying silver, buying Bitcoin.” The entry read inside that is the useful part for us — the dollar has already broken to new lows, gold has moved and silver has moved, but “Bitcoin has not moved yet… eventually it will,” which is a lagging-leg setup on IBIT rather than a chase. Official demand is doing the work on the gold leg: China added 20 tonnes in July, its largest monthly purchase since October 2023, the PBoC is adding in Hong Kong, and the Bank of Korea has resumed buying after thirteen years. The bond market is the tell he keeps returning to — the week delivered a downside inflation surprise, a soft retail sales print and a miss on payrolls the week before, and long yields still would not come down, while the yen has not moved since the intervention even as September odds shifted to 31% for the Fed and 80% for the BOJ from roughly even before payrolls. On the inflation measurement fight he is with Warsh against the academics: he composites the Atlanta sticky core at 2.5, CPI core at 2.6, the Dallas trimmed mean at 2.2, and Cleveland at 2.7 into a single 2.5 reading, against PCE core sitting alone above it — and notes that from 1990 to 2020 the relationship ran the other way, which is his evidence the calculation itself has drifted. Bill Dudley reports Warsh may jettison PCE as the primary metric as soon as January; Bank of America is still calling for three hikes. Our discipline is unaffected by any of it: headline CPI printed 3.4% for July, down from 3.5%, so cap_multiple stays 1.0 and the monetary axis stays dormant and weight-inert. Conviction is loud, the gate is shut, and paused is not sold.`,
        tickers: ['SLV', 'GLDM', 'IBIT'],
        bucket: 'Monetary Scarcity',
        wholeBucket: true,
      },
    ],
  },
  {
    name: 'Camillo',
    headline: 'BET ON WHAT PEOPLE DO, NOT WHAT MARKETS THINK',
    subtitle: 'Chris Camillo — social arbitrage and the companies AI will make dominant',
    asOf: 'August 9, 2026',
    active: true,
    themes: [
      {
        name: 'AI Application',
        editorial: `He has concentrated down, and the sentence is the whole card: asked what he is still aggressively invested in after the drawdown, the answer was “mainly Bloom and Amazon.” Nebius drops out of the front rank by omission rather than by exit language. Amazon remains the anchor and he restated the method rather than the thesis, which is the more useful part for us — the discipline is to identify the single marginal driver of price action for a company and then leave finance entirely to find ground truth on it. For Amazon that driver is whether the capex converts into real returns, and he has spent recent months reading technology forums and developer accounts on Reddit and X rather than sell-side work, explicitly the same play that produced the original AWS call over a decade ago, when he saw engineers describing migrations before the market priced the cloud. He also reframed the drawdown as a buying mechanic he had pre-committed to: “you know what I’ve been saying for months, I hope Amazon goes down,” and it did, and he had been adding the whole way. Robinhood appears in his all-time list by dollar returns alongside Amazon, Nvidia and Palantir, but drew no fresh add this window, so HOOD carries forward on the 7/15 agentic-trading conviction rather than new sponsorship. Worth logging against our own gates: he describes 50-to-100-hour research trades and perhaps 70 to 80 positions across seventeen years, which is why a Camillo leg is a name nomination of real weight and still not, by itself, a seat.`,
        tickers: ['AMZN', 'HOOD'],
        curated: true,
      },
      {
        name: 'AI Compute',
        editorial: `This is the window where Bloom’s entry quality changed, and it changed for reasons that have nothing to do with the thesis. He took a 40% account drawdown — among the largest of his career — as BE fell from roughly $300 to $165, about 45%, and his read of the cause is entirely mechanical: Aschenbrenner was being margin-called on what he estimated at $10B-plus, and simultaneously essentially every levered fund in South Korea was being liquidated into the same names, with Bloom one of the most actively traded stocks in that market. His framing was that the forced flow had to end and the price did not deserve to be there, so he added into it while explicitly unable to time it: “there was a moment this morning where I legit almost threw up, then picked up more Bloom Energy in Amazon.” A near-eight-figure up day followed roughly twenty-four hours later. He was around 1× levered against Aschenbrenner’s 4×, which is the part he treats as the actual lesson rather than the P&L. For our book the consequence is specific and worth carrying into the next scoring run: BE is no longer the parabolic name that scored S5 near 30 on a +1,300% trailing year — a 45% unwind on forced supply into an intact thesis is the anti-momentum setup the engine is built to reward. It still carries a single voice leg with no Visser or ZaStocks corroboration, and its overlap with AIPO’s power sleeve needs resolving before any seat conversation. Watch, not seat — but watch it properly now.`,
        tickers: ['BE'],
        curated: true,
      },
    ],
  },
  {
    name: 'ZaStocks',
    headline: 'THINK BIGGER ON THE LEADERS',
    subtitle: 'ZaStocks (@ZaStocks) — technical setups and the AI market broadening beyond core semis',
    asOf: 'wk of Aug 10 – 17 · via Grok',
    active: true,
    themes: [
      {
        name: 'AI Compute — memory & the new leaders',
        editorial: `Micron is the convergence of the window and the only one. He bought the dip and posted the reason: Elon, replying to the claim that memory is the rate limiter of the agentic era, said “few realise this” — and separately the government asked Apple not to buy Chinese memory. The chart he showed sits near 971.66, reclaiming after a pullback beneath the descending trendline from the 1255 highs, above a 20-EMA near 900 and a 50-SMA near 805. Set beside Visser’s own rebuy with a seven-handle, that is two positive legs and a convergence payout of 60 — the first genuine cross-voice agreement in several windows. It does not become a seat: v3.3 de-seated MU deliberately because SOXX carries it as a real holding, and Rule B’s λ0.92 coverage discount applies to exactly this situation, so the convergence is logged and the exposure stays inside the basket. CoreWeave is the watch name, near 105.26 with a $104B backlog he thinks is “perfect for a government stake,” recovering above a 20-EMA near 92.8 and a 50-SMA near 97 but still under the descending trendline from 187 — one leg only, since Visser cited CoreWeave’s disclosures as evidence for the compute thesis rather than as a position. Nebius stays on watch on the short-interest setup, though Camillo has quietly de-emphasised it. The ledger item that matters most: he touched one of our holdings for the first time in six windows, and it was soft — “surprised $SKHY isn’t doing better but maybe it pulls a $SPCX.” That is a Mentioned, not a positive leg, and it carries no mechanical effect, but our largest thesis-seated satellite drawing a lukewarm nod from its own thematic corroborator belongs in the record ahead of the September rescore.`,
        tickers: ['MU', 'CRWV', 'NBIS'],
        curated: true,
      },
      {
        name: 'Software & data',
        editorial: `Reddit is his most-repeated name of the window and the one that comes closest to clearing without doing so. The setup is trendline support near 178 off a rising line from the 140 area, with a 20-EMA near 168.5 and price still under a 50-SMA near 184.9, and the catalyst stack is sequenced: “S&P 500 inclusion first. Data deals with OpenAI, Anthropic, and Google next,” with the post-earnings recovery from the software selloff framed as correcting something egregious. The trap to avoid here is a false convergence — Camillo talks about Reddit constantly, but as the venue where he goes to find ground truth from developers, not as a position, so it supplies no positive leg. RDDT therefore stands at one leg and, under corroboration-only, cannot seat. Figma is the other new chart: a post-IPO base near 25.42 with about 40% short interest and partnerships with OpenAI and Anthropic, well below the 142 highs against a 50-SMA near 31.6 — a base-in-progress with the short interest as the fuel, and no pillar fit in our book. Zeta and Oscar Health appear only as a passing “have been great,” which is a Mentioned and nothing more.`,
        tickers: ['RDDT', 'FIG'],
        curated: true,
      },
      {
        name: 'Off-thesis: SpaceX & robotics',
        editorial: `SpaceX draws his strongest institutional language of the window — “big money is loaded up on $SPCX and little money retail is yelling about how expensive it is” — with the argument that it is closer to an AI hyperscaler and national-security asset than a rocket company, not far behind Anthropic and OpenAI on revenue, and that waiting for a reasonable valuation will strand people. Visser was independently enthusiastic on the same name this week, citing 6-to-8 gigawatts of incremental data centres in 2027 with a case above ten, exclusivity with Nvidia on Vera Rubin, and roughly 80% of output earmarked for space-based capacity. That is the closest thing to a second leg in the window and it still does not qualify: Visser described the buildout as evidence, stated no position, and explicitly framed the equity as a call option. SPCX stays where we put it — no pillar fit and no gateable technicals as a new listing, which is a data failure rather than a thesis failure. Ouster is the robotics chart, near 48.71 after breaking out above a 20-EMA near 37.28 and a 50-SMA near 29.27 with prior resistance around 37, captioned “the robots are coming.” Robotics is Stage 5 in our clock and Camillo’s own deployment schedule puts scale at 2028, so it is a watch with a two-year fuse, not a candidate. The psychology he published is the useful counterweight to the L1 card’s confidence: “focusing on former leaders is how you can miss the new leaders in their early stages,” aimed squarely at the Marvell, Dell, Arm and Intel cohort that led in late March and early April and is now consensus.`,
        tickers: ['SPCX', 'OUST'],
        curated: true,
      },
    ],
  },
]

export default VOICES
