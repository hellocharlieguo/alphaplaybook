// System tab data — blueprint layout, inspector-driven detail.
//
// PHASE 1: content is authored here. When podcast_log and system_changelog land
// in Supabase, swap SYS_DETAILS for a query and keep the Block[] shape.
//
// TIER C (not built): the `files` arrays below are hand-authored. The intent is
// to generate them from the repo — parse imports for the graph, `git log` for
// last-touched, `git status` for modified/untracked — and emit JSON. Until then
// every entry carries a status, and 'unverified' means exactly that.
//
// Stage coordinate space is 1400 x 430 and matches the SVG viewBox.
// Node box is 152 wide. Connector y = node.y + 34.

export type NodeKind = 'input' | 'engine' | 'human' | 'write'

export interface SysNode {
  id: string
  x: number
  y: number
  kind: NodeKind
  ref: string
  title: string
  sub: string
  history?: boolean
}

// 'stale'    = content is out of date versus reality (a spec still listing S4)
// 'modified' = tracked, but has uncommitted local edits (M in git status)
// 'untracked'= never git add-ed; no history, no recovery (?? in git status)
export type FileStatus = 'live' | 'stale' | 'modified' | 'orphan' | 'untracked' | 'unverified' | 'proposed' | 'missing'

export interface SysFile {
  path: string
  role: string
  // DECLARED status. Only the judgment values survive the merge with
  // fileStatus.ts — 'stale', 'orphan' and 'proposed' are human calls the
  // generator cannot derive. 'live' / 'modified' / 'untracked' / 'unverified'
  // are placeholders that generated state overrides.
  status: FileStatus
  kind?: 'file' | 'dir' | 'table'
}

export interface SysZone { x: number; y: number; w: number; h: number; label: string }
export interface SysEdge { d: string; tone: 'wire' | 'feedback'; arrow?: boolean }
export interface SysLabel { x: number; y: number; text: string }

export type Block =
  | { t: 'sec'; label: string }
  | { t: 'kv'; k: string; v: string; pending?: boolean }
  | { t: 'bar'; k: string; v: string; pct: number }
  | { t: 'row'; date?: string; pill?: string; tone?: 'engine' | 'book' | 'data' | 'open'; title: string; quote?: string; pending?: boolean }
  | { t: 'note'; text: string }

export interface SysDetail {
  eyebrow: string
  title: string
  source: string
  blocks: Block[]
  files?: SysFile[]
  parts?: string[]   // ids rendered as drill-in rows (engine internals)
  parent?: string    // id rendered as a back link
}

// ---------------------------------------------------------------------------
// THE BOOK -- single source for every weight rendered anywhere in this file.
//
// Mirrors server/daily-cron.cjs BASE_PORTFOLIO at PORTFOLIO_VERSION
// '2026-08-31-v3.4.1-stageflip'. The cron is authoritative; this is a copy for
// display. At the next freeze, edit THIS ARRAY ONLY -- the trend bars and the
// holdings list are both derived from it, so they cannot disagree.
//
// Weights sum to exactly 100.0. Floors in the cron are half-weight, rounded.
// ---------------------------------------------------------------------------
export const V34_BOOK = [
  { tkr: 'LLY',  trend: 'AI Applied',      w: 13.9, act: 'Hold' },
  { tkr: 'AMZN', trend: 'AI Applied',      w: 12.4, act: 'Hold' },
  { tkr: 'IBIT', trend: 'Monetary',        w: 12.2, act: 'Add'  },
  { tkr: 'ETHA', trend: 'Tokenized Rails', w: 11.8, act: 'Add'  },
  { tkr: 'GLDM', trend: 'Monetary',        w:  9.1, act: 'Add'  },
  { tkr: 'HOOD', trend: 'Tokenized Rails', w:  8.0, act: 'Add'  },
  { tkr: 'SLV',  trend: 'Monetary',        w:  7.8, act: 'Hold' },
  { tkr: 'AIPO', trend: 'AI Buildout',     w:  6.2, act: 'Trim' },
  { tkr: 'GLW',  trend: 'AI Buildout',     w:  5.0, act: 'Hold' },
  { tkr: 'ASML', trend: 'AI Buildout',     w:  5.0, act: 'Trim' },
  { tkr: 'SOXX', trend: 'AI Buildout',     w:  4.5, act: 'Trim' },
  { tkr: 'COPX', trend: 'AI Buildout',     w:  4.1, act: 'Hold' },
] as const

// Ordered by weight, descending. Rendering order for the trend bars.
export const TREND_ORDER = ['Monetary', 'AI Applied', 'AI Buildout', 'Tokenized Rails'] as const

export const trendSum = (name: string): number =>
  Math.round(V34_BOOK.filter(h => h.trend === name).reduce((s, h) => s + h.w, 0) * 10) / 10

// ---------------------------------------------------------------- geometry

export const STAGE_W = 1400
export const STAGE_H = 430

export const ENGINE_BOX = { x: 200, y: 76, w: 300, h: 132 }

export const SYS_ZONES: SysZone[] = [
  { x: 0, y: 8, w: 1180, h: 256, label: 'Weekly · you + Claude' },
  { x: 0, y: 296, w: 940, h: 122, label: 'Daily · cron 7pm ET' },
]

export const SYS_NODES: SysNode[] = [
  { id: 'visser',   x: 10,  y: 18,  kind: 'input',  ref: 'A1 · INPUT L1', title: 'Visser',         sub: '2×/wk · moves themes', history: true },
  { id: 'camillo',  x: 10,  y: 106, kind: 'input',  ref: 'A2 · INPUT L2', title: 'Camillo',        sub: 'names only',           history: true },
  { id: 'zastocks', x: 10,  y: 194, kind: 'input',  ref: 'A3 · INPUT L2', title: 'ZaStocks',       sub: 'verify only',          history: true },

  { id: 'approval', x: 536, y: 106, kind: 'human',  ref: 'C1 · GATE',     title: 'Approval',       sub: 'no auto-build' },
  { id: 'freeze',   x: 732, y: 106, kind: 'write',  ref: 'C2 · WRITE',    title: 'Freeze',         sub: 'v3.4-trendfirst',         history: true },
  { id: 'push',     x: 928, y: 106, kind: 'write',  ref: 'C3 · DEPLOY',   title: 'git push',       sub: '→ Vercel' },

  { id: 'cron',     x: 10,  y: 344, kind: 'input',  ref: 'D1 · TRIGGER',  title: 'GitHub Actions', sub: '7pm ET' },
  { id: 'apis',     x: 204, y: 344, kind: 'input',  ref: 'D2 · DATA',     title: 'Price + macro',  sub: '5 sources' },
  { id: 'croncjs',  x: 402, y: 344, kind: 'engine', ref: 'D3 · ENGINE',   title: 'daily-cron.cjs', sub: 'RSI · DMA · CPI' },
  { id: 'pnl',      x: 600, y: 344, kind: 'engine', ref: 'D4 · ENGINE',   title: 'P&L drift',      sub: 'drift vs rebal' },
  { id: 'supabase', x: 798, y: 344, kind: 'write',  ref: 'D5 · WRITE',    title: 'Supabase',       sub: '3 tables',             history: true },
]

export const SYS_EDGES: SysEdge[] = [
  { d: 'M162,54 C178,54 178,138 192,138',   tone: 'wire', arrow: true },
  { d: 'M162,140 L192,140',                 tone: 'wire', arrow: true },
  { d: 'M162,226 C178,226 178,144 192,144', tone: 'wire', arrow: true },
  { d: 'M502,142 L536,142',                 tone: 'wire', arrow: true },
  { d: 'M698,142 L732,142',                 tone: 'wire', arrow: true },
  { d: 'M894,142 L928,142',                 tone: 'wire', arrow: true },
  { d: 'M162,378 L192,378',                 tone: 'wire', arrow: true },
  { d: 'M354,378 L388,378',                 tone: 'wire', arrow: true },
  { d: 'M552,378 L586,378',                 tone: 'wire', arrow: true },
  { d: 'M750,378 L784,378',                 tone: 'wire', arrow: true },
  { d: 'M812,190 C812,272 470,268 420,360', tone: 'feedback' },
]

export const SYS_LABELS: SysLabel[] = [
  { x: 26,  y: 34,  text: 'A · INPUTS' },
  { x: 200, y: 34,  text: 'B · ENGINE' },
  { x: 740, y: 34,  text: 'C · GATE + WRITE' },
  { x: 26,  y: 344, text: 'D · NIGHTLY' },
  { x: 596, y: 274, text: 'BASE_PORTFOLIO' },
]

// ---------------------------------------------------------------- files

// Reused across several stages.
const F_ENGINE: SysFile   = { path: 'signal_engine.py',          role: 'the live engine — composite scoring',        status: 'live' }
const F_CONFIG: SysFile   = { path: 'signal_model_config.json',  role: 'composite weights, thresholds, multipliers', status: 'live' }
const F_THEME: SysFile    = { path: 'theme_engine.py',           role: 'L1/L2 recommender — prints and writes theme_weights.json, never writes the cron', status: 'untracked' }
const F_CRON: SysFile     = { path: 'server/daily-cron.cjs',     role: 'nightly orchestrator',                       status: 'live' }
const F_RECAP: SysFile    = { path: 'src/components/SignalRecap.tsx', role: 'renders the three voice cards',         status: 'live' }
const F_VOICES: SysFile   = { path: 'src/data/voiceCards.ts',    role: 'weekly card content — one-file edit',        status: 'live' }
const F_WEEKLY: SysFile   = { path: 'Weekly_Workflow.md',        role: 'the §1–§8 weekly run order',                 status: 'live' }
const F_PULL: SysFile     = { path: 'pull_candidates.cjs',       role: 'candidate technicals pull — uncommitted edits, git diff first', status: 'modified' }

export const SYS_DETAILS: Record<string, SysDetail> = {
  engine: {
    eyebrow: 'B · Sealed assembly',
    title: 'Engine',
    source: 'voices in → 12 weighted positions out · v3.4 trend-first',
    parts: ['tagging', 'themes', 'pillars', 'seats', 'names'],
    blocks: [
      { t: 'sec', label: 'Assembly' },
      { t: 'kv', k: 'Methodology', v: 'v3.4 trend-first · locked 8/23/26' },
      { t: 'kv', k: 'Frozen as', v: '2026-08-31-v3.4.1-stageflip · 12 names' },
      { t: 'kv', k: 'Parts', v: '5 — one superseded' },
      { t: 'kv', k: 'Human calls', v: '1 — trend conviction (tconv)' },
      { t: 'note', text: 'Supersedes all composite scoring. Trends compete for weight; names compete only inside their own trend. Nothing competes across trends. B3 pillar sizing is retained for version history and no longer runs.' },
      { t: 'sec', label: 'The cascade' },
      { t: 'kv', k: '1 · name_score', v: '55 × timing × quality × wave × entry_band' },
      { t: 'kv', k: '2 · trend_score', v: 'derived_timing × tconv × breadth' },
      { t: 'kv', k: '3 · trend_weight', v: '100 × trend_score / Σ trend_score' },
      { t: 'kv', k: '4 · name_weight', v: 'trend_weight × name_score / Σ in trend' },
      { t: 'note', text: '55 = 100 − floor 45. Multipliers act on the above-floor portion only. A name below the floor scores zero and drops out; if it is the only name in its trend, the trend collapses.' },
      { t: 'sec', label: 'Ladders · three share rungs' },
      { t: 'kv', k: 'Rungs', v: '1.00 · 0.92 · 0.80 · 0.72 · 0.60' },
      { t: 'kv', k: 'Timing', v: 'binding · working · cooling · forward · exhausted' },
      { t: 'kv', k: 'Quality', v: 'sole · basket · duopoly · leader · contested' },
      { t: 'kv', k: 'Wave demand', v: 'coding · enterprise · consumer · embodied · chatbots' },
      { t: 'note', text: 'Accelerating gaps — 0.08, 0.12, 0.08, 0.12 — so the bottom of each ladder costs more than the top. Quality falls to 0 only on an explicit remove. Wave demand also carries a macro rung at 1.00 for trends that sit off the AI curve entirely and run on their own clock. Timing is derived at trend level as the mean of its sub-themes, never asserted separately.' },
      { t: 'sec', label: 'Entry band · its own scale' },
      { t: 'kv', k: 'S5 85–100', v: '×1.00 — pullback, thesis intact' },
      { t: 'kv', k: 'S5 70–84', v: '×0.95 — off highs, has not run' },
      { t: 'kv', k: 'S5 55–69', v: '×0.85 — steady early-stage grind' },
      { t: 'kv', k: 'S5 45–54', v: '×0.75 — near highs, stage peaked' },
      { t: 'kv', k: 'S5 below 45', v: '×0.60 — vertical blowoff' },
      { t: 'note', text: 'The entry band does NOT share the rungs above — it is a separate mapping off the S5 score, and S5 excludes RSI. These five multipliers are not drawn from config; they were set by hand and are the least-validated numbers in the cascade.' },
      { t: 'sec', label: 'Breadth' },
      { t: 'kv', k: 'N_eff', v: '(Σλ)² / Σλ² over 251 sessions' },
      { t: 'note', text: 'Measured from real correlations, not √n. Seven buildout names resolve to 1.95 independent bets; √n claims 2.65, a 36% overstatement. Two uncorrelated application names are worth 2.00. Backward-looking, and correlations tighten as the window shortens — AIPO-SOXX 0.86 at one year against 0.91 at three months, GLDM-IBIT 0.28 against 0.59.' },
      { t: 'sec', label: 'Design decisions' },
      { t: 'row', title: 'RSI removed from S5', quote: 'A cliff, not a slope — 69.9 to 70.0 cost 8 S5 points. It was also the only term ranking gold above bitcoin against the S1 judgment. Removed 8/22, but pull_candidates.cjs kept emitting the retired term until 8/31, so any S5 printed in between understates names with RSI at or above 60.' },
      { t: 'row', title: 'Correlation is not coverage', quote: 'AIPO and SOXX correlate 0.86, but SOXX holds zero utilities or grid. N_eff alone would drop the position the whole thesis points at, merely because power has not decoupled yet. Removals are judged on both.' },
      { t: 'row', pending: true, pill: 'open', tone: 'open', title: 'tconv has the least provenance', quote: 'Trend conviction is the highest-leverage input and the only classification carrying no mandatory source quote or date, unlike timing and quality which both require attribution.' },
      { t: 'row', pending: true, pill: 'open', tone: 'open', title: 'Breadth rewards unrelated names', quote: 'N_eff rises when an uncorrelated name is added, so a name can buy trend weight regardless of conviction. Named in the worksheet as a perverse incentive and not yet fenced.' },
      { t: 'sec', label: 'Worksheet' },
      { t: 'note', text: 'Full per-name arithmetic lives in v34_worksheet_2026-08-31.html — click any cell for its derivation. Deliberately not restated here: a second copy of the numbers is a second thing to drift.' },
    ],
    files: [F_ENGINE, F_CONFIG, F_THEME],
  },

  visser: {
    eyebrow: 'A1 · Input, Layer 1',
    title: 'Visser',
    source: 'card stamped 8/16 · phase 2: podcast_log',
    blocks: [
      { t: 'sec', label: 'Mandate' },
      { t: 'kv', k: 'Moves theme weights', v: 'yes — only voice' },
      { t: 'kv', k: 'Change limiter', v: '±4% / week' },
      { t: 'kv', k: 'Cadence', v: 'Pomp + solo, 2×/wk' },
      { t: 'sec', label: 'Episode log' },
      { t: 'row', date: '8/16 · solo', pill: 'open', tone: 'open', title: 'Stage 4 dated for the first time', quote: 'beginning in September the next constraint is not physical, it is financial — guardrails, consumer agents, settlement, stablecoins, tokenization. First time he has attached a month rather than a year.' },
      { t: 'row', date: '8/15 · Pomp', title: 'Same framing, plus the supporting evidence', quote: 'Figure earnings — consumer-loan marketplace volume $4.3B, +132% YoY, Figure Connect expected to approach 70% of volume. A 45-name, 10-vertical crypto index naming FIGR, HOOD, PYPL and COIN as the public expressions. Stablecoin card volume +16%. US bank regulator opening national charters.' },
      { t: 'row', date: '8/09 · solo', title: 'Memory re-entry thesis', quote: 'rebought MU with a seven-handle, above his own exit; called memory the most important part of the AI trade' },
      { t: 'row', date: '8/08 · Pomp', title: 'S3 power intact, silver working' },
      { t: 'row', date: '7/27 · Mark Moss', title: 'debasement framing → axis 2 confirm' },
      { t: 'row', date: '7/06 · Substack', title: 'Bitcoin and the Fed → monetary axis' },
      { t: 'sec', label: '5-stage AI cycle' },
      { t: 'kv', k: 'S1 Memory', v: 'working ×0.92' },
      { t: 'kv', k: 'S2 Optical / chem', v: 'working' },
      { t: 'kv', k: 'S3 Power + silver', v: 'binding — now' },
      { t: 'kv', k: 'S4 Tokenization', v: "Sept '26 — dated, not actioned" },
      { t: 'kv', k: 'S5 Agentic', v: '2028+' },
      { t: 'sec', label: 'Open · token sleeve S2 upgrade' },
      { t: 'row', pending: true, pill: 'open', tone: 'open', title: 'Held, not actioned', quote: 'Under the S2 rubric a dated Stage 4 moves out of the one-stage-out band (70–89) toward binding (90–100), which would re-rate HOOD at 6% and ETHA at 2.5%. Waiting on an observable cadence shift rather than an announced one — he has said "next year" about tokenization before. Both seats are below their 200-DMA, so the entry gate is shut regardless.' },
    ],
    files: [F_VOICES, F_RECAP, F_THEME, F_WEEKLY],
  },

  camillo: {
    eyebrow: 'A2 · Input, Layer 2',
    title: 'Camillo',
    source: 'card stamped 8/9 · nomination only, cannot move themes',
    blocks: [
      { t: 'sec', label: 'Named picks' },
      { t: 'kv', k: 'AMZN', v: 'anchor · deployed 10%' },
      { t: 'kv', k: 'HOOD', v: 'deployed 6%' },
      { t: 'kv', k: 'BE', v: 'watch — entry re-rated 8/9' },
      { t: 'sec', label: 'Recent' },
      { t: 'row', date: '8/09 · ICH', pill: 'open', tone: 'open', title: 'BE entry quality materially re-rated', quote: 'BE fell from roughly $300 to $165, about −45%, on forced flow rather than thesis damage: a margin call on an estimated $10B+ position plus simultaneous liquidation of essentially every levered South Korean fund, where BE is among the most actively traded names. He added into it at roughly 1x leverage against the forced seller\'s ~4x.' },
      { t: 'row', date: '8/08 · WOLF', title: 'humanoid deployment framed at 2028', quote: 'pushed the S5 timeline out; explicit deployment language, not research language' },
      { t: 'row', date: '7/15 · WOLF', title: 'AMZN anchor reaffirmed' },
      { t: 'sec', label: 'Why BE is watch, not seat' },
      { t: 'note', text: 'A 45% unwind on forced supply into an intact thesis is the anti-momentum setup the engine rewards — it is no longer the parabolic +1,300% name that scored S5 near 30. But it is still one voice leg with no Visser or ZaStocks corroboration, and its overlap with the AIPO power sleeve (BE is roughly 4.9% of AIPO) has to be resolved before any seat conversation.' },
    ],
    files: [F_VOICES, F_RECAP, F_PULL],
  },

  zastocks: {
    eyebrow: 'A3 · Input, Layer 2',
    title: 'ZaStocks',
    source: 'window Aug 10–17 · candidates-to-verify, never auto-seat',
    blocks: [
      { t: 'sec', label: 'Sourcing' },
      { t: 'kv', k: 'Method', v: 'scheduled Grok task' },
      { t: 'kv', k: 'Inference risk', v: 'high — chart images' },
      { t: 'sec', label: 'Latest window · Aug 10–17' },
      { t: 'row', date: '8/15', title: 'SKHY soft mention logged', quote: 'Surprised SKHY is not doing better, but maybe it pulls an SPCX. A Mentioned, not a positive leg — zero mechanical effect. It matters because it breaks his five-window streak of naming zero book holdings, and it is our largest thesis-seated satellite drawing a lukewarm nod from its own thematic corroborator. Put it in front of the September SKHY rescore.' },
      { t: 'row', date: '8/10–17', pill: 'data', tone: 'data', title: 'MU convergence logged, not seated', quote: 'Visser rebought with a seven-handle and ZaStocks added on the dip — two legs, convergence payout 60, the only genuine cross-voice agreement this window. It does not seat: v3.3 de-seated MU deliberately because SOXX carries it at roughly 9%. Exposure stays inside the basket.' },
      { t: 'sec', label: 'False-convergence traps' },
      { t: 'row', title: 'RDDT does not converge', quote: 'ZaStocks is Adding-Holding with real catalysts — S&P 500 inclusion, then OpenAI and Google data-deal renewals and an Anthropic settlement. But Camillo\'s constant Reddit references are to the venue where he reads developers for ground truth, not to a position. One leg only; under corroboration-only it cannot seat.' },
      { t: 'row', title: 'SPCX is evidentiary, not corroborating', quote: 'ZaStocks Adding-Holding; Visser enthusiastic — 6–8GW incremental data centre in 2027, possibly above 10GW, Nvidia Vera Rubin exclusivity, roughly 80% of output earmarked for space-based capacity — but he stated no position and framed the equity as a call option. SPCX also fails on data as a new listing with no gateable technicals, which is a data failure rather than a thesis failure.' },
      { t: 'sec', label: 'Earlier windows' },
      { t: 'row', date: '8/03 – 8/10', title: '' },
      { t: 'row', date: '7/27 – 8/03', title: '' },
      { t: 'note', text: 'Gated tighter than Camillo. A ZaStocks name never seats alone and never trips the voice floor independently.' },
    ],
    files: [F_VOICES, F_RECAP],
  },

  tagging: {
    eyebrow: 'B1 · Engine',
    title: 'Conviction tagging',
    source: 'quote → theme + score',
    parent: 'engine',
    blocks: [
      { t: 'sec', label: 'Rubric' },
      { t: 'kv', k: 'position_disclosure', v: '.35' },
      { t: 'kv', k: 'certainty', v: '.25' },
      { t: 'kv', k: 'causal', v: '.20' },
      { t: 'kv', k: 'persistence', v: '.10' },
      { t: 'kv', k: 'contrarian', v: '.10' },
      { t: 'sec', label: 'Rule' },
      { t: 'note', text: 'Exact transcript quotes only. No paraphrase, no inferred stance. A claim without a quote does not tag.' },
      { t: 'sec', label: 'Backfill finding' },
      { t: 'row', title: 'Airtime alone fails', quote: 'chips scored 0 airtime for 8 straight weeks — airtime-only weighting would have deleted ASML. Settled convictions produce almost no airtime, so a structural backbone is mandatory.' },
    ],
    files: [
      F_VOICES,
      { path: 'conviction_tags.sql', role: 'conviction schema — never applied', status: 'untracked' },
      { path: 'Conviction_Tagging_Rubric.docx', role: 'the scoring rubric', status: 'untracked' },
    ],
  },

  themes: {
    eyebrow: 'B2 · Engine, cascade output',
    title: 'Trend weights',
    source: 'rescore_trendfirst.py → frozen into daily-cron.cjs BASE_PORTFOLIO',
    parent: 'engine',
    blocks: [
      { t: 'sec', label: 'Trend mix · v3.4.1' },
      ...TREND_ORDER.map((tr): Block => ({
        t: 'bar', k: tr, v: trendSum(tr).toFixed(1) + '%', pct: trendSum(tr),
      })),
      { t: 'note', text: 'Bars are summed from the holdings below, not typed in — they cannot drift apart. Trend weights are an OUTPUT of the cascade, not an input. Sums to 100.0 exactly. There is no cash row: SGOV left the book at the v3.4 freeze and stays priced only because the momentum sleeve settles its cash residual there.' },
      { t: 'sec', label: 'Versions' },
      { t: 'kv', k: 'v3.4.1 stage flip', v: '8/31/26 · 12 names · 4.06pp turnover' },
      { t: 'kv', k: 'v3.4 trend-first', v: '8/24/26 · 12 names' },
      { t: 'kv', k: 'v3.3 core-satellite', v: '7/15/26 · 14 names' },
      { t: 'kv', k: 'v3.2 top-down', v: '7/13/26 · 15 names' },
      { t: 'kv', k: 'v3.1 / v3.0 sleeve mix', v: 'pending backfill', pending: true },
      { t: 'note', text: 'v3.4.1 is a classification patch, not a methodology change. The cascade is unchanged v3.4; only two timing classifications and three entry bands moved. Ticker set unchanged.' },
      { t: 'sec', label: 'Holdings at freeze' },
      ...V34_BOOK.map((h): Block => ({
        t: 'kv', k: h.tkr + ' · ' + h.trend, v: h.w.toFixed(1) + ' · ' + h.act,
      })),
      { t: 'note', text: 'Floors are half the frozen weight, rounded to 0.1. Actions are the freeze-night instruction, not a standing signal.' },
      { t: 'sec', label: 'What moved on 8/31' },
      { t: 'row', date: '8/31 · flip', pill: 'engine', tone: 'engine', title: 'ETHA forward → working · +2.2', quote: 'The 8/15–8/16 basis was that beginning in September the next constraint becomes financial — dated, not started. It is now started. Visser 8/30 calls it the catalyst point and the most important thing to be spending time on; 8/29 states more money in crypto than ever and more Ethereum than he has ever held. Corroborated by price rather than assertion alone: ETH/BTC breakout, tokenized index outperforming BTC year to date. Held at working rather than binding — one rung at a time.' },
      { t: 'row', date: '8/31 · flip', pill: 'engine', tone: 'engine', title: 'GLDM binding → working · −2.4', quote: 'Visser 8/30 supersedes the 8/16 debasement instruction with an explicit RELATIVE de-rate: gold will not be the fastest horse in the race. Direction is intact — he still expects gold higher — so this maps to timing, not quality. Independently corroborated: GLDM broke its 200-DMA the same week at 87.70 against 89.40, dropping S5 from 58 to 45 and the entry band from 0.85 to 0.75.' },
      { t: 'row', date: '8/28 · bands', pill: 'data', tone: 'data', title: 'Three band shifts on Friday closes', quote: 'LLY 0.85 to 0.95 after falling through its 50-DMA at 1156.75 against 1188. SLV 0.60 to 0.75 on stretch decay. GLDM 0.85 to 0.75. AMZN moved −0.9 with no classification change of its own — LLY simply took more of a shrinking AI Applied pot, which is intra-trend renormalisation working as designed.' },
      { t: 'note', text: 'GLDM and ETHA together account for 56% of this cycle turnover. The AMZN/LLY rounding tie at 13.353685096 dissolved on the LLY band change and needs no correction.' },
      { t: 'sec', label: 'theme_engine.py · recommender, dormant' },
      { t: 'note', text: 'L1 theme weights were retired at the v3.4 lock. The findings below describe theme_engine.py, which no longer feeds the book and has never run in this working tree. Kept because the file is still present and the failure modes are still real if it is ever revived.' },
      { t: 'row', pending: true, pill: 'open', tone: 'open', title: 'No structural backbone in L1', quote: 'Intensity is a pure function of airtime × conviction. A theme with zero airtime falls to the max(0.01) floor, and the only thing holding it up is the ±4%/week limiter clamping it to prior − 4. Over the 8-week stretch where chips scored zero airtime, that is roughly −32 points — the ASML-deletion failure mode the backfill warned about, arriving slowly instead of at once.' },
      { t: 'row', pill: 'data', tone: 'data', title: 'Partial severity degrades quietly', quote: 'A missing input file hard-exits via sys.exit, which is correct. But in L2, sev.severity.get(pillar, 0.6) substitutes 0.6 for any pillar absent from the severity file, and a missing config falls back to CFG_DEFAULT whole. So an absent file fails loudly while an incomplete one does not.' },
      { t: 'row', pill: 'data', tone: 'data', title: 'Has never run in this working tree', quote: 'Line 152 writes theme_weights.json on every successful run and that file does not exist. conviction_tags.json and theme_engine_config.json are also absent, and severity_scores.json is dated 7/15 against an 8/5 engine.' },
    ],
    files: [
      F_THEME,
      { path: 'Trend_First_Spec.md', role: 'spec — canonical v3.4 methodology', status: 'live' },
      { path: 'rescore_trendfirst.py', role: 'offline runner — validated v3.4 engine', status: 'live' },
      { path: 'v34_worksheet_2026-08-31.html', role: 'canonical worksheet — v3.4.1 per-name arithmetic', status: 'live' },
      { path: 'v34_worksheet_2026-08-24.html', role: 'prior worksheet — v3.4 baseline for the delta', status: 'live' },
      { path: 'server/daily-cron.cjs', role: 'BASE_PORTFOLIO — the frozen book, source of truth', status: 'live' },
      { path: 'corr_matrix.json', role: 'input — 251-session correlations behind N_eff', status: 'live' },
      { path: 'conviction_tags.json', role: 'input to the dormant recommender; presence not confirmed', status: 'unverified' },
      { path: 'severity_scores.json', role: 'input to the dormant recommender; gitignored', status: 'unverified' },
      { path: 'theme_weights.json', role: 'output of the dormant recommender; absent', status: 'unverified' },
      { path: 'src/components/SignalRadar.tsx', role: 'theme radar — Dashboard does not import it; check before trusting', status: 'unverified' },
      { path: 'src/components/Portfolio.tsx', role: 'renders the resulting holdings table', status: 'live' },
    ],
  },

  pillars: {
    eyebrow: 'B3 · Superseded 8/23/26',
    title: 'Pillar sizing · v3.3 composite',
    source: 'signal_engine.py + signal_model_config.json — retained for version history',
    parent: 'engine',
    blocks: [
      { t: 'sec', label: 'Retired' },
      { t: 'note', text: 'This is the composite scoring that built v3.0 through v3.3. It was superseded by the v3.4 trend-first cascade on 8/23/26 and no longer sets any weight in the live book. Kept visible because the version rows under B2 reference books this produced, and deleting it would make that history unauditable.' },
      { t: 'sec', label: 'Composite weights · historical' },
      { t: 'kv', k: 'S1 bottleneck', v: '0.30', pending: true },
      { t: 'kv', k: 'S2 timing', v: '0.30', pending: true },
      { t: 'kv', k: 'S5 entry quality', v: '0.20', pending: true },
      { t: 'kv', k: 'S6 valuation risk', v: '0.10', pending: true },
      { t: 'kv', k: 'convergence bonus', v: '0.10', pending: true },
      { t: 'note', text: 'Labels deliberately skip S3 and S4. S5 appears before S6 by design. Of these only S5 survives into v3.4, as the entry-band input to name_score — and with RSI removed from it.' },
      { t: 'sec', label: 'S1 four-axis · historical' },
      { t: 'kv', k: '1 · Bottleneck', v: 'AIPO 85 · ASML 88 · GLW 80', pending: true },
      { t: 'kv', k: '2 · Monetary', v: 'IBIT 88 · GLDM 85', pending: true },
      { t: 'kv', k: '3 · Physical', v: 'COPX 55+22 · SLV 52+16', pending: true },
      { t: 'kv', k: '4 · App dominance', v: 'LLY 68 · HOOD 61 · AMZN 60', pending: true },
      { t: 'row', pill: 'open', tone: 'open', title: 'Axis 3 boost has no v3.4 successor', quote: 'The Axis-3 physical boost was the only link from hyperscaler capex to copper and silver weight. Trend-first has nothing equivalent. Big-4 2026 capex verified 8/17 at roughly $725B against $410B, up 77% year on year with Q2 guidance raises. Open: give it a home in the wave-demand column, or document the loss.' },
    ],
    files: [
      F_ENGINE, F_CONFIG,
      { path: 'Signal_Engine_Reference.md', role: 'spec — describes the retired composite', status: 'stale' },
      { path: 'S1_Four_Axis_Spec.md', role: 'spec — describes the retired composite, still carries S4 · 0.15', status: 'stale' },
    ],
  },

  seats: {
    eyebrow: 'B4 · Human call',
    title: 'Trend conviction',
    source: 'the one step in the assembly the engine does not perform',
    parent: 'engine',
    blocks: [
      { t: 'sec', label: 'Principle' },
      { t: 'note', text: 'Under v3.4 the human call is trend conviction (tconv), not seat count. Concentration still scales with winner-certainty rather than cycle stage, and size stays engine output. The engine sizes what you classify; it does not classify.' },
      { t: 'sec', label: 'Standing rule' },
      { t: 'row', title: 'Fix scores, not weights', quote: 'a discretionary weight override undermines the system. If a weight looks wrong, the score is wrong. This is why the nightly convergence-boost and RSI-trim in the cron stay disabled — they double-counted signals the engine already prices in.' },
      { t: 'sec', label: 'Open decision · v3.3 era' },
      { t: 'row', pill: 'open', tone: 'open', title: 'WDC — cold storage / nearline HDD', quote: 'raised under v3.3 as the only uncovered axis. WDC and STX hold above 80% share, 2026 output sold out, LTAs through 2027–28. SNDK is watch-not-seat: +570% YTD triggered the full velocity penalty and it rents rather than owns the bottleneck. Not re-tested against the v3.4 cascade.' },
    ],
    files: [
      F_WEEKLY,
      { path: 'Weekly_Workflow_v34_section.md', role: 'canonical v3.4 run order', status: 'untracked' },
      { path: 'Weekly_Workflow_v2.docx', role: 'revised run order — superseded by the v3.4 section', status: 'untracked' },
    ],
  },

  names: {
    eyebrow: 'B5 · Engine, name split',
    title: 'Name split',
    source: 'coverage discount and the v3.4 ladders',
    parent: 'engine',
    blocks: [
      { t: 'sec', label: 'Rule B' },
      { t: 'kv', k: 'lambda', v: '0.814' },
      { t: 'kv', k: 'Applies to', v: 'single names inside a held ETF' },
      { t: 'kv', k: 'Supersedes', v: '12% single-stock cap (6/1/26)' },
      { t: 'note', text: 'MU and MRVL were removed as standalones because both are real SOXX holdings. WDC, SNDK and GLW are confirmed absent from SOXX — no lambda discount applies. Rule B survives v3.4 unchanged; it is the same principle as the coverage test that keeps AIPO despite its 0.86 correlation to SOXX.' },
      { t: 'sec', label: 'Timing ladder' },
      { t: 'kv', k: 'binding', v: '×1.00' },
      { t: 'kv', k: 'working', v: '×0.92' },
      { t: 'kv', k: 'cooling', v: '×0.80' },
      { t: 'kv', k: 'forward', v: '×0.72' },
      { t: 'kv', k: 'exhausted', v: '×0.60 — floor' },
      { t: 'note', text: '0.60 is a floor, not a kill. Fade, never zero. Corrected 9/02: an earlier pass on this card mislabelled the middle rungs as forward / dated / absent. The multipliers were right, the names were not — cooling sits at 0.80 and forward at 0.72. Under v3.4 this ladder applies to every name rather than to S1 alone, and its multipliers act on the above-floor 55, stacking with lambda.' },
    ],
    files: [
      F_ENGINE, F_PULL,
      { path: 'rescore_trendfirst.py', role: 'the live v3.4 offline runner', status: 'live' },
      { path: 'rescore_current_v3.py', role: 'orphaned since 7/6 — not the live engine, do not run', status: 'orphan' },
      { path: 'rescore_v34.py', role: 'retired — superseded by rescore_trendfirst.py, do not run', status: 'orphan' },
      { path: 'patch_gate_no_dma.py', role: 'fourth null-DMA patch — never run', status: 'untracked' },
    ],
  },

  approval: {
    eyebrow: 'C1 · Human gate',
    title: 'Approval',
    source: 'nothing is built without it',
    blocks: [
      { t: 'sec', label: 'The loop' },
      { t: 'note', text: 'discuss → mockup → approve → build. Applies at every level: theme weights, pillar weights, name splits, UI changes.' },
      { t: 'sec', label: 'Probe before propose' },
      { t: 'row', date: 'adopted 7/26/26', title: 'Reconnaissance precedes recommendation', quote: 'for any new external data source, run the probe first and batch every endpoint into one run. No tile mockup, no engine wire, no build recommendation before probe output is in hand. Every specific claim marked verified, inferred, or assumed.' },
    ],
    files: [
      F_WEEKLY,
      { path: 'probe_source.textClipping', role: 'Finder stub — will not execute, re-save as .cjs', status: 'orphan' },
    ],
  },

  freeze: {
    eyebrow: 'C2 · Write',
    title: 'Freeze',
    source: 'phase 2: system_changelog · PORTFOLIO_VERSION drives P&L drift',
    blocks: [
      { t: 'sec', label: 'Current' },
      { t: 'kv', k: 'Version string', v: '2026-07-15-v3.3-coresat' },
      { t: 'kv', k: 'Names', v: '14' },
      { t: 'sec', label: 'Changelog' },
      { t: 'row', date: '8/11', pill: 'engine', tone: 'engine', title: 'Memory stage exhausted → working', quote: '×0.60 → ×0.92. Applied by raising SKHY S2 into the 65–89 band — the engine derives stage from S2 thresholds computationally, there is no stage config field. Standing wiring trap: contract is not spot. SK Hynix sells bilateral contracts to hyperscalers, so feeding spot into severity_probe.cjs produces a false negative on SKHY.' },
      { t: 'row', date: '8/11', pill: 'data', tone: 'data', title: 'Null-DMA coercion patched', quote: 'JS null coerced to 0 produced a fabricated S5 of 52 for SKHY. Three of four patches applied.' },
      { t: 'row', date: '8/11', pill: 'book', tone: 'book', title: 'GLDM conviction-proximity carve-out fired', quote: '−2.12% from the 200-DMA, inside the ±3% band' },
      { t: 'row', date: '8/08', pill: 'engine', tone: 'engine', title: 'S5 humanoid timeline moved to 2028' },
      { t: 'row', date: '7/15', pill: 'book', tone: 'book', title: 'v3.3 core-satellite freeze' },
      { t: 'row', date: '7/13', pill: 'engine', tone: 'engine', title: 'AIPO reclassified as power infrastructure', quote: 'roughly 85% power, grid and nuclear — no double-count against ASML, SOXX or GLW' },
      { t: 'row', date: '7/09', pill: 'engine', tone: 'engine', title: 'S4 catalyst removed permanently', quote: 'every liquid Kalshi market that could drive S4 is already an axis-2 input; feeding it to S4 double-counts debasement' },
      { t: 'row', date: '7/07', pill: 'engine', tone: 'engine', title: 'S1 four-axis architecture deployed' },
      { t: 'row', date: '6/01', pill: 'engine', tone: 'engine', title: 'Rule B introduced, lambda 0.814' },
    ],
    files: [
      { path: 'server/daily-cron.cjs', role: 'holds BASE_PORTFOLIO + PORTFOLIO_VERSION', status: 'live' },
      { path: 'src/data/systemMap.ts', role: 'this changelog, until system_changelog exists', status: 'live' },
      { path: 'system_changelog', role: 'Supabase table — phase 2', status: 'proposed', kind: 'table' },
    ],
  },

  push: {
    eyebrow: 'C3 · Deploy',
    title: 'git push → Vercel',
    source: 'auto-deploys on push to main',
    blocks: [
      { t: 'sec', label: 'Discipline' },
      { t: 'kv', k: 'Validate', v: 'npm run build — never dev' },
      { t: 'kv', k: 'Stage', v: 'targeted git add only' },
      { t: 'kv', k: 'Patches', v: 'anchored, .bak, count==1' },
      { t: 'note', text: 'Site deploys instantly on push, but data only changes after the 7pm ET cron writes to Supabase.' },
    ],
    files: [
      { path: 'src/components/Dashboard.tsx', role: 'app shell — theme tokens, tab routing, stat cards', status: 'live' },
      { path: '.gitignore', role: 'keeps Finder artifacts and local assets out', status: 'live' },
    ],
  },

  cron: {
    eyebrow: 'D1 · Trigger',
    title: 'GitHub Actions',
    source: 'server/daily-cron.cjs',
    blocks: [
      { t: 'kv', k: 'Schedule', v: '7pm ET weekdays' },
      { t: 'kv', k: 'Writes', v: 'service-role key' },
      { t: 'note', text: 'The cron never writes podcast_log or system_changelog. Those stay weekly and human-authored.' },
    ],
    files: [
      { path: '.github/workflows/', role: 'the schedule definition', status: 'unverified', kind: 'dir' },
      F_CRON,
    ],
  },

  apis: {
    eyebrow: 'D2 · Data',
    title: 'Price + macro sources',
    source: 'five live, one manual',
    blocks: [
      { t: 'kv', k: 'Twelve Data', v: 'primary technicals' },
      { t: 'kv', k: 'Finnhub', v: 'price quotes' },
      { t: 'kv', k: 'Alpha Vantage', v: 'SPY RSI history only' },
      { t: 'kv', k: 'FRED', v: 'CPIAUCNS YoY' },
      { t: 'kv', k: 'Kalshi', v: 'read API, no auth' },
      { t: 'kv', k: 'CME warehouse', v: 'manual weekly', pending: true },
      { t: 'note', text: 'Cleveland Fed nowcast is JS-rendered and not on FRED — displays as an em dash until an endpoint is found.' },
    ],
    files: [
      F_CRON, F_PULL,
      { path: '.env.local', role: 'API keys — gitignored, read directly, no dotenv', status: 'live' },
      { path: 'severity_probe.cjs', role: 'exhaustion probe — needs one live run', status: 'untracked' },
      { path: 'probe_fear_guards.cjs', role: 'Kalshi fear/greed ladder guards', status: 'untracked' },
    ],
  },

  croncjs: {
    eyebrow: 'D3 · Engine',
    title: 'daily-cron.cjs',
    source: 'the nightly orchestrator',
    blocks: [
      { t: 'sec', label: 'Computes' },
      { t: 'kv', k: 'RSI14', v: 'Wilder' },
      { t: 'kv', k: 'SMA', v: '50 / 200' },
      { t: 'kv', k: 'CPI regime', v: 'bearish at or above 4%' },
      { t: 'sec', label: 'Known trap' },
      { t: 'row', title: 'Null DMA arithmetic', quote: 'null coerces to 0, producing an infinite stretch, a max velocity penalty, a clamp, and a fabricated score. Patched 8/11; the gate branch patch is still pending.' },
    ],
    files: [
      F_CRON,
      { path: 'patch_gate_no_dma.py', role: 'the fourth null-DMA patch — still unrun', status: 'untracked' },
    ],
  },

  pnl: {
    eyebrow: 'D4 · Engine',
    title: 'P&L drift model',
    source: 'hold-and-drift, not daily rebalance',
    blocks: [
      { t: 'note', text: 'On rebalance days — rescore, version change, or ticker add/drop — positions reset to target. On drift days each position carries forward by its own price move and weights float naturally.' },
      { t: 'sec', label: 'Why' },
      { t: 'row', title: 'The original constant-mix model silently trimmed winners every night, producing a curve incompatible with the book philosophy.' },
    ],
    files: [
      { path: 'server/daily-cron.cjs', role: 'rebalance-detect at the version-string compare', status: 'live' },
      { path: 'src/components/PnLTracker.tsx', role: 'Performance tab — returns, cumulative, alpha vs SPY', status: 'live' },
    ],
  },

  supabase: {
    eyebrow: 'D5 · Write',
    title: 'Supabase',
    source: 'single source of truth for display',
    blocks: [
      { t: 'sec', label: 'Live tables' },
      { t: 'kv', k: 'daily_snapshots', v: 'live' },
      { t: 'kv', k: 'portfolio_holdings', v: 'live' },
      { t: 'kv', k: 'voice_mentions', v: 'live' },
      { t: 'sec', label: 'Proposed — phase 2' },
      { t: 'kv', k: 'podcast_log', v: 'not created', pending: true },
      { t: 'kv', k: 'system_changelog', v: 'not created', pending: true },
      { t: 'note', text: 'Two small tables plus a one-time backfill. Roughly 30 extra seconds in the weekly workflow.' },
    ],
    files: [
      { path: 'src/supabase.ts', role: 'browser client — anon key, read-only', status: 'live' },
      { path: 'server/daily-cron.cjs', role: 'the only writer — service-role key', status: 'live' },
      { path: 'src/components/HistoryLog.tsx', role: 'merged into Performance, still on disk — check', status: 'unverified' },
    ],
  },
}
