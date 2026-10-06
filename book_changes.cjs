/**
 * book_changes.cjs — packet section H · Weekly Workflow 5.11 step 4 (2026-09-29)
 *
 * For every derived vehicle in theme_map.json, project the book WITH it added,
 * using the canonical worksheet engine itself (v34_worksheet.html), so the
 * projection can never drift from the scoring method.
 *
 *   cd ~/Desktop/alphaplaybook
 *   node book_changes.cjs                                   # newest packet/candidates_*.txt
 *   node book_changes.cjs packet/candidates_2026-09-28.txt
 *   node book_changes.cjs --with COIN,BE                     # JOINT projection: all added at once
 *   node book_changes.cjs --with MU --drop GLW               # swap: add and remove in one projection
 *   node book_changes.cjs --with COIN:working/leader,BE@power_grid
 *        SYM[:timing/quality][@theme] — overrides default timing/quality; @theme picks the row
 *        when a vehicle maps to more than one theme (COIN: tokenization, agent_payments).
 *
 * Read-only. Verdicts: ADD · ADD-WHEN · NOT WORTH IT · ALREADY HELD · NO DATA.
 *
 * ALREADY HELD is a LOOK-THROUGH test (2026-10-01, replaces the '>2% of an ETF' rule):
 * a name inside a held ETF counts as held only when (its % of the ETF) x (the ETF's
 * book weight) >= LOOK_MIN of the whole book. Below that it is scored like any other
 * candidate, and correlation decides how much breadth it really adds.
 * A name with no measured correlation is PROVISIONAL: the engine drops it from
 * N_eff, so its trend-level effect is understated until pull_correlations.py covers it.
 * Defaults (workflow 5.11): timing 'forward' unless the theme carries a Visser
 * stage call ("timing" in theme_map); quality 'leader' unless set ("quality").
 */
const fs = require('fs'), path = require('path')
const MIN_ADD = 3.0, MAX_STRETCH = 25, DUP_CORR = 0.90, LOOK_MIN = 1.5   // LOOK_MIN: % of the whole book

const html = fs.readFileSync('v34_worksheet.html', 'utf8')
const js = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n')
const el = () => new Proxy({}, { get: (t, k) => k === 'style' ? {} : k === 'classList' ? { add() {}, remove() {}, toggle() {} }
  : (k in t ? t[k] : (typeof k === 'string' && /^(add|remove|query|set|get|append|focus|scroll)/.test(k) ? () => el() : '')),
  set: (t, k, v) => { t[k] = v; return true } })
const stub = { getElementById: () => el(), querySelector: () => el(), querySelectorAll: () => [], addEventListener() {}, createElement: () => el(), body: el(), documentElement: el() }
const engine = () => new Function('document', 'window', 'innerWidth', 'innerHeight', 'navigator',
  js + '\n;return {calc,getD:()=>D,R:()=>R,CORR};')(stub, { addEventListener() {} }, 1000, 1000, {})

const TM = JSON.parse(fs.readFileSync('theme_map.json', 'utf8')).themes
const argv = process.argv.slice(2)
const wi = argv.indexOf('--with')
const WITH = wi >= 0 ? (argv[wi + 1] || '').split(',').filter(Boolean) : null
if (wi >= 0) argv.splice(wi, 2)
const di = argv.indexOf('--drop')
const DROP = di >= 0 ? (argv[di + 1] || '').split(',').filter(Boolean) : []
if (di >= 0) argv.splice(di, 2)
let capFile = argv[0]
if (!capFile) {
  const c = fs.readdirSync('packet').filter(f => /^candidates_.*\.txt$/.test(f)).sort()
  if (!c.length) { console.error('No packet/candidates_*.txt — run cycle_packet.py --pull first.'); process.exit(1) }
  capFile = path.join('packet', c[c.length - 1])
}
const TD = {}
for (const line of fs.readFileSync(capFile, 'utf8').split('\n')) {
  const m = line.match(/^(\S+)\s+px=\s*([\d.]+)\s+d50=\s*([\d.n/a]+)\s+d200=\s*([\d.n/a]+)\s+rsi=\s*([\d.]+)/)
  if (m) TD[m[1]] = [m[2], m[3], m[4], m[5]].map(v => v === 'n/a' ? null : parseFloat(v))
}

// baseline
const B = engine(); B.calc(); const R0 = B.R(); const CORR = B.CORR
const held = new Set(Object.keys(R0))
// look-through share of the whole book for an 'in_etf:ETF:pct:asof' status (null if the ETF is not held)
function lookThrough(st) {
  const [, etf, pct, asof] = String(st).split(':')
  return R0[etf] ? { etf, pct: +pct, asof, book: (+pct / 100) * R0[etf].w } : { etf, pct: +pct, asof, book: 0 }
}
const isHeldLT = st => String(st).startsWith('in_etf') && lookThrough(st).book >= LOOK_MIN
const f1 = x => x.toFixed(1), sg = x => (x >= 0 ? '+' : '') + x.toFixed(1)

if (WITH || DROP.length) { joint(WITH || []); process.exit(0) }

function joint(specs) {
  const W = engine(); const D = W.getD(); const added = []
  for (const spec of specs) {
    const m = spec.match(/^([A-Z0-9.]+)(?::(\w+)\/(\w+))?(?:@(\w+))?$/)
    if (!m) { console.error(`Bad --with entry: ${spec}`); process.exit(1) }
    const [, sym, tOv, qOv, thOv] = m
    const hits = Object.entries(TM).filter(([k, t]) => (!thOv || k === thOv) && t.vehicles && t.vehicles[sym]
      && !isHeldLT(t.vehicles[sym]) && t.vehicles[sym] !== 'held')
    if (!hits.length) { console.error(`${sym}: not a candidate in theme_map.json${thOv ? ' under ' + thOv : ''}`); process.exit(1) }
    const [key, th] = hits[0]
    if (!th.trend) { console.error(`${sym}: theme ${key} has no trend assigned`); process.exit(1) }
    const td = TD[sym]; if (!td || td[1] == null || td[2] == null) { console.error(`${sym}: no usable technicals in ${capFile}`); process.exit(1) }
    const timing = tOv || (th.timing && (th.timing[sym] || th.timing._)) || 'forward'
    const quality = qOv || (th.quality && th.quality[sym]) || 'leader'
    D.find(t => t[0] === th.trend)[4].push([th.sub || key, sym, timing, quality, td, 0, '', 1])
    const [px, d50, d200] = td, st = (px - d50) / d50 * 100
    added.push({ sym, key, trend: th.trend, timing, quality, st, v200: (px - d200) / d200 * 100,
                 entryOK: st <= MAX_STRETCH && px >= d200, corr: !!CORR['1y'][sym] })
    if (hits.length > 1 && !thOv) console.log(`note: ${sym} maps to ${hits.map(h => h[0]).join(', ')} — using ${key} (override with ${sym}@theme)`)
  }
  for (const sym of DROP) {
    let found = false
    for (const t of D) { const i = t[4].findIndex(s => s[1] === sym); if (i >= 0) { t[4].splice(i, 1); found = true } }
    if (!found) { console.error(`--drop ${sym}: not a holding`); process.exit(1) }
  }
  W.calc(); const R = W.R()
  console.log(`## H+ · Joint projection — ${[...specs.map(s => '+' + s), ...DROP.map(s => '−' + s)].join(' ')}\n`)
  console.log(`Engine: v34_worksheet.html · technicals: ${capFile}\n`)
  console.log('| added | theme | timing/quality | stretch | vs 200 | entry | corr measured |')
  console.log('|---|---|---|---:|---:|---|---|')
  for (const a of added) console.log(`| **${a.sym}** | ${a.key} | ${a.timing}/${a.quality} | ${f1(a.st)}% | ${sg(a.v200)}% | ${a.entryOK ? 'OK' : '**NOT MET**'} | ${a.corr ? 'yes' : '**NO**'} |`)
  const trends = [...new Set(Object.values(R).map(r => r.trend))]
  console.log('\n| trend | now | joint | Δ | N_eff now → joint |')
  console.log('|---|---:|---:|---:|---|')
  for (const t of trends) {
    const now = Object.values(R0).find(r => r.trend === t), jt = Object.values(R).find(r => r.trend === t)
    console.log(`| ${t} | ${f1(now.twt)} | ${f1(jt.twt)} | ${sg(jt.twt - now.twt)} | ${now.br.toFixed(3)} → ${jt.br.toFixed(3)} |`)
  }
  console.log('\n| name | now | joint | Δ |')
  console.log('|---|---:|---:|---:|')
  let turn = 0
  for (const r of Object.values(R).sort((a, b) => b.w - a.w)) {
    const now = R0[r.tkr] ? R0[r.tkr].w : 0; turn += Math.abs(r.w - now)
    console.log(`| ${R0[r.tkr] ? r.tkr : '**' + r.tkr + '** (new)'} | ${R0[r.tkr] ? f1(now) : '—'} | ${f1(r.w)} | ${sg(r.w - now)} |`)
  }
  for (const sym of DROP) { turn += R0[sym].w; console.log(`| ~~${sym}~~ (removed) | ${f1(R0[sym].w)} | — | ${sg(-R0[sym].w)} |`) }
  const small = added.filter(a => R[a.sym].w < MIN_ADD).map(a => `${a.sym} ${f1(R[a.sym].w)}%`)
  console.log(`\nTurnover vs current engine book: **${f1(turn)}pp** (Σ|Δ|). Names: ${Object.keys(R0).length} → ${Object.keys(R).length}.`)
  if (small.length) console.log(`**Below the ${MIN_ADD}% ADD line in the joint book:** ${small.join(', ')}.`)
  const bad = added.filter(a => !a.entryOK).map(a => a.sym)
  if (bad.length) console.log(`**Entry not met:** ${bad.join(', ')} — these are ADD-WHEN, not ADD.`)
  const nc = added.filter(a => !a.corr).map(a => a.sym)
  if (nc.length) console.log(`**No measured correlations:** ${nc.join(', ')} — breadth understated; run pull_correlations.py + inject_corr.py.`)
  console.log(`\n"now" is the current worksheet engine on this capture, not the deployed freeze.`)
}

console.log(`## H · Book changes — derived candidates (workflow 5.11)\n`)
console.log(`Engine: v34_worksheet.html · technicals: ${capFile} · ADD needs >= ${MIN_ADD}% · entry: stretch <= ${MAX_STRETCH}% and above 200-DMA · duplicate: 1y corr > ${DUP_CORR} · already held: look-through >= ${LOOK_MIN}% of book\n`)
console.log('| theme | vehicle | status | stretch | vs 200 | nearest holding (1y / 3m) | projected | funded from | trend Δ | verdict |')
console.log('|---|---|---|---:|---:|---|---:|---|---:|---|')
const needCorr = new Set(), rows = []
for (const [key, th] of Object.entries(TM)) {
  for (const [sym, st] of Object.entries(th.vehicles || {})) {
    if (st === 'held' || held.has(sym)) continue
    let ltNote = ''
    if (st.startsWith('in_etf')) {
      const lt = lookThrough(st)
      if (lt.book >= LOOK_MIN) { rows.push(`| ${key} | ${sym} | ${lt.pct}% of ${lt.etf} = ${lt.book.toFixed(2)}% of book | | | | | | | ALREADY HELD |`); continue }
      ltNote = ` · ${lt.book.toFixed(2)}% via ${lt.etf}`
    }
    if (st === 'private' || st === 'none' || sym.startsWith('PRIV:')) continue
    if (!th.trend) { rows.push(`| ${key} | ${sym} | ${st} | | | | | | | TREND UNASSIGNED — assign first |`); continue }
    const td = TD[sym]
    if (!td) { rows.push(`| ${key} | ${sym} | ${st} | | | | | | | NO DATA — not in capture |`); continue }
    const [px, d50, d200, rsi] = td
    if (d50 == null || d200 == null) { rows.push(`| ${key} | ${sym} | ${st} | | | | | | | NO DATA — history too short |`); continue }
    const stretch = (px - d50) / d50 * 100, v200 = (px - d200) / d200 * 100
    // nearest same-trend holding by 1y correlation
    const mates = Object.values(R0).filter(r => r.trend === th.trend).map(r => r.tkr)
    let near = null
    if (CORR['1y'][sym]) for (const m of mates) {
      const c1 = CORR['1y'][sym][m]; if (c1 == null) continue
      if (!near || c1 > near.c1) near = { m, c1, c3: CORR['3m'][sym] ? CORR['3m'][sym][m] : null }
    } else needCorr.add(sym)
    // projection
    const W = engine(); const D = W.getD(); const T = D.find(t => t[0] === th.trend)
    const timing = (th.timing && th.timing[sym]) || (th.timing && th.timing._) || 'forward'
    const quality = (th.quality && th.quality[sym]) || 'leader'
    T[4].push([th.sub || key, sym, timing, quality, [px, d50, d200, rsi], 0, '', 1])
    W.calc(); const R = W.R(); const w = R[sym].w
    const tΔ = R[sym].twt - R0[mates[0]].twt
    const fund = mates.map(m => [m, R[m].w - R0[m].w]).filter(([, d]) => d < -0.05).sort((a, b) => a[1] - b[1])
      .slice(0, 3).map(([m, d]) => `${m} ${sg(d)}`).join(', ')
    const entryOK = stretch <= MAX_STRETCH && px >= d200
    let verdict
    if (near && near.c1 > DUP_CORR) verdict = `NOT WORTH IT — duplicates ${near.m}`
    else if (w < MIN_ADD) verdict = `NOT WORTH IT — ${w.toFixed(2)}% < ${MIN_ADD}%`
    else if (!entryOK) verdict = `ADD-WHEN ${px < d200 ? 'it reclaims its 200-DMA' : `stretch < ${MAX_STRETCH}%`}`
    else verdict = 'ADD'
    if (!near) verdict = verdict.startsWith('ADD') ? 'PROVISIONAL ' + verdict + ' — measure corr first' : verdict + ' · corr not measured'
    if (st === 'watch') verdict = `WATCH ONLY — not eligible (theme_map note) · engine alone: ${verdict}`
    rows.push(`| ${key} | ${sym} | ${st.startsWith('in_etf') ? 'look-through' + ltNote : st} · ${timing}/${quality} | ${f1(stretch)}% | ${sg(v200)}% | ${near ? `${near.m} ${near.c1.toFixed(2)} / ${near.c3 == null ? '—' : near.c3.toFixed(2)}` : '—'} | ${f1(w)}% | ${fund || '—'} | ${sg(tΔ)} | **${verdict}** |`)
  }
}
rows.forEach(r => console.log(r))
if (needCorr.size) console.log(`\n**Correlations not measured for:** ${[...needCorr].join(', ')} — breadth is unchanged in their projections. Add them to the pull_correlations.py universe before acting on an ADD.`)
console.log(`\nProjected weight uses the default timing unless theme_map.json carries a Visser stage call. Every verdict can be overruled; the numbers are the evidence.`)
