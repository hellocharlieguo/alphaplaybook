#!/usr/bin/env python3
"""
patch_ui_card_geometry.py — two layout fixes in Dashboard.tsx.

1. .ap-pnl-stats: repeat(5, 1fr) -> repeat(4, 1fr)
   Written for the original five Performance cards. It now holds four, so they
   filled 4/5 of the width and the fifth column sat empty on the right. Four
   columns also matches the header row. Mobile rule is already repeat(2,...).

2. PortfolioValueCard height == StatCard height.
   Both share an identical shell (padding 16, 11px label + marginBottom 4,
   11px caption). Only the value line differed:
       StatCard            value div, fontSize 22, no extra box
       PortfolioValueCard  input,     fontSize 20, padding 2px 8px + 1px border
   The input's chrome added ~6px and its caption used marginTop 4 vs 2, and the
   grid stretches every card to the tallest. Fixed by making the value line
   identical BY CONSTRUCTION rather than by hardcoding a pixel height: match
   fontSize 22, zero vertical padding, drop the border (t.inputBg + radius still
   signal an editable field), caption marginTop 4 -> 2.

Each edit is independently skippable, so re-running after a partial apply is safe.

Usage:
    python3 patch_ui_card_geometry.py            # dry run
    python3 patch_ui_card_geometry.py --apply
"""
import sys, shutil, datetime, pathlib

TARGET = pathlib.Path("src/components/Dashboard.tsx")
APPLY  = "--apply" in sys.argv

GRID_OLD = ".ap-pnl-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }"
GRID_NEW = ".ap-pnl-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }"

DOLLAR_OLD = ("""<span style={{ fontSize: 20, fontWeight: 600, color: t.textTertiary,"""
              """ fontFamily: "'Manrope', sans-serif" }}>$</span>""")
DOLLAR_NEW = ("""<span style={{ fontSize: 22, fontWeight: 600, color: t.textTertiary,"""
              """ fontFamily: "'Manrope', sans-serif" }}>$</span>""")

INPUT_OLD = ("""style={{ flex: 1, minWidth: 0, fontSize: 20, fontWeight: 600,"""
             """ fontFamily: "'Manrope', sans-serif", fontVariantNumeric: 'tabular-nums',"""
             """ background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 6,"""
             """ padding: '2px 8px', color: t.textPrimary, outline: 'none' }} />""")
INPUT_NEW = ("""style={{ flex: 1, minWidth: 0, fontSize: 22, fontWeight: 600,"""
             """ fontFamily: "'Manrope', sans-serif", fontVariantNumeric: 'tabular-nums',"""
             """ background: t.inputBg, border: 'none', borderRadius: 6,"""
             """ padding: '0 8px', color: t.textPrimary, outline: 'none' }} />""")

CAP_OLD = ("""<div style={{ fontSize: 11, color: t.textTertiary, marginTop: 4,"""
           """ fontStyle: 'italic' }}>Sizing only — live engine weights</div>""")
CAP_NEW = ("""<div style={{ fontSize: 11, color: t.textTertiary, marginTop: 2,"""
           """ fontStyle: 'italic' }}>Sizing only — live engine weights</div>""")

EDITS = [
    ("ap-pnl-stats 5 -> 4 columns",      GRID_OLD,   GRID_NEW),
    ("$ glyph 20px -> 22px",             DOLLAR_OLD, DOLLAR_NEW),
    ("input 22px, no border, 0 y-pad",   INPUT_OLD,  INPUT_NEW),
    ("caption marginTop 4 -> 2",         CAP_OLD,    CAP_NEW),
]

MUST_KEEP = [
    'placeholder="Enter"',
    "background: t.inputBg",
    "borderRadius: 6",
    "Sizing only",
    "function StatCard(",
    "function PortfolioValueCard(",
    ".ap-pnl-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }",
]

def die(m):
    print(f"\nABORT: {m}\nNo files were written.")
    sys.exit(1)

if not TARGET.exists():
    die(f"{TARGET} not found — run from ~/Desktop/alphaplaybook")

src = TARGET.read_text()
out, applied = src, 0

for label, old, new in EDITS:
    n = out.count(old)
    if n == 0:
        if out.count(new) == 1:
            print(f"skip  {label}  (already applied)")
            continue
        die(f"[{label}] anchor not found verbatim:\n       {old[:100]}")
    if n != 1:
        die(f"[{label}] anchor appears {n} times, expected 1")
    out = out.replace(old, new, 1)
    applied += 1
    print(f"ok    {label}")

if applied == 0:
    print("\nnothing to do — all four edits already applied")
    sys.exit(0)

for a in MUST_KEEP:
    if a not in out:
        die(f"structural anchor lost: {a!r}")
if out.count("\n") != src.count("\n"):
    die("line count changed — these are all in-line style edits")
if "repeat(5, 1fr)" in out:
    die("a repeat(5, 1fr) remains")

print(f"\nline count stable: {src.count(chr(10))}")
print("value line now identical to StatCard by construction (22px, no extra box)")
print("card shell unchanged: padding 16 / label 11 + mb4 / caption 11 + mt2")

if not APPLY:
    print("\nDRY RUN — nothing written. Re-run with --apply")
    sys.exit(0)

bak = TARGET.with_suffix(TARGET.suffix + f".bak.{datetime.datetime.now():%Y%m%d-%H%M%S}")
shutil.copy2(TARGET, bak)
TARGET.write_text(out)
print(f"\nwrote {TARGET}\nbackup {bak}")
print("\nNEXT:\n  npm run build")
