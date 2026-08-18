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
export type FileStatus = 'live' | 'stale' | 'modified' | 'orphan' | 'untracked' | 'unverified' | 'proposed'

export interface SysFile {
  path: string
  role: string
  status: FileStatus
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
  { id: 'freeze',   x: 732, y: 106, kind: 'write',  ref: 'C2 · WRITE',    title: 'Freeze',         sub: 'v3.3-coresat',         history: true },
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
const F_THEME: SysFile    = { path: 'theme_engine.py',           role: 'L1 theme weights + ±4%/wk limiter',          status: 'untracked' }
const F_CRON: SysFile     = { path: 'server/daily-cron.cjs',     role: 'nightly orchestrator',                       status: 'live' }
const F_RECAP: SysFile    = { path: 'src/components/SignalRecap.tsx', role: 'renders the three voice cards',         status: 'live' }
const F_VOICES: SysFile   = { path: 'src/data/voiceCards.ts',    role: 'weekly card content — one-file edit',        status: 'live' }
const F_WEEKLY: SysFile   = { path: 'Weekly_Workflow.md',        role: 'the §1–§8 weekly run order',                 status: 'live' }
const F_PULL: SysFile     = { path: 'pull_candidates.cjs',       role: 'candidate technicals pull — uncommitted edits, git diff first', status: 'modified' }

export const SYS_DETAILS: Record<string, SysDetail> = {
  engine: {
    eyebrow: 'B · Sealed assembly',
    title: 'Engine',
    source: 'voices in → 14 weighted positions out',
    parts: ['tagging', 'themes', 'pillars', 'seats', 'names'],
    blocks: [
      { t: 'sec', label: 'Assembly' },
      { t: 'kv', k: 'Parts', v: '5' },
      { t: 'kv', k: 'Human calls', v: '1 — B4 seat count' },
      { t: 'kv', k: 'Layers', v: 'L1 → L4' },
      { t: 'note', text: 'Seat count sits inside the assembly but the engine does not perform it. Contestedness is a human call; the engine only sizes what you seat.' },
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
    eyebrow: 'B2 · Engine, Layer 1',
    title: 'Theme weights',
    source: 'theme_engine.py · phase 2: daily_snapshots.portfolio_version',
    parent: 'engine',
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
    files: [
      F_THEME,
      { path: 'src/components/SignalRadar.tsx', role: 'theme radar — Dashboard does not import it; check before trusting', status: 'unverified' },
      { path: 'src/components/Portfolio.tsx', role: 'renders the resulting holdings table', status: 'live' },
    ],
  },

  pillars: {
    eyebrow: 'B3 · Engine, Layer 2',
    title: 'Pillar sizing',
    source: 'signal_engine.py + signal_model_config.json',
    parent: 'engine',
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
    files: [
      F_ENGINE, F_CONFIG,
      { path: 'Signal_Engine_Reference.md', role: 'spec — not updated to drop S4', status: 'stale' },
      { path: 'S1_Four_Axis_Spec.md', role: 'spec — still carries the removed S4 · 0.15', status: 'stale' },
    ],
  },

  seats: {
    eyebrow: 'B4 · Human call',
    title: 'Seat count',
    source: 'the one step in the assembly the engine does not perform',
    parent: 'engine',
    blocks: [
      { t: 'sec', label: 'Principle' },
      { t: 'note', text: 'Concentration scales with winner-certainty, not cycle stage. Contestedness sets seat count — a human call. Size stays engine output.' },
      { t: 'sec', label: 'Standing rule' },
      { t: 'row', title: 'Fix scores, not weights', quote: 'a discretionary weight override undermines the system. If a weight looks wrong, the score is wrong.' },
      { t: 'sec', label: 'Open decision' },
      { t: 'row', pill: 'open', tone: 'open', title: 'WDC — cold storage / nearline HDD', quote: 'only uncovered axis in v3.3. WDC+STX above 80% share, 2026 output sold out, LTAs through 2027–28. SNDK is watch-not-seat: +570% YTD triggers the full velocity penalty and it rents rather than owns the bottleneck.' },
    ],
    files: [
      F_WEEKLY,
      { path: 'Weekly_Workflow_v2.docx', role: 'revised run order — not yet promoted', status: 'untracked' },
    ],
  },

  names: {
    eyebrow: 'B5 · Engine, Layer 4',
    title: 'Name split',
    source: 'coverage discount and stage decay',
    parent: 'engine',
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
    files: [
      F_ENGINE, F_PULL,
      { path: 'rescore_current_v3.py', role: 'orphaned since 7/6 — not the live engine, do not run', status: 'orphan' },
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
      { path: 'src/components/Methodology.tsx', role: 'public-facing — line 43 still lists S4 w:15', status: 'stale' },
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
      { path: 'system_changelog', role: 'Supabase table — phase 2', status: 'proposed' },
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
      { path: '.github/workflows/', role: 'the schedule definition — path not yet confirmed', status: 'unverified' },
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
