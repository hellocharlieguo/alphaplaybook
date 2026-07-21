// src/components/TradingTab.tsx — the Trading tab. Reads Supabase-cached daily
// candles (trading_candles, written nightly by cron Step 5d), computes all
// technicals client-side, and renders the landscape workbench: stat strip +
// wide chart + indicator right rail. DISPLAY-ONLY by design: never writes to
// Supabase, never touches sleeve weights, the engine, or the rebalance trigger.
// Phase 1 = BTC/USD. Phase 2 = monetary sleeve (IBIT/SLV/GLDM/ETHA). Phase 3 = book.

import { useState, useEffect, useMemo } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { supabase } from '../supabase'
import type { Theme } from './Dashboard'
import TradingChart from './TradingChart'
import type { ChartToggles } from './TradingChart'
import IndicatorPanel from './IndicatorPanel'
import type { IndicatorEntry } from './IndicatorPanel'
import { smaSeries, rsiSeries, anchoredVwap, volumeProfile, fmtPrice } from '../lib/technicals'
import type { Candle } from '../lib/technicals'
import { elliottCount } from '../lib/elliott'
import { INDICATOR_DOCS } from '../lib/indicator_docs'

const PHASE1_TICKER = 'BTC/USD'
const PHASE2_TICKERS = ['SLV', 'IBIT', 'GLDM', 'ETHA']
const PHASE3_TICKERS = ['HOOD', 'AIPO', 'SOXX', 'ASML']

const glass: CSSProperties = {
  background: 'rgba(30,29,27,0.38)', backdropFilter: 'blur(32px) saturate(132%)',
  WebkitBackdropFilter: 'blur(32px) saturate(132%)', border: '1px solid rgba(255,255,255,0.11)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)', borderRadius: 12,
}

export default function TradingTab({ theme }: { theme: Theme }) {
  const [candles, setCandles] = useState<Candle[] | null>(null)
  const [asOf, setAsOf] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [on, setOn] = useState<ChartToggles>({ ew: true, ma: true, vp: true, vwap: true, rsi: true, fib: true })

  useEffect(() => {
    async function fetchCandles() {
      setLoading(true)
      const { data, error } = await supabase.from('trading_candles').select('*').eq('ticker', PHASE1_TICKER).single()
      if (error || !data?.candles?.length) {
        setLoadError(error ? error.message : 'no candle rows')
        setCandles(null)
      } else {
        setCandles(data.candles as Candle[])
        setAsOf(String(data.candles[data.candles.length - 1].d).slice(0, 10))
        setLoadError(null)
      }
      setLoading(false)
    }
    fetchCandles()
  }, [])

  const computed = useMemo(() => {
    if (!candles || candles.length < 60) return null
    const closes = candles.map((c) => c.c)
    const s50 = smaSeries(50, closes)
    const s200 = smaSeries(200, closes)
    const hasVolume = candles.some((c) => c.v > 0)
    // Anchor VWAP at the lowest low of the window (major cycle low).
    let anchorIdx = 0
    for (let i = 1; i < candles.length; i++) if (candles[i].l < candles[anchorIdx].l) anchorIdx = i
    const vwapArr = hasVolume ? anchoredVwap(candles, anchorIdx) : new Array<number | null>(candles.length).fill(null)
    const vp = hasVolume ? volumeProfile(candles.slice(-365)) : null
    const rsiArr = rsiSeries(closes)
    const ew = elliottCount(candles)
    return { s50, s200, hasVolume, vwapArr, vp, rsiArr, ew }
  }, [candles])

  // ---------- loading / empty states ----------
  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256, color: theme.textTertiary }}>Loading candles...</div>
  }
  if (!candles || !computed) {
    return (
      <div style={{ ...glass, padding: 24, color: theme.textSecondary, fontSize: 13, lineHeight: 1.6 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: theme.textPrimary, marginBottom: 8 }}>No candle data yet</div>
        The trading_candles table has no {PHASE1_TICKER} row{loadError ? ` (${loadError})` : ''}. The nightly cron (Step 5d) writes it once the
        table exists in Supabase; to seed immediately, run <code style={{ color: theme.accent }}>node server/seed-trading-candles.cjs</code> from the repo root.
      </div>
    )
  }

  const { s50, s200, hasVolume, vwapArr, vp, rsiArr, ew } = computed
  const N = candles.length
  const last = candles[N - 1].c
  const cycleHigh = Math.max(...candles.map((c) => c.h))
  const sma50Now = s50[N - 1]
  const sma200Now = s200[N - 1]
  const vwapNow = vwapArr[N - 1]
  const rsiNow = rsiArr[N - 1]
  const pct = (a: number, b: number) => ((a - b) / b) * 100
  const vs200 = sma200Now !== null ? pct(last, sma200Now) : null
  const vs50 = sma50Now !== null ? pct(last, sma50Now) : null
  const vsVwap = vwapNow !== null && vwapNow !== undefined ? pct(last, vwapNow) : null
  const belowBoth = vs200 !== null && vs50 !== null && vs200 < 0 && vs50 < 0
  const aboveBoth = vs200 !== null && vs50 !== null && vs200 >= 0 && vs50 >= 0

  // ---------- composite vote across enabled indicators ----------
  const votes: ('bull' | 'bear' | 'neut')[] = []
  if (on.ma && vs200 !== null) votes.push(aboveBoth ? 'bull' : belowBoth ? 'bear' : 'neut')
  if (on.vwap && vsVwap !== null) votes.push(vsVwap >= 0 ? 'bull' : 'bear')
  if (on.vp && vp) votes.push(last >= vp.pocPrice ? 'bull' : 'bear')
  if (on.ew) votes.push(ew.bias)
  if (on.rsi && rsiNow !== null && rsiNow !== undefined) votes.push(rsiNow > 70 ? 'bear' : rsiNow < 30 ? 'bull' : 'neut')
  const bears = votes.filter((v) => v === 'bear').length
  const bulls = votes.filter((v) => v === 'bull').length
  const rsiVal = rsiNow ?? null
  const composite = bears > bulls
    ? (rsiVal !== null && rsiVal < 35 ? 'BEARISH → BASING' : 'BEARISH')
    : bulls > bears ? 'BULLISH' : 'MIXED'
  const compositeBear = bears > bulls

  const pill = (text: string, bear: boolean) => (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: bear ? theme.negative : theme.positive, background: bear ? 'rgba(201,112,90,0.16)' : 'rgba(125,186,106,0.16)' }}>{text}</span>
  )

  // ---------- indicator entries (readings + current-read prose) ----------
  const targetsStr = ew.targets.map((t) => `${t.label} → ${fmtPrice(t.price)}`).join(' · ')
  const entries: IndicatorEntry[] = [
    {
      key: 'ew', name: INDICATOR_DOCS.ew.name, general: INDICATOR_DOCS.ew.general,
      reading: pill(ew.phase.toUpperCase(), ew.bias === 'bear'),
      currentRead: `Best-fit count: ${ew.phase} (confidence ${ew.confidence}). ${targetsStr ? `Targets: ${targetsStr}. ` : ''}${ew.invalidation ? `Invalidation at ${fmtPrice(ew.invalidation.price)} — ${ew.invalidation.note}.` : 'No invalidation level (count indeterminate).'}`,
      enabled: on.ew,
    },
    {
      key: 'ma', name: INDICATOR_DOCS.ma.name, general: INDICATOR_DOCS.ma.general,
      reading: <>50: {sma50Now !== null ? fmtPrice(sma50Now) : '—'} · 200: {sma200Now !== null ? fmtPrice(sma200Now) : '—'}<br />{vs200 !== null ? pill(vs200 >= 0 ? 'ABOVE 200' : 'BELOW 200', vs200 < 0) : null}</>,
      currentRead: vs200 !== null && vs50 !== null
        ? `Price is ${Math.abs(vs200).toFixed(1)}% ${vs200 >= 0 ? 'above' : 'below'} the 200-DMA and ${Math.abs(vs50).toFixed(1)}% ${vs50 >= 0 ? 'above' : 'below'} the 50-DMA. ${belowBoth ? 'Below both — this is the engine\u2019s monetary-sleeve gate: IBIT/SLV stay weight-inert until the 200-DMA reclaim, the standing trigger.' : aboveBoth ? 'Above both — uptrend regime; the BTC 200-DMA reclaim is the standing monetary-sleeve uncap trigger.' : 'Between the two averages — transitional regime.'}`
        : 'Insufficient history for the 200-DMA.',
      enabled: on.ma,
    },
    {
      key: 'vp', name: INDICATOR_DOCS.vp.name, general: INDICATOR_DOCS.vp.general,
      reading: vp ? <>POC {fmtPrice(vp.pocPrice)}<br />VA {fmtPrice(vp.val)}–{fmtPrice(vp.vah)}</> : '—',
      currentRead: vp
        ? `POC at ${fmtPrice(vp.pocPrice)}, ${last >= vp.pocPrice ? 'below current price — acts as support' : 'above current price — the wall of trapped buyers price must reabsorb (resistance)'}. Value area ${fmtPrice(vp.val)}–${fmtPrice(vp.vah)} over the last ~365 sessions.`
        : 'The data feed carries no volume for this symbol, so the profile cannot be computed.',
      enabled: on.vp,
      unavailable: hasVolume ? undefined : 'volume unavailable',
    },
    {
      key: 'vwap', name: INDICATOR_DOCS.vwap.name, general: INDICATOR_DOCS.vwap.general,
      reading: vwapNow !== null && vwapNow !== undefined ? <>{fmtPrice(vwapNow)} {pill(vsVwap !== null && vsVwap >= 0 ? 'ABOVE' : 'BELOW', !(vsVwap !== null && vsVwap >= 0))}</> : '—',
      currentRead: vwapNow !== null && vwapNow !== undefined && vsVwap !== null
        ? `Price is ${Math.abs(vsVwap).toFixed(1)}% ${vsVwap >= 0 ? 'above' : 'below'} cycle-anchored VWAP (${fmtPrice(vwapNow)}, anchored at the window low). ${vsVwap < 0 ? 'The average cycle-long holder is underwater — historically a capitulation-phase marker; VWAP reclaim tends to slightly lead the 200-DMA reclaim, making this the earliest-warning line for the uncap trigger.' : 'The average cycle-long holder is in profit — supportive.'}`
        : 'The data feed carries no volume for this symbol, so VWAP cannot be computed.',
      enabled: on.vwap,
      unavailable: hasVolume ? undefined : 'volume unavailable',
    },
    {
      key: 'rsi', name: INDICATOR_DOCS.rsi.name, general: INDICATOR_DOCS.rsi.general,
      reading: rsiVal !== null ? <>{rsiVal.toFixed(1)} {rsiVal < 30 ? pill('OVERSOLD', false) : rsiVal > 70 ? pill('OVERBOUGHT', true) : <span style={{ color: theme.textTertiary }}>NEUTRAL</span>}</> : '—',
      currentRead: rsiVal !== null
        ? `RSI(14) at ${rsiVal.toFixed(1)}. ${rsiVal < 30 ? 'Oversold — selloff stretched; watch for divergence at any new price low.' : rsiVal > 70 ? 'Overbought — rally stretched.' : rsiVal < 40 ? 'Approaching the oversold zone; if price makes a lower low while RSI holds a higher low, that is bullish divergence — the highest-quality bottoming signal here.' : 'Mid-range — no edge from RSI alone.'}`
        : 'Insufficient history for RSI.',
      enabled: on.rsi,
    },
    {
      key: 'fib', name: INDICATOR_DOCS.fib.name, general: INDICATOR_DOCS.fib.general,
      reading: ew.targets.length ? <>{ew.targets.map((t) => <span key={t.label}>{t.label}: {fmtPrice(t.price)}<br /></span>)}</> : '—',
      currentRead: ew.targets.length
        ? `${targetsStr}. Levels derive from the current ${ew.phase} count; they move if the count changes.`
        : 'No active fib targets — the wave count is indeterminate or in a completed phase.',
      enabled: on.fib,
    },
  ]

  const chip = (label: string, active: boolean, phase?: string) => (
    <span key={label} title={phase} style={{ padding: '6px 13px', borderRadius: 999, border: `1px solid ${active ? theme.accent : theme.border}`, fontSize: 12.5, color: active ? theme.bg : theme.textSecondary, background: active ? theme.accent : 'transparent', fontWeight: active ? 700 : 400, opacity: active ? 1 : 0.4, cursor: active ? 'default' : 'not-allowed' }}>{label}</span>
  )

  const stat = (label: string, value: ReactNode, sub: ReactNode, color?: string) => (
    <div style={{ ...glass, padding: '16px 18px' }}>
      <div style={{ fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: theme.textTertiary, fontWeight: 400, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: color ?? theme.textPrimary, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>{value}</div>
      <div style={{ fontSize: 11, color: theme.textTertiary, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>{sub}</div>
    </div>
  )

  return (
    <div>
      {/* Ticker chips */}
      <div style={{ ...glass, display: 'flex', gap: 8, alignItems: 'center', padding: '12px 16px', marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', color: theme.textTertiary, fontWeight: 600, marginRight: 4 }}>Asset</span>
        {chip('BTC-USD', true)}
        {PHASE2_TICKERS.map((tk) => chip(tk, false, 'Phase 2'))}
        {PHASE3_TICKERS.map((tk) => chip(tk, false, 'Phase 3'))}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: theme.textTertiary }}>Phase 1 BTC · candles as of {asOf} · display-only, never feeds the engine</span>
      </div>

      {/* Stat strip */}
      <div className="ap-trading-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
        <style>{`@media (max-width: 900px) { .ap-trading-stats { grid-template-columns: repeat(2, minmax(0,1fr)) !important; } }`}</style>
        {stat('BTC-USD Last', fmtPrice(last), <span style={{ color: theme.negative }}>{pct(last, cycleHigh).toFixed(1)}% from window high {fmtPrice(cycleHigh)}</span>)}
        {stat('vs 200-DMA', vs200 !== null ? `${vs200 >= 0 ? '+' : ''}${vs200.toFixed(1)}%` : '—',
          <>200: {sma200Now !== null ? fmtPrice(sma200Now) : '—'} · 50: {sma50Now !== null ? fmtPrice(sma50Now) : '—'}{belowBoth ? ' · below both → monetary sleeve capped' : aboveBoth ? ' · above both → uncap trigger zone' : ''}</>,
          vs200 !== null ? (vs200 >= 0 ? theme.positive : theme.negative) : undefined)}
        {stat('EW Phase', <span style={{ color: theme.accent }}>{ew.phase}</span>,
          <>{targetsStr || 'no active targets'}{ew.invalidation ? ` · invalid > ${fmtPrice(ew.invalidation.price)}` : ''} · conf {ew.confidence}</>)}
        {stat('Composite', pill(composite, compositeBear),
          <>{bears} bear / {bulls} bull of {votes.length} enabled · RSI {rsiVal !== null ? rsiVal.toFixed(1) : '—'}</>)}
      </div>

      {/* Chart (full width) then indicators below — Option C */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ ...glass, borderRadius: 16, padding: '16px 18px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <span style={{ fontSize: 15, fontWeight: 700, color: theme.textPrimary }}>BTC-USD · Daily</span>{' '}
              <span style={{ fontSize: 11.5, color: theme.textTertiary }}>{N} candles · through {asOf}</span>
            </div>
            <div style={{ fontSize: 11.5, color: theme.textTertiary }}>Solid = actual · dotted = projected wave path (algo count, {ew.confidence} confidence)</div>
          </div>
          <TradingChart candles={candles} theme={theme} on={on} sma50={s50} sma200={s200} vwap={vwapArr} rsi={rsiArr} vp={on.vp ? vp : null} ew={ew} />
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8, fontSize: 11, color: theme.textSecondary }}>
            <span><i style={{ display: 'inline-block', width: 14, height: 3, borderRadius: 2, background: '#6a9fd8', marginRight: 5 }} />SMA 50</span>
            <span><i style={{ display: 'inline-block', width: 14, height: 3, borderRadius: 2, background: '#d8b46a', marginRight: 5 }} />SMA 200</span>
            <span><i style={{ display: 'inline-block', width: 14, height: 3, borderRadius: 2, background: '#a98ad8', marginRight: 5 }} />VWAP (anchored window low)</span>
            <span><i style={{ display: 'inline-block', width: 14, height: 3, borderRadius: 2, background: 'rgba(224,145,92,0.85)', marginRight: 5 }} />Elliott labels / projection</span>
            <span><i style={{ display: 'inline-block', width: 14, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.25)', marginRight: 5 }} />Volume profile · <b style={{ color: theme.accent }}>—</b> POC</span>
          </div>
        </div>
        <IndicatorPanel entries={entries} onToggle={(key, value) => setOn((prev) => ({ ...prev, [key]: value }))} theme={theme} />
      </div>
    </div>
  )
}
