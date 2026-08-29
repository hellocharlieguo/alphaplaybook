#!/usr/bin/env python3
"""AlphaPlaybook — FREEZE v3.3 (core-satellite restructure).

Cores = AIPO + SOXX (diversified baskets, biggest weights). MU + MRVL REMOVED (redundant —
both are ~9% / ~4.9% of SOXX, so SOXX now carries them). ASML/SKHY/GLW/COPX = satellites,
all ADDITIVE (not meaningfully in SOXX: ASML Amsterdam-listed, SKHY Korean ADR, GLW=Corning
materials, COPX=copper). Memory conviction re-expressed via SK Hynix (SKHY 8) + SOXX's Micron
slice. ASML boosted 5->7 (monopoly). LLY/AMZN to 50/50. HOOD/GLW up.

Ticker set changes (SOXX in; MU, MRVL out) -> rebalance branch fires regardless of version.
Anchored on the v3.2 BASE_PORTFOLIO block + version line. .bak-guarded, count==1. node --check after.
"""
import shutil, sys, re

PATH = 'server/daily-cron.cjs'
NEW_BOOK = [
    ("AIPO", 16.0, "AI Compute",        "Enter",  "CORE — power basket (Visser's top bottleneck)"),
    ("SOXX", 12.0, "AI Compute",        "Enter",  "CORE — broad semi basket (carries MU/MRVL/AMD/NVDA)"),
    ("LLY",  10.0, "AI Application",     "Enter",  "application anchor (50/50 with AMZN)"),
    ("AMZN", 10.0, "AI Application",     "Enter",  "consumer-agent platform (50/50 with LLY)"),
    ("SKHY",  8.0, "AI Compute",         "Enter",  "memory conviction — SK Hynix HBM pure-play; no technicals yet"),
    ("ASML",  7.0, "AI Compute",         "Enter",  "satellite — EUV MONOPOLY, additive (SOXX has ~0 ASML)"),
    ("SLV",   7.0, "Monetary Scarcity",  "Hold",   "monetary; paused below-200"),
    ("HOOD",  6.0, "Tokenization",       "Enter",  "tokenization; uptrend"),
    ("SGOV",  6.0, "Cash",               "Hold",   "cash floor (min 3)"),
    ("GLW",   4.5, "AI Compute",         "Enter",  "satellite — optical fiber (Corning)"),
    ("IBIT",  4.0, "Monetary Scarcity",  "Hold",   "paused below-200"),
    ("GLDM",  4.0, "Monetary Scarcity",  "Hold",   "paused below-200"),
    ("COPX",  3.0, "AI Compute",         "Hold",   "satellite — copper; carve-out exempt"),
    ("ETHA",  2.5, "Tokenization",       "Hold",   "paused below-200"),
]
OLD_VERSION = "const PORTFOLIO_VERSION = '2026-07-13-v3.2-topdown'"
NEW_VERSION = "const PORTFOLIO_VERSION = '2026-07-15-v3.3-coresat'"

def build_block():
    lines = ["const BASE_PORTFOLIO = {"]
    for tk, w, theme, action, note in NEW_BOOK:
        extra = " min_weight: 3," if tk == "SGOV" else ""
        lines.append(f"  {tk+':':<6} {{ base_weight: {w}, theme: '{theme}',{' '*(18-len(theme))} action: '{action}',{extra} }}, // {note}")
    lines.append("}")
    return "\n".join(lines)

def main():
    src = open(PATH, encoding='utf-8').read()
    m = re.search(r"const BASE_PORTFOLIO = \{.*?\n\}", src, re.DOTALL)
    if not m: sys.exit("ABORT: BASE_PORTFOLIO block not found")
    if src.count(m.group(0)) != 1: sys.exit("ABORT: block not unique")
    if src.count(OLD_VERSION) != 1:
        sys.exit(f"ABORT: version anchor count {src.count(OLD_VERSION)} != 1 (is v3.2 live?)")
    shutil.copy(PATH, PATH + '.bak.freeze_v33')
    src = src.replace(m.group(0), build_block(), 1).replace(OLD_VERSION, NEW_VERSION, 1)
    open(PATH, 'w', encoding='utf-8').write(src)
    print(f"\u2713 froze v3.3 core-satellite ({len(NEW_BOOK)} names, sum {sum(w for _,w,*_ in NEW_BOOK):.1f}%)")
    print(f"  SOXX in (core 12), MU + MRVL OUT (into SOXX), ASML 5->7, SKHY 10->8, LLY/AMZN 50/50")
    print(f"  ticker set changed -> rebalance fires. NEXT: node --check {PATH}")

if __name__ == '__main__': main()
