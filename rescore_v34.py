#!/usr/bin/env python3
"""
rescore_v34.py — AlphaPlaybook rescore harness, rebuilt 2026-08-21 against the
LIVE v3.3 core-satellite book ('2026-07-15-v3.3-coresat', 14 holdings).

Supersedes rescore_current_v3.py, which was a v3.0 artifact and could not
reproduce the live book. Five defects fixed here:

  1. TICKER SET      v3.0 BOOK had 13 rows, no SKHY (8% of book, the entire
                     memory conviction) and carried the pre-core-satellite mix.
  2. hand_s1         was LLY 48 / AMZN 42 / HOOD 55 (pre-four-axis). The
                     four-axis spec supersedes these with 68 / 60 / 61.
  3. TECHNICALS      ~6 weeks stale, and the staleness FLIPPED GATES:
                     IBIT/GLDM/ETHA all read below-200 when they are now above,
                     and SLV read -11.9% vs 200-DMA when it is now -2.97%
                     (inside the 3% carve-out band). Refreshed from the
                     2026-08-21 pull_candidates.cjs run.
  4. voice_conviction the monetary names were all False. Visser reaffirmed every
                     one of them 8/16 ("buying gold, buying silver, buying
                     Bitcoin"). With vc=False, _carveout() short-circuits and
                     SLV is never evaluated at all.
  5. s4_catalyst     still passed positionally. Kept (deprecated no-op field, so
                     callers do not crash) but zeroed — S4 was removed from the
                     composite on 2026-07-09.

NOT A FREEZE. This prints targets for review. Nothing is written to
server/daily-cron.cjs. Freeze only after the numbers are validated by hand.

Run:  cd ~/Desktop/alphaplaybook && python3 rescore_v34.py
      cd ~/Desktop/alphaplaybook && python3 rescore_v34.py --all-regimes
"""

import sys
import json

# Import block mirrors rescore_current_v3.py verbatim. `normalize` lives in
# portfolio_normalizer, NOT signal_engine; CFG is loaded here, not imported.
from signal_engine import (
    SignalInput,
    score_ticker,
    compute_pause_caps,
    compute_voice_floors,
)
from portfolio_normalizer import normalize
import s1_axes

CFG = json.load(open("signal_model_config.json"))

# score_ticker(sig, capex_yoy_pct, regime_above=False) — this is the YoY PERCENT,
# not a multiplier. The GREEN/AMBER/RED multiplier is derived inside score_ticker.
# 77.0 = big-4 2026 capex ~$725B vs ~$410B 2025, verified 2026-08-21. Unchanged
# from the v3 script, which already carried 77.0.
CAPEX = 77.0

MON = set(CFG["three_axes"]["monetary_scarcity"]["names"])
PHY = set(CFG["three_axes"]["physical_scarcity"]["names"])
SCARC = MON | PHY

# ---------------------------------------------------------------------------
# BOOK — v3.3 live book. Silver splits into two engine rows (summed for display).
# SGOV is NOT a row; normalize() handles it as cash_ticker.
#
# schema: (ticker, type, s2, s4, s6, lenses, price, d50, d200, rsi, ret1y,
#          cur_wt, is_etf, voice_conviction, hand_s1, s5_hand)
#
# s5_hand -> SignalInput.s5_entry_quality. None for every name with real DMAs:
# the s5_ladder (signal_engine ~150-180) computes S5 from the 20/50/200 ladder
# plus RSI/velocity penalty. Set it ONLY for names with no DMAs, where line 148
# falls back to the hand-set value. This is the field patch_s5_null_guard.py's
# JS counterpart was protecting -- it existed in Python all along.
#
# technicals: pull_candidates.cjs run 2026-08-21  [VERIFIED]
# s2 / s6:    ***TODO — HAND-SET. Seeded from v3.0 where the name existed;
#             SOXX and SKHY are new to the book and are GUESSES. See notes.***
# ---------------------------------------------------------------------------
# MU lens count. The ledger reports 1 (the ZaStocks "Added" leg from the
# 8/10-8/17 window was never logged to voice_mentions); 2 is the corrected
# value. Convergence pays 60 x 0.10 = 6 composite points, so this single
# number moves MU's seat materially. Flip it and re-run to size the effect.
MU_LENSES = 1   # <- set to 1 for the ledger-as-is floor case

BOOK = [
    # --- AI Compute: cores ---
    # s2 72 carried from v3.0. AIPO still binding per Visser 8/16.
    ("AIPO",  "company",          72, 0, 60, 1,   29.28,   30.71,   27.40, 45.12,  49.08, 16.00, True,  False, None, None),
    # TODO s2: 60 predates SOXX's promotion to CORE (v3.3). Chips cooling, but
    # the basket now carries MU/MRVL. Re-set deliberately.
    ("SOXX",  "company",          70, 0, 55, 1,  525.96,  558.89,  420.80, 46.66, 117.02, 12.00, True,  False, None, None),

    # --- AI Compute: satellites ---
    # SKHY: NO DMAs (listed 2026-07-10, ~30 bars). Passes d50/d200/ret1y = None
    # and a HAND-SET s5 via s5_entry_quality -- the engine's own documented path
    # for new names. No synthetic technicals: manufacturing d50=d200=price would
    # reproduce exactly the fabricated-but-plausible S5 that
    # patch_s5_null_guard.py was written to kill on the JS side.
    # TODO s5_hand: seeded at 50 = true neutral (also the engine default at line
    # 141). NOT a recommendation -- seeding higher would quietly boost an 8%
    # position. Per S5_guidance bands, SKHY is flat since inception (-2.93%),
    # never ran, no blowoff: arguably band (2) "off-highs, hasn't run recently"
    # = 70-84, or band (3) early/binding theme = 65-80. Your call, set it
    # deliberately before any freeze.
    # TODO s2: 78 assumes memory `working` (the 8/11 flip). Consequential.
    ("SKHY",  "company",          78, 0, 58, 1,  163.08,    None,    None, 51.96,   None,  8.00, False, False, None, 50),
    ("ASML",  "company",          70, 0, 55, 1, 1756.97, 1781.40, 1446.50, 49.84, 138.91,  7.00, False, False, None, None),
    ("GLW",   "company",          78, 0, 58, 1,  154.62,  174.20,  140.66, 46.64, 138.28,  4.50, False, False, None, None),
    ("COPX",  "company",          70, 0, 60, 1,   93.80,   81.17,   79.13, 69.01, 101.16,  3.00, True,  False, None, None),

    # --- CANDIDATES: unheld (cw=0, held=False). Re-seat evaluation only. ---
    # MU  s2 78 mirrors SKHY -- same memory stage (`working`, flipped 8/11).
    #     s6 TODO 45: +747% trailing year is real valuation risk. Seeded LOW
    #     (higher s6 = less risk in this scale). Set deliberately.
    #     lenses 2 = Visser (rebought ~$700, 7-handle) + ZaStocks ("Added").
    #     NOTE: the live voice_mentions ledger still reports MU at 1 lens --
    #     it has not ingested the ZaStocks leg. 2 is the CORRECTED value.
    ("MU",    "company",          78, 0, 45, MU_LENSES,  980.77,  964.87,  571.17, 55.74, 747.02,  0.00, False, True,  None, None),
    # MRVL s2 70 = optical/chips, cooling -- matches ASML's 70, below GLW's 78.
    #     lenses 2 = Visser + ZaStocks, straight from the pull's CONVERGENCE flag.
    ("MRVL",  "company",          70, 0, 50, 2,  249.91,  234.11,  145.14, 60.89, 250.95,  0.00, False, True,  None, None),

    # --- AI Application (hand_s1 = four-axis dominance scores, NOT the v3.0 values) ---
    ("LLY",   "company",          90, 0, 60, 1, 1243.74, 1179.35, 1052.92, 57.90,  75.22, 10.00, False, True,  68, None),
    ("AMZN",  "company",          75, 0, 55, 2,  258.25,  249.72,  238.32, 49.45,  16.36, 10.00, False, True,  60, None),

    # --- Tokenization ---
    # TODO s2: 78 = one-stage-out. Visser DATED Stage 4 to September (8/15-8/16).
    # If the S2 upgrade is taken, HOOD/ETHA move toward binding (90-100).
    ("HOOD",  "company",          78, 0, 55, 1,  100.66,  100.16,   96.04, 55.67,  -5.31,  6.00, False, True,  61, None),
    ("ETHA",  "macro_hardmoney",  75, 0, 60, 1,   17.92,   13.84,   17.62, 81.44, -43.89,  2.50, True,  True,  None, None),

    # --- Monetary Scarcity (vc=True: Visser 8/16 explicit reaffirmation) ---
    ("IBIT",  "macro_hardmoney",  75, 0, 62, 1,   43.37,   36.28,   43.00, 78.98, -31.90,  4.00, True,  True,  None, None),
    ("GLDM",  "macro_hardmoney",  78, 0, 65, 1,   90.53,   82.58,   89.07, 69.79,  36.96,  4.00, True,  True,  None, None),

    # --- Silver dual rows: identical technicals, cw split 3.25 / 3.75 = 7.00 ---
    # (preserves the spec's SLV_M < SLV_P ordering, rescaled from 3.0/3.5 = 6.5)
    ("SLV_M", "macro_hardmoney",  80, 0, 62, 1,   62.63,   55.63,   64.55, 66.63,  80.94,  3.25, True,  True,  None, None),
    ("SLV_P", "macro_hardmoney",  78, 0, 62, 1,   62.63,   55.63,   64.55, 66.63,  80.94,  3.75, True,  True,  None, None),
]

CURWT = {r[0]: r[11] for r in BOOK}

# Live deployed book, for the drift column. SGOV 6.0 completes the 100%.
DEPLOY = {
    "AIPO": 16.0, "SOXX": 12.0, "LLY": 10.0, "AMZN": 10.0, "SKHY": 8.0,
    "ASML": 7.0, "SLV": 7.0, "HOOD": 6.0, "SGOV": 6.0, "GLW": 4.5,
    "IBIT": 4.0, "GLDM": 4.0, "COPX": 3.0, "ETHA": 2.5,
}

DISP = {
    "AIPO": "bottleneck", "SOXX": "bottleneck", "SKHY": "bottleneck",
    "GLW": "bottleneck", "ASML": "bottleneck", "COPX": "physical",
    "MU": "bottleneck*", "MRVL": "bottleneck*",
    "SLV_P": "physical", "IBIT": "monetary", "GLDM": "monetary",
    "SLV_M": "monetary", "ETHA": "monetary", "LLY": "applic.",
    "AMZN": "applic.", "HOOD": "tokeniz.",
}


# ---------------------------------------------------------------------------
def preflight():
    """Fail loudly rather than silently producing a plausible wrong book."""
    errs = []

    tot = sum(r[11] for r in BOOK)
    if abs(tot + DEPLOY["SGOV"] - 100.0) > 0.01:
        errs.append(f"BOOK weights {tot} + SGOV {DEPLOY['SGOV']} != 100")

    if len(BOOK) != len({r[0] for r in BOOK}):
        errs.append("duplicate ticker in BOOK")

    for stale in ("MU", "MRVL"):
        if CURWT.get(stale, 0) > 0:
            errs.append(f"{stale} carries weight — v3.3 de-seated it; "
                        "candidates must be cw=0/held=False")

    if "SKHY" not in CURWT:
        errs.append("SKHY missing — this was the v3.0 script's core defect")

    # s5_hand only for no-DMA names; everyone else must use the ladder
    for r in BOOK:
        has_dma = r[7] is not None and r[8] is not None
        if has_dma and r[15] is not None:
            errs.append(f"{r[0]} has DMAs but a hand-set s5 ({r[15]}) - ladder is bypassed")
        if not has_dma and r[15] is None:
            errs.append(f"{r[0]} has no DMAs and no hand-set s5 - would default to 50 silently")

    # hand_s1 must be the four-axis dominance values, not the v3.0 ones
    want = {"LLY": 68, "AMZN": 60, "HOOD": 61}
    got = {r[0]: r[14] for r in BOOK if r[0] in want}
    if got != want:
        errs.append(f"hand_s1 {got} != four-axis spec {want}")

    # the correction that makes the SLV carve-out reachable at all
    for t in ("IBIT", "GLDM", "ETHA", "SLV_M", "SLV_P"):
        row = next(r for r in BOOK if r[0] == t)
        if not row[13]:
            errs.append(f"{t} voice_conviction False — Visser reaffirmed 8/16")

    # config sanity
    bn = set(CFG["three_axes"].get("bottleneck", {}).get("names", []))
    if "SKHY" not in bn:
        errs.append(f"config bottleneck axis lacks SKHY: {sorted(bn)}")
    if "application_dominance" not in CFG.get("three_axes", {}):
        print("  note: no application_dominance axis in config — "
              "LLY/AMZN/HOOD fall through to hand_s1 (expected).")

    if errs:
        print("\nPREFLIGHT FAILED:")
        for e in errs:
            print(f"  - {e}")
        sys.exit(1)
    print(f"  preflight ok — {len(BOOK)} rows, {tot:.2f}% + SGOV {DEPLOY['SGOV']}%")


# ---------------------------------------------------------------------------
# OFFLINE EVALUATION ONLY — deliberately NOT written to signal_model_config.json,
# which the cron reads. Judge the corrected book first, then decide whether the
# config change is warranted.
#
# SOXX raw_s1 70 predates the 2026-07-15 v3.3 de-seating that moved MU (~9% of
# SOXX) and MRVL (~4.9%) into the basket. Both still carry live axis scores in
# config (MU 82, MRVL 83) and are now orphaned there.
#     carrier blend = .090*82 + .049*83 + .861*70 = 71.7 -> 72
# ---------------------------------------------------------------------------
S1_RAW_OVERRIDE = {"SOXX": 72}


def build(regime):
    res = []
    for r in BOOK:
        name = r[0]
        s1 = s1_axes.s1_for(name, regime, CFG)
        s1 = r[14] if s1 is None else s1
        if name in S1_RAW_OVERRIDE:
            stage = regime["stages"].get(name, "cooling")
            mult = CFG["three_axes"]["bottleneck"]["stage_decay"][stage]
            s1 = S1_RAW_OVERRIDE[name] * mult
        if s1 is None:
            sys.exit(f"ABORT: no S1 for {name} (not on an axis, no hand_s1)")
        res.append(score_ticker(
            SignalInput(
                name, r[1], is_etf=r[12], s1_bottleneck=s1, s2_timing=r[2],
                s4_catalyst=r[3], s5_entry_quality=r[15],
                s6_valuation_risk=r[4], lenses_pointing=r[5],
                price=r[6], dma50=r[7], dma200=r[8], rsi=r[9],
                trailing_1y_pct=r[10], held=(r[11] > 0), current_weight=r[11],
                voice_conviction=r[13],
            ),
            CAPEX,
        ))

    caps = compute_pause_caps(res, "aggressive")

    m = s1_axes.cap_relax_multiple(regime["cpi"], CFG)
    for n in MON:
        if m is None:
            caps.pop(n, None)
        elif n in caps:
            caps[n] = round(CURWT[n] * m, 2)

    if regime["capex_on"]:
        for n in PHY:
            caps.pop(n, None)

    vf = compute_voice_floors(res, "aggressive")
    w = normalize(res, sleeve="aggressive", cash_ticker="SGOV",
                  paused_caps=caps, voice_floors=vf)["weights_pct"]

    cap = CFG["three_axes"]["scarcity_sleeve_cap_pct"]
    sc = sum(w.get(k, 0) for k in SCARC)
    if sc > cap:
        scale = cap / sc
        freed = sc - cap
        nonsc = [k for k in w if k not in SCARC and k != "SGOV"]
        base = sum(w[k] for k in nonsc) or 1
        for k in list(w):
            if k in SCARC:
                w[k] = round(w[k] * scale, 1)
            elif k in nonsc:
                w[k] = round(w[k] + freed * (w[k] / base), 1)
    return w


def report(label, regime):
    w = build(regime)
    slv = w.get("SLV_M", 0) + w.get("SLV_P", 0)

    print(f"\n{label}")
    print(f"  CPI {regime['cpi']}  ·  capex_on={regime['capex_on']}  ·  "
          f"stages {regime['stages']}")
    print(f"\n{'TKR':<7}{'axis':<12}{'target':>8}{'deployed':>10}{'drift':>8}")
    print("-" * 45)

    order = ["AIPO", "SOXX", "SKHY", "ASML", "GLW", "COPX", "MU", "MRVL",
             "LLY", "AMZN", "HOOD", "IBIT", "GLDM", "SLV_M", "SLV_P", "ETHA"]
    for t in order:
        if t not in w:
            continue
        dep = DEPLOY.get(t)
        if t in ("SLV_M", "SLV_P"):
            dep = None  # shown on the combined SLV line
        d = f"{w[t] - dep:+.1f}" if dep is not None else "—"
        ds = f"{dep:.1f}" if dep is not None else "—"
        print(f"{t:<7}{DISP.get(t, ''):<12}{w[t]:>8.1f}{ds:>10}{d:>8}")

    print("-" * 45)
    print(f"{'SLV':<7}{'(M+P)':<12}{slv:>8.1f}{DEPLOY['SLV']:>10.1f}"
          f"{slv - DEPLOY['SLV']:>+8.1f}")
    print(f"{'SGOV':<7}{'cash':<12}{w.get('SGOV', 0):>8.1f}"
          f"{DEPLOY['SGOV']:>10.1f}{w.get('SGOV', 0) - DEPLOY['SGOV']:>+8.1f}")

    sleeves = {
        "AI Compute": ["AIPO", "SOXX", "SKHY", "ASML", "GLW", "COPX", "MU", "MRVL"],
        "Application": ["LLY", "AMZN"],
        "Tokenization": ["HOOD", "ETHA"],
        "Monetary": ["IBIT", "GLDM", "SLV_M"],
        "Physical": ["SLV_P"],
        "Cash": ["SGOV"],
    }
    print()
    for s, ks in sleeves.items():
        print(f"  {s:<14}{sum(w.get(k, 0) for k in ks):>6.1f}%")
    print(f"  {'scarcity tot':<14}{sum(w.get(k, 0) for k in SCARC):>6.1f}%  "
          f"(cap {CFG['three_axes']['scarcity_sleeve_cap_pct']})")
    print(f"  {'TOTAL':<14}{sum(w.values()):>6.1f}%")
    return w


STAGES = {
    "AIPO": "binding",   # Visser 8/16: compute/power insatiable
    "SOXX": "cooling",
    "SKHY": "working",   # memory flipped exhausted -> working on the 8/11 cycle
    "GLW":  "cooling",
    "ASML": "cooling",
    "MU":   "working",   # memory, same stage as SKHY
    "MRVL": "cooling",   # optical/chips
}

# CPI 3.4% (July 2026, released 8/12, down from 3.5%) -> cap_multiple 1.0, dormant.
# capex_on=False is the CONSERVATIVE default: the Axis-3 physical-boost trigger
# has no numeric definition (queue item #1). +77% YoY would fire it on either a
# level or second-derivative test — run --all-regimes to see the magnitude, but
# do NOT freeze the capex_on book until the threshold is defined.
BASE = {"cpi": 3.4, "capex_on": False, "stages": STAGES}
CAPEX_ON = {"cpi": 3.4, "capex_on": True, "stages": STAGES}
BOTH = {"cpi": 6.5, "capex_on": True, "stages": STAGES}


if __name__ == "__main__":
    print("\nrescore_v34.py — v3.3 book, technicals 2026-08-21")
    print("=" * 45)
    preflight()

    report("BASE — CPI dormant, capex trigger OFF (recommended read)", BASE)

    if "--all-regimes" in sys.argv:
        report("SENSITIVITY — capex trigger ON (threshold UNDEFINED, do not freeze)",
               CAPEX_ON)
        report("TAIL — CPI 6.5 uncap + capex ON (scarcity cap should bind)", BOTH)

    print("\n" + "=" * 45)
    print("""REVIEW BEFORE ANY FREEZE:
  - s2 / s6 marked TODO in BOOK are seeded, not decided. SOXX and SKHY
    especially: SOXX's 60 predates its CORE promotion, SKHY's 78 encodes
    the memory `working` flip.
  - SKHY S5 is synthetic-neutral (d50=d200=price, ret1y=0). Confirm
    SignalInput has no s5 override before relying on it.
  - SLV sits -2.97% vs its 200-DMA, inside the 3% carve-out band, with
    vc=True. Margin is 0.026pp. Confirm the carve-out fired as intended
    and did not merely strip the s5_held_below_200_floor (55) while
    leaving raw S5 (~36) — check both halves moved the same way.
  - IBIT/GLDM/ETHA/HOOD have all RECLAIMED their 200-DMAs. The reclaim
    confirmation window is undefined; all four are within 2% of the line.
  - Nothing here is written to server/daily-cron.cjs.""")
