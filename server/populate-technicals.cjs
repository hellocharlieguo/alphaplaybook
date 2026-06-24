// server/populate-technicals.cjs
// One-time helper: compute the 10/50/200 DMAs for your current holdings and write
// them onto the LATEST daily_snapshots row's `technicals` column. Use this to fill
// the column now (instead of waiting for the next trading-day cron run), e.g. to
// give Step 3 real data to render. Non-destructive: only sets `technicals`.
//
// Uses the REAL computeTechnicals from the cron, so it matches what the nightly job
// writes. Takes ~2.5 min (TD calls paced under the 8/min free limit).
//
//   cd ~/Desktop/alphaplaybook
//   node server/populate-technicals.cjs

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })
const { computeTechnicals } = require('./daily-cron.cjs')

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase env'); process.exit(1) }
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function run() {
  // Latest snapshot date + its holdings.
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
  const tickers = [...new Set(rows.map((r) => r.ticker))]

  console.log(`Populating technicals for ${date}: ${tickers.join(', ')}\n`)

  const technicals = await computeTechnicals(tickers) // logs each ticker's DMAs

  const { error: e3 } = await supabase
    .from('daily_snapshots')
    .update({ technicals })
    .eq('snapshot_date', date)
  if (e3) throw new Error(`Supabase (update): ${e3.message}`)

  console.log(`\n✓ Wrote technicals onto ${date}. Verify with:`)
  console.log(`  select snapshot_date, technicals from daily_snapshots where snapshot_date = '${date}';`)
}

run().catch((e) => { console.error('🚨', e.message); process.exit(1) })
