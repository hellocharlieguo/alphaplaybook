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
    asOf: 'August 23, 2026',
    active: true,
    themes: [
      {
        name: 'AI Compute',
        editorial: `He is still long this sleeve and no longer leaning on it, and he said so plainly: the AI infrastructure trade will still outperform the S&P and is still where you want a lot of your money in the stock world, but “my overweights are towards the scarcity trade.” The position detail is the most specific he has given in months. Marvell is a decent sized position he is explicitly sticking with — “I still love it… I still think there’s a triple quadruple from here” — and it is the largest name he identifies inside the thematic portfolio once Lilly, silver and Bitcoin are set aside as not really counting. Micron is only a little bit, bought into the down move. Fluence is down roughly 50% from his own highest purchase and is a tiny position, with EOS smaller and worse. The mechanism he keeps returning to is multiple compression rather than demand: Nvidia has gone from a 40-50 forward multiple to about 19, a fourteen-bagger since 2022 with a PEG below one, and yet roughly 80% of its gain since June 2024 arrived in four of twenty-four months. He calls that the Nvidia mud trap and says it is the AI trade going forward. On the shortage itself he called balls and strikes against his own book: Warren Pies flagged early cracks in GPU availability data, and Visser’s read is that GPU pricing stops rising and goes sideways at a high level, which is ordinary depreciation rather than damage — “the fireworks show is over.” The volatility numbers underneath are the ones worth keeping: Micron’s 60-day realised vol printed near 120 against Bitcoin’s 24, Micron and IBM 90-day vol has spiked while S&P 90-day vol has not moved at all, which he says has never happened since 2009, and Morgan Stanley tech momentum has had 57 five-percent days this year against zero in the whole post-crisis period. His conclusion is a sizing conclusion: “you can’t own as much Micron as you can Bitcoin right now cuz it’s less volatile.”`,
        tickers: ['SOXX', 'AIPO', 'COPX', 'GLW', 'ASML', 'SKHY'],
        bucket: 'AI Compute',
        wholeBucket: true,
      },
      {
        name: 'AI Application',
        editorial: `Lilly is now one of three names he describes himself as having rotated into, which is the strongest framing this seat has ever had from him: “right now, I think crypto, Eli Lilly, silver, those are the places that I rotated into and reduced all those other things,” and it made new all-time highs this week. He is aware nobody wants to hear it — a company growing revenue 50% year over year draws no interest unless it moves 100 to 300% — which is precisely why he keeps it. The wider thesis is the reason: he has written since November that pharmaceuticals will be the biggest winners from AI on the application side, healthcare has outperformed the S&P by roughly 7-8% this year and made new multi-year relative highs while still far below absolute highs, and Moderna’s melanoma result doubling the stock in a day is the proof he points at, with AI taking assets over the stage-two hurdle where they usually die. Palantir got its first substantive mention in a while, on 8/22 and for a structural reason rather than a chart: “the orchestration layer becomes much much more important,” with AI sovereignty an issue that also constrains Anthropic and OpenAI. Amazon drew no direct commentary, so that seat carries on prior conviction. The offsetting pressure is unchanged and got louder: S&P forward multiples are down 20% while earnings rose, which he reads as the market pricing the end of terminal value rather than a bubble, and “I’m actually the most bearish person I know on public equities. It’s just not today.”`,
        tickers: ['LLY', 'AMZN'],
        bucket: 'AI Application',
        wholeBucket: true,
      },
      {
        name: 'Tokenization',
        editorial: `Two things changed here and both are firsts. The gate opened — Ethereum broke its 200-day alongside Bitcoin and, more importantly, its 200-day turned up, which he called a very powerful signal — and he disclosed a new position: “I have a good amount of Ethereum. I didn’t have any Ethereum until really recently.” The ranking that comes with it inverts the usual order and speaks directly to how this sleeve is sized: “I believe beta is going to lead in crypto and Bitcoin will not be the leader… Ethereum should lead because this is about the ecosystem being invested in.” Asked what outperforms his infrastructure names, he answered silver, Bitcoin, Ethereum and MicroStrategy, all yes. The structural evidence arrived in the same week. Stripe bought OpenRouter and published the reasoning — tokens are the new dollars, an agent-economy stack running money into compute into tokens into output — with first-half signups up 50% year over year. The White House crypto event put Trump on record that the US proceeds with or without the Clarity Act, and Treasury opened Genius Act rulemaking for comment on 8/17. His own 46-name equal-weight tokenized index is now positive on the year and outperforming Bitcoin, with two of ten verticals up — digital monetary assets and AI-agents-in-the-machine-economy. The September framing is restated and sharpened: “the next constraint is financial. It’s not physical.” He expects hedge funds to arrive before year-end, and notes the one thing still missing is agentic commerce infrastructure, which is why the crypto leg has not shown up in revenue yet.`,
        tickers: ['HOOD', 'ETHA'],
        bucket: 'Tokenization',
        wholeBucket: true,
      },
      {
        name: 'Monetary Scarcity',
        editorial: `This is the week the discipline rule fired. Bitcoin broke above its 200-day on three consecutive large candles, up 22-23% on the week, which he measures as a seven-sigma move — 60-day vol of 23 divided by the root of 52 gives a 3% one-sigma week against a 22% print. Only three weeks in the past decade exceeded five sigma; the prior two were April 2019 and January 2023, both also broke the 200-day, both held it, and both roughly doubled inside two months. His standing condition was explicit and is now met: below the 200-day he would buy quietly and not talk about it, above it “I am going to be pounding my hands on the table.” Gold is back above its own 200-day after a multi-sigma move and silver was up big. The disclosure that matters most for how this sleeve is built: “I am long SLV and I am long SIL. SIL is much bigger. I like the miners because… the miners are just trading way too cheap relative to where the metal is.” His silver expression is majority miners, not metal. The macro chain behind it is Treasury-driven rather than Fed-driven — increased nominal buyback sizes announced this week following the yen intervention and the refunding language change, Bessent publicly calling yields mispriced and leaning on the Fed over FIMA, and Druckenmiller’s filing adding Bitcoin miners while exiting Intel and Micron, which Visser identified as “the exact same trade that I make.” He has never sold a Bitcoin in his life and frames the asset as the hedge against abundance, since hyper-competition destroys terminal value everywhere else.`,
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
    asOf: 'wk of Aug 17 – 24 · via Grok',
    active: true,
    themes: [
      {
        name: 'AI healthcare — the new defining theme',
        editorial: `The defining call of his window is that AI healthcare may be the biggest theme in the market, with Moderna’s cancer vaccine as the first domino and AI accelerating treatments and cures from here — and he ties it to a broader point that AI needs to deliver something ordinary people can feel while the anti-datacenter noise builds. Tempus AI is the expression and it returns to the sheet after aging out: last affirmed in the Jun 26 - Jul 2 window and past the 45-day decay, now re-affirmed with a chart breaking out off its base near 72.69 against a 50-day around 61.7 and a prior high at 104, on rising volume. His framing is deliberately offhand — “something about a cure for cancer? I heard Tempus does some AI in healthcare stuff” — but it is a dedicated chart, which under our rules is what separates a setup from an aside. TEM reconnects with our own AI Application second-seat watch, though it remains a candidate to verify rather than a seat. Personalis is situational rather than a setup: trading above its buyout price on the same newsflow, with his only concern being that the buyout gets nixed as a result.`,
        tickers: ['TEM', 'PSNL'],
        curated: true,
      },
      {
        name: 'Crypto re-rates — and he names a holding',
        editorial: `The ledger event of the window, and the first in six windows: he named a name we actually hold, and stated he owns it. On Robinhood — “degens are gonna see crypto ripping, hear we’re curing cancer, and probably start trading like crazy on Robinhood again. Seems bullish $HOOD,” with the follow-up that if he had not already been long beforehand he would have bought that day. That gives HOOD a second independent leg alongside Camillo, who carries it as one of his two high-conviction holds, and it lands on a seat already held rather than on a candidate. Coinbase is the base trade — “multi month base and crypto is cool again,” with the $150 level and the 200-week moving average called out as the two that matter, price around 186. Circle is the one carrying a hard date: the CLARITY Act vote on 9/15, holding above its IPO-week lows near 49.9 and recovered toward 88, with a buy-the-rumour move flagged as the setup. That date is the useful cross-reference of the week, because Visser independently put the financial-guardrail constraint in September without naming a vote, and the White House signalled the US proceeds either way. Two voices, two routes, one month.`,
        tickers: ['HOOD', 'COIN', 'CRCL'],
        curated: true,
      },
      {
        name: 'The king still bases',
        editorial: `Nvidia stays the anchor and the argument is fundamental rather than technical this time: it is raising prices by about 15% into accelerating demand, and has spent nearly an entire year basing while earnings explode, trading around 214-215 against a prior high near 236. That is the same observation Visser makes from the multiple side, arrived at from the tape. SoFi is the new pattern-match and it is explicitly framed off names that already worked — a multi-month consolidation near 18.91 under resistance around 19-20 with a rising 200-day, which “looks a lot like $PLTR $HOOD $SHOP did before their recent big moves higher.” Note what that does to Palantir: it appears this window only as a comparison, with no chart and no setup, so its ZaStocks leg is now aging even though Visser’s leg is fresh. Figma carries forward from 8/17 on the same structure as before — post-IPO base near 25.4 down from 143, 40% short interest, OpenAI and Anthropic partnerships. Nothing appeared this window on MU, CRWV, NBIS, RDDT, SPCX or OUST, all of which carried dedicated charts last week; that rotation away is itself worth logging. His risk note is the one to keep next to Visser’s table-pounding: “oversizing leads to more ruin than almost anything else.”`,
        tickers: ['NVDA', 'SOFI', 'FIG'],
        curated: true,
      },
    ],
  },
]

export default VOICES
