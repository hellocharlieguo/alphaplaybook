#!/usr/bin/env node
/**
 * probe_fear_guards.cjs — READ-ONLY. Replicates fetchFearGreed() exactly and
 * reports WHICH guard trips, per event, instead of just returning null.
 *
 *   cd ~/Desktop/alphaplaybook
 *   node probe_fear_guards.cjs
 *
 * Writes nothing. Keyless. Mirrors daily-cron.cjs:977-1030.
 */
const HOSTS = ['https://api.elections.kalshi.com/trade-api/v2']
const FG_BANDS = ['Extreme Fear', 'Fear', 'Neutral', 'Greed', 'Extreme Greed']
const FG_MIDPOINTS = { 'Extreme Fear': 12.5, Fear: 35, Neutral: 50, Greed: 65, 'Extreme Greed': 87.5 }

;(async () => {
  for (const host of HOSTS) {
    const res = await fetch(`${host}/markets?series_ticker=KXFEAR&status=open&limit=60`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (AlphaPlaybook probe)' } })
    if (!res.ok) { console.log(`HTTP ${res.status}`); continue }
    const ms = ((await res.json()).markets) || []
    console.log(`${ms.length} open markets\n`)
    if (!ms.length) return

    const events = {}
    for (const m of ms) {
      const ev = String(m.ticker || '').split('-').slice(0, -1).join('-')
      if (!ev) continue
      ;(events[ev] = events[ev] || []).push(m)
    }

    const sorted = Object.entries(events)
      .map(([ev, list]) => ({ ev, list, close: String(list[0].close_time || '') }))
      .sort((a, b) => a.close.localeCompare(b.close))

    sorted.forEach((e, idx) => {
      const tag = idx === 0 ? '  <<< THIS IS THE ONE THE CRON USES' : ''
      console.log(`${e.ev}  closes ${e.close}${tag}`)
      const mids = {}, oi = {}
      for (const m of e.list) {
        const name = String(m.yes_sub_title || m.subtitle || '').trim()
        if (FG_BANDS.indexOf(name) < 0) continue
        const b = parseFloat(m.yes_bid_dollars), a = parseFloat(m.yes_ask_dollars)
        if (isNaN(b) || isNaN(a) || a <= 0) { console.log(`    ${name}: unparseable bid/ask`); continue }
        mids[name] = (b + a) / 2
        oi[name] = parseFloat(m.open_interest_fp || 0)
      }
      const n = Object.keys(mids).length
      const sum = FG_BANDS.reduce((s, k) => s + (mids[k] || 0), 0)
      let totOi = 0
      for (const k of FG_BANDS) {
        const spread = mids[k] != null ? '' : '  MISSING'
        console.log(`    ${k.padEnd(14)} mid ${(mids[k] ?? 0).toFixed(4)}  OI ${(oi[k] ?? 0).toFixed(0).padStart(7)}${spread}`)
        totOi += oi[k] || 0
      }
      console.log(`    bands ${n}/5   sum ${sum.toFixed(4)}   total OI ${totOi.toFixed(0)}`)
      if (n !== 5) console.log(`    -> GUARD 1 TRIPS: incomplete ladder`)
      else if (sum < 0.97 || sum > 1.03) console.log(`    -> GUARD 2 TRIPS: sum outside 0.97-1.03`)
      else {
        const norm = {}; for (const k of FG_BANDS) norm[k] = mids[k] / sum
        let band = FG_BANDS[0]; for (const k of FG_BANDS) if (norm[k] > norm[band]) band = k
        const implied = FG_BANDS.reduce((s, k) => s + norm[k] * FG_MIDPOINTS[k], 0)
        console.log(`    -> PASSES: ${band} ${Math.round(norm[band] * 100)}% · implied ${implied.toFixed(1)}`)
      }
      console.log('')
    })
    return
  }
})()
