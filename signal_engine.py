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
        "context": {"price":sig.price,"pct_from_52w_high":sig.pct_from_52w_high,
                    "trailing_1y_pct":sig.trailing_1y_pct},
        "notes": sig.notes,
    }


def apply_exit_rules_vs_prior(current: dict, prior_composite: Optional[float]):
    flags = []
    if prior_composite is None: return flags
    drop = prior_composite - current["composite"]
    er = CFG["exit_rules"]
    if drop >= er["exit_if_composite_drops"]:
        flags.append(f"EXIT: composite fell {drop:.1f} pts (>= {er['exit_if_composite_drops']})")
    elif drop >= er["trim_one_tier_if_composite_drops"]:
        flags.append(f"TRIM one tier: composite fell {drop:.1f} pts (>= {er['trim_one_tier_if_composite_drops']})")
    return flags


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
