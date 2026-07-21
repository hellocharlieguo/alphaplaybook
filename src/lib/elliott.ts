// src/lib/elliott.ts — pure-algorithmic Elliott Wave count (locked decision 7/18/26).
// ZigZag pivots -> hard-rule-validated 5-wave impulse -> A-B-C corrective phase ->
// fib targets + ALWAYS an invalidation level. EW is inherently subjective; this emits
// a best-fit count with a stated confidence, never a certainty. Display-only.

import { atr14 } from './technicals'
import type { Candle } from './technicals'

export interface Pivot { idx: number; price: number; kind: 'H' | 'L' }
export interface WaveLabel { idx: number; price: number; label: string; dir: 1 | -1 }
export interface ElliottResult {
  phase: string
  labels: WaveLabel[]
  projection: { idx: number; price: number }[]
  targets: { label: string; price: number }[]
  invalidation: { price: number; note: string } | null
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
}

const NONE: ElliottResult = {
  phase: 'Indeterminate', labels: [], projection: [], targets: [], invalidation: null, confidence: 'LOW',
}

// Swing pivots: reversal >= max(6% of price, 2.5 x ATR14). Final pivot is provisional.
export function zigzag(candles: Candle[]): Pivot[] {
  const n = candles.length
  if (n < 30) return []
  const a = atr14(candles)
  const PCT = 0.06
  const pivots: Pivot[] = []
  let dir: 1 | -1 = candles[1].c >= candles[0].c ? 1 : -1
  let extIdx = 0
  let extPrice = dir === 1 ? candles[0].h : candles[0].l
  for (let i = 1; i < n; i++) {
    const c = candles[i]
    if (dir === 1) {
      if (c.h > extPrice) { extPrice = c.h; extIdx = i }
      if (extPrice - c.l >= Math.max(extPrice * PCT, 2.5 * a)) {
        pivots.push({ idx: extIdx, price: extPrice, kind: 'H' })
        dir = -1; extPrice = c.l; extIdx = i
      }
    } else {
      if (c.l < extPrice) { extPrice = c.l; extIdx = i }
      if (c.h - extPrice >= Math.max(extPrice * PCT, 2.5 * a)) {
        pivots.push({ idx: extIdx, price: extPrice, kind: 'L' })
        dir = 1; extPrice = c.h; extIdx = i
      }
    }
  }
  pivots.push({ idx: extIdx, price: extPrice, kind: dir === 1 ? 'H' : 'L' })
  return pivots
}

export function elliottCount(candles: Candle[]): ElliottResult {
  const piv = zigzag(candles)
  if (piv.length < 6) return NONE

  // Best up-impulse: 6-pivot window L-H-L-H-L-H passing the three hard rules,
  // scored by fib conformance (x10), recency, and span.
  let best: { i: number; fib: number; score: number } | null = null
  for (let i = 0; i + 5 < piv.length; i++) {
    const p = piv.slice(i, i + 6)
    if (!(p[0].kind === 'L' && p[1].kind === 'H' && p[2].kind === 'L' && p[3].kind === 'H' && p[4].kind === 'L' && p[5].kind === 'H')) continue
    const w1 = p[1].price - p[0].price
    const w3 = p[3].price - p[2].price
    const w5 = p[5].price - p[4].price
    if (w1 <= 0 || w3 <= 0 || w5 <= 0) continue
    if (p[2].price <= p[0].price) continue                 // Rule: W2 never retraces all of W1
    if (w3 < w1 && w3 < w5) continue                       // Rule: W3 never the shortest
    if (p[4].price <= p[1].price) continue                 // Rule: W4 no overlap of W1 territory
    if (!(p[3].price > p[1].price && p[5].price > p[3].price)) continue // higher highs 1<3<5
    let fib = 0
    const r2 = (p[1].price - p[2].price) / w1
    if (r2 >= 0.382 && r2 <= 0.786) fib++
    const x3 = w3 / w1
    if (x3 >= 1.382 && x3 <= 2.618) fib++
    const r4 = (p[3].price - p[4].price) / w3
    if (r4 >= 0.236 && r4 <= 0.5) fib++
    const score = fib * 10 + i + ((p[5].price - p[0].price) / p[5].price) * 5
    if (!best || score > best.score) best = { i, fib, score }
  }
  if (!best) return NONE

  const imp = piv.slice(best.i, best.i + 6)
  const p5 = imp[5]
  const lastIdx = candles.length - 1
  const lastClose = candles[lastIdx].c
  const confidence: ElliottResult['confidence'] = best.fib === 3 ? 'HIGH' : best.fib === 2 ? 'MEDIUM' : 'LOW'

  const labels: WaveLabel[] = imp.slice(1).map((p, k) => ({
    idx: p.idx, price: p.price, label: String(k + 1), dir: p.kind === 'H' ? 1 : -1,
  }))

  // Corrective structure after wave 5.
  const rest = piv.slice(best.i + 6)
  const A = rest[0] && rest[0].kind === 'L' ? rest[0] : null
  const B = A && rest[1] && rest[1].kind === 'H' && rest[1].price < p5.price ? rest[1] : null

  // Post-correction advance: price back above the impulse high.
  if (lastClose > p5.price) {
    return {
      phase: 'New impulse (post-correction)', labels, projection: [], targets: [],
      invalidation: A ? { price: A.price, note: 'Advance invalid on close below wave-A low' } : null,
      confidence,
    }
  }

  if (A && B && lastClose < B.price) {
    // Wave C in progress. C targets measured from B: 1.0x and 1.272x wave A's length.
    labels.push({ idx: A.idx, price: A.price, label: 'A', dir: -1 })
    labels.push({ idx: B.idx, price: B.price, label: 'B', dir: 1 })
    const lenA = p5.price - A.price
    const c100 = B.price - lenA
    const c127 = B.price - 1.272 * lenA
    labels.push({ idx: lastIdx + 16, price: c100, label: 'C?', dir: -1 })
    return {
      phase: 'Wave C',
      labels,
      projection: [
        { idx: lastIdx, price: lastClose },
        { idx: lastIdx + 16, price: c100 },
        { idx: lastIdx + 26, price: c100 * 0.985 },
        { idx: lastIdx + 44, price: (c100 + B.price) / 2 },
      ],
      targets: [
        { label: 'C = 1.0\u00d7A', price: c100 },
        { label: 'C = 1.272\u00d7A', price: c127 },
      ],
      invalidation: { price: B.price, note: 'Count invalid on daily close above the wave-B high' },
      confidence,
    }
  }

  if (A && lastClose > A.price) {
    // Bounce off A without a confirmed B pivot yet -> Wave B.
    labels.push({ idx: A.idx, price: A.price, label: 'A', dir: -1 })
    return {
      phase: 'Wave B', labels, projection: [],
      targets: [
        { label: 'B = 0.5 retr', price: A.price + 0.5 * (p5.price - A.price) },
        { label: 'B = 0.618 retr', price: A.price + 0.618 * (p5.price - A.price) },
      ],
      invalidation: { price: p5.price, note: 'Close above wave-5 high = correction complete' },
      confidence,
    }
  }

  // Declining from 5 with no confirmed A pivot yet -> Wave A.
  return {
    phase: 'Wave A', labels, projection: [], targets: [],
    invalidation: { price: p5.price, note: 'Close above wave-5 high = correction complete' },
    confidence,
  }
}
