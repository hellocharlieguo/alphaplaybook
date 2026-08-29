#!/usr/bin/env python3
"""cleanup_v34.py — two corrections after the config patch landed.

1. REMOVE S1_RAW_OVERRIDE. signal_model_config.json now carries SOXX raw_s1=72,
   so the offline override is redundant. Leaving it is worse than redundant: a
   hardcoded value that shadows config is precisely the drift that made
   rescore_current_v3.py unusable. Config becomes the single source of truth
   and the run becomes reproducible from the repo.

2. REWRITE the REVIEW block. It still warns about SKHY's placeholder S5 and
   SOXX's s2=60 -- SKHY is out of the book and s2 is 70.
"""
import re, shutil, sys
from datetime import datetime
from pathlib import Path

P = Path("rescore_v34.py"); ts = datetime.now().strftime("%Y%m%d-%H%M%S")
def die(m): sys.exit(f"\n  ABORT: {m}\n")
if not Path(".git").is_dir(): die("cd ~/Desktop/alphaplaybook first")
src = P.read_text(encoding="utf-8")
if "S1_RAW_OVERRIDE" not in src and "v3.4 REVIEW" in src:
    print("\n  Already cleaned.\n"); sys.exit(0)

import json
cfg = json.load(open("signal_model_config.json"))
soxx = cfg["three_axes"]["bottleneck"]["raw_s1"].get("SOXX")
if soxx != 72:
    die(f"config SOXX raw_s1 is {soxx}, expected 72. Run patch_config_soxx_s1.py first "
        "-- removing the override before config carries the value would silently revert SOXX to 70.")
print("  ok    config confirms SOXX raw_s1 = 72")

# 1. strip the override block + its use
src = re.sub(r"# -+\n# OFFLINE EVALUATION ONLY.*?S1_RAW_OVERRIDE = \{[^}]*\}\n\n\n", "", src, flags=re.S)
src = re.sub(r"\n        if name in S1_RAW_OVERRIDE:\n(?:            .*\n){3}", "\n", src)
if "S1_RAW_OVERRIDE" in src: die("override still present after strip")
print("  ok    S1_RAW_OVERRIDE removed; config is now the single source")

# 2. replace the review block
m = re.search(r'    print\("""REVIEW BEFORE ANY FREEZE:.*?"""\)', src, re.S)
if not m: die("REVIEW block not found")
NEW = '''    print("""v3.4 REVIEW BEFORE ANY FREEZE:
  - SELECTION RULE: sub-theme name count decides basket vs satellite.
    Cores AIPO + SOXX. Satellites only where the sub-theme is 1-2 real
    names: MU (memory), ASML (EUV), GLW (optical, won a 4-name screen on
    lowest velocity + a Visser leg), COPX (copper, physical axis).
  - SKHY REMOVED. Unscoreable until SMA50 ~Sept 18. Trade-off accepted:
    SOXX does not hold SK Hynix, so the HBM-chokepoint exposure is gone,
    not relocated. Effective memory is now MU plus SOXX's Micron slice.
  - ZA_COUNTS=False. ZaStocks nominates, does not size. MU therefore
    scores on its Visser leg alone. pull_candidates.cjs line 147 still
    counts him -- the live ledger and this harness disagree until patched.
  - s2 / s6 are still hand-set. MU s6=45 for the +747% trailing year is
    the one most worth revisiting; it is the main brake on MU's weight.
  - SLV sits -2.97% vs its 200-DMA with vc=True, inside the 3% band by
    0.026pp. Both halves land at 3.0 = the voice floor, so the carve-out
    is weight-NEGATIVE: it strips the s5_held_below_200_floor of 55 and
    leaves raw S5 ~36.
  - IBIT/GLDM/ETHA/HOOD have all reclaimed their 200-DMAs. This, not CPI,
    is what released the monetary sleeve -- cap_relax only touches names
    already in caps, so a reclaimed name never sees the CPI ladder.
  - Nothing here is written to server/daily-cron.cjs.""")'''
src = src[:m.start()] + NEW + src[m.end():]

shutil.copy2(P, f"{P}.bak.{ts}")
P.write_text(src, encoding="utf-8")
print(f"  ok    backup -> {P}.bak.{ts}")
print("  ok    REVIEW block rewritten for v3.4")
print("\nRe-run and confirm SOXX is UNCHANGED at 4.0 -- if it drops to ~3.5,\n"
      "the config value is not being read and the override was load-bearing.\n"
      f"    python3 rescore_v34.py\n\nRollback:\n    cp {P}.bak.{ts} rescore_v34.py\n")
