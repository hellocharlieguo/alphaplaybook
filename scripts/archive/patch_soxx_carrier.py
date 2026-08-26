#!/usr/bin/env python3
"""
patch_soxx_carrier.py — OFFLINE EVALUATION ONLY.

Adds a carrier-blend S1 override + corrected s2 for SOXX to rescore_v34.py.
Touches NOTHING else: signal_model_config.json, signal_engine.py and
server/daily-cron.cjs are all untouched. This only changes what the offline
harness prints, so the correction can be judged before anything is frozen.

Rationale (both edits):
  S1  SOXX raw 70 was set 2026-07-05, BEFORE the 7/15 v3.3 de-seating moved
      MU (~9% of SOXX) and MRVL (~4.9%) into the basket. Their own axis scores
      are 82 and 83 and are still live in config, now orphaned. Carrier blend:
          .090*82 + .049*83 + .861*70 = 71.7  -> 72
      A +2 raw correction. After cooling x0.80 this is 56.0 -> 57.6.
  s2  60 was a seeded TODO carried from v3.0 and is the lowest in the book
      (GLW 78, SKHY 78, AIPO 72, ASML 70) despite SOXX now spanning a WORKING
      stage (memory, flipped 8/11) and a COOLING one (chips). Breadth blend of
      SKHY's 78 and cooling-chips ~65 -> 70.

Neither number is reverse-engineered from a target ranking. Expected result is
that SOXX closes ~3.5 of the ~8.1-point composite gap to GLW and still does
NOT clear it. If it did clear, that would be the tell that the numbers were
bent rather than corrected.

Run:  cd ~/Desktop/alphaplaybook && python3 patch_soxx_carrier.py
"""

import shutil
import sys
from datetime import datetime
from pathlib import Path

P = Path("rescore_v34.py")
ts = datetime.now().strftime("%Y%m%d-%H%M%S")

OLD_S2 = '("SOXX",  "company",          60, 0, 55, 1,'
NEW_S2 = '("SOXX",  "company",          70, 0, 55, 1,'

ANCHOR_BUILD = "def build(regime):"
BLOCK = '''# ---------------------------------------------------------------------------
# OFFLINE EVALUATION ONLY — deliberately NOT written to signal_model_config.json,
# which the cron reads. Judge the corrected book first, then decide whether the
# config change is warranted.
#
# SOXX raw_s1 70 predates the 2026-07-15 v3.3 de-seating that moved MU (~9% of
# SOXX) and MRVL (~4.9%) into the basket. Both still carry live axis scores in
# config (MU 82, MRVL 83) and are now orphaned there.
#     carrier blend = .090*82 + .049*83 + .861*70 = 71.7 -> 72
# ---------------------------------------------------------------------------
S1_RAW_OVERRIDE = {"SOXX": 72}


'''

INSERT_AFTER = "        s1 = r[14] if s1 is None else s1"
INSERT = '''        if name in S1_RAW_OVERRIDE:
            stage = regime["stages"].get(name, "cooling")
            mult = CFG["three_axes"]["bottleneck"]["stage_decay"][stage]
            s1 = S1_RAW_OVERRIDE[name] * mult'''


def die(m):
    sys.exit(f"\n  ABORT: {m}\n")


if not Path(".git").is_dir():
    die("not in the repo root. cd ~/Desktop/alphaplaybook first.")
if not P.is_file():
    die(f"{P} not found — copy it in from ~/Downloads first.")

src = P.read_text(encoding="utf-8")

if "S1_RAW_OVERRIDE" in src:
    print("\n  Already patched. Nothing to do.\n")
    sys.exit(0)

for label, anchor in (("SOXX s2 row", OLD_S2),
                      ("build() def", ANCHOR_BUILD),
                      ("s1 fallback line", INSERT_AFTER)):
    n = src.count(anchor)
    if n != 1:
        die(f"{label} anchor found {n}x, expected exactly 1")
print("  ok    all three anchors unique")

out = src.replace(OLD_S2, NEW_S2, 1)
out = out.replace(ANCHOR_BUILD, BLOCK + ANCHOR_BUILD, 1)
out = out.replace(INSERT_AFTER, INSERT_AFTER + "\n" + INSERT, 1)

if out.count("S1_RAW_OVERRIDE") != 3:  # 1 defn + 2 uses in build()
    die("override appears the wrong number of times — not writing")

bak = f"{P}.bak.{ts}"
shutil.copy2(P, bak)
P.write_text(out, encoding="utf-8")

print(f"  ok    backup -> {bak}")
print(f"  ok    SOXX s2 60 -> 70")
print(f"  ok    SOXX raw S1 70 -> 72 (offline only)")
print(f"""
Next:
    python3 -m py_compile rescore_v34.py && python3 rescore_v34.py

Rollback:
    cp {bak} rescore_v34.py
""")
