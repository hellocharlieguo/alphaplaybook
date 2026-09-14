#!/usr/bin/env python3
"""
patch_freeze_v35.py — FREEZE 2026-09-14-v3.5-asmlcut.

Ticker set 12 -> 11. ASML removed under Rule B (holding #17 in SOXX at 2.49%,
verified against the 34-name list dated 2026-08-20). GLW checked against the
same list and confirmed ABSENT, so the optical seat stays.

AI Buildout trend weight is a logged discretionary override at 24.70. Breadth
falls 1.7458 -> 1.6716 on the removal, which would cut the sleeve to 24.43;
the override holds pillar weight constant. +0.27pp, logged per workflow 5.1.

Touches TWO surfaces:
  server/daily-cron.cjs   BASE_PORTFOLIO + version string   (the deployed book)
  src/data/systemMap.ts   freeze card, which reads 2026-07-15-v3.3-coresat /
                          14 names under a heading of "Current" - two versions
                          and two names stale.

Run from repo root, then: npm run build && node --check server/daily-cron.cjs
"""
import re, shutil, sys, time

NEW_VERSION = "2026-09-14-v3.5-asmlcut"
OLD_VERSION = "2026-08-31-v3.4.1-stageflip"

# ticker -> (base_weight, action).  min_weight is base/2, matching existing rows.
BOOK = [
    ("AMZN", 13.2, "Add"),  ("LLY",  13.2, "Trim"), ("ETHA", 12.4, "Add"),
    ("IBIT", 12.2, "Hold"), ("GLDM",  9.1, "Hold"), ("SLV",   7.8, "Hold"),
    ("HOOD",  7.4, "Trim"), ("COPX",  6.7, "Add"),  ("AIPO",  6.4, "Hold"),
    ("SOXX",  6.0, "Add"),  ("GLW",   5.6, "Add"),
]
assert abs(sum(w for _, w, _ in BOOK) - 100.0) < 0.01, "weights must sum to 100"

# ---------------------------------------------------------------- cron
P = "server/daily-cron.cjs"
src = open(P, encoding="utf-8").read()

if NEW_VERSION in src:
    sys.exit("ABORT: cron already at " + NEW_VERSION)

# 1. remove ASML entirely
m = re.search(r"^\s*ASML:\s*\{[^}]*\},\s*\n", src, re.M)
if not m:
    sys.exit("ABORT: ASML row not found in BASE_PORTFOLIO")
src = src[:m.start()] + src[m.end():]

# 2. rewrite each remaining weight + action, preserving each line's own layout
for tkr, w, act in BOOK:
    pat = re.compile(r"^(\s*%s:\s*\{\s*base_weight:\s*)([0-9.]+)(,.*?min_weight:\s*)([0-9.]+)(,\s*action:\s*')(\w+)('.*)$"
                     % tkr, re.M)
    hits = pat.findall(src)
    if len(hits) != 1:
        sys.exit(f"ABORT: {tkr} matched {len(hits)} times, expected 1")
    src = pat.sub(lambda g: g.group(1) + f"{w:.1f}" + g.group(3) + f"{w/2:.1f}"
                  + g.group(5) + act + g.group(7), src, count=1)

# 3. version string
n = src.count(OLD_VERSION)
if n < 1:
    sys.exit("ABORT: old version string not found in cron")
src = src.replace(OLD_VERSION, NEW_VERSION)

shutil.copy2(P, f"{P}.bak.{time.strftime('%Y%m%d-%H%M%S')}")
open(P, "w", encoding="utf-8").write(src)
print(f"OK  {P}: ASML removed, 11 weights rewritten, version -> {NEW_VERSION} ({n} occurrence(s))")

# ---------------------------------------------------------------- systemMap
P2 = "src/data/systemMap.ts"
s2 = open(P2, encoding="utf-8").read()
done = []

a = "{ t: 'kv', k: 'Version string', v: '2026-07-15-v3.3-coresat' },"
if s2.count(a) == 1:
    s2 = s2.replace(a, "{ t: 'kv', k: 'Version string', v: '%s' }," % NEW_VERSION, 1)
    done.append("version string")
elif NEW_VERSION in s2:
    done.append("version string already current")
else:
    print("WARN: systemMap version-string anchor not found — fix by hand")

b = "{ t: 'kv', k: 'Names', v: '14' },"
if s2.count(b) == 1:
    s2 = s2.replace(b, "{ t: 'kv', k: 'Names', v: '11' },", 1)
    done.append("name count 14 -> 11")
else:
    print("WARN: systemMap Names anchor not found (count %d) — fix by hand" % s2.count(b))

if done:
    shutil.copy2(P2, f"{P2}.bak.{time.strftime('%Y%m%d-%H%M%S')}")
    open(P2, "w", encoding="utf-8").write(s2)
    print(f"OK  {P2}: " + ", ".join(done))

print("\nVERIFY:")
print("  node --check server/daily-cron.cjs")
print("  grep -n 'base_weight' server/daily-cron.cjs | head -15")
print("  npm run build")
print("\nNOTE: systemMap still carries stale weights elsewhere (SOXX row, the")
print("      'seven buildout names / 1.95 independent bets' note). Not patched")
print("      here — they need the post-injection numbers first.")
