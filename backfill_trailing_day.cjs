#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * backfill_trailing_day.cjs
 * ===========================================================================
 * Writes the MOST RECENT missing session directly from Finnhub /quote, for the
 * case where the cron missed the last trading day and the next session has not
 * yet opened.
 *
 * WHY THIS EXISTS ALONGSIDE backfill_missing_day.cjs
 *   backfill_missing_day.cjs reconstructs an INTERIOR gap — it needs the
 *   following session's c/pc to derive the missing day's closes. On the
 *   trailing edge there is no following session, so it aborts.
 *
 *   But between the close of session T and the open of session T+1, Finnhub
 *   /quote returns c = T's close and pc = T-1's close. That is not a
 *   reconstruction; it is the real print. This script uses it.
 *
 *   Verified 2026-08-29: for all 12 holdings + SPY, Finnhub pc matched the
 *   stored 2026-08-27 price to 0.0000 and every quote timestamp read
 *   2026-08-28 16:00:00 ET.
 *
 * WHY NOT JUST RUN THE CRON
 *   daily-cron.cjs has a weekend guard (~L1861). Its comment is correct: on a
 *   weekend run there is normally no new close, so the P&L pipeline would
 *   re-apply the prior trading day's move and compound the cumulative wrongly
 *   (the Jun 6 Saturday incident). That reasoning assumes the prior session was
 *   already recorded. It is not a bug and must not be removed. This script is
 *   the sanctioned way around it for recovery.
 *
 * HARD PRECONDITIONS (all abort on failure)
 *   1. TARGET absent from both tables.
 *   2. TARGET is a weekday.
 *   3. TARGET is the FIRST business day after the latest stored snapshot —
 *      i.e. exactly one missing session. dp is a one-day move; a wider gap
 *      would silently drop sessions.
 *   4. No snapshot exists after TARGET.
 *   5. Finnhub pc == stored prior price for EVERY ticker (tol 0.011).
 *      This is the proof that c is TARGET's close and not something else.
 *   6. Every quote timestamp falls on TARGET in ET.
 *   7. Every column on the prior row is classified (see sets below).
 *
 * MOMENTUM
 *   Carried FLAT. The sleeve's per-name book is not reconstructable here. A
 *   null momentum_value would make the next cron run take the
 *   `prev.momentum_value == null` branch and RESET the sleeve to its starting
 *   value with cumulative 0. Flat-carry is a real distortion — record it.
 *
 * USAGE
 *   cd ~/Desktop/alphaplaybook
 *   node backfill_trailing_day.cjs --date=2026-08-28            # dry run
 *   node backfill_trailing_day.cjs --date=2026-08-28 --apply
 *
 * MUST RUN BEFORE the next scheduled cron, or that run chains off the older
 * snapshot and TARGET's move is lost permanently.
 */

const fs = require('fs')
const path = require('path')

const STARTING_VALUE = 100000
const PC_TOLERANCE = 0.011

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

function arg(n) {
  const h = process.argv.find((a) => a.startsWith(`--${n}=`))
  return h ? h.slice(n.length + 3) : null
}
const TARGET = arg('date')
const APPLY = process.argv.includes('--apply')

function die(m) { console.error(`\nABORT: ${m}`); process.exit(1) }
if (!TARGET || !/^\d{4}-\d{2}-\d{2}$/.test(TARGET)) die('--date=YYYY-MM-DD is required.')

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
const FH = env.FINNHUB_API_KEY
if (!URL_ || !KEY) die('VITE_SUPABASE_URL / SUPABASE_SERVICE_KEY not found in .env.local')
if (!FH) die('FINNHUB_API_KEY not found in .env.local')

const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }
async function sbGet(t, q) {
  const r = await fetch(`${URL_}/rest/v1/${t}?${q}`, { headers: H })
  if (!r.ok) throw new Error(`GET ${t} -> ${r.status} ${await r.text()}`)
  return r.json()
}
async function sbInsert(t, rows) {
  const r = await fetch(`${URL_}/rest/v1/${t}`, { method: 'POST', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(rows) })
  if (!r.ok) throw new Error(`POST ${t} -> ${r.status} ${await r.text()}`)
  return r.json()
}

const r2 = (x) => Math.round(x * 100) / 100
const pad = (s, n) => String(s).padEnd(n)
const lp = (s, n) => String(s).padStart(n)
const etDate = (ts) => new Date(ts * 1000).toLocaleDateString('en-CA', { timeZone: 'America/New_York' })

function firstBusinessDayAfter(d) {
  const x = new Date(`${d}T00:00:00Z`)
  do { x.setUTCDate(x.getUTCDate() + 1) } while (x.getUTCDay() === 0 || x.getUTCDay() === 6)
  return x.toISOString().slice(0, 10)
}

function classify(keys, sets, label) {
  const unknown = []
  console.log(`\nCOLUMN COVERAGE — ${label} (${keys.length} columns)`)
  for (const k of keys.slice().sort()) {
    let d = null
    for (const [n, s] of sets) if (s.has(k)) { d = n; break }
    if (!d) unknown.push(k)
    console.log(`  ${pad(k, 32)}${d ? '     ' : ' <-- '}${d || 'UNCLASSIFIED'}`)
  }
  if (unknown.length) {
    die(`${label}: unclassified column(s): ${unknown.join(', ')}\n` +
        `  The schema changed. Add each to the appropriate set at the top of this file.\n` +
        `  Refusing to write a row that would leave an unreviewed column null.`)
  }
}

async function main() {
  console.log('='.repeat(86))
  console.log(`TRAILING-EDGE BACKFILL ${TARGET}   ${APPLY ? 'APPLY (will write)' : 'DRY RUN (no writes)'}`)
  console.log(`Now: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET`)
  console.log('='.repeat(86))

  const wd = new Date(`${TARGET}T00:00:00Z`).getUTCDay()
  if (wd === 0 || wd === 6) die(`${TARGET} is a weekend — not a trading session.`)

  const exS = await sbGet('daily_snapshots', `snapshot_date=eq.${TARGET}&select=snapshot_date`)
  const exH = await sbGet('portfolio_holdings', `snapshot_date=eq.${TARGET}&select=ticker`)
  if (exS.length || exH.length) die(`${TARGET} already present (snapshots=${exS.length}, holdings=${exH.length}).`)

  const after = await sbGet('daily_snapshots', `snapshot_date=gt.${TARGET}&select=snapshot_date&limit=1`)
  if (after.length) die(`a snapshot exists after ${TARGET} (${after[0].snapshot_date}). This is an INTERIOR gap — use backfill_missing_day.cjs instead.`)

  const [prev] = await sbGet('daily_snapshots', `snapshot_date=lt.${TARGET}&select=*&order=snapshot_date.desc&limit=1`)
  if (!prev) die(`no snapshot before ${TARGET}`)
  const P = prev.snapshot_date
  const expected = firstBusinessDayAfter(P)
  if (expected !== TARGET) {
    die(`latest stored snapshot is ${P}; the first business day after it is ${expected}, not ${TARGET}.\n` +
        `  More than one session is missing. daily_change_pct is a ONE-day move — writing this would drop sessions.`)
  }
  console.log(`\nPrior stored session ${P} -> target ${TARGET} (adjacent business days). OK.`)

  classify(Object.keys(prev), [
    ['db-generated (omit)', SNAP_DB_GENERATED], ['computed', SNAP_COMPUTED],
    ['carry forward', SNAP_CARRY_FORWARD], ['carry as 0', SNAP_CARRY_ZERO],
    ['null (point-in-time)', SNAP_NULLABLE],
  ], 'daily_snapshots')

  const holdP = await sbGet('portfolio_holdings', `snapshot_date=eq.${P}&select=*&order=ticker.asc`)
  if (!holdP.length) die(`no holdings on ${P}`)
  classify(Object.keys(holdP[0]), [
    ['db-generated (omit)', HOLD_DB_GENERATED], ['computed', HOLD_COMPUTED],
    ['carry forward', HOLD_CARRY_FORWARD], ['null', HOLD_NULLABLE],
  ], 'portfolio_holdings')

  // quotes
  console.log(`\nFetching Finnhub quotes for ${holdP.length} holdings + SPY...`)
  const quotes = {}
  for (const t of [...holdP.map((h) => h.ticker), 'SPY']) {
    const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${t}&token=${FH}`)
    const q = await r.json()
    if (!q || typeof q.c !== 'number' || q.c <= 0) die(`bad quote for ${t}: ${JSON.stringify(q)}`)
    quotes[t] = q
  }

  // preconditions 5 + 6
  const checks = [...holdP.map((h) => ({ ticker: h.ticker, stored: h.price })), { ticker: 'SPY', stored: prev.spy_value }]
  let bad = 0
  console.log(`\n${pad('TICKER', 8)}${lp('STORED ' + P, 15)}${lp('FH pc', 12)}${lp('DELTA', 10)}${lp('FH c', 12)}${lp('dp', 9)}   TS (ET)`)
  console.log('-'.repeat(80))
  for (const c of checks) {
    const q = quotes[c.ticker]
    const d = q.pc - c.stored
    const ts = q.t ? etDate(q.t) : '(none)'
    const ok = Math.abs(d) <= PC_TOLERANCE && ts === TARGET
    if (!ok) bad++
    console.log(pad(c.ticker, 8) + lp(c.stored.toFixed(2), 15) + lp(q.pc?.toFixed(2) ?? '-', 12) +
      lp(d.toFixed(4), 10) + lp(q.c.toFixed(2), 12) + lp(q.dp?.toFixed(2) ?? '-', 9) + `   ${ts}${ok ? '' : '  <-- FAIL'}`)
  }
  console.log('-'.repeat(80))
  if (bad) die(`${bad} ticker(s) failed the pc-match / timestamp check. The quotes are not ${TARGET}'s close. Nothing written.`)
  console.log(`Precondition OK: every pc matches stored ${P} and every timestamp is ${TARGET}.`)

  // compute
  let move = 0
  const rows = holdP.map((h) => {
    const q = quotes[h.ticker]
    const dp = (q.c - q.pc) / q.pc * 100
    const contrib = (h.weight_pct * dp) / 100
    move += contrib
    return { ticker: h.ticker, w: h.weight_pct, pxP: h.price, c: q.c, dp, contrib, prevRow: h }
  })

  const pv = r2(prev.portfolio_value * (1 + move / 100))
  const cum = r2(((pv - STARTING_VALUE) / STARTING_VALUE) * 100)
  const spyQ = quotes.SPY
  const spyRatio = spyQ.c / prev.spy_value
  const spy = r2(spyQ.c)
  const spyCum = r2(((1 + prev.spy_cumulative_return_pct / 100) * spyRatio - 1) * 100)

  console.log(`\n${pad('TICKER', 8)}${lp('WT ' + P, 12)}${lp('CLOSE ' + P, 14)}${lp('CLOSE ' + TARGET, 15)}${lp('MOVE', 10)}${lp('CONTRIB', 11)}`)
  console.log('-'.repeat(70))
  for (const r of rows.slice().sort((a, b) => a.contrib - b.contrib)) {
    console.log(pad(r.ticker, 8) + lp(r.w.toFixed(2), 12) + lp(r.pxP.toFixed(2), 14) + lp(r.c.toFixed(2), 15) +
      lp(`${r.dp >= 0 ? '+' : ''}${r.dp.toFixed(2)}%`, 10) + lp(`${r.contrib >= 0 ? '+' : ''}${(r.contrib * 100).toFixed(1)}bp`, 11))
  }
  console.log('-'.repeat(70))
  console.log(pad('TOTAL', 8) + lp(rows.reduce((s, r) => s + r.w, 0).toFixed(2), 12) + lp('', 29) +
    lp(`${move >= 0 ? '+' : ''}${move.toFixed(3)}%`, 10) + lp(`${(move * 100).toFixed(1)}bp`, 11))

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
  snapRow.daily_return_pct = r2(move)
  snapRow.cumulative_return_pct = cum
  snapRow.spy_cumulative_return_pct = spyCum

  const miss = Object.keys(prev).filter((k) => !SNAP_DB_GENERATED.has(k) && !(k in snapRow))
  if (miss.length) die(`internal: ${miss.join(', ')} classified but not written`)

  console.log(`\nPROPOSED daily_snapshots ROW`)
  for (const k of Object.keys(snapRow).sort()) {
    const tag = SNAP_CARRY_FORWARD.has(k) ? '  (carried)' : SNAP_CARRY_ZERO.has(k) ? '  (flat)' : SNAP_NULLABLE.has(k) ? '  (null: point-in-time)' : ''
    console.log(`  ${pad(k, 32)}${pad(JSON.stringify(snapRow[k]), 26)}${tag}`)
  }
  console.log(`  SPY day  ${((spyRatio - 1) * 100).toFixed(2)}%   (${prev.spy_value} -> ${spy}, quoted not derived)`)
  console.log(`  alpha vs SPY  ${(cum - spyCum).toFixed(2)}%   (was ${(prev.cumulative_return_pct - prev.spy_cumulative_return_pct).toFixed(2)}% on ${P})`)

  const f = 1 + move / 100
  const holdRows = rows.map((r) => {
    const row = {}
    for (const k of Object.keys(r.prevRow)) {
      if (HOLD_DB_GENERATED.has(k)) continue
      if (HOLD_CARRY_FORWARD.has(k)) { row[k] = r.prevRow[k]; continue }
      if (HOLD_NULLABLE.has(k)) { row[k] = null; continue }
    }
    const w = r2((r.w * (1 + r.dp / 100)) / f)
    row.snapshot_date = TARGET
    row.ticker = r.ticker
    row.weight_pct = w
    row.price = r2(r.c)
    row.market_value = r2((w / 100) * pv)
    row.daily_change_pct = r2(r.dp)
    return row
  })
  console.log(`\nPROPOSED portfolio_holdings: ${holdRows.length} rows, weight_pct sums to ${holdRows.reduce((s, h) => s + h.weight_pct, 0).toFixed(2)}`)
  for (const h of holdRows) {
    console.log(`  ${pad(h.ticker, 7)}${lp(h.weight_pct.toFixed(2), 7)}%${lp(h.price.toFixed(2), 12)}${lp(h.market_value.toFixed(2), 12)}${lp(`${h.daily_change_pct >= 0 ? '+' : ''}${h.daily_change_pct.toFixed(2)}%`, 10)}`)
  }

  console.log(`\nMOMENTUM: carried flat (value ${snapRow.momentum_value}, cum ${snapRow.momentum_cumulative_return_pct}%, daily 0).`)
  console.log(`  Real distortion — record it in the changelog. Also prevents the cron's`)
  console.log(`  'momentum_value == null' branch from resetting the sleeve to zero.`)

  if (!APPLY) { console.log(`\nDRY RUN — nothing written. Re-run with --apply.`); return }

  console.log(`\nInserting daily_snapshots...`)
  await sbInsert('daily_snapshots', [snapRow])
  console.log(`Inserting portfolio_holdings (${holdRows.length})...`)
  await sbInsert('portfolio_holdings', holdRows)

  const v = await sbGet('daily_snapshots', `snapshot_date=gte.${P}&select=snapshot_date,portfolio_value,daily_return_pct,cumulative_return_pct,spy_value,spy_cumulative_return_pct,momentum_value,momentum_cumulative_return_pct&order=snapshot_date.asc`)
  console.log(`\nVERIFY:`)
  for (const r of v) {
    console.log(`  ${r.snapshot_date}  pf ${lp(r.portfolio_value, 10)}  day ${lp(r.daily_return_pct, 7)}%  cum ${lp(r.cumulative_return_pct, 7)}%  spy ${lp(r.spy_value, 7)} ${lp(r.spy_cumulative_return_pct, 5)}%  mom ${lp(r.momentum_value, 9)} ${lp(r.momentum_cumulative_return_pct, 6)}%`)
  }
  console.log(`\nDone. Monday's cron will now chain off ${TARGET}.`)
}

main().catch((e) => { console.error(`\nFATAL: ${e.message}`); process.exit(1) })
