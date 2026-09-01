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
    asOf: 'August 30, 2026',
    active: true,
    themes: [
      {
        name: 'AI Compute',
        editorial: `Nvidia delivered the quarter and the stock did nothing, and he treats that gap as the whole lesson. The print was a blowout — revenue running past a billion dollars a day, guidance for roughly 70% growth next year against a street looking for 44%, and 2028 estimates now near $20 of earnings on a $220 stock, which he contrasts directly with Cisco at 100 times earnings in the dot-com comparison people keep reaching for. The stock is up about 25% over a year. He calls this the Nvidia mudstorm: up 9% one day, back down 4-5% the next, with the multiple compressing faster than the earnings rise, and he says plainly it is going to happen to a lot of the AI semiconductor names because they are over-owned in the hedge fund world by people who have already made their money. Marvell reported into the same tape, ran from 180 to 240 on a good number and guidance better than expected, then gave it back. The demand case is unchanged and he leans on the Dwarkesh Patel and Dylan Patel conversation to make it: OpenAI and Anthropic are centralising global compute because their margins let them outbid everyone, open source does not commoditise compute when compute itself is scarce, and neither of them treats open source as a competitive threat at all. Hyperscaler issuance is now about 9% of all investment-grade supply, double last year, with Broadcom alone bringing a $70B deal and triple-C spreads starting to widen underneath. The sentence that governs the sleeve’s size rather than its direction: he still expects these names to beat the S&P over twelve months, but “I don’t think you’re getting 10 and 20 baggers from those in a year anymore — the firework show is over.” Breadth says the same thing. Only 29% of his thematic names sit above their 50-day, the slope of the 50-day is turning down, the book is 25% off its highs, and tech momentum made new lows. He expects the mud to last until the midterms.`,
        tickers: ['SOXX', 'AIPO', 'COPX', 'GLW', 'ASML', 'SKHY'],
        bucket: 'AI Compute',
        wholeBucket: true,
      },
      {
        name: 'AI Application',
        editorial: `The framing shift he has been building toward since June is now stated outright, and it lands on this sleeve: “my mindset has evolved since June and I’ve been more focused on the application side and the rise of agent applications, and the fact that I believe the next year is all about software that uses agents — applications, and including things like Eli Lilly that need agents.” That is the first time he has named Lilly as an agent-consuming application rather than a defensive pharma holding, and it strengthens the seat on his own logic rather than on price. Palantir moved from commentary to confirmed ownership: “Palantir is part of the thematic portfolio. It’s what I’ve written about. It’s what I own,” named as part of the software complex that has recovered toward its highs, led out by Bitcoin miners. The rotation logic underneath is unflattering to the infrastructure names and favourable here: software was destroyed in the first quarter, nobody owned it, the July momentum unwind forced shorts to cover in software while longs came out of semis, and that flow has not finished. Amazon drew no direct commentary again. The structural bear case is unchanged and he keeps restating it as the reason multiples compress rather than as a market call — competition arrives three years out for everything, terminal value keeps shortening, and there will never be a bull market that feels like one. He also expects higher corporate taxes eventually, on the argument that humanoids and exploding profit margins are where the government will have to go for revenue when the consumer tax base stops working.`,
        tickers: ['LLY', 'AMZN'],
        bucket: 'AI Application',
        wholeBucket: true,
      },
      {
        name: 'Tokenization',
        editorial: `This is now his largest conviction and he said so in allocation terms: given $100 to invest, “I have more money focused on crypto right now, and it’s not just Bitcoin. It’s Ethereum. It’s Solana.” Solana enters the picture for the first time — up 46% month to date, outperforming Ethereum recently, and back to where it stood against semiconductors in early February, which is his illustration of how fast this can travel. He also disclosed a new holding: BitMine, owned specifically as an Ethereum expression after Tom Lee’s argument that Ethereum is the institutional settlement layer, won on liquidity, trust, standards and path dependence rather than on speed. His own ranking is explicit — Ethereum should outperform Bitcoin, and Ethereum has already broken out against it. The thesis is that tokenization turns assets into software, which only becomes useful once agents are the users of those markets, and that is the catalyst that has arrived. Evidence he stacked this week: Japan announced stock and bond tokenization plans, Korea is racing alongside, Coinbase and Better launched Bitcoin-backed mortgages, and his 46-name tokenized index broke out again and is positive on the year while Bitcoin is still down. The tell he keeps returning to is that nobody has done the work — in a week when Solana rose 40%, the only thing macro people asked him about was gold. He compares the setup directly to Micron a year ago at 60 before it went to 1,300, and puts the big part of the move from January through roughly August of next year.`,
        tickers: ['HOOD', 'ETHA'],
        bucket: 'Tokenization',
        wholeBucket: true,
      },
      {
        name: 'Monetary Scarcity',
        editorial: `The reclaim held and consolidated — Bitcoin around 80,000 with 82,000 the natural resistance and 74,000 the support that matters, and the structural signal he cares about is that the 200-day slope has now turned up on both Bitcoin and Ethereum. He ran the history: four prior instances of the 200-day pointing down for at least 100 days and then breaking back above, and in every case the prior lows were never revisited, which would put roughly 58,000 as the floor if history holds. The macro chain continued in the same direction — Bessent floated tapping the $1T TGA, following the yen intervention, the refunding language change, the buyback framework and then larger buybacks, which he reads as a pattern of intent rather than a series of one-offs. Warsh at Jackson Hole said nothing new but moved September hike odds from 35% to about 60%; Visser thinks he will not hike, because doing so would offset everything the Treasury is attempting and because nobody wants the long end breaking ahead of the midterms. Ten-year yields did not fall on hawkish talk, which he takes as evidence the pressure is coming from AI capital needs rather than from policy. The item that matters most for how this sleeve is weighted is a demotion, and it is unambiguous: “if gold is the big trade and people are saying, well, I think it’s going to go up — I do too. Gold’s not going to be the fastest horse in the race. I don’t even think it’s going to finish in the top hundred of the fastest things.” He is not bearish gold; he is explicit that it sits outside the economy being built, where the tokenized rails and stablecoins sit inside it. Store of value remains good, and ranks last among the things he wants to own.`,
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
    asOf: 'August 30, 2026',
    active: true,
    themes: [
      {
        name: 'AI Application',
        editorial: `First signal from him since 8/9, and Amazon is unchanged as the core, high-conviction mega-position — unofficial trackers still put it at a large majority of his estimated public exposure. The one thing he said about macro is the useful part for us, because it is a discipline statement rather than a view: a possible rate hike is a known short-term risk that “changes nothing about my larger $AMZN thesis.” Known macro noise is not a thesis change. The thesis itself is the long-running one, that the market underestimates Amazon’s role in the AI infrastructure buildout. The new idea of the week is Take-Two, bought after leaked GTA VI gameplay on 8/21 — unpolished footage showing a leap in world density, NPC behaviour and systemic depth, which he reads as a possible generational leap rather than a graphics update, and he has traded this franchise’s cycles since 1999. We are logging it, not seating it: it is a consumer product-cycle bet with no pillar fit, and he frames it as speculative himself — if the gameplay does not excite players it fails. Robinhood and Bloom still appear in his estimated holdings but were not this week’s focus. The process note is the most quotable thing he published and it is aimed straight at people sizing into Nvidia earnings on feel: “conviction without an information edge is just confidence dressed up as research.”`,
        tickers: ['AMZN', 'HOOD'],
        curated: true,
      },
      {
        name: 'AI Compute',
        editorial: `No fresh Bloom commentary this window — it appears in estimated-holdings discussion alongside Robinhood, AMD, Micron and a handful of older names, but it was not part of what he actually posted about, and the week’s two active ideas were Amazon and Take-Two. So this seat carries forward on prior conviction rather than on anything new, and the aging is worth stating plainly rather than papering over: the last substantive Bloom thesis work from him predates this window by several weeks. What did carry over is the sizing philosophy that governs how he holds it — concentrated bets when the signal is real, sized down when it is not, with Amazon as the concentrated multi-year thesis and Take-Two explicitly framed as the high-upside speculative one. His method note applies directly to any power-and-datacenter name: go to primary sources, small accounts and people who actually use the product, because “you’ll never get to ground truth by lazily relying on what algorithms surface.” Treat the Bloom conviction as held and quiet, not re-affirmed.`,
        tickers: ['BE'],
        curated: true,
      },
    ],
  },
  {
    name: 'ZaStocks',
    headline: 'THINK BIGGER ON THE LEADERS',
    subtitle: 'ZaStocks (@ZaStocks) — technical setups and the AI market broadening beyond core semis',
    asOf: 'wk of Aug 24 – 31 · via Grok',
    active: true,
    themes: [
      {
        name: 'AI Compute — the quarter and the mudstorm',
        editorial: `Nvidia is now Adding-Holding rather than admired from a distance — “another monster $NVDA quarter proving that demand isn’t slowing down and AI is accelerating,” with the note that he has been bull posting it for weeks and that the muted initial reaction is typical. No new chart this window, so it is conviction without a fresh level. Super Micro is the genuinely new name and it comes back on his radar through earnings rather than price: a monthly big-picture base near 37.08 against a 20-EMA around 36.4 and a 50-SMA of 35.41, with a descending trendline arriving at current price after the long fall from 122.9, and his framing is that “if the fraud and accounting issues didn’t exist this stock would be 3x higher.” SpaceX keeps the narrative slot with no chart and no level, argued as a full AI stack across compute, models, Cursor distribution, Grok consumer and connectivity, with insiders not selling — “if you thought $SPCX was expensive at $105 wait until how expensive it looks when it’s $200.” It stays where we put it: off-thesis, no pillar fit, no gateable technicals. His stance on the sleeve overall is the same caution Visser is expressing from the breadth side — the Nasdaq has chopped sideways for four months, NVDA earnings and Jackson Hole both proved nothing burgers, and “pressing in tech when conditions are choppy is how you end up blowing up.”`,
        tickers: ['NVDA', 'SMCI', 'SPCX'],
        curated: true,
      },
      {
        name: 'Fintech tightens — and he is long one of ours',
        editorial: `Robinhood is the second consecutive window in which he has named a seat we hold and stated he is long it, which under our rules is the strongest thing an L2 voice can do for an existing position. The setup is now specific: a weekly triangle tightening against a descending trendline near 104-110 after reclaiming every key moving average in the 95-101 area, with the old high marked at 153.86, and the reason attached is crypto — “getting tight, reclaimed all key moving averages just as crypto gets going again,” alongside “been a longtime $HOOD bull. Love the company.” That is a second independent leg beside Camillo, who still carries HOOD in his holdings, and it arrives in the same week Visser moved crypto to his largest allocation — three voices pointing at the same transmission mechanism from different directions. SoFi is the pattern-match again and he sharpened it: still forming a mini base against the $20 level with price near 18.06, a 20-EMA of 18.03 and a rising 200-SMA at 12.84, and “eventually you have to think the wall comes down… looks a bit like $HOOD did.” Coinbase carries over from 8/24 unchanged — multi-month base near 186.49 with the $150 level and the 200-week moving average flagged as the two that matter. Neither SOFI nor COIN has a stated position, so both stay candidates to verify.`,
        tickers: ['HOOD', 'SOFI', 'COIN'],
        curated: true,
      },
      {
        name: 'Expensive stocks are often the best',
        editorial: `The framing of the week is a valuation stance rather than a setup: “expensive stocks are often the best. $PLTR $CRWD $NET etc. the list goes on.” Palantir appears only inside that list — no chart, no level, second consecutive window as a reference rather than a setup — so its ZaStocks leg keeps aging even as Visser has just confirmed he owns it outright. Meta is the one he actually argued for, on vertical integration: “vertical integration in AI is becoming more important, Meta is perfectly positioned. The demise of Zuck is being greatly exaggerated,” with price near 578 above longer-term support in the 460-530 band and a prior high at 796.25, framed as a fear campaign of the kind that historically resolved higher for prior hyperscalers. No book holding appears in this block. Of our tracked list he named only HOOD, COIN and PLTR all window; nothing on AIPO, SOXX, GLW, COPX, ASML, LLY, AMZN, ETHA, SLV, GLDM, IBIT, MRVL, DELL, WDC, MSTR, FLNC, RDDT, TEM or CRCL, and TEM and CRCL both dropped out after carrying dedicated charts last week. His risk note is the one to hold against a week when three voices turned bullish at once: “if you’re waiting for a stock to be all over your feed before buying, it’s probably late and the best entry is gone.”`,
        tickers: ['META', 'PLTR', 'NET'],
        curated: true,
      },
    ],
  },
]

export default VOICES
