#!/usr/bin/env python3
"""
patch_v34_bookshape.py — rebuild rescore_v34.py's BOOK to the v3.4 shape.
OFFLINE ONLY. daily-cron.cjs untouched.

SELECTION RULE (new, 2026-08-21): sub-theme NAME COUNT decides basket vs
satellite. Concentrated sub-theme (1-2 real names) -> seat a satellite.
Fragmented sub-theme (many names) -> own it through the basket. This is the
candidate screen the engine never had.

  CORES      AIPO (power) + SOXX (semis)
  SATELLITES memory  -> MU     (sub-theme is SKHY + MU only)
             EUV     -> ASML   (one company on earth)
             optical -> GLW    (multi-name, but SOXX does NOT cover optical --
                                config line 313 names it as having no held ETF,
                                so it needs a satellite chosen by screen.
                                GLW wins: S5 72, ret1y +138% = lowest velocity
                                penalty of the four, and a Visser leg.
                                COHR 72/+242%/0 legs, AAOI 72/+438%/1,
                                LITE 58/+662%/0.)
             copper  -> COPX   (physical axis, itself a basket)

CHANGES
  - SKHY REMOVED. New ADR, ~30 bars, unscoreable until SMA50 ~Sept 18. Its S5
    was a hand placeholder driving the memory split. NOTE THE TRADE-OFF: SOXX
    does NOT hold SK Hynix (Korean, absent from the US index), so this deletes
    the HBM-chokepoint exposure rather than relocating it. Deliberate.
  - MU SEATED at SKHY's 8.0. Memory conviction now expressed via Micron.
  - MRVL NOT seated. Optical is multi-name; and in the 8/10-8/17 window
    ZaStocks had MRVL as "Mentioned" (former-leaders comp), not a positive leg.
  - ZA_COUNTS gate: when False, a ZaStocks-only leg does not contribute to
    lenses_pointing. Za nominates candidates; he does not size them. Config
    already excludes him from voice_conviction -- this extends the same logic
    to the convergence bonus.

Run:  cd ~/Desktop/alphaplaybook && python3 patch_v34_bookshape.py
"""
import re, shutil, sys
from datetime import datetime
from pathlib import Path

P = Path("rescore_v34.py"); ts = datetime.now().strftime("%Y%m%d-%H%M%S")

def die(m): sys.exit(f"\n  ABORT: {m}\n")
if not Path(".git").is_dir(): die("not in repo root. cd ~/Desktop/alphaplaybook first.")
if not P.is_file(): die(f"{P} not found.")
src = P.read_text(encoding="utf-8")
if "ZA_COUNTS" in src:
    print("\n  Already patched. Nothing to do.\n"); sys.exit(0)

# --- 1. gate block -------------------------------------------------------
GATE = '''# ZaStocks sizing gate. He is corroboration-only: his leg puts a name on the
# consideration list, it does not add weight. Config already bars him from
# voice_conviction (pull_candidates.cjs line 16); this extends the same rule to
# the convergence bonus, which is worth 60 x 0.10 = 6 composite points.
# Set True to restore the old behaviour and measure the difference.
ZA_COUNTS = False

# Legs by voice, so the gate can be applied per name rather than hard-coded.
# (Visser, Camillo, ZaStocks) positive legs, 8/10-8/17 window + 120d ledger.
LEGS = {
    "AIPO": (1, 0, 0), "SOXX": (1, 0, 0), "ASML": (1, 0, 0), "GLW":  (1, 0, 0),
    "COPX": (1, 0, 0), "MU":   (1, 0, 1), "LLY":  (1, 0, 0), "AMZN": (1, 1, 0),
    "HOOD": (1, 0, 0), "IBIT": (1, 0, 0), "GLDM": (1, 0, 0), "ETHA": (1, 0, 0),
    "SLV_M": (1, 0, 0), "SLV_P": (1, 0, 0),
}

def lenses(t):
    v, c, z = LEGS.get(t, (0, 0, 0))
    return min(3, v + c + (z if ZA_COUNTS else 0))


'''
src = src.replace("BOOK = [", GATE + "BOOK = [", 1)

# --- 2. new BOOK ---------------------------------------------------------
NEW_BOOK = '''BOOK = [
    # --- CORES ---
    ("AIPO",  "company",          72, 0, 60, lenses("AIPO"),   29.28,   30.71,   27.40, 45.12,  49.08, 16.00, True,  False, None, None),
    ("SOXX",  "company",          70, 0, 55, lenses("SOXX"),  525.96,  558.89,  420.80, 46.66, 117.02, 12.00, True,  False, None, None),

    # --- SATELLITES: concentrated sub-themes only ---
    # MU cw=0 / held=False: not yet held. SKHY's 8.0 is freed, not transferred --
    # the engine decides where it goes.
    ("MU",    "company",          78, 0, 45, lenses("MU"),    980.77,  964.87,  571.17, 55.74, 747.02,  0.00, False, True,  None, None),
    ("ASML",  "company",          70, 0, 55, lenses("ASML"), 1756.97, 1781.40, 1446.50, 49.84, 138.91,  7.00, False, False, None, None),
    ("GLW",   "company",          78, 0, 58, lenses("GLW"),   154.62,  174.20,  140.66, 46.64, 138.28,  4.50, False, False, None, None),
    ("COPX",  "company",          70, 0, 60, lenses("COPX"),   93.80,   81.17,   79.13, 69.01, 101.16,  3.00, True,  False, None, None),

    # --- AI Application ---
    ("LLY",   "company",          90, 0, 60, lenses("LLY"),  1243.74, 1179.35, 1052.92, 57.90,  75.22, 10.00, False, True,  68, None),
    ("AMZN",  "company",          75, 0, 55, lenses("AMZN"),  258.25,  249.72,  238.32, 49.45,  16.36, 10.00, False, True,  60, None),

    # --- Tokenization ---
    ("HOOD",  "company",          78, 0, 55, lenses("HOOD"),  100.66,  100.16,   96.04, 55.67,  -5.31,  6.00, False, True,  61, None),
    ("ETHA",  "macro_hardmoney",  75, 0, 60, lenses("ETHA"),   17.92,   13.84,   17.62, 81.44, -43.89,  2.50, True,  True,  None, None),

    # --- Monetary (vc=True: Visser 8/16 explicit reaffirmation) ---
    ("IBIT",  "macro_hardmoney",  75, 0, 62, lenses("IBIT"),   43.37,   36.28,   43.00, 78.98, -31.90,  4.00, True,  True,  None, None),
    ("GLDM",  "macro_hardmoney",  78, 0, 65, lenses("GLDM"),   90.53,   82.58,   89.07, 69.79,  36.96,  4.00, True,  True,  None, None),
    ("SLV_M", "macro_hardmoney",  80, 0, 62, lenses("SLV_M"),  62.63,   55.63,   64.55, 66.63,  80.94,  3.25, True,  True,  None, None),
    ("SLV_P", "macro_hardmoney",  78, 0, 62, lenses("SLV_P"),  62.63,   55.63,   64.55, 66.63,  80.94,  3.75, True,  True,  None, None),
]'''
m = re.search(r"BOOK = \[.*?\n\]", src, re.S)
if not m: die("BOOK block not found")
src = src.replace(m.group(0), NEW_BOOK, 1)

# --- 4. deployed / stages / display -------------------------------------
src = re.sub(r'DEPLOY = \{.*?\n\}',
'''DEPLOY = {
    "AIPO": 16.0, "SOXX": 12.0, "LLY": 10.0, "AMZN": 10.0,
    "ASML": 7.0, "SLV": 7.0, "HOOD": 6.0, "SGOV": 6.0, "GLW": 4.5,
    "IBIT": 4.0, "GLDM": 4.0, "COPX": 3.0, "ETHA": 2.5,
}''', src, flags=re.S)
src = src.replace('"SKHY": "working",   # memory, same stage as SKHY', '')
src = src.replace('"SKHY": "working",', '')
src = src.replace('"MRVL": "cooling",   # optical/chips', '"MRVL": "cooling",')
src = re.sub(r'\n\s*"SKHY": "bottleneck",', '', src)
src = src.replace('"MU": "bottleneck*", "MRVL": "bottleneck*",', '"MU": "bottleneck",')
src = src.replace('order = ["AIPO", "SOXX", "SKHY", "ASML", "GLW", "COPX", "MU", "MRVL",',
                  'order = ["AIPO", "SOXX", "MU", "ASML", "GLW", "COPX",')
src = src.replace('"AI Compute": ["AIPO", "SOXX", "SKHY", "ASML", "GLW", "COPX", "MU", "MRVL"],',
                  '"AI Compute": ["AIPO", "SOXX", "MU", "ASML", "GLW", "COPX"],')

# --- 5. preflight: SKHY no longer required, MU now seated ---------------
src = re.sub(r'    for stale in \("MU", "MRVL"\):.*?candidates must be cw=0/held=False"\)\n', '', src, flags=re.S)
src = re.sub(r'    if "SKHY" not in CURWT:.*?core defect"\)\n', '''    if "SKHY" in CURWT:
        errs.append("SKHY present - v3.4 removed it (unscoreable until ~Sept 18)")
    if CURWT.get("MU", 0) <= 0:
        errs.append("MU missing - v3.4 seats it as the memory satellite")
''', src, flags=re.S)
src = re.sub(r'    tot = sum\(r\[11\] for r in BOOK\)\n    if abs\(tot \+ DEPLOY\["SGOV"\] - 100\.0\) > 0\.01:\n        errs\.append\(f"BOOK weights \{tot\} \+ SGOV \{DEPLOY\[.SGOV.\]\} != 100"\)',
"""    tot = sum(r[11] for r in BOOK)
    # 86.0 = v3.3 deployed (94.0) minus SKHY's 8.0, which v3.4 frees. MU enters
    # unheld at cw=0, so the 8 points are redistributed by the engine, not moved.
    if abs(tot - 86.0) > 0.01:
        errs.append(f"BOOK weights {tot} != 86.0 (v3.3 deployed less freed SKHY)")""", src)

shutil.copy2(P, f"{P}.bak.{ts}")
P.write_text(src, encoding="utf-8")
print(f"  ok    backup -> {P}.bak.{ts}")
print("  ok    BOOK rebuilt: 14 rows, cores AIPO 18 / SOXX 16, MU seats at 8, SKHY out, MRVL out")
print("  ok    ZA_COUNTS = False (ZaStocks legs no longer size)")
print(f"""
Next:
    python3 -m py_compile rescore_v34.py && python3 rescore_v34.py

Rollback:
    cp {P}.bak.{ts} rescore_v34.py
""")
