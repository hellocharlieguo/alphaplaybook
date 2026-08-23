#!/usr/bin/env python3
"""
rescore_trendfirst.py — AlphaPlaybook v3.4 scoring. Locked 2026-08-23.

SUPERSEDES rescore_v34.py and rescore_current_v3.py, which implement the OLD
composite method (S1 .30 / S2 .30 / S5 .20 / S6 .10 / conv .10 with target_top
pinning). That method is retired. Nothing in this file uses it.

Canonical reference: v34_worksheet.html — this script reproduces it exactly.
Any divergence means one of the two is stale; the worksheet is the design
document, this is the offline runner.

-------------------------------------------------------------------------------
THE METHOD
-------------------------------------------------------------------------------
Trend-first. Four trends; every name sits in exactly one sub-theme inside one
trend. Nothing competes across trends.

  name score   = 55 x timing x quality x wave_demand x entry_band(S5)
  trend score  = derived_timing x conviction x breadth
  trend weight = 100 x trend_score / sum(all trend scores)
  name weight  = trend_weight x (name score / sum of scores in that trend)

Every judgement is a named rung on a shared 5-step ladder
(1.00 / 0.92 / 0.80 / 0.72 / 0.60). No free-form 0-100 numbers anywhere.

  TIMING    where this bottleneck sits in its own cycle. Visser's stage clock.
            binding 1.00 / working 0.92 / cooling 0.80 / forward 0.72 /
            exhausted 0.60. The 0.60 is a floor: fade, never zero.

  QUALITY   the odds that owning this captures the trend. A monopoly and a
            whole-theme basket both score high for opposite reasons - one has
            no alternative, the other owns every alternative. This is the
            breadth term the old severity scale never had, and it is why SOXX
            no longer needs a hand-set floor.
            sole 1.00 / basket 0.92 / duopoly 0.80 / leader 0.72 /
            contested 0.60 / remove 0.

  WAVE      AI buildout ONLY. Which adoption wave is running, and how much
            each sub-theme is stressed by it. Different waves stress different
            parts of the stack: consumer agents need more memory but less
            nearline storage than enterprise agents do. The other trends are
            not downstream of the AI adoption curve and sit at 1.00.

  S5        computed, never typed. DMA position sets the base; stretch above
            the 50-DMA sets the penalty. RSI was REMOVED 2026-08-22 - it was a
            cliff not a slope (69.9 -> 70.0 cost 8 points of S5 and 25% of
            weight) and it was the only thing ranking gold above bitcoin when
            S1 said the reverse. Trailing 1-year return is excluded by design
            (6/22/26), so a name down 32% that has just bounced still reads as
            stretched. IBIT is exactly that case - a known limitation.

  BREADTH   N_eff, MEASURED from a return-correlation matrix, not sqrt(n).
            sqrt(n) assumed each sub-theme was an independent bet. Measured:
            seven AI-buildout names averaged ~0.65 correlation and delivered
            1.95 independent bets, while two application names (AMZN vs LLY at
            0.04) delivered 2.00. sqrt(n) was paying for fake diversification.
            N_eff = (sum of eigenvalues)^2 / sum(eigenvalues^2).

  TREND     conviction is the one trend-level judgement left. Trend TIMING is
            DERIVED as the mean of its sub-themes - it was being stated twice,
            and AI buildout had been set 'binding' with only 1 of 7 members
            binding.

RETIRED and not to be reintroduced without a decision:
  target_top_pct   pinned the #1 name to a constant, so its weight carried no
                   information about its conviction
  composite        S1/S2/S5/S6/conv weighted sum
  single_stock_cap superseded 6/1/26 by Rule B
  L1 theme weights trend weights are now an OUTPUT, not an input
  convergence bonus voices reach the model through timing and quality instead
                   of a separate term - one opinion, one place

Run:  cd ~/Desktop/alphaplaybook && python3 rescore_trendfirst.py
      cd ~/Desktop/alphaplaybook && python3 rescore_trendfirst.py --sqrt
"""

import json
import math
import os
import sys

LADDER = [1.00, 0.92, 0.80, 0.72, 0.60]
TIMING = dict(zip(["binding", "working", "cooling", "forward", "exhausted"], LADDER))
QUALITY = dict(zip(["sole", "basket", "duopoly", "leader", "contested"], LADDER))
QUALITY["remove"] = 0.0
CONVICTION = dict(zip(["certain", "strong", "forming", "speculative", "watch"], LADDER))
FLOOR_SCORE = 45

# Adoption wave. Visser 8/16: "This year was about agents, the agentic economy
# opening... next year is about consumer agents", and enterprise agents are
# "coming. Not having started yet." Confirmed unchanged 8/23.
WAVES = ["chatbots", "coding agents", "enterprise agents", "consumer agents", "embodied"]
WAVE = "coding agents"
WAVE_TREND = "1 AI buildout"
WAVE_DEMAND = {                    # chatbots coding enterprise consumer embodied
    "power/grid":         [0.92, 1.00, 1.00, 1.00, 0.92],
    "semis basket":       [0.92, 0.92, 0.92, 0.92, 1.00],
    "memory":             [0.80, 1.00, 1.00, 1.00, 0.80],
    "storage / nearline": [0.72, 0.80, 1.00, 0.80, 0.72],
    "optical":            [0.72, 0.92, 1.00, 1.00, 0.72],
    "lithography":        [0.92, 0.92, 0.92, 0.92, 0.92],
    "copper input":       [0.80, 0.80, 0.92, 1.00, 1.00],
}

# (sub_theme, ticker, timing, quality, [price, d50, d200], conviction-source)
# technicals: pull_candidates.cjs 2026-08-21
BOOK = {
    "1 AI buildout": ("certain", [
        ("power/grid",   "AIPO", "binding", "basket",  [29.28, 30.71, 27.40],
         'Visser 8/16: "impossible to get enough compute for all of the billions of agents."'),
        ("semis basket", "SOXX", "cooling", "basket",  [525.96, 558.89, 420.80],
         'No direct call. Visser 8/16 argues AGAINST the basket: "Marvell is not the same '
         'semiconductor as Infineon, as Nvidia, as Intel." Live objection on the record.'),
        ("optical",      "GLW",  "binding", "duopoly", [154.62, 174.20, 140.66],
         'CORRECTED 8/22 from cooling. Visser 8/8: "the area I am probably most focused on at '
         'this point is the optical names... Vera Rubin is coming." 8/2 Corning reclaims its '
         '200-day on Meta $6B + Nvidia partnership.'),
        ("lithography",  "ASML", "cooling", "sole",    [1756.97, 1781.40, 1446.50],
         'NO VOICE SUPPORT in the last month - zero mentions of ASML, EUV or lithography. '
         'Structural seat on the monopoly.'),
        ("copper input", "COPX", "working", "basket",  [93.80, 81.17, 79.13],
         'NO VOICE SUPPORT. The one copper mention (Visser 8/8) uses copper as a METAPHOR for '
         'compute, not as a position. Structural seat. Highest measured breadth in the trend.'),
    ]),
    "2 AI applied": ("strong", [
        ("distribution",      "AMZN", "working", "leader", [258.25, 249.72, 238.32],
         'Camillo 8/9, ~90 mentions: "mainly Bloom and Amazon"; distribution-moat framing.'),
        ("proprietary data",  "LLY",  "working", "leader", [1243.74, 1179.35, 1052.92],
         'NO VOICE SUPPORT in the last month. Structural seat on the 150-year trial-data moat.'),
    ]),
    "3 Tokenized rails": ("forming", [
        ("settlement layer", "ETHA", "forward", "sole",      [17.92, 13.84, 17.62],
         'Visser 8/15-8/16: "beginning in September, the next constraint is not physical, it is '
         'financial." Dated, not started.'),
        ("brokerage rails",  "HOOD", "working", "contested", [100.66, 100.16, 96.04],
         'MOVED 8/22 from AI applied. Visser 8/15 groups it with tokenization, not fintech: '
         '"the public companies like Figure, like Hood, like PayPal, like Coinbase."'),
    ]),
    "4 Monetary": ("certain", [
        ("bitcoin", "IBIT", "binding", "sole",    [43.37, 36.28, 43.00],
         'Visser 8/16 debasement instruction + lagging-leg read. 8/23: bitcoin entering its '
         '"third wave, the adoption phase"; "the purest AI trade" because AI cannot disrupt it.'),
        ("gold",    "GLDM", "binding", "basket",  [90.53, 82.58, 89.07],
         'Visser 8/16: "buying gold, buying silver, buying Bitcoin." China +20t July, largest '
         'since Oct 2023; Bank of Korea resumes after 13 years.'),
        ("silver",  "SLV",  "binding", "leader",  [62.63, 55.63, 64.55],
         'Visser 8/16, named directly. NOTE: GLDM-SLV correlation is 0.83 - silver is trading '
         'as gold, not as an industrial. Its physical half has no seat.'),
    ]),
}

CORR_FILE = "corr_matrix.json"
CORR_WINDOW = "1y"


def s5(px, d50, d200):
    """DMA position + stretch above the 50-DMA. No RSI, no trailing return."""
    if d50 is None or d200 is None:
        return None
    base = 45 if px < d200 else (72 if px < d50 else 58)
    st = (px - d50) / d50 * 100
    rp = 12 if st >= 50 else 8 if st >= 25 else 4 if st >= 10 else 0
    return max(5, min(95, base - rp * 0.5))


def entry_band(v):
    return 1.00 if v >= 85 else .95 if v >= 70 else .85 if v >= 55 else .75 if v >= 45 else .60


def _eigenvalues(M):
    """Jacobi rotation. Small symmetric matrices only."""
    n = len(M)
    A = [row[:] for row in M]
    for _ in range(200):
        p = q = 0
        mx = 0.0
        for i in range(n):
            for j in range(i + 1, n):
                if abs(A[i][j]) > mx:
                    mx, p, q = abs(A[i][j]), i, j
        if mx < 1e-11:
            break
        th = 0.5 * math.atan2(2 * A[p][q], A[p][p] - A[q][q])
        c, s = math.cos(th), math.sin(th)
        for k in range(n):
            a1, a2 = c * A[k][p] + s * A[k][q], -s * A[k][p] + c * A[k][q]
            A[k][p], A[k][q] = a1, a2
        for k in range(n):
            a1, a2 = c * A[p][k] + s * A[q][k], -s * A[p][k] + c * A[q][k]
            A[p][k], A[q][k] = a1, a2
    return [A[i][i] for i in range(n)]


def n_eff(syms, C):
    """Independent bets. 7 identical names -> 1.0. 7 independent -> 7.0."""
    S = [x for x in syms if x in C]
    if len(S) < 2:
        return float(len(S) or 1)
    lam = _eigenvalues([[C[a][b] for b in S] for a in S])
    return sum(lam) ** 2 / sum(l * l for l in lam)


def run(use_sqrt=False, wave=WAVE):
    C = {}
    if os.path.isfile(CORR_FILE):
        C = json.load(open(CORR_FILE))[CORR_WINDOW]
    elif not use_sqrt:
        sys.exit(f"ABORT: {CORR_FILE} missing. Run pull_correlations.py, or pass --sqrt "
                 "to fall back to counted breadth (which overstates it).")

    wi = WAVES.index(wave)
    trends = []
    for tname, (conv, subs) in BOOK.items():
        rows = []
        for sub, tkr, tm, ql, td, src in subs:
            if ql == "remove":
                continue
            wd = WAVE_DEMAND.get(sub, [1.0] * 5)[wi] if tname == WAVE_TREND else 1.0
            v5 = s5(*td)
            raw = (100 - FLOOR_SCORE) * TIMING[tm] * QUALITY[ql] * wd
            rows.append(dict(sub=sub, tkr=tkr, timing=tm, quality=ql, wd=wd, s5=v5, src=src,
                             s1=100 * TIMING[tm] * QUALITY[ql] * wd, raw=raw,
                             mult=entry_band(v5), score=raw * entry_band(v5)))
        if not rows:
            continue
        tm_der = sum(TIMING[r["timing"]] for r in rows) / len(rows)
        syms = [r["tkr"] for r in rows]
        br = math.sqrt(len(rows)) if use_sqrt else n_eff(syms, C)
        trends.append(dict(name=tname, conv=conv, rows=rows, tm_der=tm_der, br=br,
                           ts=tm_der * CONVICTION[conv] * br))

    grand = sum(t["ts"] for t in trends) or 1
    for t in trends:
        t["tw"] = 100 * t["ts"] / grand
        ssum = sum(r["score"] for r in t["rows"]) or 1
        for r in t["rows"]:
            r["share"] = r["score"] / ssum
            r["w"] = t["tw"] * r["share"]
    return trends, C


def main():
    use_sqrt = "--sqrt" in sys.argv
    trends, C = run(use_sqrt)
    mode = "sqrt(n) COUNTED" if use_sqrt else f"N_eff MEASURED ({CORR_WINDOW})"

    print(f"\nAlphaPlaybook v3.4 — trend-first")
    print(f"wave: {WAVE}   breadth: {mode}")
    print("=" * 78)
    print(f"{'TREND':<20}{'conv':<9}{'timing':>7}{'breadth':>9}{'of':>4}{'WEIGHT':>8}")
    print("-" * 78)
    for t in trends:
        print(f"{t['name']:<20}{t['conv']:<9}{t['tm_der']:>7.3f}{t['br']:>9.2f}"
              f"{len(t['rows']):>4}{t['tw']:>8.1f}")
    print("-" * 78)
    print(f"\n{'TKR':<6}{'sub-theme':<20}{'timing':<9}{'quality':<10}"
          f"{'S1':>4}{'S5':>4}{'mult':>6}{'score':>7}{'WEIGHT':>8}")
    print("-" * 78)
    allw = []
    for t in trends:
        for r in sorted(t["rows"], key=lambda x: -x["w"]):
            allw.append((r["tkr"], r["w"]))
            print(f"{r['tkr']:<6}{r['sub']:<20}{r['timing']:<9}{r['quality']:<10}"
                  f"{r['s1']:>4.0f}{r['s5']:>4.0f}{r['mult']:>6.2f}{r['score']:>7.1f}{r['w']:>8.1f}")
    print("-" * 78)
    print(f"{'TOTAL':<6}{sum(w for _, w in allw):>72.1f}")
    if C:
        print(f"\nbook N_eff {n_eff([t for t, _ in allw], C):.2f} "
              f"from {len(allw)} holdings")

    unsourced = [r["tkr"] for t in trends for r in t["rows"] if "NO VOICE SUPPORT" in r["src"]]
    if unsourced:
        pct = sum(w for tk, w in allw if tk in unsourced)
        print(f"\nNO VOICE SUPPORT: {', '.join(unsourced)}  ({pct:.1f}% of book)")
        print("  Structural seats on market analysis, not voice conviction. Deliberate, not drift.")
    print("\nNothing written. server/daily-cron.cjs is untouched.\n")


if __name__ == "__main__":
    main()
