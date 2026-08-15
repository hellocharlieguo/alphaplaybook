// System tab data — node graph geometry + per-node history payloads.
//
// PHASE 1: all content is authored here as constants. When podcast_log and
// system_changelog land in Supabase, swap SYS_DETAILS for a query and keep the
// Block[] shape — SystemTab.tsx renders blocks and knows nothing about sources.
//
// Stage coordinate space is 1800 x 560 (matches the SVG viewBox). Node box is
// 150 wide; connector y = node.y + 43.

export type NodeKind = 'input' | 'engine' | 'human' | 'write'

export interface SysNode {
  id: string
  x: number
  y: number
  kind: NodeKind
  eyebrow: string
  title: string
  sub: string
  history?: boolean
}

export type Tone = 'engine' | 'book' | 'data' | 'open'

export type Block =
  | { t: 'sec'; label: string }
  | { t: 'kv'; k: string; v: string; pending?: boolean }
  | { t: 'bar'; k: string; v: string; pct: number }
  | { t: 'row'; date?: string; pill?: { label: string; tone?: Tone }; title: string; quote?: string; pending?: boolean }
  | { t: 'note'; text: string }

export interface SysDetail {
  eyebrow: string
  title: string
  source: string
  blocks: Block[]
}

export interface SysEdge {
  d: string
  tone?: 'default' | 'copper' | 'green'
  flow?: boolean
  arrow?: boolean
}

export interface SysLabel { x: number; y: number; text: string }

// ---------------------------------------------------------------- geometry

export const STAGE_W = 1800
export const STAGE_H = 560

export const SYS_LANES = [
  { x: 0, y: 0, w: 1790, h: 320, label: 'Weekly · you + Claude chat' },
  { x: 0, y: 356, w: 1080, h: 180, label: 'Daily · cron 7pm ET' },
]

export const SYS_NODES: SysNode[] = [
  { id: 'visser',   x: 10,   y: 30,  kind: 'input',  eyebrow: 'Input · L1', title: 'Visser',            sub: '2×/wk · Pomp + solo', history: true },
  { id: 'camillo',  x: 10,   y: 130, kind: 'input',  eyebrow: 'Input · L2', title: 'Camillo',           sub: 'social arbitrage',    history: true },
  { id: 'zastocks', x: 10,   y: 230, kind: 'input',  eyebrow: 'Input · L2', title: 'ZaStocks',          sub: 'Grok task',           history: true },

  { id: 'tagging',  x: 190,  y: 130, kind: 'engine', eyebrow: 'Engine',        title: 'Conviction tagging', sub: 'quote → theme' },
  { id: 'themes',   x: 370,  y: 130, kind: 'engine', eyebrow: 'Engine · L1',   title: 'Theme weights',      sub: 'sleeve history', history: true },
  { id: 'pillars',  x: 550,  y: 130, kind: 'engine', eyebrow: 'Engine · L2',   title: 'Pillar sizing',      sub: 'composite score' },
  { id: 'seats',    x: 730,  y: 130, kind: 'human',  eyebrow: 'Human · L3',    title: 'Seat count',         sub: 'contestedness' },
  { id: 'names',    x: 910,  y: 130, kind: 'engine', eyebrow: 'Engine · L4',   title: 'Name split',         sub: 'Rule B · decay' },
  { id: 'approval', x: 1090, y: 130, kind: 'human',  eyebrow: 'Human gate',    title: 'Approval',           sub: 'nothing auto-builds' },
  { id: 'freeze',   x: 1270, y: 130, kind: 'write',  eyebrow: 'Write',         title: 'Freeze',             sub: 'v3.3-coresat', history: true },
  { id: 'push',     x: 1450, y: 130, kind: 'write',  eyebrow: 'Deploy',        title: 'git push → Vercel',  sub: 'build then ship' },

  { id: 'cron',     x: 10,  y: 400, kind: 'input',  eyebrow: 'Trigger', title: 'GitHub Actions', sub: '7pm ET' },
  { id: 'apis',     x: 190, y: 400, kind: 'input',  eyebrow: 'Data',    title: 'Price + macro',  sub: '5 sources' },
  { id: 'croncjs',  x: 370, y: 400, kind: 'engine', eyebrow: 'Engine',  title: 'daily-cron.cjs', sub: 'RSI · DMA · CPI' },
  { id: 'pnl',      x: 550, y: 400, kind: 'engine', eyebrow: 'Engine',  title: 'P&L drift',      sub: 'drift vs rebal' },
  { id: 'supabase', x: 730, y: 400, kind: 'write',  eyebrow: 'Write',   title: 'Supabase',       sub: '3 tables', history: true },
  { id: 'render',   x: 910, y: 400, kind: 'input',  eyebrow: 'Render',  title: 'Site reads',     sub: 'display-only' },
]

const SPINE = [
  'M160,73 C178,73 176,173 190,173',
  'M160,173 L190,173',
  'M160,273 C178,273 176,177 190,177',
  'M340,173 L370,173',
  'M520,173 L550,173',
  'M700,173 L730,173',
  'M880,173 L910,173',
  'M1060,173 L1090,173',
  'M1240,173 L1270,173',
  'M1420,173 L1450,173',
]

const DAILY = [
  'M160,443 L190,443',
  'M340,443 L370,443',
  'M520,443 L550,443',
  'M700,443 L730,443',
  'M880,443 L910,443',
]

const FREEZE_TO_CRON = 'M1345,216 C1345,320 520,300 445,398'
const SUPABASE_TO_TAB = 'M805,398 C805,320 1500,318 1525,218'

export const SYS_EDGES: SysEdge[] = [
  ...SPINE.map((d) => ({ d, tone: 'copper' as const, flow: true, arrow: true })),
  ...DAILY.map((d) => ({ d, tone: 'copper' as const, flow: true, arrow: true })),
  { d: FREEZE_TO_CRON, tone: 'default', flow: true },
  { d: SUPABASE_TO_TAB, tone: 'green', flow: true },
]

// drawn first, unanimated, at low opacity — gives every wire a static spine
export const SYS_EDGE_TRACKS: string[] = [...SPINE, ...DAILY, FREEZE_TO_CRON, SUPABASE_TO_TAB]

export const SYS_LABELS: SysLabel[] = [
  { x: 380,  y: 166, text: '±4%/wk' },
  { x: 920,  y: 166, text: 'seats' },
  { x: 1100, y: 166, text: 'Rule B λ' },
  { x: 700,  y: 330, text: 'BASE_PORTFOLIO' },
  { x: 1120, y: 316, text: 'history → System tab' },
]

export const RETICLE = { cx: 900, cy: 215, radii: [96, 150, 200, 255] }

// ---------------------------------------------------------------- content

export const SYS_DETAILS: Record<string, SysDetail> = {
  visser: {
    eyebrow: 'Input · Layer 1',
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
      { t: 'row', date: '8/02 · solo', title: 'no theme change' },
      { t: 'row', date: '8/01 · Pomp', title: 'no theme change' },
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
    eyebrow: 'Input · Layer 2',
    title: 'Camillo',
    source: 'name nomination only — cannot move themes',
    blocks: [
      { t: 'sec', label: 'Gating' },
      { t: 'kv', k: 'Status', v: 'display-only as deployed' },
      { t: 'kv', k: 'Target state', v: 'L2 wiring + convergence' },
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
    eyebrow: 'Input · Layer 2',
    title: 'ZaStocks',
    source: 'candidates-to-verify — never auto-seat',
    blocks: [
      { t: 'sec', label: 'Sourcing' },
      { t: 'kv', k: 'Method', v: 'scheduled Grok task' },
      { t: 'kv', k: 'Why not API', v: 'X killed free reads 2/26' },
      { t: 'kv', k: 'Inference risk', v: 'high — chart images' },
      { t: 'sec', label: 'Windows logged' },
      { t: 'row', date: '8/03 – 8/10', title: 'latest ingested' },
      { t: 'row', date: '7/27 – 8/03', title: '' },
      { t: 'row', date: '7/20 – 7/27', title: '' },
      { t: 'row', date: '7/13 – 7/20', title: '' },
      { t: 'note', text: 'Gated tighter than Camillo. A ZaStocks name never seats alone and never trips the voice floor independently.' },
    ],
  },

  tagging: {
    eyebrow: 'Engine',
    title: 'Conviction tagging',
    source: 'quote → theme + score',
    blocks: [
      { t: 'sec', label: 'Rule' },
      { t: 'note', text: 'Exact transcript quotes only. No paraphrase, no inferred stance. A claim without a quote does not tag.' },
      { t: 'sec', label: 'Backfill finding' },
      { t: 'row', title: '8-week backfill proved airtime alone fails', quote: 'chips scored 0 airtime for 8 straight weeks — airtime-only weighting would have deleted ASML. Settled convictions produce ~0 airtime, so a structural backbone is mandatory.' },
      { t: 'sec', label: 'Beneficiary rule' },
      { t: 'note', text: 'Agent / humanoid DEMAND credits Compute, not App.' },
    ],
  },

  themes: {
    eyebrow: 'Engine · Layer 1',
    title: 'Theme weights',
    source: 'theme_engine.py · phase 2: daily_snapshots.portfolio_version',
    blocks: [
      { t: 'sec', label: 'Sleeve history' },
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
    eyebrow: 'Engine · Layer 2',
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
    eyebrow: 'Human gate · Layer 3',
    title: 'Seat count',
    source: 'the one judgment call the engine does not make',
    blocks: [
      { t: 'sec', label: 'Principle' },
      { t: 'note', text: 'Concentration scales with winner-certainty, not cycle stage. Contestedness sets seat count — a human call. Size stays engine output.' },
      { t: 'sec', label: 'Standing rule' },
      { t: 'row', title: 'Fix scores, not weights', quote: 'a discretionary weight override undermines the system. If a weight looks wrong, the score is wrong.' },
      { t: 'sec', label: 'Open seat decision' },
      { t: 'row', pill: { label: 'open', tone: 'open' }, title: 'WDC — cold storage / nearline HDD', quote: 'only uncovered axis in v3.3. WDC+STX >80% share, 2026 output sold out, LTAs through 2027–28. SNDK is watch-not-seat: +570% YTD triggers the full −12 velocity penalty and it rents rather than owns the bottleneck.' },
    ],
  },

  names: {
    eyebrow: 'Engine · Layer 4',
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
    eyebrow: 'Human gate',
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
    eyebrow: 'Write',
    title: 'Freeze',
    source: 'phase 2: system_changelog · PORTFOLIO_VERSION drives P&L drift',
    blocks: [
      { t: 'sec', label: 'Current' },
      { t: 'kv', k: 'Version string', v: '2026-07-15-v3.3-coresat' },
      { t: 'kv', k: 'Names', v: '14' },
      { t: 'sec', label: 'Changelog' },
      { t: 'row', pending: true, pill: { label: 'open', tone: 'open' }, title: 'Memory stage exhausted → working', quote: '×0.60 → ×0.92. Provisionally approved 8/11. Refresh TrendForce contract prices before applying — contract is not spot, and feeding spot into the severity probe produces a false negative.' },
      { t: 'row', date: '8/11', pill: { label: 'data', tone: 'data' }, title: 'Null-DMA coercion patched', quote: 'JS null coerced to 0 produced a fabricated S5 of 52 for SKHY. Three of four patches applied.' },
      { t: 'row', date: '8/11', pill: { label: 'book', tone: 'book' }, title: 'GLDM conviction-proximity carve-out fired', quote: '−2.12% from the 200-DMA, inside the ±3% band' },
      { t: 'row', date: '8/08', pill: { label: 'engine', tone: 'engine' }, title: 'S5 humanoid timeline moved to 2028' },
      { t: 'row', date: '7/15', pill: { label: 'book', tone: 'book' }, title: 'v3.3 core-satellite freeze' },
      { t: 'row', date: '7/13', pill: { label: 'engine', tone: 'engine' }, title: 'AIPO reclassified as power infrastructure', quote: 'roughly 85% power, grid and nuclear — no double-count against ASML, SOXX or GLW' },
      { t: 'row', date: '7/09', pill: { label: 'engine', tone: 'engine' }, title: 'S4 catalyst removed permanently', quote: 'every liquid Kalshi market that could drive S4 is already an axis-2 input; feeding it to S4 double-counts debasement' },
      { t: 'row', date: '7/07', pill: { label: 'engine', tone: 'engine' }, title: 'S1 four-axis architecture deployed' },
      { t: 'row', date: '6/01', pill: { label: 'engine', tone: 'engine' }, title: 'Rule B introduced, lambda 0.814' },
    ],
  },

  push: {
    eyebrow: 'Deploy',
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
    eyebrow: 'Trigger',
    title: 'GitHub Actions',
    source: 'server/daily-cron.cjs',
    blocks: [
      { t: 'kv', k: 'Schedule', v: '7pm ET' },
      { t: 'kv', k: 'Writes', v: 'service-role key' },
      { t: 'note', text: 'The cron never writes podcast_log or system_changelog. Those stay weekly and human-authored.' },
    ],
  },

  apis: {
    eyebrow: 'Data',
    title: 'Price + macro sources',
    source: 'five live, one manual',
    blocks: [
      { t: 'kv', k: 'Twelve Data', v: 'primary price / technicals' },
      { t: 'kv', k: 'Finnhub', v: 'price quotes' },
      { t: 'kv', k: 'Alpha Vantage', v: 'SPY RSI history only' },
      { t: 'kv', k: 'FRED', v: 'CPIAUCNS YoY' },
      { t: 'kv', k: 'Kalshi', v: 'read API, no auth' },
      { t: 'kv', k: 'CME warehouse', v: 'manual weekly', pending: true },
      { t: 'note', text: 'Cleveland Fed nowcast is JS-rendered and not on FRED — displays as an em dash until an endpoint is found.' },
    ],
  },

  croncjs: {
    eyebrow: 'Engine',
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
    eyebrow: 'Engine',
    title: 'P&L drift model',
    source: 'hold-and-drift, not daily rebalance',
    blocks: [
      { t: 'note', text: 'On rebalance days — rescore, version change, or ticker add/drop — positions reset to target. On drift days each position carries forward by its own price move and weights float naturally.' },
      { t: 'sec', label: 'Why' },
      { t: 'row', title: 'The original constant-mix model silently trimmed winners every night, producing a curve incompatible with the book philosophy.' },
    ],
  },

  supabase: {
    eyebrow: 'Write',
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

  render: {
    eyebrow: 'Render',
    title: 'Site reads',
    source: 'frontend never writes',
    blocks: [
      { t: 'note', text: 'Every tab is display-only. No component writes to Supabase and nothing in the UI touches engine weights.' },
      { t: 'sec', label: 'Tabs' },
      { t: 'kv', k: 'Signals · Portfolio · Performance', v: 'live' },
      { t: 'kv', k: 'Trading', v: 'hidden 7/23', pending: true },
      { t: 'kv', k: 'System', v: 'this tab' },
    ],
  },
}
