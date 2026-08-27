#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * backfill_missing_day.cjs   (v2 — supersedes backfill_20260826.cjs)
 * ===========================================================================
 * Reconstructs a single missing daily_snapshots + portfolio_holdings day.
 *
 * WHY v2 EXISTS
 *   v1 built the snapshot row from a hardcoded whitelist of six columns. The
 *   table has twenty. It silently dropped daily_return_pct (blank cell on the
 *   Performance tab) and all four momentum_* fields. That second omission was
 *   dangerous: daily-cron.cjs line ~1645 reads
 *
 *       if (!prev || prev.momentum_value == null) { return { ...START, cum: 0 } }
 *
 *   so a backfilled row with a null momentum_value causes the NEXT cron run to
 *   RESET the momentum sleeve to its starting value and zero its cumulative
 *   return. A gap in the table is safe (the cron looks further back); a row
 *   that exists but is null is NOT. v1 turned a safe gap into a silent
 *   track-record wipe.
 *
 *   v2 therefore classifies EVERY column found on the prior row and HARD FAILS
 *   on any column it does not recognise. Adding a column to daily_snapshots
 *   will break this script loudly instead of nulling the new field quietly.
 *
 * RECONSTRUCTION METHOD
 *   portfolio_holdings.daily_change_pct is Finnhub ((c - pc) / pc) — a ONE-day
 *   move from the prior close. So for a missing day T with neighbours P and N:
 *
 *       close_T(t)  = price_N(t) / (1 + chg_N(t)/100)
 *       move_T(t)   = close_T(t) / close_P(t) - 1
 *       move_T(pf)  = SUM_t [ weight_P(t) * move_T(t) ]
 *
 *   Requires EXACTLY ONE missing session between P and N, or chg_N spans more
 *   than one day and the arithmetic is wrong. Enforced below.
 *
 * SPY
 *   spy prev_close is not persisted (buildMacroSignals stores only
 *   { price, ath, pct_off_ath }), so the missing day's SPY close CANNOT be
 *   derived from the database. It must be supplied. No default, by design —
 *   v1 hardcoded it and that is exactly the kind of thing that rots.
 *
 * MOMENTUM
 *   Carried FLAT across the gap. The sleeve's per-name book is not stored per
 *   day in reconstructable form, so its true move is unrecoverable. Flat-carry
 *   preserves chain continuity and prevents the reset above. This IS a real
 *   (small) distortion and must be recorded in the changelog.
 *
 * USAGE
 *   cd ~/Desktop/alphaplaybook
 *
 *   # dry run — prints column coverage + proposed rows, writes nothing
 *   node backfill_missing_day.cjs --date=2026-08-26 --spx-prev=7677.28 --spx-target=7675.70
 *
 *   # or supply the SPY close directly
 *   node backfill_missing_day.cjs --date=2026-08-26 --spy-close=765.75
 *
 *   # commit
 *   node backfill_missing_day.cjs --date=2026-08-26 --spy-close=765.75 --apply
 *
 * FLAGS
 *   --date=YYYY-MM-DD   required, the missing session
 *   --spy-close=N       SPY closing price on --date
 *   --spx-prev=N        S&P 500 close on the PRIOR session   } alternative to
 *   --spx-target=N      S&P 500 close on --date              } --spy-close
 *   --apply             actually write (default is dry run)
 *   --force-gap         override the one-session-gap guard (holidays)
 */

const fs = require('fs')
const path = require('path')

const STARTING_VALUE = 100000
const MODEL_TOLERANCE_PP = 0.02

// --- column classification -------------------------------------------------
// Every column on the prior daily_snapshots row must appear in exactly one of
// these sets, or the script aborts. This is the guard that v1 lacked.
const SNAP_DB_GENERATED = new Set(['id', 'created_at'])
const SNAP_COMPUTED = new Set([
  'snapshot_date', 'portfolio_value', 'spy_value',
  'daily_return_pct', 'cumulative_return_pct', 'spy_cumulative_return_pct',
])
const SNAP_CARRY_FORWARD = new Set([
  'portfolio_version',
  'momentum_value', 'momentum_cumulative_return_pct', 'momentum_members',
])
const SNAP_CARRY_ZERO = new Set(['momentum_daily_return_pct'])
// Point-in-time reads. Genuinely unreconstructable after the fact. Nulling
// these is safe ONLY because no prevSnapshot read in daily-cron.cjs touches
// them — verified 2026-08-27 against lines 1256 / 1265 / 1285 / 1636.
const SNAP_NULLABLE = new Set([
  'spy_rsi', 'rsi_signal', 'polymarket_signals', 'narrative_signals',
  'bullish_assets', 'portfolio', 'macro_signals', 'technicals',
])

const HOLD_DB_GENERATED = new Set(['id', 'created_at'])
const HOLD_COMPUTED = new Set([
  'snapshot_date', 'ticker', 'weight_pct', 'price', 'market_value', 'daily_change_pct',
])
const HOLD_CARRY_FORWARD = new Set(['shares', 'signal_sources'])
const HOLD_NULLABLE = new Set([])

// --- args ------------------------------------------------------------------
function arg(name) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : null
}
const FLAG = (name) => process.argv.includes(`--${name}`)

const TARGET = arg('date')
const APPLY = FLAG('apply')
const FORCE_GAP = FLAG('force-gap')
const SPY_CLOSE_IN = arg('spy-close') ? Number(arg('spy-close')) : null
const SPX_PREV = arg('spx-prev') ? Number(arg('spx-prev')) : null
const SPX_TARGET = arg('spx-target') ? Number(arg('spx-target')) : null

function die(msg) {
  console.error(`\nABORT: ${msg}`)
  process.exit(1)
}

if (!TARGET || !/^\d{4}-\d{2}-\d{2}$/.test(TARGET)) {
  die('--date=YYYY-MM-DD is required.')
}
if (SPY_CLOSE_IN === null && (SPX_PREV === null || SPX_TARGET === null)) {
  die('supply either --spy-close=N, or both --spx-prev=N and --spx-target=N. No default: the SPY close for the missing day cannot be derived from the database.')
}

// --- env -------------------------------------------------------------------
function loadEnv(p) {
  const out = {}
  if (!fs.existsSync(p)) return out
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 0) continue
    let v = t.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    out[t.slice(0, i).trim()] = v
  }
  return out
}
const env = { ...loadEnv(path.join(process.cwd(), '.env.local')), ...process.env }
const URL_ = env.VITE_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_KEY
if (!URL_ || !KEY) die('VITE_SUPABASE_URL / SUPABASE_SERVICE_KEY not found in .env.local')

const HEADERS = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }

async function sbGet(table, qs) {
  const res = await fetch(`${URL_}/rest/v1/${table}?${qs}`, { headers: HEADERS })
  if (!res.ok) throw new Error(`GET ${table} -> ${res.status} ${await res.text()}`)
  return res.json()
}
async function sbInsert(table, rows) {
  const res = await fetch(`${URL_}/rest/v1/${table}`, {
    method: 'POST', headers: { ...HEADERS, Prefer: 'return=representation' }, body: JSON.stringify(rows),
  })
  if (!res.ok) throw new Error(`POST ${table} -> ${res.status} ${await res.text()}`)
  return res.json()
}

const r2 = (x) => Math.round(x * 100) / 100
const pad = (s, n) => String(s).padEnd(n)
const lpad = (s, n) => String(s).padStart(n)

function businessDaysBetween(a, b) {
  // strictly between, weekends excluded; holidays NOT known
  const out = []
  const d = new Date(`${a}T00:00:00Z`)
  const end = new Date(`${b}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  while (d < end) {
    const wd = d.getUTCDay()
    if (wd !== 0 && wd !== 6) out.push(d.toISOString().slice(0, 10))
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return out
}

function classify(keys, sets, label) {
  const report = []
  const unknown = []
  for (const k of keys.slice().sort()) {
    let disp = null
    for (const [name, set] of sets) if (set.has(k)) { disp = name; break }
    if (!disp) unknown.push(k)
    report.push([k, disp || 'UNCLASSIFIED'])
  }
  console.log(`\nCOLUMN COVERAGE — ${label} (${keys.length} columns)`)
  for (const [k, d] of report) {
    const mark = d === 'UNCLASSIFIED' ? ' <-- ' : '     '
    console.log(`  ${pad(k, 32)}${mark}${d}`)
  }
  if (unknown.length) {
    die(`${label}: ${unknown.length} unclassified column(s): ${unknown.join(', ')}\n` +
        `  The schema changed. Decide the disposition for each and add it to the\n` +
        `  appropriate set at the top of this file. Refusing to write a row that\n` +
        `  would leave an unreviewed column null — that is the v1 bug.`)
  }
}

// --- main ------------------------------------------------------------------
async function main() {
  console.log('='.repeat(78))
  console.log(`BACKFILL ${TARGET}   ${APPLY ? 'APPLY (will write)' : 'DRY RUN (no writes)'}`)
  console.log('='.repeat(78))

  // 1. target must be absent
  const exSnap = await sbGet('daily_snapshots', `snapshot_date=eq.${TARGET}&select=snapshot_date`)
  const exHold = await sbGet('portfolio_holdings', `snapshot_date=eq.${TARGET}&select=ticker`)
  if (exSnap.length || exHold.length) {
    die(`${TARGET} already present (snapshots=${exSnap.length}, holdings=${exHold.length}). Nothing written.`)
  }

  // 2. neighbours
  const [prev] = await sbGet('daily_snapshots', `snapshot_date=lt.${TARGET}&select=*&order=snapshot_date.desc&limit=1`)
  const [next] = await sbGet('daily_snapshots', `snapshot_date=gt.${TARGET}&select=*&order=snapshot_date.asc&limit=1`)
  if (!prev) die(`no snapshot before ${TARGET}`)
  if (!next) die(`no snapshot after ${TARGET} — the reconstruction needs the following day's c/pc quotes`)
  const P = prev.snapshot_date, N = next.snapshot_date
  console.log(`\nNeighbours: prior ${P}  ->  missing ${TARGET}  ->  next ${N}`)

  // 3. exactly one missing session
  const gap = businessDaysBetween(P, N)
  if (gap.length !== 1 || gap[0] !== TARGET) {
    const msg = `expected exactly one business day between ${P} and ${N}; found ${gap.length}: ${gap.join(', ')}.\n` +
      `  If chg_${N} spans more than one missing session the arithmetic is invalid.\n` +
      `  If the extra days are market holidays, re-run with --force-gap.`
    if (!FORCE_GAP) die(msg)
    console.warn(`\nWARNING (--force-gap): ${msg}`)
  } else {
    console.log(`Gap OK: exactly one missing session.`)
  }

  // 4. column coverage — before any arithmetic
  classify(Object.keys(prev), [
    ['db-generated (omit)', SNAP_DB_GENERATED],
    ['computed', SNAP_COMPUTED],
    ['carry forward', SNAP_CARRY_FORWARD],
    ['carry as 0', SNAP_CARRY_ZERO],
    ['null (point-in-time)', SNAP_NULLABLE],
  ], 'daily_snapshots')

  const holdP = await sbGet('portfolio_holdings', `snapshot_date=eq.${P}&select=*&order=ticker.asc`)
  const holdN = await sbGet('portfolio_holdings', `snapshot_date=eq.${N}&select=*&order=ticker.asc`)
  if (!holdP.length) die(`no holdings on ${P}`)
  if (!holdN.length) die(`no holdings on ${N}`)
  classify(Object.keys(holdP[0]), [
    ['db-generated (omit)', HOLD_DB_GENERATED],
    ['computed', HOLD_COMPUTED],
    ['carry forward', HOLD_CARRY_FORWARD],
    ['null', HOLD_NULLABLE],
  ], 'portfolio_holdings')

  // 5. ticker sets
  const byP = Object.fromEntries(holdP.map((h) => [h.ticker, h]))
  const byN = Object.fromEntries(holdN.map((h) => [h.ticker, h]))
  const tP = Object.keys(byP).sort(), tN = Object.keys(byN).sort()
  if (tP.join(',') !== tN.join(',')) {
    die(`ticker sets differ.\n  ${P}: ${tP.join(' ')}\n  ${N}: ${tN.join(' ')}\n  A rebalance inside the gap invalidates this reconstruction.`)
  }
  console.log(`\nTicker set OK: ${tP.length} names, identical across ${P} and ${N}.`)

  // 6. model check — proves daily_change_pct is a clean one-day c/pc move
  const chainActual = (next.portfolio_value / prev.portfolio_value - 1) * 100
  const chainModel = tP.reduce((s, t) => s + (byP[t].weight_pct * byN[t].daily_change_pct) / 100, 0)
  const drift = Math.abs(chainModel - chainActual)
  console.log(`\nModel check: stored chain ${chainActual.toFixed(4)}%  vs  sum(w_${P} * chg_${N}) ${chainModel.toFixed(4)}%  (drift ${drift.toFixed(4)}pp)`)
  if (drift > MODEL_TOLERANCE_PP) {
    die(`model drift ${drift.toFixed(4)}pp > ${MODEL_TOLERANCE_PP}pp — daily_change_pct is not a clean one-day c/pc move here. Do not write.`)
  }
  console.log('Model check OK.')

  // 7. reconstruct
  const rows = []
  let pfMove = 0
  for (const t of tP) {
    const a = byP[t], b = byN[t]
    const closeT = b.price / (1 + b.daily_change_pct / 100)
    const move = (closeT / a.price - 1) * 100
    const contrib = (a.weight_pct * move) / 100
    pfMove += contrib
    rows.push({ ticker: t, wP: a.weight_pct, pxP: a.price, closeT, move, contrib, prevRow: a })
  }

  const pv = r2(prev.portfolio_value * (1 + pfMove / 100))
  const cum = r2(((pv - STARTING_VALUE) / STARTING_VALUE) * 100)
  const dailyRet = r2(pfMove)

  const spyRatio = SPY_CLOSE_IN !== null ? SPY_CLOSE_IN / prev.spy_value : SPX_TARGET / SPX_PREV
  const spy = r2(prev.spy_value * spyRatio)
  const spyCum = r2(((1 + prev.spy_cumulative_return_pct / 100) * spyRatio - 1) * 100)
  const spySrc = SPY_CLOSE_IN !== null ? `--spy-close=${SPY_CLOSE_IN}` : `SPX ${SPX_TARGET}/${SPX_PREV}`

  // 8. print
  console.log(`\n${pad('TICKER', 8)}${lpad(`WT ${P}`, 12)}${lpad('CLOSE prior', 13)}${lpad('CLOSE tgt', 13)}${lpad('MOVE', 11)}${lpad('CONTRIB', 11)}`)
  console.log('-'.repeat(68))
  for (const r of rows.slice().sort((x, y) => x.contrib - y.contrib)) {
    console.log(pad(r.ticker, 8) + lpad(r.wP.toFixed(2), 12) + lpad(r.pxP.toFixed(2), 13) +
      lpad(r.closeT.toFixed(4), 13) + lpad(`${r.move >= 0 ? '+' : ''}${r.move.toFixed(3)}%`, 11) +
      lpad(`${r.contrib >= 0 ? '+' : ''}${(r.contrib * 100).toFixed(1)}bp`, 11))
  }
  console.log('-'.repeat(68))
  console.log(pad('TOTAL', 8) + lpad(rows.reduce((s, r) => s + r.wP, 0).toFixed(2), 12) + lpad('', 26) +
    lpad(`${pfMove >= 0 ? '+' : ''}${pfMove.toFixed(3)}%`, 11) + lpad(`${(pfMove * 100).toFixed(1)}bp`, 11))

  // 9. build snapshot row from the FULL prior key set
  const snapRow = {}
  for (const k of Object.keys(prev)) {
    if (SNAP_DB_GENERATED.has(k)) continue
    if (SNAP_CARRY_FORWARD.has(k)) { snapRow[k] = prev[k]; continue }
    if (SNAP_CARRY_ZERO.has(k)) { snapRow[k] = 0; continue }
    if (SNAP_NULLABLE.has(k)) { snapRow[k] = null; continue }
  }
  snapRow.snapshot_date = TARGET
  snapRow.portfolio_value = pv
  snapRow.spy_value = spy
  snapRow.daily_return_pct = dailyRet
  snapRow.cumulative_return_pct = cum
  snapRow.spy_cumulative_return_pct = spyCum

  const missing = Object.keys(prev).filter((k) => !SNAP_DB_GENERATED.has(k) && !(k in snapRow))
  if (missing.length) die(`internal: ${missing.join(', ')} classified but not written`)

  console.log(`\nPROPOSED daily_snapshots ROW`)
  for (const k of Object.keys(snapRow).sort()) {
    const v = snapRow[k]
    const tag = SNAP_CARRY_FORWARD.has(k) ? '  (carried)' : SNAP_CARRY_ZERO.has(k) ? '  (flat)' : SNAP_NULLABLE.has(k) ? '  (null: point-in-time)' : ''
    console.log(`  ${pad(k, 32)}${pad(JSON.stringify(v), 26)}${tag}`)
  }
  console.log(`  spy source: ${spySrc}`)
  console.log(`  alpha vs SPY: ${(cum - spyCum).toFixed(2)}%`)

  // 10. holdings rows from the FULL prior key set
  const pfFactor = 1 + pfMove / 100
  const holdRows = rows.map((r) => {
    const row = {}
    for (const k of Object.keys(r.prevRow)) {
      if (HOLD_DB_GENERATED.has(k)) continue
      if (HOLD_CARRY_FORWARD.has(k)) { row[k] = r.prevRow[k]; continue }
      if (HOLD_NULLABLE.has(k)) { row[k] = null; continue }
    }
    const w = r2((r.wP * (1 + r.move / 100)) / pfFactor)
    row.snapshot_date = TARGET
    row.ticker = r.ticker
    row.weight_pct = w
    row.price = r2(r.closeT)
    row.market_value = r2((w / 100) * pv)
    row.daily_change_pct = r2(r.move)
    return row
  })
  const wSum = holdRows.reduce((s, h) => s + h.weight_pct, 0)
  console.log(`\nPROPOSED portfolio_holdings: ${holdRows.length} rows, weight_pct sums to ${wSum.toFixed(2)}`)
  for (const h of holdRows) {
    console.log(`  ${pad(h.ticker, 7)}${lpad(h.weight_pct.toFixed(2), 7)}%${lpad(h.price.toFixed(2), 12)}${lpad(h.market_value.toFixed(2), 12)}${lpad(`${h.daily_change_pct >= 0 ? '+' : ''}${h.daily_change_pct.toFixed(2)}%`, 10)}`)
  }

  console.log(`\nMOMENTUM: carried flat (value ${snapRow.momentum_value}, cum ${snapRow.momentum_cumulative_return_pct}%, daily 0).`)
  console.log(`  Its true ${TARGET} move is unrecoverable. Flat-carry is a real distortion —`)
  console.log(`  record it in the changelog. It also prevents daily-cron.cjs from taking the`)
  console.log(`  'momentum_value == null' branch and resetting the sleeve to zero.`)

  if (!APPLY) {
    console.log(`\nDRY RUN — nothing written. Re-run with --apply.`)
    return
  }

  console.log(`\nInserting daily_snapshots...`)
  await sbInsert('daily_snapshots', [snapRow])
  console.log(`Inserting portfolio_holdings (${holdRows.length})...`)
  await sbInsert('portfolio_holdings', holdRows)

  const verify = await sbGet('daily_snapshots', `snapshot_date=gte.${P}&select=snapshot_date,portfolio_value,daily_return_pct,cumulative_return_pct,spy_value,spy_cumulative_return_pct,momentum_value,momentum_cumulative_return_pct&order=snapshot_date.asc`)
  console.log(`\nVERIFY:`)
  for (const v of verify) {
    console.log(`  ${v.snapshot_date}  pf ${lpad(v.portfolio_value, 10)}  day ${lpad(v.daily_return_pct, 6)}%  cum ${lpad(v.cumulative_return_pct, 6)}%  spy ${lpad(v.spy_value, 7)} ${lpad(v.spy_cumulative_return_pct, 5)}%  mom ${lpad(v.momentum_value, 9)} ${lpad(v.momentum_cumulative_return_pct, 6)}%`)
  }
  console.log(`\nDone. Confirm momentum_cumulative_return_pct is unchanged across the gap.`)
}

main().catch((e) => { console.error(`\nFATAL: ${e.message}`); process.exit(1) })
