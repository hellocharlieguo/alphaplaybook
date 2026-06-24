// server/backfill-spy-1b.cjs
// One-time Step 1b backfill. Recomputes historical SPY value + SPY cumulative
// return from Twelve Data's daily close series, and fills any MISSING RSI — fixing
// the frozen rows left by Alpha Vantage failures (e.g. Jun 3 SPY flat / RSI blank).
//
// DRY RUN by default — writes NOTHING. Pass --commit to apply after you've reviewed.
//   cd ~/Desktop/alphaplaybook
//   node server/backfill-spy-1b.cjs            # prints proposed changes, no writes
//   node server/backfill-spy-1b.cjs --commit   # applies them
//
// Design:
//  - SPY value re-anchored to TD for ALL rows (incl. inception) → single-source,
//    internally-consistent cumulative. Inception cumulative stays 0 by definition.
//  - RSI is fill-missing-only (existing values, e.g. inception, are preserved).
//  - Alpha is NOT stored — it's derived in the UI from cumulative − spy_cumulative,
//    so fixing spy_cumulative auto-fixes Alpha.

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })
const { fetchTwelveDataSeries, calculateRSI, getRSISignal } = require('./daily-cron.cjs')

const COMMIT = process.argv.includes('--commit')
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase env'); process.exit(1) }
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const r2 = (x) => Math.round(x * 100) / 100

// Latest TD close on or before a YYYY-MM-DD (handles weekends/holidays gracefully).
function closeAsOf(series, dateStr) {
  const target = new Date(dateStr)
  let best = null
  for (const p of series) { // series is ascending
    if (new Date(p.date) <= target) best = p
    else break
  }
  return best // { date, close } | null
}

// RSI(14) from closes up to and including the as-of date.
function rsiAsOf(series, dateStr) {
  const target = new Date(dateStr)
  const upto = series.filter((p) => new Date(p.date) <= target)
  if (upto.length < 15) return null
  return calculateRSI(upto)
}

async function run() {
  console.log(`=== Step 1b SPY/RSI backfill — ${COMMIT ? 'COMMIT (writing)' : 'DRY RUN (no writes)'} ===\n`)

  const { data: rows, error } = await supabase
    .from('daily_snapshots')
    .select('snapshot_date, spy_value, spy_cumulative_return_pct, cumulative_return_pct, spy_rsi, rsi_signal')
    .order('snapshot_date', { ascending: true })
  if (error) throw new Error(`Supabase read: ${error.message}`)
  if (!rows || rows.length === 0) { console.log('No snapshots found.'); return }

  const series = await fetchTwelveDataSeries('SPY', 250)
  if (!series) throw new Error('Twelve Data SPY series unavailable — cannot backfill.')

  const inception = rows[0]
  const incClose = closeAsOf(series, inception.snapshot_date)
  if (!incClose) throw new Error(`No TD close on/before inception ${inception.snapshot_date}`)
  console.log(`Inception ${inception.snapshot_date}: anchor spy_value ${inception.spy_value} → TD ${r2(incClose.close)} (re-anchored; cumulative stays 0)\n`)

  const updates = []
  for (const row of rows) {
    const c = closeAsOf(series, row.snapshot_date)
    if (!c) { console.warn(`  ${row.snapshot_date}: no TD close on/before — skipping`); continue }
    const isInception = row.snapshot_date === inception.snapshot_date

    const newSpyValue = r2(c.close)
    const newSpyCum = isInception ? 0 : r2(((c.close - incClose.close) / incClose.close) * 100)

    // RSI: fill-missing-only.
    let newRsi = row.spy_rsi
    let newSig = row.rsi_signal
    const missingRsi = row.spy_rsi === null || row.spy_rsi === undefined
    if (missingRsi) {
      const computed = rsiAsOf(series, row.snapshot_date)
      if (computed !== null) { newRsi = computed; newSig = getRSISignal(computed) }
    }

    const newAlpha = r2((row.cumulative_return_pct ?? 0) - newSpyCum) // display only

    updates.push({
      snapshot_date: row.snapshot_date,
      spy_value: newSpyValue,
      spy_cumulative_return_pct: newSpyCum,
      spy_rsi: newRsi,
      rsi_signal: newSig,
      _alpha: newAlpha,
      _old: { spy_value: row.spy_value, cum: row.spy_cumulative_return_pct, rsi: row.spy_rsi },
    })
  }

  console.log('date        spy_value(old→new)      spy_cum%(old→new)       RSI(old→new)       alpha(new)')
  for (const u of updates) {
    console.log(
      `${u.snapshot_date}  ${String(u._old.spy_value).padEnd(8)}→ ${String(u.spy_value).padEnd(9)} ` +
      `${String(u._old.cum).padEnd(8)}→ ${String(u.spy_cumulative_return_pct).padEnd(9)} ` +
      `${String(u._old.rsi ?? '—').padEnd(6)}→ ${String(u.spy_rsi ?? '—').padEnd(8)} ${u._alpha}`
    )
  }

  if (!COMMIT) {
    console.log('\nDRY RUN complete — nothing written. Review the table above, then re-run with --commit.')
    return
  }

  console.log('\nApplying...')
  for (const u of updates) {
    const { error: uerr } = await supabase
      .from('daily_snapshots')
      .update({
        spy_value: u.spy_value,
        spy_cumulative_return_pct: u.spy_cumulative_return_pct,
        spy_rsi: u.spy_rsi,
        rsi_signal: u.rsi_signal,
      })
      .eq('snapshot_date', u.snapshot_date)
    if (uerr) console.error(`  ${u.snapshot_date}: FAILED — ${uerr.message}`)
    else console.log(`  ${u.snapshot_date}: updated ✓`)
  }
  console.log('\nDone. Refresh the Performance tab — SPY Cumul / Alpha / RSI should now be populated.')
}

run().catch((e) => { console.error('🚨', e.message); process.exit(1) })
