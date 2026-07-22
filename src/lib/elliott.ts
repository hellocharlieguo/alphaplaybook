// src/lib/elliott.ts — pure-algorithmic Elliott Wave count. v2 (7/20/26):
// BIDIRECTIONAL — detects both up-impulses (L-H-L-H-L-H) and down-impulses
// (H-L-H-L-H-L) with mirrored hard rules, then labels the corrective phase
// against the impulse. Adds a ZigZag threshold-relaxation pass (6% -> 4.5% -> 3%)
// so a valid count is found on most real windows. v1 only searched up-impulses,
// which returned Indeterminate on any downtrend-dominated window (the BTC bug).
// Emits trend ('up'/'down') and bias ('bull'/'bear'/'neut') so the UI never
// string-matches phase names. Always displays an invalidation level. Display-only.

import { atr14 } from './technicals'
import type { Candle } from './technicals'

export interface Pivot { idx: number; price: number; kind: 'H' | 'L' }
export interface WaveLabel { idx: number; price: number; label: string; dir: 1 | -1 }
export interface ElliottResult {
  phase: string
  trend: 'up' | 'down' | 'none'
  bias: 'bull' | 'bear' | 'neut'
  labels: WaveLabel[]
  projection: { idx: number; price: number }[]
  targets: { label: string; price: number }[]
  invalidation: { price: number; note: string } | null
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
}

const NONE: ElliottResult = {
  phase: 'Indeterminate', trend: 'none', bias: 'neut',
  labels: [], projection: [], targets: [], invalidation: null, confidence: 'LOW',
}

// Swing pivots: reversal >= max(pct of price, 2.5 x ATR14). Final pivot is provisional.
export function zigzag(candles: Candle[], pct = 0.06): Pivot[] {
  const n = candles.length
  if (n < 30) return []
  const a = atr14(candles)
  const pivots: Pivot[] = []
  let dir: 1 | -1 = candles[1].c >= candles[0].c ? 1 : -1
  let extIdx = 0
  let extPrice = dir === 1 ? candles[0].h : candles[0].l
  for (let i = 1; i < n; i++) {
    const c = candles[i]
    if (dir === 1) {
      if (c.h > extPrice) { extPrice = c.h; extIdx = i }
      if (extPrice - c.l >= Math.max(extPrice * pct, 2.5 * a)) {
        pivots.push({ idx: extIdx, price: extPrice, kind: 'H' })
        dir = -1; extPrice = c.l; extIdx = i
      }
    } else {
      if (c.l < extPrice) { extPrice = c.l; extIdx = i }
      if (c.h - extPrice >= Math.max(extPrice * pct, 2.5 * a)) {
        pivots.push({ idx: extIdx, price: extPrice, kind: 'L' })
        dir = 1; extPrice = c.h; extIdx = i
      }
    }
  }
  pivots.push({ idx: extIdx, price: extPrice, kind: dir === 1 ? 'H' : 'L' })
  return pivots
}

interface ImpulseHit { i: number; fib: number; score: number; endPivotIdx: number; d: 1 | -1 }

// Direction-generalized impulse search. d = +1 up-impulse, -1 down-impulse.
// All three hard rules mirror via the sign: signed wave lengths d*(delta) must be
// positive; W2 not a full retrace: d*(p2-p0) > 0; W4 no overlap: d*(p4-p1) > 0;
// progression: d*(p3-p1) > 0 and d*(p5-p3) > 0. Fib retraces use the same signs.
function findImpulse(piv: Pivot[], d: 1 | -1, nCandles: number): ImpulseHit | null {
  const startKind = d === 1 ? 'L' : 'H'
  const altKind = d === 1 ? 'H' : 'L'
  let best: ImpulseHit | null = null
  for (let i = 0; i + 5 < piv.length; i++) {
    const p = piv.slice(i, i + 6)
    if (!(p[0].kind === startKind && p[1].kind === altKind && p[2].kind === startKind && p[3].kind === altKind && p[4].kind === startKind && p[5].kind === altKind)) continue
    const w1 = d * (p[1].price - p[0].price)
    const w3 = d * (p[3].price - p[2].price)
    const w5 = d * (p[5].price - p[4].price)
    if (w1 <= 0 || w3 <= 0 || w5 <= 0) continue
    if (d * (p[2].price - p[0].price) <= 0) continue        // Rule: W2 never retraces all of W1
    if (w3 < w1 && w3 < w5) continue                        // Rule: W3 never the shortest
    if (d * (p[4].price - p[1].price) <= 0) continue        // Rule: W4 no overlap of W1 territory
    if (!(d * (p[3].price - p[1].price) > 0 && d * (p[5].price - p[3].price) > 0)) continue // 1<3<5 progression
    let fib = 0
    const r2 = (d * (p[1].price - p[2].price)) / w1
    if (r2 >= 0.382 && r2 <= 0.786) fib++
    const x3 = w3 / w1
    if (x3 >= 1.382 && x3 <= 2.618) fib++
    const r4 = (d * (p[3].price - p[4].price)) / w3
    if (r4 >= 0.236 && r4 <= 0.5) fib++
    // RECENCY-DOMINANT score (fix 7/21): an old clean impulse used to beat the
    // recent structure because the tiebreaker was tiny. Now recency is the primary
    // term — how close the wave-5 pivot's CANDLE index is to the right edge, 0..40 —
    // with fib conformance (0..6) and span (0..5) as secondary. This anchors the
    // count on where price IS, not a months-old completed wave.
    const recency = (p[5].idx / Math.max(1, nCandles - 1)) * 40
    const span = d * (p[5].price - p[0].price)
    const score = recency + fib * 2 + (span / p[5].price) * 5
    if (!best || score > best.score) best = { i, fib, score, endPivotIdx: p[5].idx, d }
  }
  return best
}

export function elliottCount(candles: Candle[]): ElliottResult {
  // Threshold relaxation: try the standard 6% swing filter first; if neither
  // direction yields a rule-valid impulse, loosen to 4.5% then 3%.
  let piv: Pivot[] = []
  let hit: ImpulseHit | null = null
  for (const pct of [0.06, 0.045, 0.03]) {
    piv = zigzag(candles, pct)
    if (piv.length < 6) continue
    const up = findImpulse(piv, 1, candles.length)
    const dn = findImpulse(piv, -1, candles.length)
    // Prefer the more RECENT structure (later wave-5 candle); tie-break on score.
    hit = up && dn
      ? (up.endPivotIdx !== dn.endPivotIdx ? (up.endPivotIdx > dn.endPivotIdx ? up : dn) : (up.score >= dn.score ? up : dn))
      : (up || dn)
    if (hit) break
  }
  if (!hit) return NONE

  const d = hit.d
  const trend: 'up' | 'down' = d === 1 ? 'up' : 'down'
  const imp = piv.slice(hit.i, hit.i + 6)
  const p5 = imp[5]
  const lastIdx = candles.length - 1
  const lastClose = candles[lastIdx].c
  const confidence: ElliottResult['confidence'] = hit.fib === 3 ? 'HIGH' : hit.fib === 2 ? 'MEDIUM' : 'LOW'
  const bounceTag = d === 1 ? '' : ' (bounce)'

  const labels: WaveLabel[] = imp.slice(1).map((p, k) => ({
    idx: p.idx, price: p.price, label: String(k + 1), dir: p.kind === 'H' ? 1 : -1,
  }))

  // Corrective structure after wave 5: A is the first counter-trend pivot, B the
  // next with-trend pivot that does NOT exceed the wave-5 extreme.
  const rest = piv.slice(hit.i + 6)
  const aKind = d === 1 ? 'L' : 'H'
  const A = rest[0] && rest[0].kind === aKind ? rest[0] : null
  const B = A && rest[1] && rest[1].kind === p5.kind && d * (p5.price - rest[1].price) > 0 ? rest[1] : null

  // Beyond the impulse extreme in the trend direction: correction over / resuming.
  // A NEW impulse is running — project it forward off the correction's extreme using
  // measured-move extensions of the prior impulse (0.618 / 1.0 / 1.618 / 2.618 x L).
  // Only levels still AHEAD of price are shown; already-passed levels are useless.
  if (d * (lastClose - p5.price) > 0) {
    const L = Math.abs(p5.price - imp[0].price)   // prior impulse length
    const anchor = A ? A.price : p5.price          // new impulse starts at the correction extreme
    // Targets must be AHEAD of price and at least 2% away — a level sitting on top of
    // spot is noise, not a target.
    const ladder = [0.382, 0.618, 1.0, 1.618, 2.618]
    const ahead = ladder
      .map((m) => ({ mult: m, price: anchor + d * m * L }))
      .filter((t) => d * (t.price - lastClose) > 0 && Math.abs(t.price - lastClose) / Math.abs(lastClose) > 0.02)
    const picked = ahead.slice(0, 2)
    const t1 = picked[0] ? picked[0].price : lastClose + d * 0.35 * L
    const t2raw = picked[1] ? picked[1].price : t1 + d * 0.6 * L
    // Clamp the DRAWN path to <=22% beyond spot. A full measured move can be far away;
    // letting it into the chart's price domain would squash the real candles. The
    // numeric target list still reports the true level.
    const cap = lastClose + d * 0.22 * Math.abs(lastClose)
    const t2 = d * (t2raw - cap) > 0 ? cap : t2raw
    const retrace = t1 - d * 0.28 * Math.abs(t1 - lastClose) // counter-trend pause between legs
    // Name targets by the wave they'd complete, keeping the fib basis visible.
    const targets = picked.map((t, k) => ({
      label: k === 0 ? `W1 target (${t.mult}\u00d7)` : `W3 target (${t.mult}\u00d7)`,
      price: t.price,
    }))
    // The A high/low is the invalidation reference — label it so the note makes sense.
    if (A) labels.push({ idx: A.idx, price: A.price, label: 'A', dir: A.kind === 'H' ? 1 : -1 })
    // PROJECTED wave numbers for the impulse now running (marked with ' to signal
    // "projected, not confirmed"). This is what gives the current impulse its count.
    const pdir: 1 | -1 = d === 1 ? 1 : -1
    labels.push({ idx: lastIdx + 13, price: t1, label: "1'", dir: pdir })
    labels.push({ idx: lastIdx + 21, price: retrace, label: "2'", dir: d === 1 ? -1 : 1 })
    labels.push({ idx: lastIdx + 34, price: t2, label: "3'", dir: pdir })
    return {
      phase: d === 1 ? 'New impulse (post-correction)' : 'New impulse (downtrend resuming)',
      trend, bias: d === 1 ? 'bull' : 'bear', labels,
      projection: [
        { idx: lastIdx, price: lastClose },
        { idx: lastIdx + 13, price: t1 },
        { idx: lastIdx + 21, price: retrace },
        { idx: lastIdx + 34, price: t2 },
      ],
      targets,
      invalidation: A ? { price: A.price, note: d === 1 ? 'Advance invalid on close below the wave-A low' : 'Breakdown invalid on close above the wave-A high' } : null,
      confidence,
    }
  }

  if (A && B && d * (B.price - lastClose) > 0) {
    // Wave C in progress, moving against the impulse. Targets from B: 1.0x / 1.272x A.
    labels.push({ idx: A.idx, price: A.price, label: 'A', dir: A.kind === 'H' ? 1 : -1 })
    labels.push({ idx: B.idx, price: B.price, label: 'B', dir: B.kind === 'H' ? 1 : -1 })
    const lenA = d * (p5.price - A.price) // absolute length of wave A
    const c100 = B.price - d * lenA
    const c127 = B.price - d * 1.272 * lenA
    labels.push({ idx: lastIdx + 16, price: c100, label: 'C?', dir: d === 1 ? -1 : 1 })
    return {
      phase: `Wave C${bounceTag}`,
      trend, bias: d === 1 ? 'bear' : 'neut', // down-move in an uptrend = bearish; counter-trend bounce = neutral
      labels,
      projection: [
        { idx: lastIdx, price: lastClose },
        { idx: lastIdx + 16, price: c100 },
        { idx: lastIdx + 26, price: c100 * (1 - d * 0.015) },
        { idx: lastIdx + 44, price: (c100 + B.price) / 2 },
      ],
      targets: [
        { label: 'C = 1.0\u00d7A', price: c100 },
        { label: 'C = 1.272\u00d7A', price: c127 },
      ],
      invalidation: {
        price: B.price,
        note: d === 1 ? 'Count invalid on daily close above the wave-B high' : 'Count invalid on daily close below the wave-B low',
      },
      confidence,
    }
  }

  if (A && d * (lastClose - A.price) > 0) {
    // Price back on the impulse side of A without a confirmed B pivot -> Wave B.
    labels.push({ idx: A.idx, price: A.price, label: 'A', dir: A.kind === 'H' ? 1 : -1 })
    const b50 = A.price + 0.5 * (p5.price - A.price)
    const b618 = A.price + 0.618 * (p5.price - A.price)
    // B completes, then C runs back against it toward the A extreme.
    const cTarget = A.price - d * 0.15 * Math.abs(p5.price - A.price)
    labels.push({ idx: lastIdx + 12, price: b618, label: 'B?', dir: d === 1 ? 1 : -1 })
    return {
      phase: `Wave B${bounceTag}`, trend, bias: 'neut', labels,
      projection: [
        { idx: lastIdx, price: lastClose },
        { idx: lastIdx + 12, price: b618 },
        { idx: lastIdx + 34, price: cTarget },
      ],
      targets: [
        { label: 'B = 0.5 retr', price: b50 },
        { label: 'B = 0.618 retr', price: b618 },
      ],
      invalidation: {
        price: p5.price,
        note: d === 1 ? 'Close above the wave-5 high = correction complete' : 'Close below the wave-5 low = bounce over, downtrend resumes',
      },
      confidence,
    }
  }

  // Moving off the wave-5 extreme with no confirmed A pivot yet -> Wave A.
  // Wave A typically retraces 0.382-0.618 of the impulse; project toward that band.
  const impLen = Math.abs(p5.price - imp[0].price)
  const aLadder = [0.382, 0.5, 0.618]
    .map((m) => ({ label: `A = ${m} retr`, price: p5.price - d * m * impLen }))
    .filter((t) => d * (t.price - lastClose) < 0) // ahead = counter-trend of the impulse
  const aTargets = aLadder.length ? aLadder.slice(0, 2) : [{ label: 'A = 0.618 retr', price: p5.price - d * 0.618 * impLen }]
  const aEnd = aTargets[aTargets.length - 1].price
  labels.push({ idx: lastIdx + 18, price: aEnd, label: 'A?', dir: d === 1 ? -1 : 1 })
  return {
    phase: `Wave A${bounceTag}`, trend, bias: d === 1 ? 'bear' : 'neut',
    labels,
    projection: [
      { idx: lastIdx, price: lastClose },
      { idx: lastIdx + 18, price: aEnd },
      { idx: lastIdx + 30, price: aEnd + d * 0.2 * Math.abs(aEnd - p5.price) },
    ],
    targets: aTargets,
    invalidation: {
      price: p5.price,
      note: d === 1 ? 'Close above the wave-5 high = correction complete' : 'Close below the wave-5 low = bounce over, downtrend resumes',
    },
    confidence,
  }
}
