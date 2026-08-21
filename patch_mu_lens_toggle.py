#!/usr/bin/env python3
"""
patch_mu_lens_toggle.py — makes MU's lens count a single named toggle in
rescore_v34.py, so the convergence-dependency of its seat can be measured.

WHY. pull_candidates.cjs line 147 computes lenses purely from the ledger:
    lenses: Math.min(3, voices.length)
No BASE_PORTFOLIO filter, so de-seated names are NOT suppressed -- the ledger
simply lacks the ZaStocks MU leg from the 8/10-8/17 window. (MRVL returned
lenses=2 from the same pull, proving Za legs do ingest.)

So the 2 currently hard-coded in MU's BOOK row is a HAND CORRECTION, not data.
At 1 leg the convergence bonus goes to zero: 60 x 0.10 = 6 composite points.

Set MU_LENSES = 1 to see MU's floor case, 2 for the corrected case. The gap
between the two runs is how much of MU's seat is convergence vs merit.

Run:  cd ~/Desktop/alphaplaybook && python3 patch_mu_lens_toggle.py
"""
import shutil, sys
from datetime import datetime
from pathlib import Path

P = Path("rescore_v34.py")
ts = datetime.now().strftime("%Y%m%d-%H%M%S")

OLD_ROW = '("MU",    "company",          78, 0, 45, 2,'
NEW_ROW = '("MU",    "company",          78, 0, 45, MU_LENSES,'

ANCHOR = "BOOK = ["
BLOCK = '''# MU lens count. The ledger reports 1 (the ZaStocks "Added" leg from the
# 8/10-8/17 window was never logged to voice_mentions); 2 is the corrected
# value. Convergence pays 60 x 0.10 = 6 composite points, so this single
# number moves MU's seat materially. Flip it and re-run to size the effect.
MU_LENSES = 2   # <- set to 1 for the ledger-as-is floor case

'''

def die(m): sys.exit(f"\n  ABORT: {m}\n")

if not Path(".git").is_dir(): die("not in repo root. cd ~/Desktop/alphaplaybook first.")
if not P.is_file(): die(f"{P} not found.")
src = P.read_text(encoding="utf-8")

if "MU_LENSES" in src:
    print("\n  Already patched. Edit MU_LENSES directly (near the BOOK definition).\n")
    sys.exit(0)

for label, a in (("MU row", OLD_ROW), ("BOOK", ANCHOR)):
    n = src.count(a)
    if n != 1: die(f"{label} anchor found {n}x, expected exactly 1")
print("  ok    both anchors unique")

out = src.replace(ANCHOR, BLOCK + ANCHOR, 1).replace(OLD_ROW, NEW_ROW, 1)
if out.count("MU_LENSES") != 2: die("toggle did not land twice -- not writing")

bak = f"{P}.bak.{ts}"
shutil.copy2(P, bak); P.write_text(out, encoding="utf-8")
print(f"  ok    backup -> {bak}")
print(f"  ok    MU lenses is now the MU_LENSES toggle (currently 2)")
print(f"""
Run both cases:

    python3 rescore_v34.py                                  # MU_LENSES = 2
    sed -i '' 's/^MU_LENSES = 2/MU_LENSES = 1/' rescore_v34.py
    python3 rescore_v34.py                                  # MU_LENSES = 1
    sed -i '' 's/^MU_LENSES = 1/MU_LENSES = 2/' rescore_v34.py

Rollback:
    cp {bak} rescore_v34.py
""")
