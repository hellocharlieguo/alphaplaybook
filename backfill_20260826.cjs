#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * backfill_20260826.cjs
 * ---------------------------------------------------------------------------
 * Reconstructs the missing 2026-08-26 snapshot.
 *
 * WHY IT IS MISSING
 *   The nightly cron did not fire on 2026-08-26. It was re-run by hand at
 *   2026-08-27T16:27:50Z (12:27pm ET) — mid-session — so the row it wrote is
 *   stamped 2026-08-27 and carries LIVE intraday prices, with Finnhub's
 *   change_pct measured off the 08-26 close. The 08-26 session therefore never
 *   entered the compounding chain.
 *
 * HOW 08-26 IS RECOVERED
 *   daily_change_pct is Finnhub ((c - pc) / pc), i.e. a ONE-day move from the
 *   prior close. Verified: sum(w_0825 * chg_0827) = +0.6409% vs the actual
 *   chain 101104.52/100461.57 - 1 = +0.6400%. The 0.0009pp residual is the
 *   2-dp rounding on change_pct. So:
 *
 *       close_0826(t) = price_0827(t) / (1 + chg_0827(t)/100)
 *       move_0826(t)  = close_0826(t) / close_0825(t) - 1
 *       move_0826(pf) = SUM_t [ weight_0825(t) * move_0826(t) ]
 *
 *   Every input is already in Supabase. No external price API is touched.
 *
 * SPY
 *   spy prev_close is NOT persisted (buildMacroSignals stores only
 *   { price, ath, pct_off_ath }), so the 08-26 SPY close is derived from the
 *   S&P 500 index ratio instead:
 *       SPY_0826 = spy_value_0825 * (SPX_0826 / SPX_0825)
 *   SPX closes below are external and hardcoded; see SPX_* constants.
 *   Sanity check on record: SPX 08-25 closed +0.32%, the stored SPY 08-25 row
 *   reads +0.33% — the quote path cross-validates.
 *
 * TIMING
 *   Must land BEFORE the nightly cron (23:17 UTC / 7:17pm ET). The cron picks
 *   its baseline with .lt('snapshot_date', TODAY) ordered desc: with the 08-26
 *   row present it chains off 99,581.01 and self-heals; without it, it chains
 *   off 08-25 again and the overstatement becomes permanent.
 *
 * USAGE
 *   cd ~/Desktop/alphaplaybook
 *   node backfill_20260826.cjs            # dry run, prints, writes nothing
 *   node backfill_20260826.cjs --apply    # inserts both tables
 *
 * SAFETY
 *   - Aborts if ANY 2026-08-26 row already exists in either table.
 *   - Aborts if the 08-25 and 08-27 ticker sets disagree.
 *   - Aborts if the reconstructed 08-27 move drifts >0.02pp from the stored
 *     chain (that check is what proves the c/pc model, so a failure means the
 *     model is wrong and nothing should be written).
 *   - INSERT only, never update/delete. Touches 2026-08-26 exclusively.
 *   - Leaves the 2026-08-27 row alone: tonight's cron upserts over it with
 *     real closing prices.
 */

const fs = require('fs')
const path = require('path')

const D25 = '2026-08-25'
const D26 = '2026-08-26'
const D27 = '2026-08-27'

const STARTING_VALUE = 100000

// S&P 500 closes, external. 08-25: 7,677.28 (FRED SP500, CNBC). 08-26: 7,675.70
// (CNBC). Implied index move -0.0206%.
const SPX_D25 = 7677.28
const SPX_D26 = 7675.70

const APPLY = process.argv.includes('--apply')

// --- env ------------------------------------------------------------------
function loadEnv(p) {
  const out = {}
  if (!fs.existsSync(p)) return out
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 0) continue
    const k = t.slice(0, i).trim()
    let v = t.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    out[k] = v
  }
  return out
}

const env = { ...loadEnv(path.join(process.cwd(), '.env.local')), ...process.env }
const SUPABASE_URL = env.VITE_SUPABASE_URL
const SUPABASE_KEY = env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('FATAL: VITE_SUPABASE_URL / SUPABASE_SERVICE_KEY not found in .env.local')
  process.exit(1)
}

const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
}

async function sbGet(table, qs) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, { headers: HEADERS })
  if (!res.ok) throw new Error(`GET ${table} -> ${res.status} ${await res.text()}`)
  return res.json()
}

async function sbInsert(table, rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...HEADERS, Prefer: 'return=representation' },
    body: JSON.stringify(rows),
  })
  if (!res.ok) throw new Error(`POST ${table} -> ${res.status} ${await res.text()}`)
  return res.json()
}

const r2 = (x) => Math.round(x * 100) / 100
const pad = (s, n) => String(s).padEnd(n)
const lpad = (s, n) => String(s).padStart(n)

function die(msg) {
  console.error(`\nABORT: ${msg}`)
  process.exit(1)
}

// --- main -----------------------------------------------------------------
async function main() {
  console.log('='.repeat(78))
  console.log(`BACKFILL ${D26}  —  ${APPLY ? 'APPLY (will write)' : 'DRY RUN (no writes)'}`)
  console.log('='.repeat(78))

  // 1. Guard: nothing may already exist on 08-26.
  const existSnap = await sbGet('daily_snapshots', `snapshot_date=eq.${D26}&select=snapshot_date`)
  const existHold = await sbGet('portfolio_holdings', `snapshot_date=eq.${D26}&select=ticker`)
  if (existSnap.length || existHold.length) {
    die(`${D26} already present (daily_snapshots=${existSnap.length}, portfolio_holdings=${existHold.length}). Nothing written.`)
  }
  console.log(`Guard OK: no existing ${D26} rows.`)

  // 2. Pull the two anchor days.
  const [snap25] = await sbGet('daily_snapshots', `snapshot_date=eq.${D25}&select=*`)
  const [snap27] = await sbGet('daily_snapshots', `snapshot_date=eq.${D27}&select=*`)
  if (!snap25) die(`no ${D25} snapshot`)
  if (!snap27) die(`no ${D27} snapshot`)

  const hold25 = await sbGet('portfolio_holdings', `snapshot_date=eq.${D25}&select=ticker,weight_pct,price,daily_change_pct&order=ticker.asc`)
  const hold27 = await sbGet('portfolio_holdings', `snapshot_date=eq.${D27}&select=ticker,weight_pct,price,daily_change_pct&order=ticker.asc`)

  const by25 = Object.fromEntries(hold25.map((h) => [h.ticker, h]))
  const by27 = Object.fromEntries(hold27.map((h) => [h.ticker, h]))

  const t25 = Object.keys(by25).sort()
  const t27 = Object.keys(by27).sort()
  if (t25.join(',') !== t27.join(',')) {
    die(`ticker sets differ.\n  ${D25}: ${t25.join(' ')}\n  ${D27}: ${t27.join(' ')}\n  A mid-gap rebalance means this reconstruction is invalid.`)
  }
  console.log(`Ticker set OK: ${t25.length} names, identical across ${D25} and ${D27}.`)

  // 3. Reconstruct 08-26 closes and moves.
  const rows = []
  let pfMove26 = 0
  for (const tk of t25) {
    const a = by25[tk]
    const b = by27[tk]
    const close26 = b.price / (1 + b.daily_change_pct / 100)
    const move26 = (close26 / a.price - 1) * 100
    const contrib = (a.weight_pct * move26) / 100
    pfMove26 += contrib
    rows.push({ ticker: tk, w25: a.weight_pct, px25: a.price, close26, move26, contrib, chg27: b.daily_change_pct, px27: b.price })
  }

  // 4. Model check: reproduce the stored 08-27 chain from 08-25 weights.
  const chainActual = (snap27.portfolio_value / snap25.portfolio_value - 1) * 100
  const chainModel = t25.reduce((s, tk) => s + (by25[tk].weight_pct * by27[tk].daily_change_pct) / 100, 0)
  const drift = Math.abs(chainModel - chainActual)
  console.log(`\nModel check  stored 08-27 chain ${chainActual.toFixed(4)}%  vs  sum(w_0825 * chg_0827) ${chainModel.toFixed(4)}%  (drift ${drift.toFixed(4)}pp)`)
  if (drift > 0.02) {
    die(`model drift ${drift.toFixed(4)}pp exceeds 0.02pp — daily_change_pct is NOT a clean one-day c/pc move. Do not write.`)
  }
  console.log('Model check OK.')

  // 5. Portfolio + SPY values for 08-26.
  const pv26 = r2(snap25.portfolio_value * (1 + pfMove26 / 100))
  const cum26 = r2(((pv26 - STARTING_VALUE) / STARTING_VALUE) * 100)

  const spyRatio = SPX_D26 / SPX_D25
  const spy26 = r2(snap25.spy_value * spyRatio)
  const spyCum26 = r2(((1 + snap25.spy_cumulative_return_pct / 100) * spyRatio - 1) * 100)

  // 6. Print.
  console.log(`\n${pad('TICKER', 8)}${lpad('WT 8/25', 9)}${lpad('CLOSE 8/25', 13)}${lpad('CLOSE 8/26', 13)}${lpad('MOVE 8/26', 12)}${lpad('CONTRIB', 11)}`)
  console.log('-'.repeat(66))
  for (const r of rows.slice().sort((x, y) => x.contrib - y.contrib)) {
    console.log(
      pad(r.ticker, 8) +
        lpad(r.w25.toFixed(2), 9) +
        lpad(r.px25.toFixed(2), 13) +
        lpad(r.close26.toFixed(4), 13) +
        lpad(`${r.move26 >= 0 ? '+' : ''}${r.move26.toFixed(3)}%`, 12) +
        lpad(`${(r.contrib * 100 >= 0 ? '+' : '')}${(r.contrib * 100).toFixed(1)}bp`, 11)
    )
  }
  console.log('-'.repeat(66))
  console.log(pad('TOTAL', 8) + lpad(rows.reduce((s, r) => s + r.w25, 0).toFixed(2), 9) + lpad('', 26) + lpad(`${pfMove26 >= 0 ? '+' : ''}${pfMove26.toFixed(3)}%`, 12) + lpad(`${(pfMove26 * 100).toFixed(1)}bp`, 11))

  console.log(`\nPROPOSED daily_snapshots ROW`)
  console.log(`  snapshot_date               ${D26}`)
  console.log(`  portfolio_value             ${pv26.toFixed(2)}   (from ${snap25.portfolio_value.toFixed(2)})`)
  console.log(`  spy_value                   ${spy26.toFixed(2)}   (from ${snap25.spy_value.toFixed(2)} x ${spyRatio.toFixed(6)})`)
  console.log(`  cumulative_return_pct       ${cum26.toFixed(2)}`)
  console.log(`  spy_cumulative_return_pct   ${spyCum26.toFixed(2)}`)
  console.log(`  alpha vs SPY                ${(cum26 - spyCum26).toFixed(2)}`)

  // 7. Drifted weights for the holdings rows.
  const pfFactor = 1 + pfMove26 / 100
  const holdRows = rows.map((r) => {
    const w26 = r2((r.w25 * (1 + r.move26 / 100)) / pfFactor)
    return {
      snapshot_date: D26,
      ticker: r.ticker,
      weight_pct: w26,
      shares: null,
      price: r2(r.close26),
      market_value: r2((w26 / 100) * pv26),
      daily_change_pct: r2(r.move26),
      signal_sources: [],
    }
  })
  const wSum = holdRows.reduce((s, h) => s + h.weight_pct, 0)
  console.log(`\nPROPOSED portfolio_holdings: ${holdRows.length} rows, weight_pct sums to ${wSum.toFixed(2)}`)
  for (const h of holdRows) {
    console.log(`  ${pad(h.ticker, 7)}${lpad(h.weight_pct.toFixed(2), 7)}%${lpad(h.price.toFixed(2), 12)}${lpad(h.market_value.toFixed(2), 12)}${lpad(`${h.daily_change_pct >= 0 ? '+' : ''}${h.daily_change_pct.toFixed(2)}%`, 10)}`)
  }

  console.log(`\nNOTE: macro columns (spy_rsi, rsi_signal, polymarket_signals, fear_greed, cpi...)`)
  console.log(`      are left NULL on the ${D26} row. They are point-in-time reads that cannot`)
  console.log(`      be reconstructed after the fact. The equity curve does not depend on them,`)
  console.log(`      but any UI that renders macro tiles for ${D26} will show blanks.`)

  if (!APPLY) {
    console.log(`\nDRY RUN — nothing written. Re-run with --apply to insert.`)
    return
  }

  // 8. Write.
  const snapRow = {
    snapshot_date: D26,
    portfolio_value: pv26,
    spy_value: spy26,
    cumulative_return_pct: cum26,
    spy_cumulative_return_pct: spyCum26,
    portfolio_version: snap25.portfolio_version ?? null,
  }
  console.log(`\nInserting daily_snapshots...`)
  await sbInsert('daily_snapshots', [snapRow])
  console.log(`Inserting portfolio_holdings (${holdRows.length})...`)
  await sbInsert('portfolio_holdings', holdRows)

  const verify = await sbGet('daily_snapshots', `snapshot_date=gte.${D25}&select=snapshot_date,portfolio_value,spy_value,cumulative_return_pct,spy_cumulative_return_pct&order=snapshot_date.asc`)
  console.log(`\nVERIFY:`)
  for (const v of verify) {
    console.log(`  ${v.snapshot_date}  pf ${String(v.portfolio_value).padStart(10)}  spy ${String(v.spy_value).padStart(7)}  cum ${String(v.cumulative_return_pct).padStart(6)}%  spyCum ${String(v.spy_cumulative_return_pct).padStart(6)}%  alpha ${(v.cumulative_return_pct - v.spy_cumulative_return_pct).toFixed(2)}%`)
  }
  console.log(`\nDone. Tonight's cron (23:17 UTC) will now chain off ${D26} and overwrite ${D27} with real closes.`)
}

main().catch((e) => {
  console.error(`\nFATAL: ${e.message}`)
  process.exit(1)
})
