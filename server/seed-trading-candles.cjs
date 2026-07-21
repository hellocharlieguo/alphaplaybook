// server/seed-trading-candles.cjs
// One-off seed for the trading_candles table so the Trading tab has data before
// the first nightly cron run. Requires daily-cron.cjs (which does NOT fire main()
// when require()d) and calls its updateTradingCandles export. Reads .env.local
// via the cron's own dotenv config. Safe to re-run: it upserts on ticker.
//
// Usage: node server/seed-trading-candles.cjs

const { updateTradingCandles } = require('./daily-cron.cjs')

if (typeof updateTradingCandles !== 'function') {
  console.error('updateTradingCandles not exported from daily-cron.cjs — run the cron patch first.')
  process.exit(1)
}

updateTradingCandles()
  .then(() => { console.log('\nSeed complete.'); process.exit(0) })
  .catch((e) => { console.error('Seed failed:', e.message); process.exit(1) })
