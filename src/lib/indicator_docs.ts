// src/lib/indicator_docs.ts — explanation copy for the Trading tab indicator panel.
// Single source: edit prose here without touching component JSX. The dynamic
// "current read" line is computed in TradingTab and appended below this text.

export interface IndicatorDoc { name: string; general: string }

export const INDICATOR_DOCS: Record<string, IndicatorDoc> = {
  ew: {
    name: 'Elliott Wave Count',
    general:
      'Elliott Wave theory says markets move in a repeating rhythm: 5 waves in the trend direction (1-2-3-4-5, where 2 and 4 are pullbacks) followed by a 3-wave correction (A-B-C) against it. Hard rules the count must obey: wave 2 never retraces all of wave 1; wave 3 is never the shortest; wave 4 does not overlap wave 1 price territory. The count here is pure-algorithmic (ZigZag pivots + rule validation + Fibonacci scoring) and always displays an invalidation level — a best-fit read, never a certainty.',
  },
  ma: {
    name: 'Moving Averages 50 / 200',
    general:
      'The 50-day tracks the intermediate trend; the 200-day is the long-term regime line. Price above both = uptrend regime; below both = downtrend/repair. The 50 crossing down through the 200 is a "death cross," up through it a "golden cross."',
  },
  vp: {
    name: 'Volume Profile',
    general:
      'The horizontal bars on the right side of the chart. Instead of showing volume over time, it shows volume traded at each price level. Fat bars = acceptance zones where huge volume changed hands (strong support/resistance). Thin bars = rejection zones price moved through fast. POC (Point of Control) = the single highest-volume price. Value Area = the band holding ~70% of all volume (VAH top, VAL bottom).',
  },
  vwap: {
    name: 'Anchored VWAP',
    general:
      'Volume-Weighted Average Price: the average price paid by everyone since a chosen anchor point, weighting big-volume days more — the market\u2019s "fair value" line from that anchor. Above VWAP, the average holder since the anchor is in profit (supportive); below, in loss (overhead supply). Anchored here to the major cycle low, so it answers: is the average bull of this entire cycle still up?',
  },
  rsi: {
    name: 'RSI (14) — sub-pane',
    general:
      'Relative Strength Index measures the speed of recent gains vs losses on a 0\u2013100 scale over 14 days. Above 70 = overbought (rally stretched); below 30 = oversold (selloff stretched). Most powerful signal: divergence — price makes a lower low while RSI makes a higher low, meaning selling momentum is exhausting even as price drops. Default-on; unchecking hides the sub-pane and returns the height to the price chart.',
  },
  fib: {
    name: 'Fibonacci Targets',
    general:
      'Elliott Wave sizing uses Fibonacci ratios: corrective C waves most often travel 1.0\u00d7 the length of wave A, or extend to 1.272\u00d7. B waves typically retrace 0.5\u20130.618 of A. On the way back up, targets use extensions of the prior impulse (1.618\u00d7 is the classic wave-3 target). Drawn as horizontal dashed levels on the chart.',
  },
}
