// src/lib/technicals.ts — pure technical computations for the Trading tab.
// Display-only: nothing here feeds the engine, the book, or the P&L.

export interface Candle { d: string; o: number; h: number; l: number; c: number; v: number }

export function fmtPrice(p: number): string {
  if (p >= 10000) return `$${(p / 1000).toFixed(1)}k`
  if (p >= 1000) return `$${(p / 1000).toFixed(2)}k`
  return `$${p.toFixed(2)}`
}

export function smaSeries(period: number, closes: number[]): (number | null)[] {
  const out: (number | null)[] = []
  let sum = 0
  for (let i = 0; i < closes.length; i++) {
    sum += closes[i]
    if (i >= period) sum -= closes[i - period]
    out.push(i >= period - 1 ? sum / period : null)
  }
  return out
}

// Wilder-smoothed RSI, same math as the cron's calculateRSI but as a full series.
export function rsiSeries(closes: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = new Array(closes.length).fill(null)
  if (closes.length < period + 1) return out
  let g = 0
  let l = 0
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1]
    if (d >= 0) g += d
    else l -= d
  }
  g /= period
  l /= period
  out[period] = 100 - 100 / (1 + g / Math.max(l, 1e-9))
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1]
    g = (g * (period - 1) + Math.max(d, 0)) / period
    l = (l * (period - 1) + Math.max(-d, 0)) / period
    out[i] = 100 - 100 / (1 + g / Math.max(l, 1e-9))
  }
  return out
}

// Whole-series average true range (single latest value); used by the ZigZag threshold.
export function atr14(candles: Candle[], period = 14): number {
  if (candles.length < period + 1) return 0
  const trs: number[] = []
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i]
    const pc = candles[i - 1].c
    trs.push(Math.max(c.h - c.l, Math.abs(c.h - pc), Math.abs(c.l - pc)))
  }
  let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period
  for (let i = period; i < trs.length; i++) atr = (atr * (period - 1) + trs[i]) / period
  return atr
}

// VWAP anchored at anchorIdx (typically the major cycle low). Null before the anchor.
// Returns null everywhere when the series carries no volume (some TD crypto feeds).
export function anchoredVwap(candles: Candle[], anchorIdx: number): (number | null)[] {
  const out: (number | null)[] = new Array(candles.length).fill(null)
  let pv = 0
  let vv = 0
  for (let i = anchorIdx; i < candles.length; i++) {
    const c = candles[i]
    const tp = (c.h + c.l + c.c) / 3
    pv += tp * c.v
    vv += c.v
    out[i] = vv > 0 ? pv / vv : null
  }
  return out
}

export interface VolumeProfileResult {
  bins: number[] // volume per bin, low price -> high price
  lo: number
  hi: number
  pocBin: number
  pocPrice: number
  vaBins: number[]
  vah: number
  val: number
}

// Volume-at-price histogram over the given candles (typically the last ~365).
// Bin by typical price, weight by volume; POC = max bin; VA = expand from POC to >=70%.
export function volumeProfile(candles: Candle[], nBins = 26): VolumeProfileResult | null {
  if (candles.length === 0) return null
  const totalVol = candles.reduce((s, c) => s + c.v, 0)
  if (totalVol <= 0) return null
  const lo = Math.min(...candles.map((c) => c.l))
  const hi = Math.max(...candles.map((c) => c.h))
  if (!(hi > lo)) return null
  const bins = new Array<number>(nBins).fill(0)
  for (const c of candles) {
    const tp = (c.h + c.l + c.c) / 3
    const b = Math.min(nBins - 1, Math.max(0, Math.floor(((tp - lo) / (hi - lo)) * nBins)))
    bins[b] += c.v
  }
  const pocBin = bins.indexOf(Math.max(...bins))
  const vaBins = [pocBin]
  let vaVol = bins[pocBin]
  while (vaVol < totalVol * 0.7) {
    const up = Math.max(...vaBins) + 1
    const dn = Math.min(...vaBins) - 1
    const uV = up < nBins ? bins[up] : -1
    const dV = dn >= 0 ? bins[dn] : -1
    if (uV >= dV && uV >= 0) { vaBins.push(up); vaVol += uV }
    else if (dV >= 0) { vaBins.push(dn); vaVol += dV }
    else break
  }
  const binPrice = (b: number) => lo + ((b + 0.5) / nBins) * (hi - lo)
  return {
    bins, lo, hi, pocBin,
    pocPrice: binPrice(pocBin),
    vaBins,
    vah: lo + ((Math.max(...vaBins) + 1) / nBins) * (hi - lo),
    val: lo + (Math.min(...vaBins) / nBins) * (hi - lo),
  }
}
