#!/usr/bin/env python3
"""
s5_v34.py — recompute S5 from pull_candidates.cjs output using the v3.4 formula.

pull_candidates.cjs still emits the RETIRED RSI-in-S5 term (removed from the
method 2026-08-22). Its printed `s5~` column understates any name with RSI>=60:
  RSI >= 70 -> -15   |   RSI >= 60 -> -7   |   RSI <= 35 -> +5
On 8/31 that mis-stated ETHA (39 vs 54), IBIT (41 vs 56) and SGOV (51 vs 58).

Until the emitter is patched, run the pull output through this before pasting
anything into the worksheet.

    node pull_candidates.cjs > candidates.txt
    python3 s5_v34.py candidates.txt
"""
import re, sys

def s5_v34(px, d50, d200):
    if d50 is None or d200 is None:
        return None, None, None
    base = 45 if px < d200 else (72 if px < d50 else 58)
    st   = (px - d50) / d50 * 100
    rp   = 12 if st >= 50 else 8 if st >= 25 else 4 if st >= 10 else 0
    return max(5.0, min(95.0, base - rp * 0.5)), st, base

def band(s):
    return 1.00 if s >= 85 else 0.95 if s >= 70 else 0.85 if s >= 55 else 0.75 if s >= 45 else 0.60

def retired_rsi_term(rsi):
    return -15 if rsi >= 70 else -7 if rsi >= 60 else 5 if rsi <= 35 else 0

LINE = re.compile(
    r"^(?P<t>[A-Z]{2,5})\s+px=\s*(?P<px>[\d.]+)\s+d50=\s*(?P<d50>[\d.]+|n/a)\s+"
    r"d200=\s*(?P<d200>[\d.]+|n/a)\s+rsi=\s*(?P<rsi>[\d.]+).*?s5~\s*(?P<s5>[\d]+|n/a)")

def num(s):
    return None if s == "n/a" else float(s)

rows, mism = [], []
for ln in open(sys.argv[1] if len(sys.argv) > 1 else "/dev/stdin"):
    m = LINE.match(ln.strip())
    if not m:
        continue
    g = m.groupdict()
    px, d50, d200, rsi = float(g["px"]), num(g["d50"]), num(g["d200"]), float(g["rsi"])
    printed = num(g["s5"])
    s5, st, base = s5_v34(px, d50, d200)
    if s5 is None:
        rows.append((g["t"], px, rsi, printed, None, None, None, "NO-DMA: hand-set"))
        continue
    gap = (printed - s5) if printed is not None else 0
    exp = retired_rsi_term(rsi)
    note = ""
    if abs(gap) > 0.5:
        note = f"printed carries {exp:+g} RSI term" if abs(gap - exp) < 0.5 else f"UNEXPLAINED gap {gap:+g}"
        mism.append(g["t"])
    rows.append((g["t"], px, rsi, printed, s5, band(s5), st, note))

print(f"{'tkr':<6}{'px':>10}{'RSI':>6}{'printed':>9}{'v3.4 S5':>9}{'band':>7}{'stretch':>9}  note")
for t, px, rsi, pr, s5, bd, st, note in rows:
    pr_s = "n/a" if pr is None else f"{pr:.0f}"
    if s5 is None:
        print(f"{t:<6}{px:>10.2f}{rsi:>6.1f}{pr_s:>9}{'—':>9}{'—':>7}{'—':>9}  {note}")
    else:
        print(f"{t:<6}{px:>10.2f}{rsi:>6.1f}{pr_s:>9}{s5:>9.0f}{bd:>7.2f}{st:>8.1f}%  {note}")

print(f"\n{len(mism)} of {len(rows)} rows mis-stated by the emitter: {', '.join(mism) or 'none'}")
print("Paste px / d50 / d200 into the worksheet and let it compute S5 — never the printed s5~ column.")
