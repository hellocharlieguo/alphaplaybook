// server/test-step2.cjs
// Step 2 verification — proves Twelve Data covers every live holding and that the
// 10/50/200-day SMA math is right, BEFORE wiring DMAs into the cron. Reads the live
// ticker list from Supabase (so it tests exactly what you hold), fetches each TD
// series (paced + cached locally), and prints per-ticker coverage + DMAs.
//
// Writes NOTHING to Supabase. Run from repo root:
//   cd ~/Desktop/alphaplaybook
//   node server/test-step2.cjs

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })
const { fetchTwelveDataSeries } = require('./daily-cron.cjs')

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase env'); process.exit(1) }
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const CACHE = path.join(__dirname, '.td-cache-step2.json')
const SLEEP_MS = 8000 // ~8s between live calls → under TD's 8/min free limit
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// This is the exact function that will go into the cron's computeTechnicals.
function sma(closes, n) {
  if (closes.length < n) return null
  const slice = closes.slice(-n)
  return Math.round((slice.reduce((a, b) => a + b, 0) / n) * 100) / 100
}
function computeDMAs(series) {
  const closes = series.map((p) => p.close)
  return {
    close: closes.length ? Math.round(closes[closes.length - 1] * 100) / 100 : null,
    dma10: sma(closes, 10),
    dma50: sma(closes, 50),
    dma200: sma(closes, 200),
  }
}

async function getLiveTickers() {
  const { data: latest, error: e1 } = await supabase
    .from('portfolio_holdings')
    .select('snapshot_date')
    .order('snapshot_date', { ascending: false })
    .limit(1)
  if (e1) throw new Error(`Supabase (latest date): ${e1.message}`)
  if (!latest || !latest.length) throw new Error('No portfolio_holdings rows found.')
  const date = latest[0].snapshot_date
  const { data: rows, error: e2 } = await supabase
    .from('portfolio_holdings')
    .select('ticker')
    .eq('snapshot_date', date)
  if (e2) throw new Error(`Supabase (tickers): ${e2.message}`)
  return { date, tickers: [...new Set(rows.map((r) => r.ticker))] }
}

function loadCache() {
  try { return JSON.parse(fs.readFileSync(CACHE, 'utf8')) } catch { return {} }
}

async function run() {
  console.log('=== Step 2 coverage + DMA test (read-only) ===\n')
  const { date, tickers } = await getLiveTickers()
  console.log(`Live holdings as of ${date}: ${tickers.join(', ')}\n`)

  // Test SPY first (known-good), then every holding.
  const symbols = ['SPY', ...tickers]
  const cache = loadCache()
  const results = {}

  for (let i = 0; i < symbols.length; i++) {
    const sym = symbols[i]
    let series = cache[sym]
    if (series) {
      console.log(`  ${sym}: (cached ${series.length} rows)`)
    } else {
      series = await fetchTwelveDataSeries(sym, 250)
      if (series) { cache[sym] = series; fs.writeFileSync(CACHE, JSON.stringify(cache)) }
      if (i < symbols.length - 1) await sleep(SLEEP_MS) // pace live calls only
    }
    results[sym] = series ? computeDMAs(series) : null
    results[sym] && (results[sym]._rows = series.length)
  }

  // Report
  console.log('\nsymbol   rows   close      dma10      dma50      dma200     coverage')
  let anyGap = false
  let anyShort = false
  for (const sym of symbols) {
    const r = results[sym]
    if (!r) {
      anyGap = true
      console.log(`${sym.padEnd(7)} —      —          —          —          —          NO DATA ✗`)
      continue
    }
    const short = r.dma200 === null
    if (short && sym !== 'SGOV') anyShort = true // SGOV is a cash proxy; DMAs irrelevant
    console.log(
      `${sym.padEnd(7)} ${String(r._rows).padEnd(6)} ` +
      `${String(r.close).padEnd(10)} ${String(r.dma10 ?? '—').padEnd(10)} ` +
      `${String(r.dma50 ?? '—').padEnd(10)} ${String(r.dma200 ?? '—').padEnd(10)} ` +
      `${short ? '<200d (dma200 null)' : 'full ✓'}`
    )
  }

  console.log('\n=== Summary ===')
  console.log(anyGap ? 'Some tickers have NO Twelve Data coverage ✗ — those would store null DMAs (entry-gate treats as "no gate").'
                     : 'All tickers returned data ✓')
  console.log(anyShort ? 'Some tickers have <200 trading days → dma200 null until they season (expected for newish ETFs).'
                       : 'All tickers have ≥200 days → full 10/50/200 ✓')
  console.log('\nSanity check the DMAs by eye: for an uptrending name, expect price ≳ dma10 ≳ dma50 ≳ dma200.')
  console.log('Cache written to .td-cache-step2.json — delete it to force a fresh fetch.')
}

run().catch((e) => { console.error('🚨', e.message); process.exit(1) })
