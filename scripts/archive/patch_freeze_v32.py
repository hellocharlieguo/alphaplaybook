#!/usr/bin/env python3
"""AlphaPlaybook — FREEZE the v3.2 TOP-DOWN book into the cron BASE_PORTFOLIO.

First book built top-down (themes -> pillars -> names) rather than flat engine sizing.
Key move vs v3.1: ASML gets the full resolved 'chips' pillar (5.0 -> 9.0); optical
trimmed (agent wave = compute-DEMAND, not optical multiple); scarcity conviction
restored at theme level (IBIT/GLDM 3 -> 4). Same 15 tickers as v3.1 -> weight-only
refreeze. Version bump forces the one-night rebalance-to-target.

Anchored on the v3.1 BASE_PORTFOLIO block + version line. .bak-guarded, count==1.
"""
import shutil, sys, re

PATH = 'server/daily-cron.cjs'
NEW_BOOK = [
    ("AIPO", 16.0, "AI Compute",        "Enter",  "power pillar (basket; contested->diversified)"),
    ("LLY",  12.0, "AI Application",     "Enter",  "application dominance anchor"),
    ("ASML",  9.0, "AI Compute",         "Enter",  "CHIPS PILLAR (resolved->concentrated: EUV monopoly gets whole pillar)"),
    ("AMZN",  8.0, "AI Application",     "Enter",  "consumer-agent platform; voice floor"),
    ("SLV",   7.0, "Monetary Scarcity",  "Hold",   "monetary; theme conviction held despite selloff"),
    ("MRVL",  7.0, "AI Compute",         "Enter",  "interconnect pillar (contested); better leg"),
    ("MU",    6.5, "AI Compute",         "Enter",  "memory pillar (contested); DRAM/HBM"),
    ("SKHY",  6.5, "AI Compute",         "Enter",  "memory pillar (contested); SK Hynix ADR, no technicals yet"),
    ("GLW",   4.0, "AI Compute",         "Watch",  "interconnect (contested); fiber, stretched leg"),
    ("IBIT",  4.0, "Monetary Scarcity",  "Hold",   "theme-restored; paused below-200 (dry powder on reclaim)"),
    ("GLDM",  4.0, "Monetary Scarcity",  "Hold",   "theme-restored; paused below-200"),
    ("HOOD",  4.5, "Tokenization",       "Watch",  "2-lens convergence"),
    ("COPX",  3.0, "AI Compute",         "Hold",   "copper satellite; carve-out exempt"),
    ("ETHA",  2.5, "Tokenization",       "Hold",   "paused below-200"),
    ("SGOV",  6.0, "Cash",               "Hold",   "cash floor (min 3)"),
]
OLD_VERSION = "const PORTFOLIO_VERSION = '2026-07-13-v3.1-themes'"
NEW_VERSION = "const PORTFOLIO_VERSION = '2026-07-13-v3.2-topdown'"

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
        sys.exit(f"ABORT: version anchor count {src.count(OLD_VERSION)} != 1 (is v3.1 deployed first?)")
    shutil.copy(PATH, PATH + '.bak.freeze_v32')
    src = src.replace(m.group(0), build_block(), 1).replace(OLD_VERSION, NEW_VERSION, 1)
    open(PATH, 'w', encoding='utf-8').write(src)
    print(f"\u2713 froze v3.2 top-down book ({len(NEW_BOOK)} names, sum {sum(w for _,w,*_ in NEW_BOOK):.1f}%)")
    print(f"  ASML 5.0->9.0 (resolved chips pillar), optical trimmed, scarcity restored")
    print(f"  same tickers as v3.1 -> weight-only rebalance on version bump")
    print(f"  NEXT: node --check {PATH}")

if __name__ == '__main__': main()
