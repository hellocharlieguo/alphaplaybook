#!/usr/bin/env python3
"""fix_mu_preflight.py — the v3.4 preflight guard contradicts the v3.4 design.

MU is deliberately cw=0 / held=False: it is an UNHELD candidate, so SKHY's
freed 8.0 is redistributed by the engine rather than handed to MU by fiat.
But the guard tested CURWT.get("MU", 0) <= 0, which is exactly that state.
Test for PRESENCE in the BOOK, not for weight.
"""
import shutil, sys
from datetime import datetime
from pathlib import Path

P = Path("rescore_v34.py"); ts = datetime.now().strftime("%Y%m%d-%H%M%S")
OLD = '''    if CURWT.get("MU", 0) <= 0:
        errs.append("MU missing - v3.4 seats it as the memory satellite")'''
NEW = '''    if "MU" not in CURWT:
        errs.append("MU missing - v3.4 seats it as the memory satellite")
    if CURWT.get("MU", 0) != 0:
        errs.append(f"MU cw={CURWT['MU']} - must be 0/held=False so the engine "
                    "redistributes SKHY's freed 8.0 rather than being handed it")'''

if not Path(".git").is_dir(): sys.exit("\n  ABORT: cd ~/Desktop/alphaplaybook first\n")
src = P.read_text(encoding="utf-8")
if 'if "MU" not in CURWT' in src:
    print("\n  Already fixed.\n"); sys.exit(0)
if src.count(OLD) != 1: sys.exit(f"\n  ABORT: anchor found {src.count(OLD)}x, expected 1\n")
shutil.copy2(P, f"{P}.bak.{ts}")
P.write_text(src.replace(OLD, NEW, 1), encoding="utf-8")
print(f"  ok    backup -> {P}.bak.{ts}")
print("  ok    guard now tests presence, and asserts cw==0")
