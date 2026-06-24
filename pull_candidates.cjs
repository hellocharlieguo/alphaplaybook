/**
 * Pull clean technicals for the candidate seats (RSI14 + SMA20/50/200 + stretch + s5).
 * No external deps: reads .env.local itself, uses Node's built-in fetch.
 *
 *   cd ~/Desktop/alphaplaybook && node ~/Downloads/pull_candidates.cjs
 *
 * Must be run from the repo root (so it finds .env.local in the current dir).
 */
const fs = require('fs')

// --- read .env.local from the current dir (no dotenv needed) ---
function loadEnv(path) {
  const env = {}
  try {
    for (const line of fs.readFileSync(path, 'utf8').split('\n')) {
      if (!line.trim() || line.trim().startsWith('#')) continue
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*?)\s*$/)
      if (m) { let v = m[2]; if (/^(".*"|'.*')$/.test(v)) v = v.slice(1, -1); env[m[1]] = v }
    }
  } catch (e) { /* file may not exist; handled below */ }
  return env
}
const env = loadEnv('.env.local')
// confirm the var name matches your .env.local; falls back to process env
const TD_KEY = env.TWELVE_DATA_KEY || process.env.TWELVE_DATA_KEY
            || env.TWELVE_DATA_API_KEY || env.TWELVEDATA_API_KEY || env.TD_API_KEY

const TICKERS = ['AIPO','HOOD','COPX','LLY','SLV','GLW','COHR','ENTG','MU','IBIT','GLDM','ETHA','CRCL']
// full funnel book + CRCL (Tokenization 2nd-seat candidate), pulled same-date so the
// deploy weights are all computed on consistent technicals.

function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) throw new Error(`Need ${period + 1}+ prices for RSI`)
  const changes = []
  for (let i = 1; i < prices.length; i++) changes.push(prices[i].close - prices[i - 1].close)
  let avgGain = 0, avgLoss = 0
  for (let i = 0; i < period; i++) { if (changes[i] >= 0) avgGain += changes[i]; else avgLoss += Math.abs(changes[i]) }
  avgGain /= period; avgLoss /= period
  for (let i = period; i < changes.length; i++) {
    const gain = changes[i] >= 0 ? changes[i] : 0
    const loss = changes[i] < 0 ? Math.abs(changes[i]) : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
  }
  if (avgLoss === 0) return 100
  return Math.round((100 - 100 / (1 + avgGain / avgLoss)) * 100) / 100
}
const sma = (c, n) => c.length < n ? null : c.slice(-n).reduce((a, b) => a + b, 0) / n

function s5score(price, d50, d200, rsi) {
  const base = price < d200 ? 45 : (price < d50 ? 72 : 58)
  let pen = 0
  if (rsi >= 70) pen += 15; else if (rsi >= 60) pen += 7; else if (rsi <= 35) pen -= 5
  const st = (price - d50) / d50 * 100
  const rp = st >= 50 ? 12 : st >= 25 ? 8 : st >= 10 ? 4 : 0
  pen += rp * 0.5                                   // working-theme discount
  return { s5: Math.max(5, Math.min(95, base - pen)), base, stretch: st, pen }
}

async function pull(sym) {
  const url = `https://api.twelvedata.com/time_series?symbol=${sym}&interval=1day&outputsize=300&apikey=${TD_KEY}`
  const j = await (await fetch(url)).json()
  if (j.status === 'error' || !j.values) throw new Error(j.message || 'no data')
  const closes = j.values.slice().reverse().map(v => parseFloat(v.close))
  const rows = closes.map(c => ({ close: c }))
  const price = closes[closes.length - 1]
  const d50 = sma(closes, 50), d200 = sma(closes, 200)
  const rsi = calculateRSI(rows)
  const yrAgo = closes.length >= 252 ? closes[closes.length - 252] : closes[0]
  const ret1y = (price / yrAgo - 1) * 100
  return { sym, price, d50, d200, rsi, ret1y, ...s5score(price, d50, d200, rsi) }
}

;(async () => {
  if (!TD_KEY) { console.error('No Twelve Data key found in .env.local (looked for TWELVE_DATA_API_KEY / TWELVEDATA_API_KEY / TD_API_KEY). Run from repo root and confirm the var name.'); process.exit(1) }
  const out = []
  for (const t of TICKERS) {
    try {
      const d = await pull(t); out.push(d)
      const gate = d.price < d.d200 ? '  [BELOW-200 -> entry-paused for new adds]' : ''
      console.log(`${d.sym.padEnd(5)} px=${d.price.toFixed(2).padStart(8)} d50=${d.d50.toFixed(2).padStart(8)} d200=${d.d200.toFixed(2).padStart(8)} rsi=${d.rsi.toFixed(1).padStart(5)} stretch=${d.stretch.toFixed(1).padStart(6)}%  s5~${d.s5.toFixed(0).padStart(2)}${gate}`)
    } catch (e) { console.error(`${t}: ${e.message}`) }
    await new Promise(r => setTimeout(r, 8000))   // ~8s spacing: 13 tickers under free-tier 8/min (~2 min total)
  }
  console.log('\n--- paste-ready quant fields for the BOOK S(...) rows ---')
  for (const d of out)
    console.log(`# ${d.sym}: price=${d.price.toFixed(2)}, d50=${d.d50.toFixed(2)}, d200=${d.d200.toFixed(2)}, rsi=${d.rsi.toFixed(2)}, ret1y=${d.ret1y.toFixed(2)}  -> s5~${d.s5.toFixed(0)} (working theme)`)
})()
