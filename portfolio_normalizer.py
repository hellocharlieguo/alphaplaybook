#!/usr/bin/env python3
"""
AlphaPlaybook Decision Engine — normalizer (v2.0)

Conviction-proportional weighting. ONE set of numbers (no separate engine % vs your %).
  weight = min_floor + (composite - floor_score)^k, scaled so TOP name = target_top_pct.
  - k solved each run.
  - min_floor (2%) keeps every included name a real position (theme breadth).
  - cash_floor reserved.
  - NO single-stock cap (concentration intended; managed by target_top + floors).

Two variants from one engine: aggressive (target_top 18%) vs conservative (11%).
Manual overrides honored (lock a weight, or 0 = force exit). Dependency-free.
"""
import json, os
from typing import Optional

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "signal_model_config.json")
with open(CONFIG_PATH) as f:
    CFG = json.load(f)

CASH_TICKERS = {"SGOV","BIL","USFR"}


def normalize(results: list[dict], sleeve: str = "aggressive",
              cash_ticker: str = "SGOV",
              manual_overrides: Optional[dict] = None,
              paused_caps: Optional[dict] = None) -> dict:
    """results: list of score_ticker() dicts. Returns weights summing to 100%.

    paused_caps {ticker: max_pct}: Phase 2b entry gate. A held name below its 200-DMA
    cannot be sized ABOVE its current weight (pause adds). Downward moves are still
    allowed — a cap only BINDS if the convexity target would exceed it. Freed weight
    redistributes to un-paused names via the same convexity solve (iterated to a fixed
    point). Caps never force a name out; that's the exit gate's job (override 0).
    """
    v = CFG["engine_variants"][sleeve]
    wcfg = CFG["weighting"]
    target_top = v["target_top_pct"]
    min_floor  = v["min_position_pct"]
    cash_floor = v["cash_floor_pct"]
    floor_score = wcfg["floor_score"]
    overrides = {k.upper(): val for k, val in (manual_overrides or {}).items()}
    caps = {k.upper(): val for k, val in (paused_caps or {}).items()}

    hold_thr = CFG["entry_thresholds"]["hold_only"]
    forced_exit = {t for t,val in overrides.items() if val == 0}
    # eligibility/tiering keys off the UNDISCOUNTED composite (Rule B leaves it intact)
    eligible = [r for r in results
                if r["composite"] >= hold_thr
                and r["ticker"].upper() not in CASH_TICKERS
                and r["ticker"].upper() not in forced_exit]
    dropped = [r["ticker"] for r in results
               if (r["composite"] < hold_thr or r["ticker"].upper() in forced_exit)
               and r["ticker"].upper() not in CASH_TICKERS]

    locked = {r["ticker"]: overrides[r["ticker"].upper()]
              for r in eligible if r["ticker"].upper() in overrides and overrides[r["ticker"].upper()] > 0}
    free = [r for r in eligible if r["ticker"] not in locked]
    # Rule B: the convexity curve runs on weighting_score (coverage-discounted for
    # ETF-redundant single names), NOT raw composite. Eligibility/tiering used composite
    # above (hold_thr check). Fallback to composite if no weighting_score.
    comp = {r["ticker"]: r.get("weighting_score", r["composite"]) for r in free}

    def solve():
        """Bisection over k with the current locked/free split. Returns (weights, k)."""
        locked_sum = sum(locked.values())
        free_comp = {r["ticker"]: comp[r["ticker"]] for r in free}
        distributable = 100.0 - cash_floor - locked_sum - min_floor*len(free)
        def weights_for_k(k):
            raw = {t: max(0,(c-floor_score))**k for t,c in free_comp.items()}
            s = sum(raw.values()) or 1.0
            w = {t: min_floor + raw[t]/s*distributable for t in raw}
            w.update(locked)
            return w
        lo, hi = 0.2, 9.0
        for _ in range(80):
            k = (lo+hi)/2
            w = weights_for_k(k)
            free_max = max([w[t] for t in free_comp], default=0)
            if free_max > target_top: hi = k
            else: lo = k
        k = (lo+hi)/2
        return weights_for_k(k), round(k,2)

    # Entry-pause caps (2b): lock any paused name whose convexity weight would exceed its
    # current weight at that cap, then re-solve so the freed weight flows to un-paused
    # names. Iterate to a fixed point (locking only reduces, so it converges quickly).
    paused_capped = []
    w, k = solve()
    for _ in range(12):
        breaches = {r["ticker"]: caps[r["ticker"].upper()]
                    for r in free
                    if r["ticker"].upper() in caps and w[r["ticker"]] > caps[r["ticker"].upper()] + 0.01}
        if not breaches:
            break
        locked.update(breaches)
        paused_capped.extend(breaches.keys())
        free = [r for r in free if r["ticker"] not in breaches]
        w, k = solve()

    w[cash_ticker] = w.get(cash_ticker, 0.0) + cash_floor
    rounded = {t: round(x*2)/2 for t,x in w.items()}
    resid = round(100.0 - sum(rounded.values()), 1)
    rounded[cash_ticker] = round(rounded.get(cash_ticker,0)+resid, 1)

    return {
        "sleeve": sleeve, "target_top_pct": target_top, "convexity_k": k,
        "cash_floor_pct": cash_floor, "min_floor_pct": min_floor,
        "weights_pct": dict(sorted(rounded.items(), key=lambda kv:-kv[1])),
        "total_pct": round(sum(rounded.values()),1),
        "dropped_avoid_exit": dropped,
        "paused_capped": paused_capped,
        "note": "No single-stock cap. Concentration via target_top + 2% floor + cash floor. paused_capped = held names frozen at current weight (below-200 entry pause).",
    }


def to_shares(weights_pct: dict, prices: dict, sleeve_dollars: float) -> dict:
    out = {}
    for t, wpct in weights_pct.items():
        dollars = sleeve_dollars*wpct/100.0
        px = prices.get(t)
        if not px:
            out[t] = {"weight_pct":wpct,"dollars":round(dollars,2),"price":None,"shares":None,"note":"price UNKNOWN"}
        else:
            sh = int(dollars//px)
            out[t] = {"weight_pct":wpct,"dollars":round(dollars,2),"price":px,"shares":sh,"actual_cost":round(sh*px,2)}
    return out


# ---------------------------------------------------------------------------
if __name__ == "__main__":
    from signal_engine import SignalInput, score_ticker
    CAPEX = 77.0
    # NOTE: scores below are the validated 5/28 v2.1 composites entered directly as
    # s1_bottleneck with the other sub-scores neutralized, so score_ticker reproduces
    # them exactly (composite == that number at CAPEX GREEN x1.0). The point of this
    # harness is to exercise Rule B (etf_redundant -> weighting_score discount), not
    # to re-derive sub-scores. Live rescores set the real six signals per name.
    def fixed(tkr, comp, etf=False, redundant=False, macro=False):
        # back out an S1 that yields `comp` as composite with everything else neutral
        # composite = (s1*.25 + 50*.20 + 50*.20 + 50*.15 + 50*.10 + 0*.10)*1.0
        # => s1 = (comp - 50*0.65)/0.25
        s1 = (comp - 50*0.65)/0.25
        return SignalInput(tkr, "macro_hardmoney" if macro else "company",
                           is_etf=etf, etf_redundant=redundant,
                           s1_bottleneck=s1, s2_timing=50, s5_entry_quality=50,
                           s4_catalyst=50, s6_valuation_risk=50, lenses_pointing=0)

    AGG = [
        fixed("SLV",82.8,etf=True,macro=True), fixed("CEG",83.9,redundant=True),
        fixed("WGMI",79.0,etf=True), fixed("AIPO",79.0,etf=True),
        fixed("IBIT",76.2,etf=True,macro=True), fixed("GLDM",75.8,etf=True,macro=True),
        fixed("GLW",74.8), fixed("TXN",73.1), fixed("FLNC",72.8),
        fixed("BE",72.4,redundant=True), fixed("MRVL",72.4), fixed("ETHA",69.5,etf=True),
        fixed("ENTG",69.2), fixed("COPX",67.2,etf=True), fixed("HOOD",58.4),
        fixed("XSD",51.2,etf=True), fixed("SGOV",51.0,etf=True),
    ]
    CON = [
        fixed("CEG",83.9,redundant=True), fixed("SLV",82.8,etf=True,macro=True),
        fixed("VST",81.3,redundant=True), fixed("NLR",79.5,etf=True),
        fixed("GRID",75.9,etf=True), fixed("GLDM",75.8,etf=True,macro=True),
        fixed("XLU",75.2,etf=True), fixed("GLW",74.8), fixed("TXN",73.1),
        fixed("BE",72.4), fixed("MRVL",72.4), fixed("MSTR",71.8),
        fixed("ENTG",69.2), fixed("XLE",68.1,etf=True), fixed("COPX",67.2,etf=True),
        fixed("COIN",65.0), fixed("XLV",55.8,etf=True), fixed("XSD",51.2,etf=True),
        fixed("SGOV",51.0,etf=True),
    ]
    for name, sleeve, book in [("AGGRESSIVE","aggressive",AGG),("CONSERVATIVE","conservative",CON)]:
        results = [score_ticker(s, CAPEX) for s in book]
        out = normalize(results, sleeve=sleeve)
        disc = {r["ticker"] for r in results if r.get("coverage_discounted")}
        print(f"\n=== {name}  (top={out['target_top_pct']}%, k={out['convexity_k']}, sum={out['total_pct']}%) ===")
        for t,wt in out["weights_pct"].items():
            flag = " *coverage-discounted" if t in disc else ""
            print(f"  {t:<6}{wt:>6.1f}%{flag}")
