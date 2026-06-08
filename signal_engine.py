#!/usr/bin/env python3
"""
AlphaPlaybook Decision Engine — scorer (v2.0)

Scores a ticker on 6 signals -> composite -> action -> tier.
Asset-type aware: company names use earnings-catalyst S4 + anti-momentum S5;
macro/hard-money names (BTC/gold/silver) use own-driver S4 + cycle-position S5.

Workflow: Claude gathers the 6 signals via web search (judgment), then this
formula turns them into a composite (deterministic). Pairs with portfolio_normalizer.py.
Dependency-free (stdlib only).
"""
import json, os
from dataclasses import dataclass
from datetime import date
from typing import Optional

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "signal_model_config.json")
with open(CONFIG_PATH) as f:
    CFG = json.load(f)


@dataclass
class SignalInput:
    ticker: str
    asset_type: str = "company"          # "company" | "macro_hardmoney"
    sleeve: str = "aggressive"           # "aggressive" | "conservative"
    is_etf: bool = False
    etf_redundant: bool = False          # single name whose THEME is held via a thematic ETF
                                         # -> Rule B coverage discount on weighting_score (NOT composite)
    # six signals, 0-100 (None = UNKNOWN -> treated as neutral 50, lowers confidence)
    s1_bottleneck: Optional[float] = None
    s2_timing: Optional[float] = None
    s5_entry_quality: Optional[float] = None   # ANTI-MOMENTUM: parabolic = low
    s4_catalyst: Optional[float] = None        # asset-type routed
    s6_valuation_risk: Optional[float] = None
    lenses_pointing: int = 0             # 0-3 (Visser / Aschenbrenner / Camillo)
    # context for the report
    price: Optional[float] = None
    pct_from_52w_high: Optional[float] = None
    trailing_1y_pct: Optional[float] = None     # informs S5 (anti-momentum)
    # Phase 2 gate inputs (from cron technicals + current book, fed at rescore time)
    held: bool = False                           # currently in the live book
    current_weight: Optional[float] = None       # current weight % (for the 2b entry pause)
    dma50: Optional[float] = None
    dma200: Optional[float] = None
    mom_up: bool = False                         # 20-DMA momentum up (un-pause fuel)
    mom_down: bool = False                        # 20-DMA momentum down (exit accelerant)
    notes: str = ""


def _conv(lenses): 
    v = CFG["convergence_bonus_values"]
    return {3:v["three_lenses"],2:v["two_lenses"],1:v["one_lens"]}.get(lenses, v["none"])


def capex_multiplier(yoy_pct: float):
    m = CFG["capex_multiplier"]
    if yoy_pct >= m["green"]["threshold_yoy_pct"]: return "GREEN", m["green"]["multiplier"]
    if yoy_pct >= m["amber"]["threshold_yoy_pct"]: return "AMBER", m["amber"]["multiplier"]
    if yoy_pct >= m["red"]["threshold_yoy_pct"]:   return "RED", m["red"]["multiplier"]
    return "NEGATIVE", m["negative"]["multiplier"]


def _confidence(sig):
    core = [sig.s1_bottleneck, sig.s2_timing, sig.s5_entry_quality,
            sig.s4_catalyst, sig.s6_valuation_risk]
    return round(sum(1 for x in core if x is not None)/len(core), 2)


def score_ticker(sig: SignalInput, capex_yoy_pct: float) -> dict:
    w = CFG["composite_weights"]
    s1 = 50 if sig.s1_bottleneck    is None else sig.s1_bottleneck
    s2 = 50 if sig.s2_timing        is None else sig.s2_timing
    s5 = 50 if sig.s5_entry_quality is None else sig.s5_entry_quality
    s4 = 50 if sig.s4_catalyst      is None else sig.s4_catalyst
    s6 = 50 if sig.s6_valuation_risk is None else sig.s6_valuation_risk
    conv = _conv(sig.lenses_pointing)

    # --- Phase 2: asymmetric S5 ------------------------------------------------
    # A HELD name below its 200-DMA must not have its composite dragged by price
    # weakness ("paused, not sold"): floor the effective S5 so price can't trim it.
    # Thesis (the other signals) can still move the composite. Adds (not held) and
    # above-200 names are untouched, so entry quality still scores normally.
    g = CFG.get("gates", {})
    below_200 = (sig.dma200 is not None and sig.price is not None and sig.price < sig.dma200)
    s5_floored = False
    if sig.held and below_200:
        floor = g.get("s5_held_below_200_floor", 60)
        if s5 < floor:
            s5 = floor
            s5_floored = True

    raw = (s1*w["S1_bottleneck"] + s2*w["S2_timing"] + s5*w["S5_entry_quality"]
           + s4*w["S4_catalyst"] + s6*w["S6_valuation_risk"] + conv*w["convergence_bonus"])
    regime, mult = capex_multiplier(capex_yoy_pct)
    composite = round(raw*mult, 1)

    t = CFG["entry_thresholds"]
    action = ("STRONG ENTRY" if composite>=t["strong_entry"] else
              "ENTER" if composite>=t["enter"] else
              "STARTER / WATCH" if composite>=t["starter_watch"] else
              "HOLD (no new entry)" if composite>=t["hold_only"] else "AVOID / EXIT")

    # --- Rule B: coverage (single-name redundancy) discount -------------------
    # Applies ONLY to the weighting_score the normalizer consumes. composite,
    # action, tier, and exit/trim triggers all key off the UNDISCOUNTED composite.
    cd = CFG.get("coverage_discount", {})
    lam = cd.get("lambda", 1.0)
    fs = CFG["weighting"]["floor_score"]
    discount_applied = bool(sig.etf_redundant) and not sig.is_etf and lam < 1.0
    weighting_score = round(fs + (composite - fs) * lam, 1) if discount_applied else composite

    return {
        "ticker": sig.ticker, "asset_type": sig.asset_type, "sleeve": sig.sleeve,
        "is_etf": sig.is_etf, "etf_redundant": sig.etf_redundant,
        "sub_scores": {"S1":s1,"S2":s2,"S5":s5,"S4":s4,"S6":s6,"convergence":conv},
        "raw": round(raw,1), "capex_regime": regime, "capex_multiplier": mult,
        "composite": composite,
        "weighting_score": weighting_score,
        "coverage_discounted": discount_applied,
        "action": action, "confidence": _confidence(sig),
        "s5_floored": s5_floored,
        "technicals": {"below_200": below_200, "mom_up": sig.mom_up,
                       "mom_down": sig.mom_down, "held": sig.held,
                       "current_weight": sig.current_weight},
        "context": {"price":sig.price,"pct_from_52w_high":sig.pct_from_52w_high,
                    "trailing_1y_pct":sig.trailing_1y_pct},
        "notes": sig.notes,
    }


def _next_lower_threshold(score: float) -> float:
    """The next entry-band floor below `score` — the '+1 band' accelerant step."""
    t = CFG["entry_thresholds"]
    ladder = [t["strong_entry"], t["enter"], t["starter_watch"], t["hold_only"]]  # 78/65/55/45
    for i, b in enumerate(ladder):
        if score >= b:
            return ladder[i+1] if i+1 < len(ladder) else max(b - 10, 0)
    return score  # already below the ladder


def apply_exit_rules_vs_prior(current: dict, prior_composite: Optional[float]) -> dict:
    """Exit decision vs the prior rescore's composite.
      TRIM (drop >= trim_thr): rides the composite (no extra cut) — flag only.
      EXIT (drop >= exit_thr): force the name out.
      Accelerant: a `company` (not exit_exempt) in the trim zone that is ALSO below its
        200-DMA with mom-down escalates +1 entry-band (cut weighting_score to next band).
    Returns {flags, action, new_weighting_score}; action in {None,'TRIM','EXIT','TRIM+ACCEL'}.
    """
    out = {"flags": [], "action": None, "new_weighting_score": None}
    if prior_composite is None:
        return out
    drop = prior_composite - current["composite"]
    er = CFG["exit_rules"]; g = CFG.get("gates", {}); acc = g.get("exit_accelerant", {})
    exit_thr = er["exit_if_composite_drops"]; trim_thr = er["trim_one_tier_if_composite_drops"]

    if drop >= exit_thr:
        out["action"] = "EXIT"
        out["flags"].append(f"EXIT: composite fell {drop:.1f} pts (>= {exit_thr})")
        return out
    if drop >= trim_thr:
        out["action"] = "TRIM"
        out["flags"].append(f"TRIM: composite fell {drop:.1f} pts (>= {trim_thr}) — rides the composite")
        tech = current.get("technicals", {})
        exempt = current["ticker"].upper() in {t.upper() for t in g.get("exit_exempt", [])}
        is_company = current.get("asset_type") == acc.get("applies_to", "company")
        if (acc.get("enabled") and is_company and not exempt
                and tech.get("below_200") and tech.get("mom_down")):
            ws = current.get("weighting_score", current["composite"])
            target = max(_next_lower_threshold(ws), CFG["weighting"]["floor_score"])
            if target < ws:
                out["action"] = "TRIM+ACCEL"
                out["new_weighting_score"] = round(target, 1)
                out["flags"].append(
                    f"ACCELERANT: company below-200 + mom-down — +1 band, weighting_score {ws:.1f} -> {target:.1f}")
    return out


# --- composite history (feeds the delta exit) -------------------------------
HIST_DIR = os.path.join(os.path.dirname(__file__), "composite_history")


def save_composites(results: list, run_date: Optional[str] = None) -> str:
    """Dump {ticker: composite} for this rescore — becomes the next run's prior."""
    os.makedirs(HIST_DIR, exist_ok=True)
    run_date = run_date or date.today().isoformat()
    path = os.path.join(HIST_DIR, f"{run_date}.json")
    with open(path, "w") as f:
        json.dump({r["ticker"]: r["composite"] for r in results}, f, indent=2, sort_keys=True)
    return path


def load_prior_composites(before_date: Optional[str] = None) -> dict:
    """Most recent saved composite map (optionally strictly before a date)."""
    if not os.path.isdir(HIST_DIR):
        return {}
    files = sorted(f for f in os.listdir(HIST_DIR) if f.endswith(".json"))
    if before_date:
        files = [f for f in files if f[:-5] < before_date]
    if not files:
        return {}
    with open(os.path.join(HIST_DIR, files[-1])) as f:
        return json.load(f)


def apply_gates(results: list, prior_composites: dict):
    """Run the exit gate over scored results. Mutates weighting_score on accelerated
    trims; returns (results, exit_overrides{ticker:0}, gate_log[str])."""
    exit_overrides, log = {}, []
    for r in results:
        dec = apply_exit_rules_vs_prior(r, prior_composites.get(r["ticker"]))
        if dec["action"] == "EXIT":
            exit_overrides[r["ticker"]] = 0
        elif dec["action"] == "TRIM+ACCEL" and dec["new_weighting_score"] is not None:
            r["weighting_score"] = dec["new_weighting_score"]
        for f in dec["flags"]:
            log.append(f"{r['ticker']}: {f}")
    return results, exit_overrides, log


def compute_pause_caps(results: list, sleeve: str = "aggressive",
                       exit_overrides: Optional[dict] = None) -> dict:
    """Entry gate (2b): a HELD name below its 200-DMA is capped at its current weight
    (pause adds; downward moves still allowed). Aggressive un-pauses on mom.up;
    conservative requires a full 200-reclaim (so it stays paused while below-200).
    Names already EXITing are skipped. Returns {ticker: current_weight} for
    normalize(paused_caps=...)."""
    exit_overrides = exit_overrides or {}
    g = CFG.get("gates", {})
    mode = g.get("entry_pause", {}).get("unpause", {}).get(sleeve, "reclaim_200dma")
    caps = {}
    for r in results:
        t = r["ticker"]; tech = r.get("technicals", {})
        if not (tech.get("held") and tech.get("below_200")
                and tech.get("current_weight") is not None and t not in exit_overrides):
            continue
        unpaused = (mode == "mom_up" and tech.get("mom_up"))   # reclaim_200dma can't hold while below-200
        if not unpaused:
            caps[t] = tech["current_weight"]
    return caps


# ---------------------------------------------------------------------------
if __name__ == "__main__":
    CAPEX = 77.0
    # Demo: a few names showing asset-type routing + anti-momentum S5.
    demo = [
        SignalInput("CEG","company",is_etf=False, s1_bottleneck=90,s2_timing=100,
                    s5_entry_quality=92,s4_catalyst=70,s6_valuation_risk=65,lenses_pointing=2,
                    trailing_1y_pct=-27, notes="Down 27% YTD -> S5 high (great entry). Nuclear."),
        SignalInput("BE","company",is_etf=False, s1_bottleneck=95,s2_timing=100,
                    s5_entry_quality=30,s4_catalyst=85,s6_valuation_risk=35,lenses_pointing=3,
                    trailing_1y_pct=1300, notes="Up ~1300% -> S5=30 (parabolic penalty, NO cushion). Fuel cells."),
        SignalInput("SLV","macro_hardmoney",is_etf=True, s1_bottleneck=90,s2_timing=95,
                    s5_entry_quality=72,s4_catalyst=88,s6_valuation_risk=65,lenses_pointing=2,
                    notes="Dual industrial+monetary; deficit + gold/silver ratio. Macro S4."),
        SignalInput("IBIT","macro_hardmoney",is_etf=True, s1_bottleneck=88,s2_timing=88,
                    s5_entry_quality=68,s4_catalyst=72,s6_valuation_risk=62,lenses_pointing=2,
                    notes="Own driver = ETF flows (just choppy). Below ATH -> S5 ok."),
    ]
    regime, mult = capex_multiplier(CAPEX)
    print(f"=== Decision Engine — {date.today()} ===")
    print(f"Capex: {regime} ({CAPEX}% YoY) x{mult}\n")
    print(f"{'TKR':<6}{'type':<16}{'S1':>4}{'S2':>4}{'S5':>4}{'S4':>4}{'S6':>4}{'Cv':>4}{'Comp':>7}  Action")
    for s in demo:
        r = score_ticker(s, CAPEX); ss = r["sub_scores"]
        print(f"{r['ticker']:<6}{r['asset_type']:<16}{ss['S1']:>4}{ss['S2']:>4}{ss['S5']:>4}"
              f"{ss['S4']:>4}{ss['S6']:>4}{ss['convergence']:>4}{r['composite']:>7}  {r['action']}")
