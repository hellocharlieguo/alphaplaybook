#!/usr/bin/env python3
"""
patch_ui_drop_currentvalue.py — remove the now-orphaned `currentValue` decl.

Follow-up to patch_ui_remove_thematic_value.py. That card was the only consumer
of `currentValue`; with it gone, tsc fails under noUnusedLocals:

    src/components/PnLTracker.tsx:61:9 - error TS6133:
    'currentValue' is declared but its value is never read.

This removes the declaration and then reports whether its own dependencies
(PORTFOLIO_BASE, latest) have been orphaned in turn, since TS6133 cascades.

Usage:
    python3 patch_ui_drop_currentvalue.py            # dry run
    python3 patch_ui_drop_currentvalue.py --apply
"""
import re, sys, shutil, datetime, pathlib

TARGET = pathlib.Path("src/components/PnLTracker.tsx")
APPLY  = "--apply" in sys.argv

OLD = ("  const currentValue = latest.portfolio_value ?? "
       "PORTFOLIO_BASE * (1 + cumulativeReturn / 100)\n")

def die(m):
    print(f"\nABORT: {m}\nNo files were written.")
    sys.exit(1)

if not TARGET.exists():
    die(f"{TARGET} not found — run from ~/Desktop/alphaplaybook")

src = TARGET.read_text()

if 'label="Thematic Value"' in src:
    die("the Thematic Value card is still present — run "
        "patch_ui_remove_thematic_value.py first, or currentValue is still needed")

n = src.count(OLD)
if n == 0:
    if "currentValue" not in src:
        die("already applied — currentValue is gone")
    die("declaration not byte-identical to the expected line.\n"
        "       Paste `grep -n currentValue src/components/PnLTracker.tsx` and stop.")
if n != 1:
    die(f"declaration appears {n} times, expected 1")

# count real usages, EXCLUDING the declaration line itself (the check that
# should have caught this the first time round)
uses = src.replace(OLD, "").count("currentValue")
if uses != 0:
    die(f"currentValue is still used {uses}x outside its declaration — "
        f"removing it would break the build")

out = src.replace(OLD, "", 1)

if out.count("\n") != src.count("\n") - 1:
    die(f"line delta {out.count(chr(10)) - src.count(chr(10)):+d}, expected -1")
if out.count("const ") != src.count("const ") - 1:
    die("const count did not drop by exactly 1")

print("ok  removed orphaned `currentValue` declaration")
print(f"line count {src.count(chr(10))} -> {out.count(chr(10))}  (-1, expected)")

# cascade check: did removing this orphan anything else?
print("\ncascade check (TS6133 chains):")
for sym in ("PORTFOLIO_BASE", "latest", "cumulativeReturn"):
    c = out.count(sym)
    decl = re.search(rf"^\s*(const|let|import).*\b{sym}\b", out, re.M)
    if c == 0:
        verdict = "gone entirely"
    elif c == 1 and decl:
        verdict = "ONLY the declaration remains -> will error next, tell me"
    else:
        verdict = f"{c} references, still used"
    print(f"  {sym:<18} {verdict}")

if not APPLY:
    print("\nDRY RUN — nothing written. Re-run with --apply")
    sys.exit(0)

bak = TARGET.with_suffix(TARGET.suffix + f".bak.{datetime.datetime.now():%Y%m%d-%H%M%S}")
shutil.copy2(TARGET, bak)
TARGET.write_text(out)
print(f"\nwrote {TARGET}\nbackup {bak}")
print("\nNEXT:\n  npm run build")
