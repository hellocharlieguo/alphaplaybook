#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * probe_friday_close.cjs — READ ONLY. Writes nothing, proposes nothing.
 *
 * Question: on a weekend, does Finnhub /quote return Friday's close as `c`
 * and Thursday's close as `pc`?
 *
 * Verification: `pc` must equal the price already stored on 2026-08-27 for
 * every ticker. If it does, `c` is Friday 2026-08-28's close and `d/dp` is
 * Friday's session move — usable directly, no reconstruction needed.
 *
 *   cd ~/Desktop/alphaplaybook
 *   node probe_friday_close.cjs
 */

const fs = require('fs')
const path = require('path')

const PRIOR = '2026-08-27'   // last stored session
const TARGET = '2026-08-28'  // missing session

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
if (!URL_ || !KEY) { console.error('missing supabase env'); process.exit(1) }
if (!FH) { console.error('missing FINNHUB_API_KEY'); process.exit(1) }

const H = { apikey: KEY, Authorization: `Bearer ${KEY}` }
const pad = (s, n) => String(s).padEnd(n)
const lp = (s, n) => String(s).padStart(n)
const etString = (ts) => new Date(ts * 1000).toLocaleString('en-US', { timeZone: 'America/New_York' })
const etDate = (ts) => new Date(ts * 1000).toLocaleDateString('en-CA', { timeZone: 'America/New_York' })

async function main() {
  console.log('='.repeat(96))
  console.log(`PROBE — Finnhub weekend quote behaviour   (prior stored session ${PRIOR}, missing ${TARGET})`)
  console.log(`Local now: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET`)
  console.log('READ ONLY — this script writes nothing.')
  console.log('='.repeat(96))

  const snapRes = await fetch(`${URL_}/rest/v1/daily_snapshots?snapshot_date=eq.${PRIOR}&select=*`, { headers: H })
  const [snap] = await snapRes.json()
  if (!snap) { console.error(`no ${PRIOR} snapshot`); process.exit(1) }

  const holdRes = await fetch(`${URL_}/rest/v1/portfolio_holdings?snapshot_date=eq.${PRIOR}&select=ticker,weight_pct,price&order=ticker.asc`, { headers: H })
  const holds = await holdRes.json()
  const tickers = holds.map((h) => h.ticker)
  console.log(`\nStored ${PRIOR}: portfolio_value ${snap.portfolio_value}  spy_value ${snap.spy_value}  cum ${snap.cumulative_return_pct}%`)
  console.log(`Holdings: ${tickers.length} names\n`)

  console.log(pad('TICKER', 8) + lp('STORED 8/27', 13) + lp('FH pc', 12) + lp('DELTA', 10) + lp('FH c', 12) + lp('FH dp', 9) + lp('CALC dp', 9) + '   QUOTE TIMESTAMP (ET)')
  console.log('-'.repeat(96))

  const rows = []
  let pcMismatch = 0, tsMismatch = 0
  for (const h of [...holds, { ticker: 'SPY', weight_pct: null, price: snap.spy_value }]) {
    let q
    try {
      const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${h.ticker}&token=${FH}`)
      q = await r.json()
    } catch (e) {
      console.log(pad(h.ticker, 8) + '  fetch error: ' + e.message)
      continue
    }
    const c = q.c, pc = q.pc, dp = q.dp, ts = q.t
    const delta = pc != null ? pc - h.price : null
    const calcDp = (pc && pc > 0) ? ((c - pc) / pc) * 100 : null
    const tsDate = ts ? etDate(ts) : '(none)'
    if (delta === null || Math.abs(delta) > 0.011) pcMismatch++
    if (tsDate !== TARGET) tsMismatch++
    rows.push({ ticker: h.ticker, w: h.weight_pct, stored: h.price, c, pc, dp, calcDp, ts, tsDate, delta })
    console.log(
      pad(h.ticker, 8) +
      lp(h.price?.toFixed(2) ?? '-', 13) +
      lp(pc?.toFixed(2) ?? '-', 12) +
      lp(delta === null ? '-' : delta.toFixed(4), 10) +
      lp(c?.toFixed(2) ?? '-', 12) +
      lp(dp == null ? '-' : dp.toFixed(2), 9) +
      lp(calcDp === null ? '-' : calcDp.toFixed(2), 9) +
      '   ' + (ts ? `${etString(ts)}  [${tsDate}]` : '(no t field)')
    )
  }

  console.log('-'.repeat(96))
  console.log(`\nVERDICT`)
  console.log(`  pc vs stored ${PRIOR}: ${pcMismatch === 0 ? 'ALL MATCH' : `${pcMismatch} MISMATCH(ES)`}`)
  console.log(`  quote timestamp on ${TARGET}: ${tsMismatch === 0 ? 'ALL MATCH' : `${tsMismatch} NOT on ${TARGET}`}`)
  if (pcMismatch === 0 && tsMismatch === 0) {
    console.log(`  => c is Friday ${TARGET}'s close. Direct write is safe; no reconstruction needed.`)
  } else {
    console.log(`  => DO NOT WRITE from these quotes. Investigate before proposing anything.`)
  }

  // Indicative only — not a proposal.
  const eq = rows.filter((r) => r.w != null && r.calcDp !== null)
  if (eq.length === holds.length) {
    const move = eq.reduce((s, r) => s + (r.w * r.calcDp) / 100, 0)
    const pv = snap.portfolio_value * (1 + move / 100)
    const spyRow = rows.find((r) => r.ticker === 'SPY')
    console.log(`\nINDICATIVE ONLY (not a proposal, nothing written):`)
    console.log(`  implied ${TARGET} thematic move  ${move >= 0 ? '+' : ''}${move.toFixed(4)}%`)
    console.log(`  implied portfolio_value          ${pv.toFixed(2)}   (cum ${(((pv - 100000) / 100000) * 100).toFixed(2)}%)`)
    if (spyRow?.calcDp !== null) {
      console.log(`  implied SPY close                ${spyRow.c?.toFixed(2)}   (day ${spyRow.calcDp >= 0 ? '+' : ''}${spyRow.calcDp.toFixed(2)}%)`)
    }
  }
  console.log(`\nNothing was written. Review the table above before any backfill is proposed.`)
}

main().catch((e) => { console.error(`FATAL: ${e.message}`); process.exit(1) })
