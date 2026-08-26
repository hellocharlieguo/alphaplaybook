#!/usr/bin/env python3
"""
patch_reseat_mu_mrvl.py — OFFLINE EVALUATION ONLY.

Adds MU and MRVL to rescore_v34.py's BOOK as UNHELD candidates (current_weight=0,
held=False) to see where the engine seats them on their own merits. Changes
nothing live: signal_model_config.json, signal_engine.py and daily-cron.cjs
are untouched.

WHY THIS IS WORTH RE-EXAMINING
------------------------------
v3.3 de-seated both on 2026-07-15 because "SOXX carries them" (MU ~9% of SOXX,
MRVL ~4.9%). Two things have since undercut that:

1. SOXX itself now scores to 4.0% (was deployed 12%). At 4%, SOXX delivers
   MU 0.36% and MRVL 0.20% effective exposure. That is not coverage.
   Knock-on: Thematic_Sleeve_Weights.md claims effective memory = SKHY 8 +
   SOXX's MU slice ~= 9.1%. At these targets it is 6.0 + 0.36 = 6.4% -- a ~30%
   cut to the memory conviction that nobody decided.

2. coverage_discount.exempt (config line 313) NAMES MRVL as exempt:
   "single names whose THEME has no held ETF (e.g. optical: GLW/MRVL --
   appearing at trivial weight inside a broad basket ... does NOT count as
   theme coverage)". The v3.3 de-seat rationale is the exact argument that
   clause rejects. MU's theme is MEMORY; SOXX is broad semis, not a memory
   vehicle, so the same reading plausibly applies.

Rule B (lambda 0.814) is driven by coverage_discount.redundant_by_sleeve, which
was NOT read in-session. If those sleeves are listed there, the discount still
fires and these rows will land lower than they should. CHECK FIRST:

    python3 -c "import json;print(json.dumps(json.load(open('signal_model_config.json'))['coverage_discount']['redundant_by_sleeve'],indent=2))"

Run:  cd ~/Desktop/alphaplaybook && python3 patch_reseat_mu_mrvl.py
"""

import shutil
import sys
from datetime import datetime
from pathlib import Path

P = Path("rescore_v34.py")
ts = datetime.now().strftime("%Y%m%d-%H%M%S")

# ---------------------------------------------------------------------------
# Candidate rows. Technicals VERIFIED from the 2026-08-21 pull.
# s1 comes from config raw_s1 (MU 82, MRVL 83) x stage multiplier, applied by
# s1_axes -- both are already in the bottleneck axis names list.
# s5 = None so the ladder computes it (pull showed MU ~58, MRVL ~51).
# ---------------------------------------------------------------------------
ROW_ANCHOR = '    # --- AI Application (hand_s1 = four-axis dominance scores, NOT the v3.0 values) ---'

NEW_ROWS = '''    # --- CANDIDATES: unheld (cw=0, held=False). Re-seat evaluation only. ---
    # MU  s2 78 mirrors SKHY -- same memory stage (`working`, flipped 8/11).
    #     s6 TODO 45: +747% trailing year is real valuation risk. Seeded LOW
    #     (higher s6 = less risk in this scale). Set deliberately.
    #     lenses 2 = Visser (rebought ~$700, 7-handle) + ZaStocks ("Added").
    #     NOTE: the live voice_mentions ledger still reports MU at 1 lens --
    #     it has not ingested the ZaStocks leg. 2 is the CORRECTED value.
    ("MU",    "company",          78, 0, 45, 2,  980.77,  964.87,  571.17, 55.74, 747.02,  0.00, False, True,  None, None),
    # MRVL s2 70 = optical/chips, cooling -- matches ASML's 70, below GLW's 78.
    #     lenses 2 = Visser + ZaStocks, straight from the pull's CONVERGENCE flag.
    ("MRVL",  "company",          70, 0, 50, 2,  249.91,  234.11,  145.14, 60.89, 250.95,  0.00, False, True,  None, None),

'''

# held is currently hardcoded True; derive it from weight instead
OLD_HELD = "                trailing_1y_pct=r[10], held=True, current_weight=r[11],"
NEW_HELD = "                trailing_1y_pct=r[10], held=(r[11] > 0), current_weight=r[11],"

# stages for the two new bottleneck names
OLD_STAGES = '''    "ASML": "cooling",
}'''
NEW_STAGES = '''    "ASML": "cooling",
    "MU":   "working",   # memory, same stage as SKHY
    "MRVL": "cooling",   # optical/chips
}'''

# preflight guard: MU/MRVL are expected now, so relax the stale-name check
OLD_GUARD = '''    for stale in ("MU", "MRVL"):
        if stale in CURWT:
            errs.append(f"{stale} present — v3.3 de-seated it (SOXX carries it)")'''
NEW_GUARD = '''    for stale in ("MU", "MRVL"):
        if CURWT.get(stale, 0) > 0:
            errs.append(f"{stale} carries weight — v3.3 de-seated it; "
                        "candidates must be cw=0/held=False")'''

# display + ordering
OLD_DISP = '''    "GLW": "bottleneck", "ASML": "bottleneck", "COPX": "physical",'''
NEW_DISP = '''    "GLW": "bottleneck", "ASML": "bottleneck", "COPX": "physical",
    "MU": "bottleneck*", "MRVL": "bottleneck*",'''

OLD_ORDER = '''    order = ["AIPO", "SOXX", "SKHY", "ASML", "GLW", "COPX",'''
NEW_ORDER = '''    order = ["AIPO", "SOXX", "SKHY", "ASML", "GLW", "COPX", "MU", "MRVL",'''

OLD_SLEEVE = '''        "AI Compute": ["AIPO", "SOXX", "SKHY", "ASML", "GLW", "COPX"],'''
NEW_SLEEVE = '''        "AI Compute": ["AIPO", "SOXX", "SKHY", "ASML", "GLW", "COPX", "MU", "MRVL"],'''


def die(m):
    sys.exit(f"\n  ABORT: {m}\n")


if not Path(".git").is_dir():
    die("not in the repo root. cd ~/Desktop/alphaplaybook first.")
if not P.is_file():
    die(f"{P} not found.")

src = P.read_text(encoding="utf-8")

if '("MU",    "company"' in src:
    print("\n  Already patched. Nothing to do.\n")
    sys.exit(0)

edits = [
    ("candidate rows", ROW_ANCHOR, NEW_ROWS + ROW_ANCHOR),
    ("held derivation", OLD_HELD, NEW_HELD),
    ("stages", OLD_STAGES, NEW_STAGES),
    ("preflight guard", OLD_GUARD, NEW_GUARD),
    ("display map", OLD_DISP, NEW_DISP),
    ("print order", OLD_ORDER, NEW_ORDER),
    ("sleeve rollup", OLD_SLEEVE, NEW_SLEEVE),
]

for label, old, _ in edits:
    n = src.count(old)
    if n != 1:
        die(f"{label} anchor found {n}x, expected exactly 1")
print(f"  ok    all {len(edits)} anchors unique")

out = src
for _, old, new in edits:
    out = out.replace(old, new, 1)

if out.count('("MU",    "company"') != 1 or out.count('("MRVL",') != 1:
    die("candidate rows did not land exactly once — not writing")

bak = f"{P}.bak.{ts}"
shutil.copy2(P, bak)
P.write_text(out, encoding="utf-8")

print(f"  ok    backup -> {bak}")
print("  ok    MU + MRVL added as cw=0 / held=False candidates")
print("  ok    held now derived from weight, not hardcoded")
print(f"""
Next:
    python3 -m py_compile rescore_v34.py && python3 rescore_v34.py

Rollback:
    cp {bak} rescore_v34.py
""")
