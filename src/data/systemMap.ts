// System tab data — blueprint/callout layout.
//
// PHASE 1: content is authored here. When podcast_log and system_changelog
// land in Supabase, swap SYS_DETAILS for a query and keep the Block[] shape —
// SystemTab.tsx renders blocks and knows nothing about sources.
//
// Stage coordinate space is 1400 x 430 and matches the SVG viewBox exactly.
// Node box is 152 wide. Connector y = node.y + 34.

export type NodeKind = 'input' | 'engine' | 'human' | 'write'

export interface SysNode {
  id: string
  x: number
  y: number
  kind: NodeKind
  ref: string          // drawing reference, e.g. "A1 · INPUT L1"
  title: string
  sub: string
  history?: boolean
}

export interface SysCell {
  id: string
  x: number
  y: number
  w: number
  ref: string
  title: string
  value: string
  gate?: boolean       // human decision inside the engine assembly
  output?: boolean     // terminal cell, not clickable
}

export interface SysZone { x: number; y: number; w: number; h: number; label: string }
export interface SysEdge { d: string; tone: 'wire' | 'feedback' | 'leader'; arrow?: boolean }
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
}

// ---------------------------------------------------------------- geometry

export const STAGE_W = 1400
export const STAGE_H = 430

export const ENGINE_BOX = { x: 200, y: 76, w: 300, h: 132 }
// Must stay clear of ENGINE_BOX (x 200-500, y 76-208): inside a preserve-3d
// context the engine's hover translateZ occludes anything overlapping it,
// regardless of z-index. Parked below the engine, inside the weekly zone.
export const BUBBLE = { x: 228, y: 214, d: 44 }
export const DETAIL_PANEL = { x: 560, y: 26, w: 560, h: 236 }

export const SYS_ZONES: SysZone[] = [
  { x: 0, y: 8, w: 1180, h: 256, label: 'Weekly · you + Claude' },
  { x: 0, y: 296, w: 940, h: 122, label: 'Daily · cron 7pm ET' },
]

export const SYS_NODES: SysNode[] = [
  { id: 'visser',   x: 10,  y: 18,  kind: 'input',  ref: 'A1 · INPUT L1', title: 'Visser',         sub: '2×/wk · moves themes', history: true },
  { id: 'camillo',  x: 10,  y: 106, kind: 'input',  ref: 'A2 · INPUT L2', title: 'Camillo',        sub: 'names only',           history: true },
  { id: 'zastocks', x: 10,  y: 194, kind: 'input',  ref: 'A3 · INPUT L2', title: 'ZaStocks',       sub: 'verify only',          history: true },

  { id: 'approval', x: 536, y: 106, kind: 'human',  ref: 'C1 · GATE',     title: 'Approval',       sub: 'no auto-build' },
  { id: 'freeze',   x: 732, y: 106, kind: 'write',  ref: 'C2 · WRITE',    title: 'Freeze',         sub: 'v3.3-coresat',         history: true },
  { id: 'push',     x: 928, y: 106, kind: 'write',  ref: 'C3 · DEPLOY',   title: 'git push',       sub: '→ Vercel' },

  { id: 'cron',     x: 10,  y: 344, kind: 'input',  ref: 'D1 · TRIGGER',  title: 'GitHub Actions', sub: '7pm ET' },
  { id: 'apis',     x: 204, y: 344, kind: 'input',  ref: 'D2 · DATA',     title: 'Price + macro',  sub: '5 sources' },
  { id: 'croncjs',  x: 402, y: 344, kind: 'engine', ref: 'D3 · ENGINE',   title: 'daily-cron.cjs', sub: 'RSI · DMA · CPI' },
  { id: 'pnl',      x: 600, y: 344, kind: 'engine', ref: 'D4 · ENGINE',   title: 'P&L drift',      sub: 'drift vs rebal' },
  { id: 'supabase', x: 798, y: 344, kind: 'write',  ref: 'D5 · WRITE',    title: 'Supabase',       sub: '3 tables',             history: true },
]

export const SYS_CELLS: SysCell[] = [
  { id: 'tagging', x: 18,  y: 24,  w: 164, ref: 'B1',        title: 'Conviction tagging', value: '5-part rubric' },
  { id: 'themes',  x: 198, y: 24,  w: 164, ref: 'B2 · L1',   title: 'Theme weights',      value: '±4% / wk limiter' },
  { id: 'pillars', x: 378, y: 24,  w: 164, ref: 'B3 · L2',   title: 'Pillar sizing',      value: '.30/.30/.20/.10/.10' },
  { id: 'seats',   x: 18,  y: 128, w: 164, ref: 'B4 · HUMAN', title: 'Seat count',        value: 'contestedness → seats', gate: true },
  { id: 'names',   x: 198, y: 128, w: 164, ref: 'B5 · L4',   title: 'Name split',         value: 'Rule B λ 0.814' },
  { id: 'output',  x: 378, y: 128, w: 164, ref: 'OUTPUT',    title: '14 positions',       value: '→ C1 approval', output: true },
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
  { d: 'M276,236 L554,250',                 tone: 'leader' },
]

export const SYS_LABELS: SysLabel[] = [
  { x: 26,  y: 34,  text: 'A · INPUTS' },
  { x: 200, y: 34,  text: 'B · ENGINE' },
  { x: 600, y: 34,  text: 'DETAIL B · 2:1' },
  { x: 740, y: 34,  text: 'C · GATE + WRITE' },
  { x: 26,  y: 344, text: 'D · NIGHTLY' },
  { x: 596, y: 274, text: 'BASE_PORTFOLIO' },
]

// ---------------------------------------------------------------- content

export const SYS_DETAILS: Record<string, SysDetail> = {
  engine: {
    eyebrow: 'B · Sealed assembly',
    title: 'Engine',
    source: 'voices in → 14 weighted positions out',
    blocks: [
      { t: 'sec', label: 'Assembly' },
      { t: 'kv', k: 'Parts', v: '5' },
      { t: 'kv', k: 'Human calls', v: '1 — B4 seat count' },
      { t: 'kv', k: 'Layers', v: 'L1 → L4' },
      { t: 'note', text: 'Seat count sits inside the assembly but the engine does not perform it. Contestedness is a human call; the engine only sizes what you seat.' },
    ],
  },

  visser: {
    eyebrow: 'A1 · Input, Layer 1',
    title: 'Visser',
    source: 'phase 2: podcast_log where source = visser',
    blocks: [
      { t: 'sec', label: 'Mandate' },
      { t: 'kv', k: 'Moves theme weights', v: 'yes — only voice' },
      { t: 'kv', k: 'Change limiter', v: '±4% / week' },
      { t: 'kv', k: 'Cadence', v: 'Pomp + solo, 2×/wk' },
      { t: 'sec', label: 'Episode log' },
      { t: 'row', date: '8/09 · solo', title: 'Memory re-entry thesis', quote: 'bought MU back above his own exit; called memory the most important part of the AI trade' },
      { t: 'row', date: '8/08 · Pomp', title: 'S3 power intact, silver working' },
      { t: 'row', date: '7/27 · Mark Moss', title: 'debasement framing → axis 2 confirm' },
      { t: 'row', date: '7/20 · Substack', title: 'AI × crypto guardrails → tokenization' },
      { t: 'row', date: '7/06 · Substack', title: 'Bitcoin and the Fed → monetary axis' },
      { t: 'sec', label: '5-stage AI cycle' },
      { t: 'kv', k: 'S1 Memory', v: 'under review' },
      { t: 'kv', k: 'S2 Optical / chem', v: 'working' },
      { t: 'kv', k: 'S3 Power + silver', v: 'binding — now' },
      { t: 'kv', k: 'S4 Tokenization', v: "July '26" },
      { t: 'kv', k: 'S5 Agentic', v: '2028+' },
    ],
  },

  camillo: {
    eyebrow: 'A2 · Input, Layer 2',
    title: 'Camillo',
    source: 'name nomination only — cannot move themes',
    blocks: [
      { t: 'sec', label: 'Named picks' },
      { t: 'kv', k: 'AMZN', v: 'anchor · deployed 10%' },
      { t: 'kv', k: 'HOOD', v: 'deployed 6%' },
      { t: 'kv', k: 'BE', v: 'not seated' },
      { t: 'sec', label: 'Recent' },
      { t: 'row', date: '8/08 · WOLF', title: 'humanoid deployment framed at 2028', quote: 'pushed the S5 timeline out; explicit deployment language, not research language' },
      { t: 'row', date: '7/15 · WOLF', title: 'AMZN anchor reaffirmed' },
      { t: 'row', date: '6/24 · WOLF', title: 'BE, HOOD reaffirmed' },
    ],
  },

  zastocks: {
    eyebrow: 'A3 · Input, Layer 2',
    title: 'ZaStocks',
    source: 'candidates-to-verify — never auto-seat',
    blocks: [
      { t: 'sec', label: 'Sourcing' },
      { t: 'kv', k: 'Method', v: 'scheduled Grok task' },
      { t: 'kv', k: 'Inference risk', v: 'high — chart images' },
      { t: 'sec', label: 'Windows logged' },
      { t: 'row', date: '8/03 – 8/10', title: 'latest ingested' },
      { t: 'row', date: '7/27 – 8/03', title: '' },
      { t: 'row', date: '7/20 – 7/27', title: '' },
      { t: 'note', text: 'Gated tighter than Camillo. A ZaStocks name never seats alone and never trips the voice floor independently.' },
    ],
  },

  tagging: {
    eyebrow: 'B1 · Engine',
    title: 'Conviction tagging',
    source: 'quote → theme + score',
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
  },

  themes: {
    eyebrow: 'B2 · Engine, Layer 1',
    title: 'Theme weights',
    source: 'theme_engine.py · phase 2: daily_snapshots.portfolio_version',
    blocks: [
      { t: 'sec', label: 'Sleeve mix' },
      { t: 'bar', k: 'AI Compute', v: '50.5%', pct: 50.5 },
      { t: 'bar', k: 'Application', v: '20.0%', pct: 20 },
      { t: 'bar', k: 'Monetary', v: '15.0%', pct: 15 },
      { t: 'bar', k: 'Tokenization', v: '8.5%', pct: 8.5 },
      { t: 'bar', k: 'Cash', v: '6.0%', pct: 6 },
      { t: 'sec', label: 'Versions' },
      { t: 'kv', k: 'v3.3 core-satellite', v: '7/15/26 · 14 names' },
      { t: 'kv', k: 'v3.2 top-down', v: '7/13/26 · 15 names' },
      { t: 'kv', k: 'v3.1 / v3.0 sleeve mix', v: 'pending backfill', pending: true },
      { t: 'sec', label: 'Holdings at freeze' },
      { t: 'kv', k: 'AIPO · core, power infra', v: '16.0' },
      { t: 'kv', k: 'SOXX · core, semis', v: '12.0' },
      { t: 'kv', k: 'LLY · app satellite', v: '10.0' },
      { t: 'kv', k: 'AMZN · app satellite', v: '10.0' },
      { t: 'kv', k: 'SKHY · memory', v: '8.0' },
      { t: 'kv', k: 'ASML · EUV monopoly', v: '7.0' },
      { t: 'kv', k: 'SLV · monetary + physical', v: '7.0' },
      { t: 'kv', k: 'HOOD · tokenization', v: '6.0' },
      { t: 'kv', k: 'SGOV · cash', v: '6.0' },
      { t: 'kv', k: 'GLW · interconnect', v: '4.5' },
      { t: 'kv', k: 'IBIT · monetary', v: '4.0' },
      { t: 'kv', k: 'GLDM · monetary', v: '4.0' },
      { t: 'kv', k: 'COPX · physical scarcity', v: '3.0' },
      { t: 'kv', k: 'ETHA · tokenization', v: '2.5' },
      { t: 'note', text: 'Dimmed rows are not yet backfilled. Cells stay empty rather than estimated.' },
    ],
  },

  pillars: {
    eyebrow: 'B3 · Engine, Layer 2',
    title: 'Pillar sizing',
    source: 'signal_engine.py + signal_model_config.json',
    blocks: [
      { t: 'sec', label: 'Composite weights' },
      { t: 'kv', k: 'S1 bottleneck', v: '0.30' },
      { t: 'kv', k: 'S2 timing', v: '0.30' },
      { t: 'kv', k: 'S5 entry quality', v: '0.20' },
      { t: 'kv', k: 'S6 valuation risk', v: '0.10' },
      { t: 'kv', k: 'convergence bonus', v: '0.10' },
      { t: 'note', text: 'Labels deliberately skip S3 and S4. S5 appears before S6 by design.' },
      { t: 'sec', label: 'S1 four-axis' },
      { t: 'kv', k: '1 · Bottleneck', v: 'AIPO 85 · ASML 88 · GLW 80' },
      { t: 'kv', k: '2 · Monetary', v: 'IBIT 88 · GLDM 85' },
      { t: 'kv', k: '3 · Physical', v: 'COPX 55+22 · SLV 52+16' },
      { t: 'kv', k: '4 · App dominance', v: 'LLY 68 · HOOD 61 · AMZN 60' },
    ],
  },

  seats: {
    eyebrow: 'B4 · Human call',
    title: 'Seat count',
    source: 'the one step in the assembly the engine does not perform',
    blocks: [
      { t: 'sec', label: 'Principle' },
      { t: 'note', text: 'Concentration scales with winner-certainty, not cycle stage. Contestedness sets seat count — a human call. Size stays engine output.' },
      { t: 'sec', label: 'Standing rule' },
      { t: 'row', title: 'Fix scores, not weights', quote: 'a discretionary weight override undermines the system. If a weight looks wrong, the score is wrong.' },
      { t: 'sec', label: 'Open decision' },
      { t: 'row', pill: 'open', tone: 'open', title: 'WDC — cold storage / nearline HDD', quote: 'only uncovered axis in v3.3. WDC+STX above 80% share, 2026 output sold out, LTAs through 2027–28. SNDK is watch-not-seat: +570% YTD triggers the full velocity penalty and it rents rather than owns the bottleneck.' },
    ],
  },

  names: {
    eyebrow: 'B5 · Engine, Layer 4',
    title: 'Name split',
    source: 'coverage discount and stage decay',
    blocks: [
      { t: 'sec', label: 'Rule B' },
      { t: 'kv', k: 'lambda', v: '0.814' },
      { t: 'kv', k: 'Applies to', v: 'single names inside a held ETF' },
      { t: 'kv', k: 'Supersedes', v: '12% single-stock cap (6/1/26)' },
      { t: 'note', text: 'MU and MRVL were removed as standalones because both are real SOXX holdings. WDC, SNDK and GLW are confirmed absent from SOXX — no lambda discount applies.' },
      { t: 'sec', label: 'Stage decay · S1 only' },
      { t: 'kv', k: 'binding', v: '×1.00' },
      { t: 'kv', k: 'working', v: '×0.92' },
      { t: 'kv', k: 'cooling', v: '×0.80' },
      { t: 'kv', k: 'exhausted', v: '×0.60 — floor' },
      { t: 'note', text: '0.60 is a floor, not a kill. Fade, never zero. Hard money and ETFs are exempt. Stacks multiplicatively with lambda.' },
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
      { t: 'row', pending: true, pill: 'open', tone: 'open', title: 'Memory stage exhausted → working', quote: '×0.60 → ×0.92. Provisionally approved 8/11. Refresh TrendForce contract prices before applying — contract is not spot, and feeding spot into the severity probe produces a false negative.' },
      { t: 'row', date: '8/11', pill: 'data', tone: 'data', title: 'Null-DMA coercion patched', quote: 'JS null coerced to 0 produced a fabricated S5 of 52 for SKHY. Three of four patches applied.' },
      { t: 'row', date: '8/11', pill: 'book', tone: 'book', title: 'GLDM conviction-proximity carve-out fired', quote: '−2.12% from the 200-DMA, inside the ±3% band' },
      { t: 'row', date: '8/08', pill: 'engine', tone: 'engine', title: 'S5 humanoid timeline moved to 2028' },
      { t: 'row', date: '7/15', pill: 'book', tone: 'book', title: 'v3.3 core-satellite freeze' },
      { t: 'row', date: '7/13', pill: 'engine', tone: 'engine', title: 'AIPO reclassified as power infrastructure', quote: 'roughly 85% power, grid and nuclear — no double-count against ASML, SOXX or GLW' },
      { t: 'row', date: '7/09', pill: 'engine', tone: 'engine', title: 'S4 catalyst removed permanently', quote: 'every liquid Kalshi market that could drive S4 is already an axis-2 input; feeding it to S4 double-counts debasement' },
      { t: 'row', date: '7/07', pill: 'engine', tone: 'engine', title: 'S1 four-axis architecture deployed' },
      { t: 'row', date: '6/01', pill: 'engine', tone: 'engine', title: 'Rule B introduced, lambda 0.814' },
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
  },
}
