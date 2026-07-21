// src/components/TradingChart.tsx — canvas renderer for the Trading tab.
// Candles + toggleable overlays: SMA 50/200, anchored VWAP, Elliott labels &
// projected path (+ invalidation line), fib targets, volume profile gutter,
// RSI sub-pane. All values computed upstream in TradingTab; this only draws.

import { useEffect, useRef } from 'react'
import type { Theme } from './Dashboard'
import type { Candle, VolumeProfileResult } from '../lib/technicals'
import { fmtPrice } from '../lib/technicals'
import type { ElliottResult } from '../lib/elliott'

export interface ChartToggles { ew: boolean; ma: boolean; vp: boolean; vwap: boolean; rsi: boolean; fib: boolean }

interface Props {
  candles: Candle[]
  theme: Theme
  on: ChartToggles
  sma50: (number | null)[]
  sma200: (number | null)[]
  vwap: (number | null)[]
  rsi: (number | null)[]
  vp: VolumeProfileResult | null
  ew: ElliottResult
}

function niceStep(raw: number): number {
  const pow = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1e-9))))
  const m = raw / pow
  return pow * (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10)
}

export default function TradingChart({ candles, theme, on, sma50, sma200, vwap, rsi, vp, ew }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv || candles.length === 0) return

    const draw = () => {
      const ctx = cv.getContext('2d')
      if (!ctx) return
      const dpr = window.devicePixelRatio || 1
      const cssH = Math.min(780, Math.max(560, window.innerHeight - 320))
      cv.style.height = `${cssH}px`
      const w = cv.clientWidth
      if (w === 0) return
      cv.width = w * dpr
      cv.height = cssH * dpr
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
      const h = cssH
      const N = candles.length
      const showVP = on.vp && vp !== null
      const showVWAP = on.vwap && vwap.some((x) => x !== null)

      const rsiH = on.rsi ? Math.round(h * 0.15) : 0
      const padL = 62
      const padT = 14
      const padB = 34 // room for the date axis row
      const mainH = h - rsiH - (rsiH ? 14 : 0)
      const padR = showVP ? Math.min(150, Math.max(90, w * 0.07)) : 14

      // Domains: reserve forward space so the projection + C target render IN-VIEW.
      // Always keep >=40 candles of forward room on the right (the projection zone),
      // even when EW is off, so toggling it doesn't reflow the x-axis.
      const FWD = 44
      const projMax = ew.projection.length ? Math.max(...ew.projection.map((p) => p.idx)) + 6 : N + FWD
      const labelMax = ew.labels.length ? Math.max(...ew.labels.map((l) => l.idx)) + 4 : N
      const xMax = Math.max(N + FWD, on.ew ? Math.max(projMax, labelMax) : N + FWD)
      const X = (i: number) => padL + (i / xMax) * (w - padL - padR)
      const priceCandidates = [
        ...candles.map((c) => c.l), ...candles.map((c) => c.h),
        ...(on.fib ? ew.targets.map((t) => t.price) : []),
        ...(on.ew ? ew.projection.map((p) => p.price) : []),
        ...(on.ew && ew.invalidation ? [ew.invalidation.price] : []),
      ]
      const pLo = Math.min(...priceCandidates) * 0.97
      const pHi = Math.max(...priceCandidates) * 1.02
      const Y = (p: number) => padT + (1 - (p - pLo) / (pHi - pLo)) * (mainH - padT - padB)

      ctx.clearRect(0, 0, w, h)

      // Forward-projection zone: faint shading to the right of the last actual
      // candle, so "where we're going" is visually distinct from actual history.
      const xNow = X(N - 1)
      if (on.ew && ew.projection.length > 1) {
        ctx.fillStyle = 'rgba(224,145,92,0.04)'
        ctx.fillRect(xNow, padT, (w - padR) - xNow, mainH - padT - padB)
        ctx.strokeStyle = 'rgba(224,145,92,0.25)'
        ctx.setLineDash([2, 3])
        ctx.beginPath(); ctx.moveTo(xNow, padT); ctx.lineTo(xNow, mainH - padB); ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = 'rgba(224,145,92,0.5)'
        ctx.font = '9.5px -apple-system, sans-serif'
        ctx.fillText('projected \u2192', xNow + 5, padT + 11)
        ctx.font = '10.5px -apple-system, sans-serif'
      }

      // Grid + y labels
      const step = niceStep((pHi - pLo) / 6)
      ctx.font = '10.5px -apple-system, sans-serif'
      for (let p = Math.ceil(pLo / step) * step; p <= pHi; p += step) {
        ctx.strokeStyle = 'rgba(255,255,255,0.05)'
        ctx.beginPath(); ctx.moveTo(padL, Y(p)); ctx.lineTo(w - padR, Y(p)); ctx.stroke()
        ctx.fillStyle = 'rgba(255,255,255,0.35)'
        ctx.fillText(fmtPrice(p), 6, Y(p) + 3)
      }

      // Value-area shading + POC line
      if (showVP && vp) {
        ctx.fillStyle = 'rgba(255,255,255,0.03)'
        ctx.fillRect(padL, Y(vp.vah), w - padL - padR, Y(vp.val) - Y(vp.vah))
      }

      // Fib target levels
      if (on.fib) {
        for (const t of ew.targets) {
          ctx.strokeStyle = 'rgba(224,145,92,0.5)'
          ctx.setLineDash([5, 4])
          ctx.beginPath(); ctx.moveTo(padL, Y(t.price)); ctx.lineTo(w - padR, Y(t.price)); ctx.stroke()
          ctx.setLineDash([])
          ctx.fillStyle = 'rgba(224,145,92,0.85)'
          ctx.fillText(`${t.label}  ${fmtPrice(t.price)}`, padL + 8, Y(t.price) - 4)
        }
      }

      // Invalidation line (always rendered with the EW toggle — pure-algo spec)
      if (on.ew && ew.invalidation) {
        ctx.strokeStyle = 'rgba(201,112,90,0.45)'
        ctx.setLineDash([2, 4])
        ctx.beginPath(); ctx.moveTo(padL, Y(ew.invalidation.price)); ctx.lineTo(w - padR, Y(ew.invalidation.price)); ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = 'rgba(201,112,90,0.8)'
        ctx.fillText(`Invalidation ${fmtPrice(ew.invalidation.price)} \u2014 ${ew.invalidation.note}`, padL + 8, Y(ew.invalidation.price) - 4)
      }

      // Candles
      const bw = Math.max(1.4, ((w - padL - padR) / xMax) * 0.72)
      for (let i = 0; i < N; i++) {
        const c = candles[i]
        const up = c.c >= c.o
        const col = up ? 'rgba(125,186,106,0.85)' : 'rgba(201,112,90,0.85)'
        ctx.strokeStyle = col
        ctx.fillStyle = col
        ctx.beginPath(); ctx.moveTo(X(i), Y(c.h)); ctx.lineTo(X(i), Y(c.l)); ctx.stroke()
        ctx.fillRect(X(i) - bw / 2, Y(Math.max(c.o, c.c)), bw, Math.max(1, Math.abs(Y(c.o) - Y(c.c))))
      }

      // Overlay lines
      const line = (arr: (number | null)[], col: string, wd: number) => {
        ctx.strokeStyle = col
        ctx.lineWidth = wd
        ctx.beginPath()
        let started = false
        for (let i = 0; i < N; i++) {
          const v = arr[i]
          if (v === null || v === undefined) continue
          if (started) ctx.lineTo(X(i), Y(v))
          else { ctx.moveTo(X(i), Y(v)); started = true }
        }
        ctx.stroke()
        ctx.lineWidth = 1
      }
      if (on.ma) { line(sma50, '#6a9fd8', 1.7); line(sma200, '#d8b46a', 1.9) }
      if (showVWAP) line(vwap, '#a98ad8', 1.6)

      // EW projection + labels
      if (on.ew) {
        if (ew.projection.length > 1) {
          ctx.strokeStyle = 'rgba(224,145,92,0.9)'
          ctx.setLineDash([4, 5])
          ctx.lineWidth = 1.9
          ctx.beginPath()
          ew.projection.forEach((p, i) => (i ? ctx.lineTo(X(p.idx), Y(p.price)) : ctx.moveTo(X(p.idx), Y(p.price))))
          ctx.stroke()
          ctx.setLineDash([])
          ctx.lineWidth = 1
        }
        ctx.font = 'bold 14px -apple-system, sans-serif'
        for (const lb of ew.labels) {
          ctx.fillStyle = 'rgba(224,145,92,0.14)'
          ctx.beginPath(); ctx.arc(X(lb.idx), Y(lb.price) - lb.dir * 17, 11, 0, 7); ctx.fill()
          ctx.fillStyle = theme.accent
          ctx.textAlign = 'center'
          ctx.fillText(lb.label, X(lb.idx), Y(lb.price) - lb.dir * 17 + 5)
        }
        ctx.textAlign = 'left'
        ctx.font = '10.5px -apple-system, sans-serif'
      }

      // Volume profile gutter
      if (showVP && vp) {
        const maxV = Math.max(...vp.bins)
        const nBins = vp.bins.length
        for (let b = 0; b < nBins; b++) {
          const p0 = vp.lo + (b / nBins) * (vp.hi - vp.lo)
          const p1 = vp.lo + ((b + 1) / nBins) * (vp.hi - vp.lo)
          const y0 = Y(p1)
          const bh = Y(p0) - Y(p1) - 1
          const bwv = (vp.bins[b] / maxV) * (padR - 16)
          ctx.fillStyle = b === vp.pocBin
            ? 'rgba(224,145,92,0.8)'
            : vp.vaBins.includes(b) ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.12)'
          ctx.fillRect(w - padR + 5, y0, bwv, Math.max(1, bh))
        }
        ctx.strokeStyle = 'rgba(224,145,92,0.55)'
        ctx.setLineDash([3, 3])
        ctx.beginPath(); ctx.moveTo(padL, Y(vp.pocPrice)); ctx.lineTo(w - padR, Y(vp.pocPrice)); ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = 'rgba(224,145,92,0.85)'
        ctx.fillText(`POC ${fmtPrice(vp.pocPrice)}`, w - padR - 78, Y(vp.pocPrice) - 4)
      }

      // Last-price tag
      const last = candles[N - 1].c
      ctx.fillStyle = theme.negative
      ctx.fillRect(w - padR - 66, Y(last) - 9, 62, 17)
      ctx.fillStyle = theme.bg
      ctx.font = 'bold 10.5px -apple-system, sans-serif'
      ctx.font = '10.5px -apple-system, sans-serif'

      // Date axis along the bottom of the main pane. ~6 evenly spaced ticks reading
      // the candle's date; a final tick marks the projection horizon if EW is on.
      const axisY = mainH - padB + 14
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.textAlign = 'center'
      ctx.font = '10px -apple-system, sans-serif'
      const fmtDate = (s: string) => {
        // 'YYYY-MM-DD' -> 'Mon 'YY' style short label, robust to odd strings.
        const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s))
        if (!m) return String(s).slice(0, 6)
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        return `${months[Math.max(0, Math.min(11, parseInt(m[2], 10) - 1))]} ${m[3]}`
      }
      const TICKS = 6
      for (let k = 0; k <= TICKS; k++) {
        const i = Math.round((k / TICKS) * (N - 1))
        const x = X(i)
        ctx.strokeStyle = 'rgba(255,255,255,0.08)'
        ctx.beginPath(); ctx.moveTo(x, mainH - padB); ctx.lineTo(x, mainH - padB + 4); ctx.stroke()
        ctx.fillStyle = 'rgba(255,255,255,0.4)'
        ctx.fillText(fmtDate(candles[i].d), x, axisY)
      }
      // Projection-horizon tick (dashed accent), if a forward path exists.
      if (on.ew && ew.projection.length > 1) {
        const horizonIdx = Math.max(...ew.projection.map((p) => p.idx))
        const x = X(horizonIdx)
        ctx.fillStyle = 'rgba(224,145,92,0.6)'
        ctx.fillText('proj.', x, axisY)
      }
      ctx.textAlign = 'left'
      ctx.font = '10.5px -apple-system, sans-serif'

      // RSI sub-pane
      if (on.rsi) {
        const t0 = mainH + 14
        ctx.fillStyle = 'rgba(255,255,255,0.02)'
        ctx.fillRect(padL, t0, w - padL - padR, rsiH)
        const Yr = (v: number) => t0 + (1 - v / 100) * rsiH
        for (const lv of [30, 70]) {
          ctx.strokeStyle = 'rgba(255,255,255,0.1)'
          ctx.setLineDash([3, 3])
          ctx.beginPath(); ctx.moveTo(padL, Yr(lv)); ctx.lineTo(w - padR, Yr(lv)); ctx.stroke()
          ctx.setLineDash([])
          ctx.fillStyle = 'rgba(255,255,255,0.3)'
          ctx.font = '9.5px -apple-system, sans-serif'
          ctx.fillText(String(lv), padL - 20, Yr(lv) + 3)
        }
        ctx.strokeStyle = theme.accent
        ctx.lineWidth = 1.5
        ctx.beginPath()
        let started = false
        for (let i = 0; i < N; i++) {
          const v = rsi[i]
          if (v === null || v === undefined) continue
          if (started) ctx.lineTo(X(i), Yr(v))
          else { ctx.moveTo(X(i), Yr(v)); started = true }
        }
        ctx.stroke()
        ctx.lineWidth = 1
        const rsiNow = rsi[N - 1]
        ctx.fillStyle = 'rgba(255,255,255,0.4)'
        ctx.font = '10.5px -apple-system, sans-serif'
        ctx.fillText(`RSI 14 \u00b7 ${rsiNow !== null && rsiNow !== undefined ? rsiNow.toFixed(1) : '\u2014'}`, padL + 8, t0 + 13)
      }
    }

    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(cv)
    window.addEventListener('resize', draw)
    return () => { ro.disconnect(); window.removeEventListener('resize', draw) }
  }, [candles, on, sma50, sma200, vwap, rsi, vp, ew, theme])

  return <canvas ref={canvasRef} style={{ width: '100%', display: 'block', borderRadius: 10 }} />
}
