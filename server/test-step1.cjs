// server/test-step1.cjs
// Step 1 smoke test — verifies the AV→Finnhub-SPY + Twelve-Data-RSI swap on a
// small set of tickers BEFORE the full nightly cron runs. Imports the REAL
// functions from daily-cron.cjs (no copies → no drift) and writes NOTHING to
// Supabase (main() doesn't fire thanks to the require.main guard).
//
// Run from the repo root so .env.local resolves the same way the cron sees it:
//   cd ~/Desktop/alphaplaybook
//   node server/test-step1.cjs

const {
  finnhubQuote,
  fetchTwelveDataSeries,
  calculateRSI,
  getRSISignal,
} = require('./daily-cron.cjs')

// Test set: SPY (the benchmark) + one holding (SLV, the top weight). Add more here
// (e.g. 'IBIT') once these pass — but keep it small to respect the 8/min TD limit.
const FINNHUB_TICKERS = ['SPY', 'SLV']
const TD_SYMBOL = 'SPY'

function ok(cond) { return cond ? 'PASS ✓' : 'FAIL ✗' }

async function run() {
  console.log('=================================================')
  console.log('STEP 1 SMOKE TEST — Finnhub SPY + Twelve Data RSI')
  console.log('=================================================\n')

  let allPass = true

  // ---- 1) Finnhub /quote for SPY + one holding -------------------------------
  console.log('--- Finnhub /quote ---')
  const quotes = {}
  for (const t of FINNHUB_TICKERS) {
    const q = await finnhubQuote(t)
    quotes[t] = q
    const good = q && typeof q.price === 'number' && q.price > 0 && typeof q.change_pct === 'number'
    if (!good) allPass = false
    console.log(
      `  ${t}: ${q ? `$${q.price} (${q.change_pct >= 0 ? '+' : ''}${q.change_pct}%)` : 'NULL'}  ${ok(good)}`
    )
  }

  // ---- 2) Twelve Data series + RSI for SPY -----------------------------------
  console.log('\n--- Twelve Data time_series + RSI ---')
  const series = await fetchTwelveDataSeries(TD_SYMBOL, 250)
  let rsi = null
  let seriesPass = false
  if (series && series.length >= 15) {
    const first = series[0]
    const last = series[series.length - 1]
    const ascending = new Date(last.date) > new Date(first.date) // reverse() worked
    rsi = calculateRSI(series)
    const rsiInRange = rsi >= 0 && rsi <= 100
    seriesPass = ascending && rsiInRange
    if (!seriesPass) allPass = false
    console.log(`  rows: ${series.length}`)
    console.log(`  range: ${first.date} → ${last.date}   ascending: ${ok(ascending)}`)
    console.log(`  latest close: $${last.close}`)
    console.log(`  RSI(14): ${rsi} → ${getRSISignal(rsi)}   in [0,100]: ${ok(rsiInRange)}`)
  } else {
    allPass = false
    console.log(`  series: ${series ? `only ${series.length} rows` : 'NULL'}  FAIL ✗`)
  }

  // ---- 3) Cross-check: Finnhub SPY price ≈ TD latest close -------------------
  // Same security, two feeds. After-close they should be within ~1%. A large gap
  // means a symbol/parse mix-up, not market movement.
  console.log('\n--- Cross-check (Finnhub SPY vs TD latest close) ---')
  if (quotes.SPY && series && series.length) {
    const fin = quotes.SPY.price
    const td = series[series.length - 1].close
    const diffPct = Math.abs((fin - td) / td) * 100
    const close = diffPct <= 1.5
    if (!close) allPass = false
    console.log(`  Finnhub $${fin}  vs  TD $${td}   Δ ${diffPct.toFixed(2)}%   within 1.5%: ${ok(close)}`)
    console.log('  (small gaps are normal — after-hours vs official close; a big gap = symbol/parse bug)')
  } else {
    console.log('  skipped (need both Finnhub SPY and a TD series)')
  }

  // ---- Summary ---------------------------------------------------------------
  console.log('\n=================================================')
  console.log(`RESULT: ${allPass ? 'ALL PASS ✓ — safe to run the full cron' : 'SOME FAILURES ✗ — do NOT deploy yet'}`)
  console.log('=================================================')
  process.exit(allPass ? 0 : 1)
}

run().catch((e) => {
  console.error('\n🚨 Test harness error:', e.message)
  console.error(e.stack)
  process.exit(1)
})
