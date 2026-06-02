// server/reset-pnl.cjs
// ============================================================================
// AlphaPlaybook — ONE-OFF P&L RESET
// ----------------------------------------------------------------------------
// Wipes the P&L/signal history and writes a CLEAN baseline dated today so the
// cumulative-return series restarts at $100,000 / 0% with no historical scar
// (the -17% from the 5/11 removed-ticker event baked into the old chain).
//
// What it does, in order:
//   1. BACK UP daily_snapshots, portfolio_holdings, signals -> local JSON files
//      (timestamped, in ./pnl-backup-<ts>/). Nothing is deleted until backups
//      are confirmed written.
//   2. WIPE all rows from those three tables.
//   3. WRITE a baseline:
//        - one daily_snapshots row for TODAY: portfolio_value=100000,
//          cumulative_return_pct=0, daily_return_pct=0,
//          spy_value=today's SPY close (new SPY inception anchor),
//          spy_cumulative_return_pct=0, portfolio JSON = 17-name Rule B sleeve.
//        - portfolio_holdings rows for TODAY: each ticker at today's Finnhub
//          price, market_value = weight% * 100000 (sums to 100000).
//
// After this runs, tonight's daily-cron treats the baseline as "yesterday",
// compounds forward normally, and every day after is clean. NO cron code
// changes are needed — this is purely a data reset.
//
// RUN ONCE, MANUALLY:  node server/reset-pnl.cjs
// (Then you can delete this file, or keep it for future resets.)
//
// Requires the same env as the cron: VITE_SUPABASE_URL / SUPABASE_URL,
// SUPABASE_SERVICE_KEY (preferred) / VITE_SUPABASE_ANON_KEY, FINNHUB_API_KEY.
// Loaded from .env.local exactly like daily-cron.cjs.
// ============================================================================

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

// --- Config: matches daily-cron.cjs exactly ---
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY. Check .env.local / environment variables.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const TODAY = new Date().toISOString().split('T')[0]
const STARTING_VALUE = 100000

// ----------------------------------------------------------------------------
// The 17-name Rule B aggressive sleeve (must match BASE_PORTFOLIO in daily-cron.cjs).
// theme + action mirror the cron so the baseline snapshot's portfolio JSON is consistent.
// ----------------------------------------------------------------------------
const BASE_PORTFOLIO = {
  SLV:  { weight_pct: 18,   theme: 'Monetary Scarcity & Tokenization' },
  WGMI: { weight_pct: 10.5, theme: 'Power & Infrastructure' },
  AIPO: { weight_pct: 10.5, theme: 'Power & Infrastructure' },
  CEG:  { weight_pct: 7.5,  theme: 'Power & Infrastructure' },
  IBIT: { weight_pct: 7,    theme: 'Monetary Scarcity & Tokenization' },
  GLDM: { weight_pct: 6.5,  theme: 'Monetary Scarcity & Tokenization' },
  GLW:  { weight_pct: 6,    theme: 'Compute' },
  SGOV: { weight_pct: 5.5,  theme: 'Cash' },
  TXN:  { weight_pct: 4.5,  theme: 'Power & Infrastructure' },
  FLNC: { weight_pct: 4.5,  theme: 'Power & Infrastructure' },
  MRVL: { weight_pct: 4.5,  theme: 'Compute' },
  ETHA: { weight_pct: 3,    theme: 'Monetary Scarcity & Tokenization' },
  ENTG: { weight_pct: 3,    theme: 'Compute' },
  BE:   { weight_pct: 2.5,  theme: 'Power & Infrastructure' },
  COPX: { weight_pct: 2.5,  theme: 'Power & Infrastructure' },
  HOOD: { weight_pct: 2,    theme: 'Monetary Scarcity & Tokenization' },
  XSD:  { weight_pct: 2,    theme: 'Compute' },
}

// ----------------------------------------------------------------------------
// Finnhub /quote price fetch — identical shape/guard to daily-cron.cjs.
// ----------------------------------------------------------------------------
async function fetchPrice(ticker) {
  if (!FINNHUB_API_KEY) return null
  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`
    let response = await fetch(url)
    if (response.status === 429) {
      console.warn(`  Rate limited (429) at ${ticker} — backing off 60s once`)
      await new Promise((r) => setTimeout(r, 60000))
      response = await fetch(url)
    }
    if (!response.ok) {
      console.warn(`  ${ticker}: HTTP ${response.status}`)
      return null
    }
    const data = await response.json()
    const c = Number(data?.c)
    if (!c || c <= 0) {
      console.warn(`  ${ticker}: no valid quote (c=${data?.c}) — skipping`)
      return null
    }
    return Math.round(c * 100) / 100
  } catch (error) {
    console.warn(`  ${ticker}: fetch error — ${error.message}`)
    return null
  }
}

// ----------------------------------------------------------------------------
// STEP 1 — Back up a table to JSON (paginated to be safe on larger tables).
// ----------------------------------------------------------------------------
async function backupTable(table, dir) {
  const all = []
  const pageSize = 1000
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .range(from, from + pageSize - 1)
    if (error) throw new Error(`Backup read failed for ${table}: ${error.message}`)
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < pageSize) break
    from += pageSize
  }
  const file = path.join(dir, `${table}.json`)
  fs.writeFileSync(file, JSON.stringify(all, null, 2))
  console.log(`  Backed up ${all.length} rows from ${table} -> ${file}`)
  return all.length
}

// ----------------------------------------------------------------------------
// STEP 2 — Wipe all rows from a table. Uses a never-null filter so it deletes
// every row (Supabase requires a filter on delete).
// ----------------------------------------------------------------------------
async function wipeTable(table) {
  const { error } = await supabase.from(table).delete().not('id', 'is', null)
  if (error) {
    // Fallback for tables whose PK isn't `id` (filter on snapshot_date instead).
    const { error: err2 } = await supabase.from(table).delete().neq('snapshot_date', '1900-01-01')
    if (err2) throw new Error(`Wipe failed for ${table}: ${error.message} / ${err2.message}`)
  }
  console.log(`  Wiped ${table}`)
}

// ----------------------------------------------------------------------------
// MAIN
// ----------------------------------------------------------------------------
async function main() {
  console.log('╔══════════════════════════════════════════╗')
  console.log('║   AlphaPlaybook — P&L RESET (one-off)     ║')
  console.log('╚══════════════════════════════════════════╝')
  console.log(`Baseline date: ${TODAY}`)
  console.log(`Baseline value: $${STARTING_VALUE.toLocaleString()}`)

  const TABLES = ['daily_snapshots', 'portfolio_holdings', 'signals']

  // ---- STEP 1: BACKUP (before touching anything) ----
  console.log('\n[1/3] Backing up tables...')
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.join('.', `pnl-backup-${ts}`)
  fs.mkdirSync(backupDir, { recursive: true })
  for (const t of TABLES) {
    await backupTable(t, backupDir)
  }
  console.log(`  All backups written to ${backupDir}/`)

  // ---- STEP 2: WIPE ----
  console.log('\n[2/3] Wiping tables...')
  for (const t of TABLES) {
    await wipeTable(t)
  }

  // ---- STEP 3: WRITE BASELINE ----
  console.log('\n[3/3] Writing clean baseline...')

  // SPY close = new inception anchor (alpha restarts at 0).
  const spyPrice = await fetchPrice('SPY')
  if (!spyPrice) {
    console.error('  Could not fetch SPY price — aborting before baseline write.')
    console.error('  Tables are already wiped; re-run after confirming FINNHUB_API_KEY, or restore from backup.')
    process.exit(1)
  }
  console.log(`  SPY inception anchor: $${spyPrice}`)

  // Fetch today's prices for the 17 holdings (for display; market_value is weight-based).
  const tickers = Object.keys(BASE_PORTFOLIO)
  const prices = {}
  for (const t of tickers) {
    prices[t] = await fetchPrice(t)
  }

  // Portfolio JSON for the snapshot row (mirrors writeDailySnapshot's portfolioData).
  const portfolioData = Object.entries(BASE_PORTFOLIO).map(([ticker, pos]) => ({
    ticker,
    weight_pct: pos.weight_pct,
    category: pos.theme,
    adjustments: [],
  }))

  // Baseline daily_snapshots row.
  const snapshotRow = {
    snapshot_date: TODAY,
    spy_rsi: null,
    rsi_signal: null,
    polymarket_signals: [],
    narrative_signals: [],
    bullish_assets: [],
    portfolio: portfolioData,
    portfolio_value: STARTING_VALUE,
    spy_value: spyPrice,
    daily_return_pct: 0,
    cumulative_return_pct: 0,
    spy_cumulative_return_pct: 0,
  }

  const { error: snapErr } = await supabase.from('daily_snapshots').insert(snapshotRow)
  if (snapErr) throw new Error(`Baseline snapshot insert failed: ${snapErr.message}`)
  console.log(`  Wrote baseline daily_snapshots row for ${TODAY} ($${STARTING_VALUE.toLocaleString()}, 0%)`)

  // Baseline portfolio_holdings rows. market_value = weight% * STARTING_VALUE
  // (sums to exactly 100000, which is what the cron reads as "yesterday's book").
  let holdingsWritten = 0
  let sumMV = 0
  for (const [ticker, pos] of Object.entries(BASE_PORTFOLIO)) {
    const marketValue = Math.round(((pos.weight_pct / 100) * STARTING_VALUE) * 100) / 100
    sumMV += marketValue
    const { error: hErr } = await supabase.from('portfolio_holdings').upsert({
      snapshot_date: TODAY,
      ticker,
      weight_pct: pos.weight_pct,
      price: prices[ticker] ?? null,
      market_value: marketValue,
      daily_change_pct: 0,          // baseline day: no day-1 move
      signal_sources: [],
    }, { onConflict: 'snapshot_date,ticker', ignoreDuplicates: false })
    if (hErr) throw new Error(`Holding insert failed for ${ticker}: ${hErr.message}`)
    holdingsWritten++
  }
  console.log(`  Wrote ${holdingsWritten} portfolio_holdings rows (Σ market_value = $${sumMV.toLocaleString()})`)

  console.log('\n✅ RESET COMPLETE')
  console.log(`   Baseline: ${TODAY}  |  $${STARTING_VALUE.toLocaleString()}  |  cumulative 0.00%  |  alpha 0.00%`)
  console.log(`   Backups:  ${backupDir}/`)
  console.log('   Next: tonight\'s 7pm cron compounds forward off this baseline. No cron changes needed.')
}

main().catch((e) => {
  console.error('\n❌ RESET FAILED:', e.message)
  console.error('If wipe ran but baseline did not write, restore from the pnl-backup-* folder.')
  process.exit(1)
})
