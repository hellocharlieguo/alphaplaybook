#!/usr/bin/env python3
"""
inject_corr.py — rebuild the worksheet's hardcoded CORR constant from corr_matrix.json.

The worksheet embeds the correlation matrix as a JS literal. That is a duplicate
surface: corr_matrix.json can be refreshed by pull_correlations.py while the
worksheet keeps computing N_eff from a stale copy, silently. This closes that gap.

Run from the repo root. Idempotent. Aborts rather than guessing.

    cd ~/Desktop/alphaplaybook
    python3 inject_corr.py                          # defaults to v34_worksheet.html
    python3 inject_corr.py v34_worksheet_2026-09-07.html
"""
import json, shutil, sys, time, os

TARGET = sys.argv[1] if len(sys.argv) > 1 else "v34_worksheet.html"
MATRIX = "corr_matrix.json"
OPEN_ANCHOR = "const CORR="

for f in (TARGET, MATRIX):
    if not os.path.exists(f):
        sys.exit(f"ABORT: {f} not found — run from the repo root")

src = open(TARGET, encoding="utf-8").read()

n = src.count(OPEN_ANCHOR)
if n != 1:
    sys.exit(f"ABORT: '{OPEN_ANCHOR}' found {n} times, expected 1")

start = src.index(OPEN_ANCHOR)
# The literal is one line terminated by '};'. Scan braces so a reformatted
# multi-line block still terminates correctly — never regex dot-all across it.
i = src.index("{", start)
depth, j = 0, i
while j < len(src):
    if src[j] == "{":
        depth += 1
    elif src[j] == "}":
        depth -= 1
        if depth == 0:
            break
    j += 1
else:
    sys.exit("ABORT: unbalanced braces in CORR literal")
if src[j:j + 2] != "};":
    sys.exit("ABORT: CORR literal does not end in '}' + ';' (saw %r)" % src[j:j + 8])
end = j + 2

old_block = src[start:end]
old = json.loads(old_block[len(OPEN_ANCHOR):-1])
new = json.load(open(MATRIX, encoding="utf-8"))

# --- sanity gates before writing anything -------------------------------
if set(new) != set(old):
    sys.exit(f"ABORT: window set changed {sorted(old)} -> {sorted(new)}; "
             "the worksheet's WINDOWS constant would need updating too")
BOOK = ["AIPO", "SOXX", "GLW", "ASML", "COPX", "AMZN", "LLY",
        "HOOD", "ETHA", "GLDM", "IBIT", "SLV"]
for w in new:
    missing = [t for t in BOOK if t not in new[w]]
    if missing:
        sys.exit(f"ABORT: window {w} missing held names {missing}")
    for a in new[w]:
        if abs(new[w][a].get(a, 0) - 1.0) > 1e-9:
            sys.exit(f"ABORT: diagonal {w}/{a} is {new[w][a].get(a)}, expected 1.0")

added = sorted(set(new["1y"]) - set(old["1y"]))
removed = sorted(set(old["1y"]) - set(new["1y"]))
moved = [(a, b, old["1y"][a][b], new["1y"][a][b])
         for a in BOOK for b in BOOK
         if a < b and abs(new["1y"][a][b] - old["1y"][a][b]) > 1e-6]

if not added and not removed and not moved:
    print("No change — worksheet CORR already matches corr_matrix.json.")
    sys.exit(0)

bak = f"{TARGET}.bak.{time.strftime('%Y%m%d-%H%M%S')}"
shutil.copy2(TARGET, bak)

new_block = OPEN_ANCHOR + json.dumps(new, separators=(",", ":")) + ";"
out = src[:start] + new_block + src[end:]
open(TARGET, "w", encoding="utf-8").write(out)

print(f"OK  target={TARGET}  backup={bak}")
print(f"    universe {len(old['1y'])} -> {len(new['1y'])} names")
if added:   print(f"    added:   {added}")
if removed: print(f"    REMOVED: {removed}   <-- check this is intended")
print(f"    held-pair values changed: {len(moved)}")
for a, b, o, nn in sorted(moved, key=lambda r: -abs(r[3] - r[2]))[:8]:
    print(f"      {a}-{b}: {o} -> {nn}  ({nn-o:+.4f})")
print(f"    bytes {len(src)} -> {len(out)}")
print("\nNext: reload the worksheet and confirm the four trend weights, then")
print("      git add corr_matrix.json " + TARGET)
