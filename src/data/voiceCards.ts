// src/data/voiceCards.ts
// AlphaPlaybook — voice ledger cards. Extracted from SignalRecap.tsx 2026-08-17
// so the weekly cycle is a one-file edit. Render logic stays in the component.
//
// 10/01: cards rewritten as pure summaries of what each voice said — no portfolio weights,
// no 'we' reactions (C). Book changes live in the worksheet and Portfolio tab, not here.
// Visser card headline 10/01: 'LONG SCARCITY, SHORT ABUNDANCE' -> 'LONG SPEED, SHORT FRICTION'.
//
// 2026-10-19 weekly cycle — '2026-10-19-v3.13-asml-litework'. ASML added (lithography, binding/sole);
// LITE forward -> working; memory held binding with a CXMT quality watch. All through the 5.4b data check.
// New transcripts: Visser 10/14 (Titans of Tomorrow, long-form guest), 10/17 (Pomp), 10/18 (solo).
// Camillo: Grok 10/12-10/18 — few first-hand posts; holdings figures come from third-party trackers
// (CamilloTracker), so the card says 'trackers estimate', never 'he holds'. ZaStocks: Grok 10/12-10/19.
// Cards stay pure summaries of what each voice said.
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
    asOf: 'October 18, 2026',
    active: true,
    themes: [
      {
        name: 'The framework',
        editorial: `"This is not a bubble popping." Wearing a hoodie for the occasion, he said the bubble that has popped is hedge-fund borrowing, not the stock market or the economy: the S&P 500 closed the week only 2.7% below its record. Hedge funds are borrowed at record levels and crowded into the same AI trades, and some of the best-known funds gave back a year of gains in a single quarter. Drawing on his years on the other side of Long-Term Capital Management, he listed how a correct idea still loses money with borrowed money: wrong timing, a jump in volatility, financing costs, crowding, broken correlations, thin liquidity. He thinks the selling could run into big tech's earnings and possibly the midterms, with the end of the month and December as likely turning points. He does not care whether inflation prints 2.6% or 3.2%; real trouble needs job losses, and weekly jobless claims are near record lows. He did flag consumer confidence at its lowest since 2013 and believes hiring is weaker than economists say as companies start handing work to AI agents.`,
        tickers: [],
        curated: true,
      },
      {
        name: 'AI Buildout',
        editorial: `He kept his view that AI computing is inevitable. Nvidia's share price is roughly where it was a year ago even though its earnings blew past every forecast, leaving it on about 15 times next year's earnings, while chip stocks overall are still up about 50% this year. Against bearish 2030 forecasts from Gartner and Bain he set contracts already signed: Micron has agreements covering more than 35% of its revenue through 2030, ASML expects shortages through 2028, Lumentum is sold out of AI parts until 2029, Amazon says its AI computing is sold out beyond 2028, and memory prices just made new highs. Agent swarms only began about two months ago, which he calls a step up in demand. For the next 12 months he wants AI agents and Nvidia's next platform, Vera Rubin; most of his 15 names there are optical-networking companies. News from Chinese memory maker CXMT knocked memory stocks this week.`,
        tickers: ['NVDA', 'MU', 'ASML', 'LITE'],
        curated: true,
      },
      {
        name: 'AI Applied',
        editorial: `He and Pompliano disagreed about Anthropic. Pompliano argued that companies will move to cheaper open-source models, citing a 97% cost cut at his own firm. Visser agreed open source wins over time but said the largest companies will keep paying for the best models, and that most future AI revenue will come from biotech, materials, robotics and science rather than chat subscriptions. Anthropic is on pace for $90 to $100 billion of annual revenue, up from about $9 billion. Only about 2% of companies run AI agents in their everyday workflows, against more than half using coding agents, so most of the change to jobs is still ahead. He still owns Eli Lilly, and he expects OpenAI's next model to bring a robotics breakthrough, noting Unitree sold only about 11,000 robots this year.`,
        tickers: ['LLY'],
        curated: true,
      },
      {
        name: 'Tokenized Rails',
        editorial: `He called tokenization the final stage of the hedge-fund squeeze. Trading around the clock, and stocks that can be spent or borrowed against instantly, change how risk, margin and even the money supply are measured. Banks and the largest asset managers began studying crypto seriously only in the last two months, he said, and are no longer calling it "rat poison." He pointed to JPMorgan's $107 billion of net interest income as money that AI agents will move to wherever it earns a yield, as Stripe already offers. Ethereum and NEAR, a network built for AI agents, are among the cryptocurrencies he watches every day.`,
        tickers: ['ETH', 'NEAR'],
        curated: true,
      },
      {
        name: 'Monetary',
        editorial: `"You know what the hedge is? If I'm right, it's to go buy Bitcoin." Bitcoin fell just 2.3% in a week when AI stocks were hit hard, holding between about $82,000 and $85,000, and he said the majority of his portfolio is now in crypto. He would not be surprised to see it drift back toward $75,000 until hedge funds finish selling, expects the next move to the highs around big tech's earnings or in December, and sees the big run in 2027. He also said the silver he bought earlier has not moved and is down about 5 to 10%.`,
        tickers: ['BTC', 'SLV'],
        curated: true,
      },
    ],
  },
  {
    name: 'Camillo',
    headline: 'INFORMATION EDGE, NOT VIBES',
    subtitle: 'Chris Camillo — social arbitrage; a supporting voice that can point to ideas but not change themes',
    asOf: 'wk of Oct 12 – Oct 18 · via Grok',
    active: true,
    themes: [
      {
        name: 'Amazon, still the core',
        editorial: `He posted few new stock calls this week. Public trackers that follow his posts and podcasts estimate Amazon at roughly three quarters of his portfolio, with Robinhood and Bloom Energy well behind. These are outside estimates, not figures he confirmed. He has described Amazon as misunderstood for its cloud business and its own AI chips, and treats dips as chances to add. He still holds Take-Two ahead of GTA 6.`,
        tickers: ['AMZN', 'HOOD', 'BE', 'TTWO'],
        curated: true,
      },
      {
        name: 'Lessons',
        editorial: `Most of his posts were about mindset. AI is easy to overthink: models, chips, agents and benchmarks matter less than the basic point that AI makes previously uneconomic problems solvable and lets people do more with less. If nothing has changed in what you know, ignore the daily moves. Having lived through the dot-com bubble, he sees AI infrastructure companies differently from the richly valued private AI startups, which feel frothier. He praised Tesla's Roadster reveal for attempting something that could have failed in public.`,
        tickers: [],
        curated: true,
      },
    ],
  },
  {
    name: 'ZaStocks',
    headline: 'EMBRACE THE CHAOS',
    subtitle: 'ZaStocks (@ZaStocks) — chart-based trade ideas, gathered weekly',
    asOf: 'wk of Oct 12 – Oct 19 · via Grok',
    active: true,
    themes: [
      {
        name: 'Two markets',
        editorial: `He sees noise and weak sentiment, not a collapse. The mood around AI is poor after weakness in CoreWeave and Oracle and cuts to Anthropic's expected IPO valuation, and the war with Iran keeps oil and yields high. The indexes sit near their highs while many former AI winners are deep in drawdowns, which he calls two different markets. He thinks the loud crash and "Black Monday" calls are overdone and that ordinary 401(k) holders are not panicking. In his count the market has had only two clean stretches to trade in two years, so he would rather sit tight until the clouds clear.`,
        tickers: [],
        curated: true,
      },
      {
        name: 'Buy quality early',
        editorial: `His lesson: people ignore a stock like SanDisk at $50 and then want it after it reaches $2,000; flip that and buy quality earlier in the run. He called Meta the clearest case of mood driving a stock, since nothing changed in the business but a new product turned sentiment and the shares went vertical. He posted Tempus AI retesting a breakout and said a Tesla and SpaceX merger would create the most ambitious company the world has seen.`,
        tickers: ['SNDK', 'META', 'TEM', 'TSLA'],
        curated: true,
      },
    ],
  },
]

export default VOICES
