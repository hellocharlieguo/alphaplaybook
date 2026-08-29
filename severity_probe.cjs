#!/usr/bin/env node
/**
 * severity_probe.cjs — measures bottleneck SEVERITY (0..1) per compute pillar.
 * Feeds the two-lens theme-engine backbone: backbone = severity x stage-binding (no vol).
 *
 * SEVERITY SOURCES (per pillar):
 *   Memory       -> EARNINGS-driven. Memory MAKERS' gross-margin level + trend (supply
 *                   tightness: Micron GM ~15% in a glut, ~50% in a shortage) PLUS AI-memory
 *                   DEMAND names' revenue growth (how hard they're pulling memory). 0.7 supply
 *                   / 0.3 demand. This is the "quarterly earnings for MU/SKHY + AI names" ask.
 *   Chips (ASML) -> ASML revenue-growth + GM stability as a BACKLOG PROXY (true net-bookings
 *                   is a non-GAAP operational number -> manual override field if you want it).
 *   Copper       -> price momentum (COPX proxy) + CFTC CoT managed-money net percentile.
 *   Power        -> HAND-SET (no clean free feed; grid interconnection queues are the real
 *                   signal but unparseable). Revisit quarterly.
 *   Interconnect -> HAND-SET (transceiver ASPs are private); the transcript tagger's
 *                   "optics stretched" caution is the live signal instead.
 *
 * Reads .env.local directly (no dotenv), matching pull_candidates.cjs. Node v24 / .cjs.
 * Outputs severity_scores.json for theme_engine.py to consume. Degrades gracefully:
 * any failed pull -> that pillar keeps its hand-set fallback + a "stale" flag.
 */
const fs = require('fs');
const path = require('path');

// ---------- config ----------
const MEMORY_MAKERS = ['MU', 'SKHY'];        // supply side: their margins = shortage tightness
const MEMORY_DEMAND = ['NVDA', 'AVGO'];      // AI names pulling memory: revenue growth = demand pull
const CHIPS_NAME    = 'ASML';                // backlog proxy via revenue growth
const COPPER_PROXY  = 'COPX';                // price momentum proxy
// hand-set fallbacks (also the value used for pillars with no feed)
const HAND_SET = { power: 0.90, interconnect: 0.60 };
const FALLBACK = { memory: 0.85, chips: 0.85, copper: 0.55 };

// ---------- env ----------
function loadEnv() {
  const p = path.join(process.cwd(), '.env.local');
  const env = {};
  try {
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch (e) { console.warn('  [warn] no .env.local found — pulls will fail to fallback'); }
  return env;
}
const ENV = loadEnv();
const FINNHUB = Object.keys(ENV).find(k => /FINNHUB/.test(k));
const FINNHUB_KEY = FINNHUB ? ENV[FINNHUB] : null;
const TD = Object.keys(ENV).find(k => /TWELVE/.test(k));
const TD_KEY = TD ? ENV[TD] : null;

async function getJSON(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'AlphaPlaybook severity_probe' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ---------- scoring helpers (pure, unit-testable) ----------
const clamp01 = x => Math.max(0, Math.min(1, x));
// memory-maker gross margin -> tightness. 15% glut -> 0, 50% shortage -> 1
const marginLevelScore = gmPct => clamp01((gmPct - 15) / (50 - 15));
// trend: rising margin confirms tightening
const trendScore = (cur, prev) => cur > prev + 1 ? 1.0 : cur < prev - 1 ? 0.0 : 0.5;
// revenue YoY growth -> demand pull. 0% -> 0.3 floor, 60%+ -> 1.0
const revGrowthScore = yoyPct => clamp01(0.3 + (yoyPct / 60) * 0.7);
// percentile passthrough (0..100 -> 0..1)
const pctToScore = p => clamp01(p / 100);

// ---------- Finnhub financial metrics ----------
async function finnhubMetric(sym) {
  if (!FINNHUB_KEY) throw new Error('no Finnhub key');
  const d = await getJSON(`https://finnhub.io/api/v1/stock/metric?symbol=${sym}&metric=all&token=${FINNHUB_KEY}`);
  const m = d.metric || {};
  // gross margin: prefer quarterly series, fall back to TTM
  const series = (d.series && d.series.quarterly && d.series.quarterly.grossMargin) || [];
  const gmSeries = series.map(x => x.v).filter(v => typeof v === 'number');
  const gmNow = gmSeries.length ? gmSeries[0] * (gmSeries[0] < 1.5 ? 100 : 1) : (m.grossMarginTTM ?? null);
  const gmPrev = gmSeries.length > 1 ? gmSeries[1] * (gmSeries[1] < 1.5 ? 100 : 1) : null;
  const revYoY = m.revenueGrowthTTMYoy ?? m['revenueGrowthQuarterlyYoy'] ?? null;
  return { gmNow, gmPrev, revYoY };
}

// ---------- pillar computations ----------
async function memorySeverity() {
  const notes = [];
  // supply: makers' margins
  let supplyScores = [];
  for (const sym of MEMORY_MAKERS) {
    try {
      const { gmNow, gmPrev } = await finnhubMetric(sym);
      if (gmNow == null) { notes.push(`${sym}: no GM`); continue; }
      const lvl = marginLevelScore(gmNow);
      const trd = gmPrev != null ? trendScore(gmNow, gmPrev) : 0.5;
      const s = 0.7 * lvl + 0.3 * trd;
      supplyScores.push(s);
      notes.push(`${sym} GM ${gmNow.toFixed(0)}% (prev ${gmPrev?.toFixed(0) ?? '—'}) -> ${s.toFixed(2)}`);
    } catch (e) { notes.push(`${sym}: ${e.message}`); }
  }
  // demand: AI names revenue growth
  let demandScores = [];
  for (const sym of MEMORY_DEMAND) {
    try {
      const { revYoY } = await finnhubMetric(sym);
      if (revYoY == null) { notes.push(`${sym}: no rev`); continue; }
      const s = revGrowthScore(revYoY);
      demandScores.push(s);
      notes.push(`${sym} revYoY ${revYoY.toFixed(0)}% -> ${s.toFixed(2)}`);
    } catch (e) { notes.push(`${sym}: ${e.message}`); }
  }
  if (!supplyScores.length && !demandScores.length)
    return { score: FALLBACK.memory, stale: true, notes: ['all memory pulls failed -> fallback'] };
  const supply = supplyScores.length ? supplyScores.reduce((a, b) => a + b) / supplyScores.length : FALLBACK.memory;
  const demand = demandScores.length ? demandScores.reduce((a, b) => a + b) / demandScores.length : 0.6;
  const score = clamp01(0.7 * supply + 0.3 * demand);
  return { score, stale: !supplyScores.length, notes };
}

async function chipsSeverity() {
  try {
    const { revYoY, gmNow } = await finnhubMetric(CHIPS_NAME);
    if (revYoY == null) return { score: FALLBACK.chips, stale: true, notes: ['ASML no rev -> fallback'] };
    // ASML: monopoly GM is stable ~50%, so revenue growth is the demand/backlog tell
    const score = clamp01(0.5 + revGrowthScore(revYoY) * 0.5); // floor high (monopoly always binds)
    return { score, stale: false, notes: [`ASML revYoY ${revYoY.toFixed(0)}% GM ${gmNow?.toFixed(0) ?? '—'}% -> ${score.toFixed(2)} (backlog proxy; manual net-bookings override optional)`] };
  } catch (e) { return { score: FALLBACK.chips, stale: true, notes: [`ASML: ${e.message} -> fallback`] }; }
}

async function copperSeverity() {
  const notes = [];
  let momScore = null, cotScore = null;
  // price momentum via COPX 3-month change (Twelve Data)
  if (TD_KEY) {
    try {
      const d = await getJSON(`https://api.twelvedata.com/time_series?symbol=${COPPER_PROXY}&interval=1day&outputsize=70&apikey=${TD_KEY}`);
      const vals = (d.values || []).map(v => parseFloat(v.close)).filter(Number.isFinite);
      if (vals.length > 60) {
        const chg = (vals[0] - vals[60]) / vals[60]; // newest first
        momScore = clamp01(0.5 + chg * 3); // +17% 3mo -> 1.0
        notes.push(`COPX 3mo ${(chg * 100).toFixed(1)}% -> mom ${momScore.toFixed(2)}`);
      }
    } catch (e) { notes.push(`COPX: ${e.message}`); }
  }
  // CFTC CoT managed-money net percentile (Socrata, no key) — copper COMEX 085692
  try {
    const d = await getJSON('https://publicreporting.cftc.gov/resource/6dca-aqww.json?cftc_contract_market_code=085692&$order=report_date_as_yyyy_mm_dd DESC&$limit=52');
    const nets = d.map(r => (+r.m_money_positions_long_all || 0) - (+r.m_money_positions_short_all || 0));
    if (nets.length > 10) {
      const cur = nets[0], min = Math.min(...nets), max = Math.max(...nets);
      const pct = max > min ? ((cur - min) / (max - min)) * 100 : 50;
      cotScore = pctToScore(pct);
      notes.push(`CoT net percentile ${pct.toFixed(0)} -> ${cotScore.toFixed(2)}`);
    }
  } catch (e) { notes.push(`CoT: ${e.message}`); }
  const parts = [momScore, cotScore].filter(x => x != null);
  if (!parts.length) return { score: FALLBACK.copper, stale: true, notes: ['copper pulls failed -> fallback'] };
  return { score: clamp01(parts.reduce((a, b) => a + b) / parts.length), stale: parts.length < 2, notes };
}

// ---------- main ----------
(async () => {
  console.log('severity_probe — measuring pillar bottleneck severity\n');
  const [mem, chips, cop] = await Promise.all([memorySeverity(), chipsSeverity(), copperSeverity()]);
  const out = {
    as_of: new Date().toISOString().slice(0, 10),
    severity: {
      power: HAND_SET.power,
      chips: round2(chips.score),
      memory: round2(mem.score),
      interconnect: HAND_SET.interconnect,
      copper: round2(cop.score),
    },
    provenance: {
      power: { source: 'hand-set', note: 'no clean feed; grid queues unparseable' },
      chips: { source: chips.stale ? 'fallback' : 'ASML earnings', notes: chips.notes },
      memory: { source: mem.stale ? 'fallback' : 'maker margins + AI-name revenue', notes: mem.notes },
      interconnect: { source: 'hand-set', note: 'transcript tagger caution is the live signal' },
      copper: { source: cop.stale ? 'partial/fallback' : 'COPX momentum + CoT', notes: cop.notes },
    },
  };
  fs.writeFileSync('severity_scores.json', JSON.stringify(out, null, 2));
  console.log('SEVERITY:');
  for (const [k, v] of Object.entries(out.severity)) {
    const p = out.provenance[k];
    console.log(`  ${k.padEnd(13)} ${v.toFixed(2)}  [${p.source}]`);
    (p.notes || []).forEach(n => console.log(`       ${n}`));
  }
  console.log('\nwrote severity_scores.json');
})().catch(e => { console.error('FATAL', e); process.exit(1); });

function round2(x) { return Math.round(x * 100) / 100; }
