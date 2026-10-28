// src/data/voiceCards.ts
// AlphaPlaybook — voice ledger cards. Extracted from SignalRecap.tsx 2026-08-17
// so the weekly cycle is a one-file edit. Render logic stays in the component.
//
// 10/01: cards rewritten as pure summaries of what each voice said — no portfolio weights,
// no 'we' reactions (C). Book changes live in the worksheet and Portfolio tab, not here.
// Visser card headline 10/01: 'LONG SCARCITY, SHORT ABUNDANCE' -> 'LONG SPEED, SHORT FRICTION'.
//
// 2026-10-28 weekly cycle — confirm the book (v3.13 unchanged). No rung passed the 5.4b data check.
// New transcripts (Project files): Visser 10/22 (Julia La Roche), 10/23 (Cointelegraph), 10/24 (Pomp),
// 10/25 (solo). Camillo: Pomp 10/12 + Grok 10/18-10/25 (first-hand posts this time). ZaStocks: Grok 10/19-10/26.
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
    asOf: 'October 25, 2026',
    active: true,
    themes: [
      {
        name: 'The framework',
        editorial: `"The AI bubble didn't pop, hedge fund leverage did." He called the last two weeks one of the largest hedge-fund unwinds of his career and thinks it is "either done or in the seventh or eighth inning." The damage has spread from stock pickers to quant and multi-strategy funds and into French government bonds, yet the S&P 500 fell only about half a percent on the week. What would make it an economic downturn rather than a fund unwind is falling profit margins and rising layoffs, and he sees neither: corporate profits are still growing about 20% a year and jobless claims are calm. Junk-bond spreads widening is the one sign he is watching. He expects the low for this AI selloff within about two weeks, around big-tech earnings, the midterms and the Treasury's November 4 refunding announcement.`,
        tickers: [],
        curated: true,
      },
      {
        name: 'AI Buildout',
        editorial: `He called SpaceX's results the most important report he has seen apart from Nvidia's: Musk said demand for computing is far greater than supply and that SpaceX could rent out its capacity several times over. His view is that supply will not catch up with demand at any point in the next three years, which makes "agentic compute" the safest place to invest — chips, but also the gas turbines, batteries and chemicals behind data centers. He said Micron could be at $1,500 by the end of February, and that edge devices are next, naming Qualcomm and AMD. His largest positions after Eli Lilly are Nvidia and Marvell.`,
        tickers: ['NVDA', 'MRVL', 'MU', 'QCOM', 'AMD'],
        curated: true,
      },
      {
        name: 'AI Applied',
        editorial: `"Healthcare needs to be part of your portfolio," on the pharma, biotech and life-sciences side. Eli Lilly, his largest position, hit a record high in a week when AI stocks fell, and he still expects it to become the largest US company within five years. His case: healthcare is now the biggest category of US consumer spending, it does not rise and fall with the economy, and AI drug discovery is turning it into a growth business; Lilly's TuneLab now pools research from 135 biotech companies. He also expects personal AI agents to move idle bank deposits to wherever they earn more, which he thinks will shrink bank valuations over the next three years.`,
        tickers: ['LLY'],
        curated: true,
      },
      {
        name: 'Tokenized Rails',
        editorial: `"The crypto guardrails were built not for humans. They were built for AI agents." Crypto is his strongest call for the next year. Stripe's John Collison said agent-driven shopping on Stripe's payment system "went vertical"; JPMorgan has three tokenized products running on Ethereum; Uniswap posted record revenue driven by Robinhood's blockchain. He expects AI-driven hacking of banks and websites to become the biggest market story of the next three years and to push banks onto blockchains faster. After Bitcoin, his largest crypto holdings are Ethereum and Solana, plus a basket of privacy coins.`,
        tickers: ['ETH', 'SOL', 'HOOD'],
        curated: true,
      },
      {
        name: 'Monetary',
        editorial: `He calls Bitcoin "the purest AI trade." It held between $80,000 and $85,000 through the AI selloff and a claim from Chamath Palihapitiya that quantum computing will send it to zero. He sides with cryptographer Adam Back: quantum is a hardware problem perhaps 20 to 40 years away, and Bitcoin can upgrade before then. BlackRock's Bitcoin fund took in $664 million and its shares outstanding are at a record. Gold and silver, by contrast, have fallen back to their lows.`,
        tickers: ['BTC'],
        curated: true,
      },
    ],
  },
  {
    name: 'Camillo',
    headline: 'INFORMATION EDGE, NOT VIBES',
    subtitle: 'Chris Camillo — social arbitrage; a supporting voice that can point to ideas but not change themes',
    asOf: 'wk of Oct 18 – Oct 25 · via Grok + Pomp 10/12',
    active: true,
    themes: [
      {
        name: 'Amazon and Bloom, holding',
        editorial: `Asked on October 22 whether he was adding to Amazon and Bloom Energy, he answered "holding." On Pompliano's show he walked through his Amazon earnings trade, about $10 million in a day: more than 100 hours of research, and the deciding call was that management would address its spending plans head-on, as Microsoft had three days earlier. He still rated it only an 80% chance of working.`,
        tickers: ['AMZN', 'BE'],
        curated: true,
      },
      {
        name: 'Lessons',
        editorial: `He has traded through the dot-com bust and the financial crisis and has never seen skepticism this intense about a major technology, with many investors seemingly rooting for AI to fail; so far the bears have been consistently wrong. Hold when the thesis has not changed, but change your mind when the data breaks: he exited a Lululemon trade once he found Google search data had been distorted by AI queries. Humanoid robots will be the biggest thing of all, but are years away.`,
        tickers: [],
        curated: true,
      },
    ],
  },
  {
    name: 'ZaStocks',
    headline: 'EMBRACE THE CHAOS',
    subtitle: 'ZaStocks (@ZaStocks) — chart-based trade ideas, gathered weekly',
    asOf: 'wk of Oct 19 – Oct 26 · via Grok',
    active: true,
    themes: [
      {
        name: 'Quality that can scale',
        editorial: `He is cautious on the AI trade and says the market "stinks," with debt worries, credit stress and pressure on the smaller cloud providers. He pushes back on constant bubble and financial-crisis comparisons: there is "too much at stake" for the AI trade to blow up now. He sees SpaceX as in a league of its own among computing providers and expects it to win contracts from struggling rivals.`,
        tickers: ['SPCX', 'META'],
        curated: true,
      },
      {
        name: 'Lessons',
        editorial: `Markets wear people out until they stop paying attention, and then they bottom. Round-the-clock trading, same-day options and leveraged funds are built to help people lose money. After a big run the easy money is often made: he likes Bloom Energy but notes it went from $15 to over $300.`,
        tickers: ['BE'],
        curated: true,
      },
    ],
  },
]

export default VOICES
