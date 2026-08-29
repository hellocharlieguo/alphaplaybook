#!/usr/bin/env python3
"""AlphaPlaybook — NO-DMA gate branch + ret_incep in paste-ready output.

A) `d.price < d.d200` is false when d200 is null (JS coerces null->0), so a
   symbol with no 200-DMA printed NO gate flag -- visually identical to a name
   that passed the gate. Add an explicit no_dma branch, checked FIRST.
B) ret1y is now null for <252 bars (correct), but the real since-inception
   number was dropped from the paste-ready line. Emit ret_incep + bars so the
   runner can see why ret1y is null.
"""
import shutil, sys, time
from pathlib import Path

P = Path("pull_candidates.cjs")
src = P.read_text()

A_OLD = """      const gate = d.price < d.d200 ? '  [BELOW-200 -> entry-paused]' : ''"""
A_NEW = """      const gate = d.no_dma ? '  [NO-DMA -> thesis-seated, S5 must be hand-set]'
                 : (d.price < d.d200 ? '  [BELOW-200 -> entry-paused]' : '')"""

B_OLD = """      convFields = `, lenses_pointing=${c.lenses}, voice_conviction=${c.voiceConviction ? 'True' : 'False'}`"""
B_NEW = """      convFields = `, lenses_pointing=${c.lenses}, voice_conviction=${c.voiceConviction ? 'True' : 'False'}`
    }
    if (d.no_dma) {
      convFields += `, ret_incep=${d.ret_incep == null ? 'null' : d.ret_incep.toFixed(2)}, bars=${d.bars}`"""

for label, old in (("A", A_OLD), ("B", B_OLD)):
    n = src.count(old)
    if n != 1:
        sys.exit(f"ABORT: anchor {label} matched {n} times, expected 1. No changes written.")

bak = f"pull_candidates.cjs.bak.{time.strftime('%Y%m%d-%H%M%S')}"
shutil.copy2(P, bak)
src = src.replace(A_OLD, A_NEW, 1).replace(B_OLD, B_NEW, 1)
P.write_text(src)
print(f"OK: 2 anchors patched. backup -> {bak}")
