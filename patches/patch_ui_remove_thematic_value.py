#!/usr/bin/env python3
"""
patch_ui_remove_thematic_value.py — Performance tab: drop the "Thematic Value"
dollar card, leaving Return / Alpha / Max Drawdown / Days Tracked.

Rationale beyond layout: a dollar figure on a Performance tab reads like an
account balance. Percentages and a day count read like a track record. The
Portfolio tab keeps dollar sizing under its "Sizing only" caption, which is
where a dollar number belongs.

Days Tracked stays last. The card row is flex/auto-fit (no gridTemplateColumns
in this file), so four cards reflow without further change — confirm visually.

Usage:
    python3 patch_ui_remove_thematic_value.py            # dry run
    python3 patch_ui_remove_thematic_value.py --apply
"""
import re, sys, shutil, datetime, pathlib

TARGET = pathlib.Path("src/components/PnLTracker.tsx")
APPLY  = "--apply" in sys.argv

OLD = ('        <PnLStatCard label="Thematic Value" value={`$${currentValue.toLocaleString('
       'undefined, { maximumFractionDigits: 0 })}`} color={t.textPrimary} t={t} />\n')

MUST_KEEP = [
    'label="Thematic Return"',
    'label="Thematic Alpha"',
    'label="Max Drawdown"',
    'label="Days Tracked"',
]

def die(m):
    print(f"\nABORT: {m}\nNo files were written.")
    sys.exit(1)

if not TARGET.exists():
    die(f"{TARGET} not found — run from ~/Desktop/alphaplaybook")

src = TARGET.read_text()

n = src.count(OLD)
if n == 0:
    if 'label="Thematic Value"' not in src:
        die("already applied — Thematic Value card is gone")
    die("card found but not byte-identical to the expected line.\n"
        "       Paste `grep -n 'Thematic Value' src/components/PnLTracker.tsx` and stop.")
if n != 1:
    die(f"Thematic Value card appears {n} times, expected 1")

out = src.replace(OLD, "", 1)

for a in MUST_KEEP:
    if out.count(a) != 1:
        die(f"expected exactly 1 {a}, found {out.count(a)}")

if out.count("<PnLStatCard") != src.count("<PnLStatCard") - 1:
    die("PnLStatCard count did not drop by exactly 1")
if out.count("\n") != src.count("\n") - 1:
    die(f"line delta {out.count(chr(10)) - src.count(chr(10)):+d}, expected -1")

if "currentValue" in out:
    print(f"note: `currentValue` still referenced {out.count('currentValue')}x elsewhere — left in place")
else:
    print("note: `currentValue` no longer referenced; tsc may flag it as unused (noUnusedLocals)")

print(f"ok  removed Thematic Value card")
print(f"remaining, in order: Thematic Return | Thematic Alpha | Max Drawdown | Days Tracked")
print(f"PnLStatCard {src.count('<PnLStatCard')} -> {out.count('<PnLStatCard')}")
print(f"line count  {src.count(chr(10))} -> {out.count(chr(10))}  (-1, expected)")

if not APPLY:
    print("\nDRY RUN — nothing written. Re-run with --apply")
    sys.exit(0)

bak = TARGET.with_suffix(TARGET.suffix + f".bak.{datetime.datetime.now():%Y%m%d-%H%M%S}")
shutil.copy2(TARGET, bak)
TARGET.write_text(out)
print(f"\nwrote {TARGET}\nbackup {bak}")
print("\nNEXT:\n  npm run build")
