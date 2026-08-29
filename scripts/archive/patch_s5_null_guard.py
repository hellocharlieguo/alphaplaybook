#!/usr/bin/env python3
"""AlphaPlaybook — null-guard s5score() + split ret1y/ret_incep.

ROOT CAUSE (verified 2026-08-10): JS coerces null->0, so for a symbol with no
50/200-DMA (SKHY, 22 bars since 2026-07-10):
  price < d200  -> false  (135.35 < 0)      -> base falls to 58 ("riding")
  (price-d50)/d50 -> Infinity               -> rp=12 (max velocity penalty)
  clamp Math.max(5,Math.min(95,58-6))       -> s5=52  <- fabricated, looks plausible
Also: [BELOW-200] flag never printed, because `price < null` is false.
Also: ret1y used closes[0] when bars<252 -> since-inception return mislabeled
      as 1-year (SKHY "-19.44%" is from its first close, $168.01).

Fix: null-in/null-out BEFORE the clamp; add no_dma flag; split ret1y/ret_incep;
expose bars. Three anchored replacements, count==1 each, .bak-guarded.
"""
import shutil, sys, time
from pathlib import Path

P = Path("pull_candidates.cjs")
src = P.read_text()

# --- A: insert the null guard right after the function signature -------------
A_OLD = """function s5score(price, d50, d200, rsi) {
  const base = price < d200 ? 45 : (price < d50 ? 72 : 58)"""

A_NEW = """function s5score(price, d50, d200, rsi) {
  // No DMA -> no trend read. Null-in/null-out BEFORE the clamp.
  // (JS coerces null->0: `price < null` is false and `(price-d50)/d50` is
  //  Infinity, which silently produced base=58, rp=12, s5=52 for SKHY.)
  if (d50 == null || d200 == null) {
    return { s5: null, base: null, stretch: null, pen: null, no_dma: true }
  }
  const base = price < d200 ? 45 : (price < d50 ? 72 : 58)"""

# --- B: tag the normal return path -------------------------------------------
B_OLD = """  return { s5: Math.max(5, Math.min(95, base - pen)), base, stretch: st, pen }"""
B_NEW = """  return { s5: Math.max(5, Math.min(95, base - pen)), base, stretch: st, pen, no_dma: false }"""

# --- C: stop labelling since-inception returns as ret1y ----------------------
C_OLD = """  const yrAgo = closes.length >= 252 ? closes[closes.length - 252] : closes[0]
  const ret1y = (price / yrAgo - 1) * 100
  return { sym, price, d50, d200, rsi, ret1y, ...s5score(price, d50, d200, rsi) }"""

C_NEW = """  const bars = closes.length
  const hasYear = bars >= 252
  const ret1y = hasYear ? (price / closes[bars - 252] - 1) * 100 : null
  const ret_incep = hasYear ? null : (price / closes[0] - 1) * 100
  return { sym, price, d50, d200, rsi, ret1y, ret_incep, bars, ...s5score(price, d50, d200, rsi) }"""

for label, old in (("A", A_OLD), ("B", B_OLD), ("C", C_OLD)):
    n = src.count(old)
    if n != 1:
        sys.exit(f"ABORT: anchor {label} matched {n} times, expected 1. No changes written.")

bak = f"pull_candidates.cjs.bak.{time.strftime('%Y%m%d-%H%M%S')}"
shutil.copy2(P, bak)
src = src.replace(A_OLD, A_NEW, 1).replace(B_OLD, B_NEW, 1).replace(C_OLD, C_NEW, 1)
P.write_text(src)
print(f"OK: 3 anchors patched. backup -> {bak}")
