// server/quant-pipeline.js
// Play 3: Fetches SPY daily prices from Alpha Vantage, calculates 14-period RSI,
// and writes the result to Supabase.

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// --- Config ---
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!ALPHA_VANTAGE_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing required environment variables. Check .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// --- Fetch SPY daily prices from Alpha Vantage ---
async function fetchSPYPrices() {
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=SPY&outputsize=compact&apikey=${ALPHA_VANTAGE_KEY}`
  console.log('Fetching SPY daily prices from Alpha Vantage...')
  const response = await fetch(url)
  const data = await response.json()

  if (data['Error Message']) {
    throw new Error(`Alpha Vantage error: ${data['Error Message']}`)
  }
  if (data['Note']) {
    throw new Error(`Alpha Vantage rate limit: ${data['Note']}`)
  }

const timeSeries = data['Time Series (Daily)']
  if (!timeSeries) {
    throw new Error('No time series data returned. Response: ' + JSON.stringify(data).slice(0, 200))
  }

  // Convert to sorted array of { date, close }
  const prices = Object.entries(timeSeries)
    .map(([date, values]) => ({
      date,
      close: parseFloat(values['4. close']),
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  console.log(`Got ${prices.length} days of SPY data. Latest: ${prices[prices.length - 1].date} @ $${prices[prices.length - 1].close}`)
  return prices
}

// --- Calculate 14-period RSI ---
function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) {
    throw new Error(`Need at least ${period + 1} prices to calculate RSI, got ${prices.length}`)
  }

  // Calculate daily changes
  const changes = []
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i].close - prices[i - 1].close)
  }

  // First average gain/loss (simple average of first 'period' changes)
  let avgGain = 0
  let avgLoss = 0
  for (let i = 0; i < period; i++) {
    if (changes[i] >= 0) {
      avgGain += changes[i]
    } else {
      avgLoss += Math.abs(changes[i])
    }
  }
  avgGain /= period
  avgLoss /= period

  // Smoothed RSI using Wilder's method for remaining periods
  for (let i = period; i < changes.length; i++) {
    const gain = changes[i] >= 0 ? changes[i] : 0
    const loss = changes[i] < 0 ? Math.abs(changes[i]) : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
  }

  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  const rsi = 100 - (100 / (1 + rs))

  return Math.round(rsi * 100) / 100 // round to 2 decimals
}

// --- Determine RSI signal ---
function getRSISignal(rsi) {
  if (rsi < 25) return 'oversold'    // Bullish signal — market may bounce
  if (rsi > 70) return 'overbought'  // Bearish signal — market may pull back
  return 'neutral'
}

// --- Determine mapped tickers based on RSI ---
function getMappedTickers(rsi, signal) {
  // RSI informs broad equity positioning
  if (signal === 'oversold') {
    return ['SPY', 'QQQ', 'XSD'] // Oversold = potential buy signal for equities
  }
  if (signal === 'overbought') {
    return ['SGOV', 'GLDM'] // Overbought = rotate to safety
  }
  return ['SPY'] // Neutral = hold current positions
}

// --- Write to Supabase ---
async function writeToSupabase(rsi, signal, latestPrice, latestDate) {
  const today = new Date().toISOString().split('T')[0]
  const mappedTickers = getMappedTickers(rsi, signal)

  // Write to signals table
  const { error: signalError } = await supabase
    .from('signals')
    .upsert({
      snapshot_date: today,
      source: 'quant',
      indicator_name: 'SPY_RSI_14',
      indicator_value: rsi,
      direction: signal === 'oversold' ? 'bullish' : signal === 'overbought' ? 'bearish' : 'neutral',
      mapped_tickers: mappedTickers,
      conviction: signal === 'neutral' ? 'low' : 'medium',
      raw_data: {
        rsi,
        signal,
        latest_price: latestPrice,
        latest_date: latestDate,
        period: 14,
        calculated_at: new Date().toISOString(),
      },
    }, {
      onConflict: 'snapshot_date,source',
      ignoreDuplicates: false,
    })

if (signalError) {
    console.error('Error writing to signals table:', signalError)
  } else {
    console.log('Written to signals table')
  }

  // Update daily_snapshots with RSI data
  const { data: existing } = await supabase
    .from('daily_snapshots')
    .select('id')
    .eq('snapshot_date', today)
    .single()

  if (existing) {
    // Update existing snapshot
    const { error: updateError } = await supabase
      .from('daily_snapshots')
      .update({
        spy_rsi: rsi,
        rsi_signal: signal,
      })
      .eq('snapshot_date', today)

    if (updateError) {
      console.error('Error updating daily_snapshot:', updateError)
    } else {
      console.log('Updated daily_snapshot with RSI data')
    }
  } else {
    // Create new snapshot for today
    const { error: insertError } = await supabase
      .from('daily_snapshots')
      .insert({
        snapshot_date: today,
        spy_rsi: rsi,
        rsi_signal: signal,
      })

    if (insertError) {
      console.error('Error creating daily_snapshot:', insertError)
    } else {
      console.log('Created new daily_snapshot with RSI data')
    }
  }
}

// --- Main ---
async function main() {
  console.log('=== AlphaPlaybook: Quant Pipeline (Play 3) ===')
  console.log(`Date: ${new Date().toISOString().split('T')[0]}`)
  console.log('')

  try {
    // 1. Fetch prices
    const prices = await fetchSPYPrices()

    // 2. Calculate RSI
    const rsi = calculateRSI(prices)
    const signal = getRSISignal(rsi)
    const latest = prices[prices.length - 1]

    console.log('')
    console.log(`RSI (14): ${rsi}`)
    console.log(`Signal: ${signal}`)
    console.log(`SPY Price: $${latest.close} (${latest.date})`)
    console.log('')

    // 3. Write to Supabase
    await writeToSupabase(rsi, signal, latest.close, latest.date)

    console.log('')
    console.log('✓ Quant pipeline complete!')
  } catch (error) {
    console.error('Pipeline error:', error.message)
    process.exit(1)
  }
}

main()