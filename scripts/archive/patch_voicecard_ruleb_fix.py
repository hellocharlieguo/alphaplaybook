#!/usr/bin/env python3
"""
patch_voicecard_ruleb_fix.py — corrects a factual error shipped live 2026-08-17.

THE ERROR (src/data/voiceCards.ts, ZaStocks card, "AI Compute -- memory & the
new leaders"):

    "...and Rule B's lambda-0.92 coverage discount applies to exactly this
     situation, so the convergence is logged and the exposure stays inside
     the basket."

Two independent mistakes, both public-facing on the Signals tab:

  1. WRONG VALUE.  coverage_discount.lambda is 0.814, not 0.92. Verified in
     signal_model_config.json line 312.

  2. WRONG MECHANISM.  Rule B never applied to MU at all. Coverage is read from
     coverage_discount.redundant_by_sleeve, which is:
         { aggressive: [CEG, BE], conservative: [CEG, VST] }
     -- power names only. Neither MU's sleeve nor MRVL's is listed, so no
     discount was ever computed for either. Config line 313 goes further and
     names MRVL as EXEMPT: "single names whose THEME has no held ETF (e.g.
     optical: GLW/MRVL -- appearing at trivial weight inside a broad basket
     like XSD does NOT count as theme coverage)".

The v3.3 de-seating of MU was a BOOK-CONSTRUCTION decision with no engine rule
behind it. That distinction matters: it is exactly why the offline rescore
re-seats MU at ~9% the moment it is allowed to compete.

Anchored on an apostrophe-free substring so smart-quote encoding cannot break
the match. Replaces one clause; the rest of the editorial is untouched.

Run:  cd ~/Desktop/alphaplaybook && python3 patch_voicecard_ruleb_fix.py
"""

import shutil
import sys
from datetime import datetime
from pathlib import Path

P = Path("src/data/voiceCards.ts")
ts = datetime.now().strftime("%Y%m%d-%H%M%S")

OLD = ("\u03bb0.92 coverage discount applies to exactly this situation, "
       "so the convergence is logged")

NEW = ("\u03bb0.814 coverage discount is scoped to power names only and was "
       "never applied here, so the de-seating was book construction rather "
       "than an engine rule; the convergence is logged")


def die(m):
    sys.exit(f"\n  ABORT: {m}\n")


if not Path(".git").is_dir():
    die("not in the repo root. cd ~/Desktop/alphaplaybook first.")
if not P.is_file():
    die(f"{P} not found.")

src = P.read_text(encoding="utf-8")

if "\u03bb0.814 coverage discount is scoped" in src:
    print("\n  Already corrected. Nothing to do.\n")
    sys.exit(0)

n = src.count(OLD)
if n != 1:
    die(f"anchor found {n}x, expected exactly 1 "
        "(has the card been edited since 8/17?)")
print("  ok    anchor unique")

out = src.replace(OLD, NEW, 1)

if "\u03bb0.92" in out:
    die("lambda-0.92 still present elsewhere in the file -- inspect manually")
if len(out) <= len(src):
    die("replacement did not lengthen the file as expected -- not writing")
print("  ok    no residual lambda-0.92 in file")

bak = f"{P}.bak.{ts}"
shutil.copy2(P, bak)
P.write_text(out, encoding="utf-8")

print(f"  ok    backup -> {bak}")
print(f"  ok    corrected {P}")
print(f"""
Verify, build, ship:

    grep -n "0.814 coverage discount" {P}
    npm run build
    git add {P}
    git commit -m "Voice cards: correct Rule B claim - lambda is 0.814 and never applied to MU"
    git push origin main

Rollback:
    cp {bak} {P}
""")
