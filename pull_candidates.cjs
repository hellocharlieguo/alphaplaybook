/**
 * Pull clean technicals for the candidate seats (RSI14 + SMA20/50/200 + stretch + s5),
 * AND compute cross-voice convergence (lenses_pointing) from the voice_mentions ledger.
 * No external deps: reads .env.local itself, uses Node's built-in fetch.
 *
 *   cd ~/Desktop/alphaplaybook && node ~/Downloads/pull_candidates.cjs
 *
 * Must be run from the repo root (so it finds .env.local in the current dir).
 *
 * Convergence (tiered 3-voice model — mirrors convergence_voices in signal_model_config.json):
 *   Visser leg   = in the live BASE_PORTFOLIO (book) OR a logged Visser mention (<=120d)
 *   Camillo leg  = a positive Camillo ledger row (<=75d)
 *   ZaStocks leg = a positive ZaStocks ledger row (<=45d) — CORROBORATION-ONLY: counts
 *                  only if Visser or Camillo also point at the name (never seats alone).
 *   Only positive convictions count (Added / Adding-Holding / Watching); Mentioned/Caution don't.
 *   lenses_pointing = min(3, #legs).  voice_conviction = (Visser || Camillo)  [Za never trips it].
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

// --- Supabase (for the voice_mentions ledger). RLS is ON with no anon SELECT policy,
//     so the SERVICE ROLE key is required (it bypasses RLS); the anon key returns []. ---
const SB_URL = env.SUPABASE_URL || process.env.SUPABASE_URL
            || env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL
const SB_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY
            || process.env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY

// --- convergence config (mirror of convergence_voices in signal_model_config.json) ---
const CONV = {
  count: new Set(['Added', 'Adding-Holding', 'Watching']),   // positive legs only
  decayDays: { Visser: 120, Camillo: 75, ZaStocks: 45 },
  zastocksCorroborationOnly: true,
}

const TICKERS = ["LITE", "FN", "MRVL", "AAOI", "CEG", "GEV", "VST", "BE", "VRT", "ETN", "FCX", "SCCO", "ASML", "TSM", "KLAC", "LRCX", "TEM", "SDGR", "RXRX", "HIMS", "NVO", "AMZN", "SHOP", "CRM", "PLTR", "MSTR", "COIN", "CRCL", "FIGR", "TSLA", "SYM", "ISRG", "NVDA", "SERV"]
// full funnel book + CRCL (Tokenization 2nd-seat candidate), pulled same-date so the
// deploy weights are all computed on consistent technicals. Ledger names (Camillo /
// ZaStocks / Visser mentions) are merged in below at runtime.

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

// --- ledger / book / convergence -------------------------------------------
function daysAgo(dateStr) {
  const d = new Date(String(dateStr) + 'T00:00:00Z')
  return Math.floor((Date.now() - d.getTime()) / 86400000)
}
async function sbGet(pathAndQuery) {
  const res = await fetch(`${SB_URL}/rest/v1/${pathAndQuery}`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  })
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return res.json()
}
async function fetchLedger() {
  const maxWin = Math.max(...Object.values(CONV.decayDays))
  const cutoff = new Date(Date.now() - (maxWin + 5) * 86400000).toISOString().slice(0, 10)
  return sbGet(`voice_mentions?select=voice,ticker,mention_date,conviction&mention_date=gte.${cutoff}&order=mention_date.desc`)
}
async function fetchBook() {
  const rows = await sbGet(`daily_snapshots?select=portfolio&order=snapshot_date.desc&limit=1`)
  const port = (rows && rows[0] && Array.isArray(rows[0].portfolio)) ? rows[0].portfolio : []
  return new Set(port.map(h => String(h.ticker || '').toUpperCase()).filter(Boolean))
}
function legFor(voice, U, ledger) {
  const win = CONV.decayDays[voice]
  return ledger.some(r => String(r.ticker).toUpperCase() === U && r.voice === voice
    && CONV.count.has(r.conviction) && daysAgo(r.mention_date) <= win)
}
function computeLenses(ticker, ledger, book) {
  const U = ticker.toUpperCase()
  const visser = book.has(U) || legFor('Visser', U, ledger)   // book OR logged mention
  const camillo = legFor('Camillo', U, ledger)
  let zastocks = legFor('ZaStocks', U, ledger)
  const zaSeen = zastocks
  if (CONV.zastocksCorroborationOnly && zastocks && !(visser || camillo)) zastocks = false
  const voices = [visser && 'Visser', camillo && 'Camillo', zastocks && 'ZaStocks'].filter(Boolean)
  return {
    lenses: Math.min(3, voices.length),
    voices,
    voiceConviction: (visser || camillo),        // ZaStocks alone never trips the voice floor
    corroborationOnly: zaSeen && !zastocks,       // ZaStocks flagged it but no partner -> watchlist
  }
}

;(async () => {
  if (!TD_KEY) { console.error('No Twelve Data key found in .env.local (looked for TWELVE_DATA_KEY / TWELVE_DATA_API_KEY / TWELVEDATA_API_KEY / TD_API_KEY). Run from repo root and confirm the var name.'); process.exit(1) }

  // --- voice_mentions ledger + current book (for convergence) ---
  let ledger = [], book = new Set(), ledgerOn = false
  if (SB_URL && SB_KEY) {
    try {
      const [lg, bk] = await Promise.all([fetchLedger(), fetchBook()])
      ledger = lg; book = bk; ledgerOn = true
      console.log(`Ledger: ${ledger.length} mentions (<=${Math.max(...Object.values(CONV.decayDays))}d) | book: ${book.size} names\n`)
    } catch (e) {
      console.error(`Ledger read failed (${e.message}) — pulling technicals only, no convergence.\n`)
    }
  } else {
    console.error('No Supabase creds in .env.local (need SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY; the anon key is blocked by RLS) — pulling technicals only, no convergence.\n')
  }

  // --- merge ledger names (Camillo / ZaStocks / Visser) AND the live book into the pull set ---
  const pullSet = new Set(TICKERS.map(t => t.toUpperCase()))
  if (ledgerOn) {
    for (const r of ledger) pullSet.add(String(r.ticker).toUpperCase())
    for (const t of book) pullSet.add(t)   // always pull every live BASE_PORTFOLIO name so a rescore has all seats
  }
  const pullList = [...pullSet]

  const out = []
  for (const t of pullList) {
    try {
      const d = await pull(t); out.push(d)
      const gate = d.price < d.d200 ? '  [BELOW-200 -> entry-paused]' : ''
      let convStr = ''
      if (ledgerOn) {
        const c = computeLenses(t, ledger, book)
        const tag = c.corroborationOnly ? '  [watchlist -- ZaStocks corroboration-only]'
                  : (c.lenses >= 2 ? '  <- CONVERGENCE' : '')
        convStr = `  lenses=${c.lenses}${c.voices.length ? ' (' + c.voices.join('+') + ')' : ''}${tag}`
      }
      console.log(`${d.sym.padEnd(5)} px=${d.price.toFixed(2).padStart(8)} d50=${d.d50.toFixed(2).padStart(8)} d200=${d.d200.toFixed(2).padStart(8)} rsi=${d.rsi.toFixed(1).padStart(5)} stretch=${d.stretch.toFixed(1).padStart(6)}%  s5~${d.s5.toFixed(0).padStart(2)}${gate}${convStr}`)
    } catch (e) { console.error(`${t}: ${e.message}`) }
    await new Promise(r => setTimeout(r, 8000))   // ~8s spacing under free-tier 8/min
  }

  console.log('\n--- paste-ready quant fields for the BOOK S(...) rows ---')
  for (const d of out) {
    let convFields = ''
    if (ledgerOn) {
      const c = computeLenses(d.sym, ledger, book)
      convFields = `, lenses_pointing=${c.lenses}, voice_conviction=${c.voiceConviction ? 'True' : 'False'}`
    }
    console.log(`# ${d.sym}: price=${d.price.toFixed(2)}, d50=${d.d50.toFixed(2)}, d200=${d.d200.toFixed(2)}, rsi=${d.rsi.toFixed(2)}, ret1y=${d.ret1y.toFixed(2)}${convFields}  -> s5~${d.s5.toFixed(0)} (working theme)`)
  }
})()
