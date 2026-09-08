#!/usr/bin/env python3
"""
patch_base_portfolio_v341.py — freeze A+B (stage flips) into the live cron.

  A  ETHA  settlement layer   forward -> working   (Visser 8/29-8/30, "this is the catalyst point")
  B  GLDM  gold               binding -> working   (Visser 8/30, "not the fastest horse in the race")
  + 8/31 technicals (LLY below 50-DMA, GLDM below 200-DMA, SLV stretch decay)

Design: this does NOT blind find-replace. It locates BASE_PORTFOLIO by brace
matching (never re.DOTALL — see the patch_kxfear_selection.py incident), asserts
the CURRENT weights match the deployed v3.4 book, and only then rewrites the
numbers in place. Any drift from expected state aborts with zero writes.

Usage:
    python3 patch_base_portfolio_v341.py            # dry run, prints diff
    python3 patch_base_portfolio_v341.py --apply
"""
import re, sys, shutil, datetime, pathlib

TARGET   = pathlib.Path("server/daily-cron.cjs")
APPLY    = "--apply" in sys.argv

OLD_VERSION = "2026-08-24-v3.4-trendfirst"
NEW_VERSION = "2026-08-31-v3.4.1-stageflip"

# deployed weights we REQUIRE to find, else the file is not what we think it is
EXPECT_OLD = {"LLY":13.4,"AMZN":13.3,"IBIT":12.5,"GLDM":11.5,"ETHA":9.6,"HOOD":8.3,
              "SLV":6.4,"AIPO":6.3,"GLW":5.0,"ASML":5.0,"SOXX":4.6,"COPX":4.1}

NEW = {"LLY":13.9,"AMZN":12.4,"IBIT":12.2,"ETHA":11.8,"GLDM":9.1,"HOOD":8.0,
       "SLV":7.8,"AIPO":6.2,"GLW":5.0,"ASML":5.0,"SOXX":4.5,"COPX":4.1}

# min_weight convention (verified against all 12 live rows): round(base_weight/2, 1)
NEW_MIN = {t: round(w / 2, 1) for t, w in NEW.items()}

# `action` is a public-facing Portfolio-tab label with hand-set semantics.
# Leave empty to preserve live values; the script reports contradictions either way.
ACTIONS = {}

def die(msg):
    print(f"\nABORT: {msg}\nNo files were written.")
    sys.exit(1)

def brace_span(text, start_idx):
    """Return (start, end) of the {...} block beginning at/after start_idx.
    Brace counting, not regex — a DOTALL regex once matched across two
    functions and deleted ~500 lines including finnhubQuote."""
    i = text.index("{", start_idx)
    depth, j = 0, i
    while j < len(text):
        if text[j] == "{": depth += 1
        elif text[j] == "}":
            depth -= 1
            if depth == 0: return i, j + 1
        j += 1
    die("unbalanced braces in BASE_PORTFOLIO")

if not TARGET.exists():
    die(f"{TARGET} not found — run from ~/Desktop/alphaplaybook")

src = TARGET.read_text()
orig_lines = src.count("\n")

# ---- 1. locate BASE_PORTFOLIO -------------------------------------------
m = list(re.finditer(r"const\s+BASE_PORTFOLIO\s*=", src))
if len(m) != 1:
    die(f"expected exactly 1 `const BASE_PORTFOLIO =`, found {len(m)}")
b0, b1 = brace_span(src, m[0].end())
block = src[b0:b1]

# ---- 2. verify current state matches the deployed book ------------------
found, found_min, found_act = {}, {}, {}
for tkr in set(EXPECT_OLD) | set(NEW):
    mm = list(re.finditer(rf"\b{tkr}\s*:\s*\{{[^}}]*?base_weight\s*:\s*([0-9.]+)", block))
    if len(mm) == 1:
        found[tkr] = float(mm[0].group(1))
        mn = list(re.finditer(rf"\b{tkr}\s*:\s*\{{[^}}]*?min_weight\s*:\s*([0-9.]+)", block))
        if len(mn) == 1:
            found_min[tkr] = float(mn[0].group(1))
        ma = list(re.finditer(rf"\b{tkr}\s*:\s*\{{[^}}]*?action\s*:\s*'([^']*)'", block))
        if len(ma) == 1:
            found_act[tkr] = ma[0].group(1)
    elif len(mm) > 1:
        die(f"{tkr}: {len(mm)} base_weight matches inside BASE_PORTFOLIO, expected 1")

missing = sorted(set(EXPECT_OLD) - set(found))
if missing:
    die(f"tickers not found in BASE_PORTFOLIO: {missing}\n"
        f"       found: {sorted(found)}\n"
        f"       -> the live book is not the 12-name v3.4 set. Paste the block and stop.")

n_entries = len(re.findall(r"^\s*([A-Z]{2,5})\s*:\s*\{", block, re.M))
if n_entries != 12:
    die(f"BASE_PORTFOLIO has {n_entries} entries, expected 12 "
        f"(ticker set must be unchanged for this patch)")

drift = {t: (found[t], EXPECT_OLD[t]) for t in EXPECT_OLD if abs(found[t] - EXPECT_OLD[t]) > 0.001}
if drift:
    print("\nLIVE WEIGHTS DO NOT MATCH THE EXPECTED v3.4 BOOK:")
    for t, (live, exp) in sorted(drift.items()):
        print(f"   {t:<5} live={live:<7} expected={exp}")
    die("refusing to patch a book I can't identify")

if len(found_min) != 12:
    die(f"found min_weight on only {len(found_min)}/12 rows — inspect the block manually")
bad = {t: (found_min[t], round(found[t] / 2, 1)) for t in found
       if abs(found_min[t] - round(found[t] / 2, 1)) > 1e-9}
if bad:
    print("\nmin_weight does NOT follow round(base/2,1) on:")
    for t, (live, exp) in sorted(bad.items()):
        print(f"   {t:<5} live={live} convention={exp}")
    die("floors are hand-set, not derived — do not let this script regenerate them")
print("verified: min_weight == round(base_weight/2, 1) on all 12 rows")

s_old = round(sum(found.values()), 4)
s_new = round(sum(NEW.values()), 4)
if abs(s_new - 100.0) > 0.001:
    die(f"new weights sum to {s_new}, not 100.0")
print(f"verified: 12 holdings, current sum {s_old}, new sum {s_new}")

# ---- 3. rewrite the numbers --------------------------------------------
new_block, edits = block, 0
for tkr, w in NEW.items():
    pat = re.compile(rf"(\b{tkr}\s*:\s*\{{[^}}]*?base_weight\s*:)(\s*[0-9.]+)")
    new_block, n = pat.subn(lambda g, w=w: f"{g.group(1)}{w:>5.1f}", new_block, count=1)
    if n != 1:
        die(f"{tkr}: expected 1 base_weight substitution, made {n}")
    mpat = re.compile(rf"(\b{tkr}\s*:\s*\{{[^}}]*?min_weight\s*:)(\s*[0-9.]+)")
    new_block, n = mpat.subn(lambda g, w=NEW_MIN[tkr]: f"{g.group(1)}{w:>5.1f}", new_block, count=1)
    if n != 1:
        die(f"{tkr}: expected 1 min_weight substitution, made {n}")
    if ACTIONS.get(tkr):
        apat = re.compile(rf"(\b{tkr}\s*:\s*\{{[^}}]*?action\s*:\s*')([^']*)(')")
        new_block, n = apat.subn(lambda g, a=ACTIONS[tkr]: f"{g.group(1)}{a}{g.group(3)}", new_block, count=1)
        if n != 1:
            die(f"{tkr}: expected 1 action substitution, made {n}")
    edits += 1
if edits != 12:
    die(f"made {edits} edits, expected 12")

if len(new_block) != len(block):
    die(f"block length changed {len(block)} -> {len(new_block)} chars; "
        f"column alignment would break. Inspect before applying.")

out = src[:b0] + new_block + src[b1:]

# ---- 4. PORTFOLIO_VERSION ----------------------------------------------
vc = out.count(OLD_VERSION)
if vc == 0:
    die(f"PORTFOLIO_VERSION '{OLD_VERSION}' not found — confirm the live value first")
if vc > 1:
    die(f"PORTFOLIO_VERSION '{OLD_VERSION}' appears {vc} times, expected 1")
out = out.replace(OLD_VERSION, NEW_VERSION)

# ---- 5. line-count guard ------------------------------------------------
new_lines = out.count("\n")
if new_lines != orig_lines:
    die(f"line count changed {orig_lines} -> {new_lines}. A patch that only "
        f"edits numbers must not change line count.")

print(f"line count stable: {orig_lines}")
print(f"\nPORTFOLIO_VERSION  {OLD_VERSION}  ->  {NEW_VERSION}")
print(f"\n{'tkr':<6}{'from':>8}{'to':>8}{'delta':>9}{'min':>8}{'->':>3}{'min':>6}   note")
for t in sorted(NEW, key=lambda x: -NEW[x]):
    d = NEW[t] - found[t]
    note = "stage flip" if t in ("ETHA", "GLDM") else ""
    print(f"{t:<6}{found[t]:>8.1f}{NEW[t]:>8.1f}{d:>+9.1f}"
          f"{found_min[t]:>8.1f}{'->':>3}{NEW_MIN[t]:>6.1f}   {note}")
print(f"{'':<6}{s_old:>8.1f}{s_new:>8.1f}")

# action-label contradiction report (never auto-changed)
contra = []
for t in NEW:
    d = NEW[t] - found[t]
    a = ACTIONS.get(t) or found_act.get(t, "?")
    if a == "Add" and d < -0.5:  contra.append((t, a, d))
    if a == "Trim" and d > +0.5: contra.append((t, a, d))
if contra:
    print("\nACTION LABELS THAT NOW CONTRADICT THE TRADE (public-facing, NOT auto-changed):")
    for t, a, d in contra:
        print(f"   {t:<5} label '{a}' but weight moves {d:+.1f}pp ({d / found[t] * 100:+.0f}%)")
    print("   -> set ACTIONS at the top of this script, or patch them separately.")

if not APPLY:
    print("\nDRY RUN — nothing written. Re-run with --apply")
    sys.exit(0)

bak = TARGET.with_suffix(TARGET.suffix + f".bak.{datetime.datetime.now():%Y%m%d-%H%M%S}")
shutil.copy2(TARGET, bak)
TARGET.write_text(out)
print(f"\nwrote {TARGET}\nbackup {bak}")
print("\nNEXT:\n  node --check server/daily-cron.cjs")
