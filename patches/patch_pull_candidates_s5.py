#!/usr/bin/env python3
"""
patch_pull_candidates_s5.py — remove the retired RSI term from s5score().

RSI was removed from S5 on 2026-08-22 (cliff not slope: 69.9 -> 70.0 cost 8 S5
points, and it ranked gold above bitcoin against S1's judgment). The v3.4 method
dropped it; pull_candidates.cjs never did. Its printed `s5~` column has been
understating every name with RSI>=60 ever since.

On the 2026-08-31 pull that mis-stated 5 of 37 rows:
    ETHA 39 vs 54  |  IBIT 41 vs 56  |  PLTR 47 vs 54  |  MSTR 34 vs 41  |  SGOV 51 vs 58

This removes exactly one line (88) and replaces it with a provenance comment, so
line count and the s5score(price, d50, d200, rsi) signature are both unchanged —
no caller needs touching. `rsi` becomes an unused parameter, which is intended:
keeping it avoids editing call sites for a one-line semantic fix.

Usage:
    python3 patch_pull_candidates_s5.py            # dry run
    python3 patch_pull_candidates_s5.py --apply
"""
import sys, shutil, datetime, pathlib

TARGET = pathlib.Path("pull_candidates.cjs")
APPLY  = "--apply" in sys.argv

OLD = "  if (rsi >= 70) pen += 15; else if (rsi >= 60) pen += 7; else if (rsi <= 35) pen -= 5\n"
NEW = "  // RSI term removed 2026-08-22 (v3.4): cliff not slope, 69.9->70.0 cost 8 S5 pts.\n"

# structural anchors that must survive untouched
MUST_KEEP = [
    "function s5score(price, d50, d200, rsi) {",
    "  if (d50 == null || d200 == null) {",
    "    return { s5: null, base: null, stretch: null, pen: null, no_dma: true }",
    "  const base = price < d200 ? 45 : (price < d50 ? 72 : 58)",
    "  let pen = 0",
    "  const st = (price - d50) / d50 * 100",
    "  const rp = st >= 50 ? 12 : st >= 25 ? 8 : st >= 10 ? 4 : 0",
    "  pen += rp * 0.5",
    "  return { s5: Math.max(5, Math.min(95, base - pen)), base, stretch: st, pen, no_dma: false }",
    "async function pull(sym) {",
]

def die(m):
    print(f"\nABORT: {m}\nNo files were written.")
    sys.exit(1)

if not TARGET.exists():
    die(f"{TARGET} not found — run from ~/Desktop/alphaplaybook")

src = TARGET.read_text()

n = src.count(OLD)
if n == 0:
    if NEW in src:
        die("already patched — RSI line is gone. Nothing to do.")
    die("RSI line not found verbatim. The function has changed; re-read it before patching.")
if n != 1:
    die(f"RSI line appears {n} times, expected exactly 1")

for anchor in MUST_KEEP:
    if src.count(anchor) < 1:
        die(f"structural anchor missing, refusing to edit: {anchor!r}")

out = src.replace(OLD, NEW, 1)

if out.count("\n") != src.count("\n"):
    die("line count changed — a one-line swap must not alter it")
if out.count("function ") != src.count("function "):
    die("function count changed — the edit escaped its intended span")

before = src.split("\n")[78:93]
after  = out.split("\n")[78:93]
print("s5score() lines 79-93\n" + "-" * 72)
for i, (b, a) in enumerate(zip(before, after), start=79):
    mark = "  " if b == a else "->"
    print(f"{mark}{i:>4}  {a}")
    if b != a:
        print(f"      was:  {b}")
print("-" * 72)
print(f"line count stable: {src.count(chr(10))}")
print(f"function count stable: {src.count('function ')}")

if not APPLY:
    print("\nDRY RUN — nothing written. Re-run with --apply")
    sys.exit(0)

bak = TARGET.with_suffix(TARGET.suffix + f".bak.{datetime.datetime.now():%Y%m%d-%H%M%S}")
shutil.copy2(TARGET, bak)
TARGET.write_text(out)
print(f"\nwrote {TARGET}\nbackup {bak}")
print("\nNEXT:")
print("  node --check pull_candidates.cjs")
print("  node test_s5score.cjs")
