// src/data/voiceCards.ts
// AlphaPlaybook — voice ledger cards. Extracted from SignalRecap.tsx 2026-08-17
// so the weekly cycle is a one-file edit. Render logic stays in the component.
//
// 10/01: cards rewritten as pure summaries of what each voice said — no portfolio weights,
// no 'we' reactions (C). Book changes live in the worksheet and Portfolio tab, not here.
// Visser card headline 10/01: 'LONG SCARCITY, SHORT ABUNDANCE' -> 'LONG SPEED, SHORT FRICTION'.
//
// 2026-10-12 weekly cycle — '2026-10-12-v3.11-gldm-litecopx'. GLDM removed (exhausted, 5.11 trigger);
// COPX -> LITE (optical, Visser 10/11 Lumentum slide); SLV working -> cooling (C discretionary);
// AI Buildout 27.1 pin retired; trend order set by conviction (AI applied -> watch, Monetary -> speculative).
// New transcripts: Visser 10/10 (Pomp), 10/11 (solo). Camillo: Grok 10/5-10/11 only — the file
// '10/11/26 Dumb Money Live Even I'm Getting Nervous' is a verbatim clip of the 9/29 episode, so it is
// NOT fresh 10/11 content and the Camillo card does not date anything from it to 10/11.
// ZaStocks: Grok 10/5-10/12. Cards stay pure summaries of what each voice said.
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
    asOf: 'October 11, 2026',
    active: true,
    themes: [
      {
        name: 'The framework',
        editorial: `"You want to be long speed. You want to be short friction." Speed means what AI agents need and use: computing power and crypto. This week he took on the talk of an AI bubble, prompted by Ray Dalio saying rising rates may burst it, and pointed out how many times Dalio has called bubbles before. He laid out three kinds. A speculative bubble needs extreme valuations, and he notes Nvidia trades around 15 times earnings, nothing like Cisco at 100 in 2000. A capacity bubble needs supply to outrun demand, but AI agents are a new kind of buyer that will number in the billions, so demand is still ahead of supply. A credit bubble needs bad borrowing, and much of the AI borrowing is backed by computing equipment whose prices are rising. In his view the real bubble is the old-economy companies that only survived because money was cheap: only 18% of utility stocks and 12% of auto stocks are in uptrends, against 73% of technology stocks. Only energy and technology have beaten the S&P 500 this year. He expects 20 to 30% corrections from time to time, but not a bubble bursting, and says ten-year yields are starting to look tired.`,
        tickers: [],
      },
      {
        name: 'AI Buildout',
        editorial: `He says there are only two places to make money from here: computing for AI agents, and crypto. The first phase was Nvidia and the power plants and turbines to run data centers; the next was memory, where he watched Micron go from $100 to $200 over seven months and then from $200 to $1,400 over the next five. He thinks people will miss the next phase the same way. His reasoning is that agents consume computing power the way the economy consumes oil, except agents multiply far faster than people do: "We will not have enough compute for the agents." He cited Box's Aaron Levie on the scale of what is coming, the chief executive of Lumentum, a maker of optical parts for data centers, saying his company is "completely sold out through 2029," and a new nuclear power agreement between Google and Constellation. His advice was to own the computing power rather than guess which AI app wins.`,
        tickers: ['AIPO', 'SOXX', 'MU', 'LITE'],
        bucket: 'AI Buildout',
      },
      {
        name: 'AI Applied',
        editorial: `He does not want to pick the winner among personal AI assistants. Amazon is blocking Meta's Muse to protect its own Alexa, Apple is closing off the iPhone, and Google is building its own, so the big companies now fight over the same customers: "I don't know how these guys are going to make money off of it." He does think the labs with the most computing power, OpenAI and Anthropic, will keep the best models. He coined "bank apocalypse" for what he expects over the next nine months or so: as AI agents start handling money, they will move it to wherever it earns the most and costs the least, and instant settlement removes the float banks earn on. He stressed he is not calling for banks to collapse, only for their valuations to shrink, the way software stocks did. His example was Stripe, with about 10,000 employees, revenue up 41% and a valuation near $160 billion, against Citigroup with about 226,000 employees. He also said it is time to start talking about humanoid robots and self-driving cars, and warned that hiring is slowing, including in healthcare.`,
        tickers: ['LLY', 'AMZN'],
        bucket: 'AI Applied',
      },
      {
        name: 'Tokenized Rails',
        editorial: `"When it comes to crypto, this is 100% for me about agents." He expects next year to bring the biggest moves in crypto because of them, and says traditional investors keep asking him about tokenization. His evidence: Stripe is building wallets for AI agents, owns a stablecoin company, and just bought OpenRouter, which routes AI requests to the cheapest model; Samsung added the USDC stablecoin to its wallet; OKX filed to offer tokenized stock trading; and the IMF noted the rapid growth of tokenized assets. He contrasted a bank wire to Robinhood that took five days with a transfer from Robinhood to Coinbase that took five seconds. He welcomed research from Citrini and BlackRock making the same case, saying an idea has to go from contrarian to widely held before big money follows. He added a new theme: privacy. After hearing Ethereum co-founder Vitalik Buterin, he said AI agents make privacy essential: "I want to be long privacy as a theme," naming Zcash and NEAR.`,
        tickers: ['ETHA', 'HOOD', 'COIN'],
        bucket: 'Tokenized Rails',
      },
      {
        name: 'Monetary',
        editorial: `On Bitcoin his message was patience: "For Christ's sake, be patient." He compared it to Micron, which spent months going sideways before its big run, and said Bitcoin and Ethereum are in a bull market that will speed up when traditional investors arrive, which needs more tokenization and stablecoin activity first. He found it encouraging that crypto rose this year even as interest rates climbed and gold fell, and he again described gold as falling. He expects ten-year yields to be about where they are now a year from today. He did not mention silver.`,
        tickers: ['IBIT', 'SLV'],
        bucket: 'Monetary',
      },
    ],
  },
  {
    name: 'Camillo',
    headline: 'INFORMATION EDGE, NOT VIBES',
    subtitle: 'Chris Camillo — social arbitrage; a supporting voice that can point to ideas but not change themes',
    asOf: 'wk of Oct 5 – Oct 11 · via Grok',
    active: true,
    themes: [
      {
        name: 'Amazon, with the case against it',
        editorial: `Amazon remains the center of his portfolio. In an October 6 post he laid out the strongest case against it: AI shopping assistants like Meta's Muse could weaken Amazon's ad business, headlines about Anthropic are moving sentiment, and higher diesel prices hurt shipping costs. He calls these real but manageable. Amazon can respond with its own assistant (Project Moonraker), partnerships or higher prices, and he thinks its cloud business and its own AI chips could more than make up for any loss. He sees the stock as misunderstood.`,
        tickers: ['AMZN'],
        curated: true,
      },
      {
        name: 'GTA 6',
        editorial: `On the Iced Coffee Hour podcast he called Take-Two Interactive, maker of Grand Theft Auto, "the next ultimate trade of 2026." He bought after strong early reactions to GTA 6 gameplay and expects first-year sales near or above the top of the 30 to 50 million estimates, with in-game purchases that could bring in $2 to $3 billion a year.`,
        tickers: ['TTWO'],
        curated: true,
      },
      {
        name: 'Lessons',
        editorial: `His main lesson this week: keep updating the strongest argument against your own position, and understand it well enough to judge how confident to be. He says the bull case doesn't need the bear case to be wrong, only to be more right. He thinks the gap between AI bulls and bears is unusually wide, which is where the opportunity is. On robots he is cautious: the market is huge, but he wants to see real commercial results before chasing it, and he hears Tesla's Optimus program has had execution problems.`,
        tickers: [],
        curated: true,
      },
    ],
  },
  {
    name: 'ZaStocks',
    headline: 'A WALL OF WORRY',
    subtitle: 'ZaStocks (@ZaStocks) — chart-based trade ideas, gathered weekly',
    asOf: 'wk of Oct 5 – Oct 12 · via Grok',
    active: true,
    themes: [
      {
        name: 'The AI names on the chart',
        editorial: `He still sees the big AI names as the place to be. He says people will look back on Amazon around $250 as obvious once it trades above $300. Micron approved a new buyback just as it neared $1,000, which he called convenient timing on a strong chart. He posted CoreWeave in an unusually tight range ("from compression comes eventual expansion") and said Tesla is quietly setting up out of a five-year base while everyone watches SpaceX. He also posted Tempus AI retesting a breakout.`,
        tickers: ['AMZN', 'MU', 'CRWV', 'TSLA', 'TEM'],
        curated: true,
      },
      {
        name: 'New highs, few winners',
        editorial: `The Nasdaq made new all-time highs despite rising yields, high oil, the midterms and war, which he calls objectively impressive. He reminds followers that how a stock reacts to news matters more than the news itself, and that setups on weekly and monthly charts are more reliable than short-term ones. He admits few stocks are actually working even at the highs, and says treading water in a market like this is a win: better times come when people are mentally and financially worn out.`,
        tickers: ['QQQ'],
        curated: true,
      },
    ],
  },
]

export default VOICES
