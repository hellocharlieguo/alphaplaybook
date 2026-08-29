#!/usr/bin/env python3
"""AlphaPlaybook — FREEZE the Monday 7/13 rescore into the cron BASE_PORTFOLIO.

Rewrites BASE_PORTFOLIO to the 16-name v3.1 book and bumps PORTFOLIO_VERSION.
Adds MRVL, MU, SKHY (new tickers -> rebalance branch fires). Weights are the
engine-pure output of the 7/13 rescore (S4 removed, option-C weights, ASML/SOXX
working, MRVL optics-stretch S6, MU/SKHY memory split engine-equal, CapEx OFF).

Anchored on the exact BASE_PORTFOLIO block + the PORTFOLIO_VERSION line.
.bak-guarded, count==1 aborts. node --check after.
"""
import shutil, sys, re

PATH = 'server/daily-cron.cjs'

# New book: ticker -> (weight, theme, action). action from composite band:
#   ENTER >=65, watch 55-65 -> 'Watch', paused/low -> 'Hold'.
NEW_BOOK = [
    ("AIPO", 18.0, "AI Compute",        "Enter",  "power infra ETF (mislabeled compute; really power)"),
    ("LLY",  11.0, "AI Application",     "Enter",  "GLP + AI drug-discovery anchor"),
    ("MRVL",  9.5, "AI Compute",         "Enter",  "active-optical/CPO; optics-stretch S6 haircut"),
    ("MU",    7.5, "AI Compute",         "Enter",  "memory (DRAM/HBM shortage); Visser biggest add"),
    ("AMZN",  7.0, "AI Application",     "Enter",  "consumer-agent platform; voice floor"),
    ("SKHY",  6.0, "AI Compute",         "Enter",  "SK Hynix ADR (HBM); thesis-seated, NO technicals yet"),
    ("SLV",   6.0, "Monetary Scarcity",  "Hold",   "monetary leg paused below-200 (freefall)"),
    ("GLW",   5.5, "AI Compute",         "Watch",  "fiber optical, cooling (stretched leg)"),
    ("ASML",  5.0, "AI Compute",         "Watch",  "EUV monopoly; underweight on mid entry (add on dip)"),
    ("HOOD",  4.0, "Tokenization",       "Watch",  "2-lens convergence (voice floor)"),
    ("SOXX",  3.0, "AI Compute",         "Watch",  "diversified semi basket"),
    ("IBIT",  3.0, "Monetary Scarcity",  "Hold",   "paused below-200"),
    ("GLDM",  3.0, "Monetary Scarcity",  "Hold",   "paused below-200"),
    ("ETHA",  3.0, "Tokenization",       "Hold",   "paused below-200"),
    ("COPX",  3.0, "AI Compute",         "Hold",   "copper; below-200 (carve-out exempts pause, honest entry score)"),
    ("SGOV",  5.5, "Cash",               "Hold",   "cash floor (min 3); absorbs rounding residual -> book sums 100"),
]

OLD_VERSION = "const PORTFOLIO_VERSION = '2026-06-29-v3.0-themes.1'"
NEW_VERSION = "const PORTFOLIO_VERSION = '2026-07-13-v3.1-themes'"

def build_block():
    lines = ["const BASE_PORTFOLIO = {"]
    # column-align ticker + weight for readability
    for tk, w, theme, action, note in NEW_BOOK:
        extra = " min_weight: 3," if tk == "SGOV" else ""
        lines.append(
            f"  {tk+':':<6} {{ base_weight: {w},{'' if w>=10 else '  '} theme: '{theme}',{' '*(18-len(theme))} action: '{action}',{extra} }}, // {note}"
        )
    lines.append("}")
    return "\n".join(lines)

def main():
    src = open(PATH, encoding='utf-8').read()

    # 1. replace the BASE_PORTFOLIO object (from 'const BASE_PORTFOLIO = {' to the closing '}')
    m = re.search(r"const BASE_PORTFOLIO = \{.*?\n\}", src, re.DOTALL)
    if not m:
        sys.exit("ABORT: could not locate BASE_PORTFOLIO block")
    old_block = m.group(0)
    if src.count(old_block) != 1:
        sys.exit(f"ABORT: BASE_PORTFOLIO block not unique ({src.count(old_block)})")

    # 2. version line must be present exactly once
    if src.count(OLD_VERSION) != 1:
        sys.exit(f"ABORT: version anchor count {src.count(OLD_VERSION)} != 1")

    shutil.copy(PATH, PATH + '.bak.freeze_v31')
    src = src.replace(old_block, build_block(), 1)
    src = src.replace(OLD_VERSION, NEW_VERSION, 1)
    open(PATH, 'w', encoding='utf-8').write(src)

    total = sum(w for _, w, *_ in NEW_BOOK)
    print(f"\u2713 froze v3.1 book ({len(NEW_BOOK)} names, sum {total:.1f}%) + bumped PORTFOLIO_VERSION")
    print(f"  new tickers: MRVL, MU, SKHY -> rebalance branch fires")
    print(f"  backup: {PATH}.bak.freeze_v31")
    print(f"  NEXT: node --check {PATH}")

if __name__ == '__main__':
    main()
