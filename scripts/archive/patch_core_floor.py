#!/usr/bin/env python3
"""
patch_core_floor.py — CORE FLOOR: SOXX >= 12%. OFFLINE ONLY.

WHAT THIS IS. An explicit, logged structural override -- the same family as the
45% scarcity sleeve cap and the ASML 5->7 monopoly bump. It is NOT a score
change and must not be mistaken for one.

WHY IT IS NEEDED. Severity scores "binding now". A diversified basket is by
construction less binding than any single chokepoint inside it, so SOXX can
never outrank ASML/GLW/MU on S1 no matter how its inputs are corrected -- the
carrier blend (raw 70->72) closed ~3.5 of an 8-point composite gap and still
left SOXX at 4.0, below every satellite. There is no term anywhere in the four
axes that expresses breadth or winner-uncertainty. The early-innings argument
for owning the basket -- semis and optical have too many names to pick a winner
-- is real and the engine simply cannot see it.

So it is recorded as a human override rather than smuggled in as a score.
Contestedness stays a human call; the engine still sizes everything else.

MECHANICS. Applied AFTER normalize and AFTER the scarcity cap. Funding is
pro-rata from the free pool, with three protections: the cash ticker is never
tapped, no name is pushed below min_position_pct, and no voice-floored name is
cut below its floor. If the pool cannot cover the need, it takes what is
available and prints a warning rather than silently under-delivering.

Run:  cd ~/Desktop/alphaplaybook && python3 patch_core_floor.py
"""
import re, shutil, sys
from datetime import datetime
from pathlib import Path

P = Path("rescore_v34.py"); ts = datetime.now().strftime("%Y%m%d-%H%M%S")
def die(m): sys.exit(f"\n  ABORT: {m}\n")
if not Path(".git").is_dir(): die("cd ~/Desktop/alphaplaybook first")
if not P.is_file(): die(f"{P} not found")
src = P.read_text(encoding="utf-8")
if "CORE_FLOORS" in src:
    print("\n  Already patched. Edit CORE_FLOORS directly.\n"); sys.exit(0)

# --- 1. constant + min-position reader -----------------------------------
CONST = '''# CORE FLOOR -- explicit human override, not a score. See module docstring.
# The engine cannot express breadth, so a basket always ranks below the
# chokepoints it contains. This restores the intended core-satellite ordering.
CORE_FLOORS = {"SOXX": 12.0}


def _min_pos(sleeve="aggressive"):
    """min_position_pct from config, whatever the sleeve block is called."""
    for k in ("sleeves", "sleeve_profiles", "profiles", "normalizer"):
        d = CFG.get(k, {})
        if isinstance(d, dict):
            s = d.get(sleeve)
            if isinstance(s, dict) and "min_position_pct" in s:
                return float(s["min_position_pct"])
    return 2.0


'''
if "def build(regime):" not in src: die("build() not found")
src = src.replace("def build(regime):", CONST + "def build(regime):", 1)

# --- 2. apply after the scarcity cap, before return ----------------------
APPLY = '''
    # --- core floor (human override, applied last) ---
    minpos = _min_pos()
    for core, floor in CORE_FLOORS.items():
        cur = w.get(core)
        if cur is None or cur >= floor - 0.01:
            continue
        need = floor - cur
        protected = {"SGOV", core}
        donors = [t for t in w if t not in protected
                  and w[t] > max(minpos, vf.get(t.upper(), 0.0)) + 0.01]
        pool = sum(w[t] - max(minpos, vf.get(t.upper(), 0.0)) for t in donors)
        if pool <= 0:
            print(f"  WARNING: core floor {core}>={floor} unfundable, pool empty")
            continue
        take = min(need, pool)
        if take < need - 0.01:
            print(f"  WARNING: core floor {core}>={floor} only partly funded "
                  f"({take:.1f} of {need:.1f}) -- floors/min-positions bind")
        for t in donors:
            head = w[t] - max(minpos, vf.get(t.upper(), 0.0))
            w[t] = round(w[t] - take * head / pool, 1)
        w[core] = round(cur + take, 1)
        print(f"  core floor: {core} {cur:.1f} -> {w[core]:.1f} "
              f"(+{take:.1f} pro-rata from {len(donors)} names)")
'''
m = re.search(r"(\n    cap = CFG\[.three_axes.\]\[.scarcity_sleeve_cap_pct.\].*?)\n    return w", src, re.S)
if not m: die("scarcity-cap block / return not found in build()")
src = src[:m.end(1)] + APPLY + "\n    return w" + src[m.end(0):]

shutil.copy2(P, f"{P}.bak.{ts}")
P.write_text(src, encoding="utf-8")
print(f"  ok    backup -> {P}.bak.{ts}")
print("  ok    CORE_FLOORS = {'SOXX': 12.0}, applied post-normalize")
print(f"""
    python3 -m py_compile rescore_v34.py && python3 rescore_v34.py

Expect a 'core floor: SOXX 4.0 -> 12.0' line and TOTAL still 100.0.

Rollback:
    cp {P}.bak.{ts} rescore_v34.py
""")
