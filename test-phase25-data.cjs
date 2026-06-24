// Phase 2.5 data test — run on 1-2 tickers BEFORE the full cron.
//   node test-phase25-data.cjs MSTR NLR GRID XLU COIN     (run from repo root)
// Mirrors the cron's fetch + computeDMAs exactly. Confirms the live API path
// and that dma20/50/200 + RSI14 + 1yr return come back sane per ticker.
try { require('dotenv').config({ path: '.env.local' }) } catch (e) {}  // load key like the cron
const TWELVE_DATA_KEY = process.env.TWELVE_DATA_KEY

async function fetchTwelveDataSeries(symbol, outputsize = 265) {
  if (!TWELVE_DATA_KEY) { console.warn('  No TWELVE_DATA_KEY env var set'); return null }
  try {
    const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=${outputsize}&apikey=${TWELVE_DATA_KEY}`
    let res = await fetch(url)
    if (res.status === 429) { console.warn(`  429 at ${symbol} — backing off 60s`); await new Promise(r=>setTimeout(r,60000)); res = await fetch(url) }
    if (!res.ok) { console.warn(`  ${symbol}: HTTP ${res.status}`); return null }
    const data = await res.json()
    if (data?.status && data.status !== 'ok') { console.warn(`  ${symbol}: ${data.status} (${data.message||''})`); return null }
    const values = data?.values
    if (!Array.isArray(values) || !values.length) { console.warn(`  ${symbol}: no values`); return null }
    const series = values.map(v=>({date:v.datetime, close:parseFloat(v.close)}))
      .filter(p=>p.date && Number.isFinite(p.close)).reverse()
    if (series.length < 15) { console.warn(`  ${symbol}: only ${series.length} rows`); return null }
    return series
  } catch (e) { console.warn(`  ${symbol}: ${e.message}`); return null }
}

const smaOf = (c,n)=> c.length<n?null:Math.round(c.slice(-n).reduce((a,b)=>a+b,0)/n*100)/100
function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) throw new Error('too short')
  const ch = []; for (let i=1;i<prices.length;i++) ch.push(prices[i].close - prices[i-1].close)
  let ag=0, al=0; for (let i=0;i<period;i++){ if(ch[i]>=0) ag+=ch[i]; else al+=Math.abs(ch[i]) }
  ag/=period; al/=period
  for (let i=period;i<ch.length;i++){ const g=ch[i]>=0?ch[i]:0, l=ch[i]<0?Math.abs(ch[i]):0; ag=(ag*(period-1)+g)/period; al=(al*(period-1)+l)/period }
  if (al===0) return 100
  return Math.round((100-100/(1+ag/al))*100)/100
}
function computeDMAs(series) {
  const closes = series.map(p=>p.close)
  let rsi14=null; try { rsi14=calculateRSI(series) } catch(e){}
  let ret1y=null
  if (closes.length>=253){ const past=closes[closes.length-1-252]; if(past) ret1y=Math.round(((closes[closes.length-1]/past)-1)*10000)/100 }
  return { close: Math.round(closes[closes.length-1]*100)/100, dma20:smaOf(closes,20), dma50:smaOf(closes,50), dma200:smaOf(closes,200), rsi14, ret1y, days: closes.length }
}

;(async () => {
  const tickers = process.argv.slice(2).length ? process.argv.slice(2) : ['GLW','MRVL']
  console.log(`Phase 2.5 data test — ${tickers.join(', ')}\n`)
  for (let i=0;i<tickers.length;i++){
    const t = tickers[i]
    const s = await fetchTwelveDataSeries(t, 265)
    if (!s){ console.log(`  ${t}: no data`); continue }
    const d = computeDMAs(s)
    const pos = d.close < d.dma200 ? 'below-200' : (d.close < d.dma50 ? 'pullback' : 'riding')
    console.log(`  ${t}: $${d.close} (${d.days}d) | 20/50/200 = ${d.dma20}/${d.dma50}/${d.dma200} | RSI ${d.rsi14} | 1y ${d.ret1y}% | ladder=${pos}`)
    if (i < tickers.length-1) await new Promise(r=>setTimeout(r,8000)) // 8/min pacing
  }
  console.log('\nIf these look right, the full cron will populate the same fields for all 18.')
})()
