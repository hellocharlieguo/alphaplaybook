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
    s4_catalyst: Optional[float] = None        # DEPRECATED 2026-07-09 (S4 removed from composite; field kept as no-op so existing callers don't break)
    s6_valuation_risk: Optional[float] = None
    lenses_pointing: int = 0             # 0-3 cross-voice convergence count (Visser / Camillo / ZaStocks).
                                         # Computed UPSTREAM in pull_candidates.cjs from BASE_PORTFOLIO
                                         # membership + the voice_mentions ledger (decay windows + positive-
                                         # conviction filter), with ZaStocks corroboration-only (his leg
                                         # counts only when Visser or Camillo also point at the name).
                                         # Aschenbrenner dropped from the auto-count (2026-07-02).
    # context for the report
    price: Optional[float] = None
    pct_from_52w_high: Optional[float] = None
    trailing_1y_pct: Optional[float] = None     # informs S5 (anti-momentum)
    # Phase 2 gate inputs (from cron technicals + current book, fed at rescore time)
    held: bool = False                           # currently in the live book
    current_weight: Optional[float] = None       # current weight % (for the 2b entry pause)
    dma20: Optional[float] = None
    dma50: Optional[float] = None
    dma200: Optional[float] = None
    rsi: Optional[float] = None                  # per-ticker RSI (Phase 2.5 velocity penalty input)
    mom_up: bool = False                         # 20-DMA momentum up (un-pause fuel)
    mom_down: bool = False                        # 20-DMA momentum down (exit accelerant)
    voice_conviction: bool = False               # tracked voice reaffirmed recently -> voice floor
    notes: str = ""


def _conv(lenses):
    # Maps the cross-voice lens count (0-3) to the convergence sub-score. The count is
    # already corroboration-adjusted upstream (ZaStocks-only names arrive as a lower count),
    # so this stays a pure count->value lookup. 2 lenses -> 60, 3 -> 100 (the 0.6/1.0 curve).
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


def _pause_carveout(sig: "SignalInput", below_200: bool) -> bool:
    """Spec A — Conviction-Proximity Pause Carve-Out.
    True if a HELD hard-money name below its 200-DMA should be EXEMPT from the
    entry pause / S5 floor because it is at-trend (not in a downtrend) with a
    tracked voice actively reaffirming. ALL must hold:
      (1) asset_type == macro_hardmoney   (companies never carve out)
      (2) within band of 200-DMA: |price/dma200 - 1| <= band   (default 3%)
      (3) voice_conviction == True         (recent reaffirmation)
    Re-arms naturally: if price falls outside the band, condition (2) fails and the
    normal pause/floor returns. Removes the FREEZE only — does not boost weight.
    """
    co = CFG.get("gates", {}).get("entry_pause", {}).get("conviction_proximity_carveout", {})
    if not co.get("enabled"):
        return False
    if not (sig.held and below_200):
        return False
    if sig.asset_type != "macro_hardmoney":
        return False
    if not sig.voice_conviction:
        return False
    if sig.dma200 is None or sig.price is None or sig.dma200 <= 0:
        return False
    band = co.get("band_pct", 0.03)
    return abs(sig.price / sig.dma200 - 1.0) <= band


def _stage_decay_mult(sig: "SignalInput", s2: float) -> float:
    """Spec B — Stage-Decay Weighting.
    Multiplier on the WEIGHTING SCORE (not composite) keyed to stage timing (S2),
    so a single name's weight bleeds as its stage cools binding->working->cooling->
    exhausted. EXEMPT: hard money (not a 5-stage AI name) and ETFs (already
    diversified). Applied like Rule B's lambda: ws = floor + (composite-floor)*mult.
    Stacks multiplicatively with Rule B (a covered, cooling name gets both).
    """
    sd = CFG.get("gates", {}).get("stage_decay", {})
    if not sd.get("enabled"):
        return 1.0
    if sig.asset_type == "macro_hardmoney" or sig.is_etf:
        return 1.0
    bands = sd.get("bands", {})
    if s2 >= sd.get("binding_thr", 90):   return bands.get("binding", 1.00)
    if s2 >= sd.get("working_thr", 65):   return bands.get("working", 0.92)
    if s2 >= sd.get("cooling_thr", 40):   return bands.get("cooling", 0.80)
    return bands.get("exhausted", 0.60)


def score_ticker(sig: SignalInput, capex_yoy_pct: float, regime_above: bool = False) -> dict:
    w = CFG["composite_weights"]
    s1 = 50 if sig.s1_bottleneck    is None else sig.s1_bottleneck
    s2 = 50 if sig.s2_timing        is None else sig.s2_timing
    s5 = 50 if sig.s5_entry_quality is None else sig.s5_entry_quality
    s6 = 50 if sig.s6_valuation_risk is None else sig.s6_valuation_risk
    conv = _conv(sig.lenses_pointing)

    # --- Phase 2.5: S5 position from the DMA ladder (opt-in) --------------------
    # Position BAND comes from the 20/50/200 ladder (structure, never distance).
    # Penalty comes from RSI + 1yr velocity (the anti-momentum blow-off brake).
    # Falls back to the hand-set s5 when DMAs/flag are absent (e.g. new names).
    g = CFG.get("gates", {})
    lad = g.get("s5_ladder", {})
    s5_source = "input"
    if (lad.get("enabled") and sig.price is not None
            and sig.dma50 is not None and sig.dma200 is not None):
        b = lad["position_bands"]; vp = lad["velocity_penalty"]; clamp = lad.get("clamp", [5, 95])
        if sig.price < sig.dma200:
            base = b["below_200"]
        elif sig.price < sig.dma50:
            base = b["pullback_below_50"]
        else:
            base = b["riding_above_50"]
        pen = 0.0
        if sig.rsi is not None:
            if sig.rsi >= vp["rsi_overbought_thr"]:   pen += vp["rsi_overbought_pen"]
            elif sig.rsi >= vp["rsi_warm_thr"]:        pen += vp["rsi_warm_pen"]
            elif sig.rsi <= vp["rsi_oversold_thr"]:    pen -= vp["rsi_oversold_bonus"]
        # Velocity = stretch ABOVE the 50-DMA (not trailing-1yr level). A name that has
        # merely been winning a long time sits far above its 200-DMA but near its 50-DMA,
        # so this only fires on a *recent* run away from trend. Discounted x0.5 in
        # working/binding themes (high s2), full in peaked (low s2). RSI guardrail above.
        if sig.price is not None and sig.dma50 not in (None, 0):
            stretch = (sig.price - sig.dma50) / sig.dma50 * 100.0
            if   stretch >= vp["stretch_hot_thr"]:  raw_pen = vp["stretch_hot_pen"]
            elif stretch >= vp["stretch_warm_thr"]: raw_pen = vp["stretch_warm_pen"]
            elif stretch >= vp["stretch_mild_thr"]: raw_pen = vp["stretch_mild_pen"]
            else:                                   raw_pen = 0.0
            theme_mult = (vp["working_theme_mult"] if s2 >= vp["working_theme_s2_thr"]
                          else vp["peaked_theme_mult"])
            pen += raw_pen * theme_mult
        s5 = max(clamp[0], min(clamp[1], base - pen))
        s5_source = f"ladder(base={base},pen={pen:+.0f})"

    # --- Phase 2: asymmetric S5 ------------------------------------------------
    # A HELD name below its 200-DMA must not have its composite dragged by price
    # weakness ("paused, not sold"): floor the effective S5 so price can't trim it.
    # Thesis (the other signals) can still move the composite. Adds (not held) and
    # above-200 names are untouched, so entry quality still scores normally.
    g = CFG.get("gates", {})
    below_200 = (sig.dma200 is not None and sig.price is not None and sig.price < sig.dma200)
    # Conviction-proximity carve-out (spec A): a hard-money name sitting AT trend
    # (within band of its 200-DMA) with reaffirmed voice conviction is treated as
    # at-trend, not in a downtrend — so it is NOT pause-frozen and the S5 floor does
    # not apply. Re-arms automatically if it falls outside the band. Narrow by design:
    # hard money only, tight band, voice-gated. Companies + deep downtrends unaffected.
    carveout = _pause_carveout(sig, below_200)
    s5_floored = False
    if sig.held and below_200 and not carveout:
        floor = g.get("s5_held_below_200_floor", 60)
        if s5 < floor:
            s5 = floor
            s5_floored = True

    raw = (s1*w["S1_bottleneck"] + s2*w["S2_timing"] + s5*w["S5_entry_quality"]
           + s6*w["S6_valuation_risk"] + conv*w["convergence_bonus"])
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
    # --- Spec B: stage-decay multiplier (stacks multiplicatively with Rule B) ---
    stage_mult = _stage_decay_mult(sig, s2)
    # --- Part 2: macro-regime tilt (Option B); only tilts when CPI regime is above 4% ---
    mrt = CFG.get("macro_regime_tilt", {})
    regime_mult = 1.0
    if regime_above and mrt.get("enabled"):
        if sig.ticker in mrt.get("boost", []):
            regime_mult = mrt.get("boost_mult", 1.1)
        elif sig.ticker in mrt.get("penalize", []):
            regime_mult = mrt.get("penalize_mult", 0.9)
    eff_mult = (lam if discount_applied else 1.0) * stage_mult * regime_mult
    weighting_score = round(fs + (composite - fs) * eff_mult, 1)

    return {
        "ticker": sig.ticker, "asset_type": sig.asset_type, "sleeve": sig.sleeve,
        "is_etf": sig.is_etf, "etf_redundant": sig.etf_redundant,
        "sub_scores": {"S1":s1,"S2":s2,"S5":s5,"S6":s6,"convergence":conv},
        "raw": round(raw,1), "capex_regime": regime, "capex_multiplier": mult,
        "composite": composite,
        "weighting_score": weighting_score,
        "coverage_discounted": discount_applied,
        "stage_decay_mult": stage_mult,
        "pause_carveout": carveout,
        "action": action, "confidence": _confidence(sig),
        "s5_floored": s5_floored, "s5_source": s5_source,
        "technicals": {"below_200": below_200, "mom_up": sig.mom_up,
                       "mom_down": sig.mom_down, "held": sig.held,
                       "current_weight": sig.current_weight,
                       "pause_carveout": carveout,
                       "voice_conviction": sig.voice_conviction},
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
      RULE C (approved 6/9/26): if the accelerant fires AND the name's theme is held via a
        thematic ETF (coverage_discount.redundant_by_sleeve, or etf_redundant=True on the
        input), the name EXITS instead of parking at a floor weight — a broken single name
        whose theme you already own diversified is clutter, not a position. Voice-floor
        names are exempt (rule_c.voice_floor_exempt). Reference case: CEG (covered by AIPO).
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
            # --- Rule C: accelerant + ETF theme coverage = EXIT, not floor ------
            rc = g.get("rule_c", {})
            if rc.get("enabled"):
                covered_list = (CFG.get("coverage_discount", {})
                                   .get("redundant_by_sleeve", {})
                                   .get(current.get("sleeve", "aggressive"), []))
                covered = (current["ticker"].upper() in {c.upper() for c in covered_list}
                           or bool(current.get("etf_redundant")))
                voice = bool(tech.get("voice_conviction"))
                if covered and not (rc.get("voice_floor_exempt", True) and voice):
                    out["action"] = "EXIT"
                    out["flags"].append(
                        "RULE C: accelerant fired + theme ETF-covered -> EXIT (not floor)")
                    return out
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
        if tech.get("pause_carveout"):   # spec A: at-trend hard money + voice -> not frozen
            continue
        unpaused = (mode == "mom_up" and tech.get("mom_up"))   # reclaim_200dma can't hold while below-200
        if not unpaused:
            caps[t] = tech["current_weight"]
    return caps


def compute_voice_floors(results: list, sleeve: str = "aggressive") -> dict:
    """Voice floor: a name flagged voice_conviction=True (a tracked voice reaffirmed it
    in recent transcripts) holds a minimum weight and is exempt from the exit force-out.
    The voice's conviction still enters PRIMARILY via convergence; this is the backstop
    so cooling/parabolic brakes can't zero a live-voice name. Returns {ticker: floor_pct}
    for normalize(voice_floors=...)."""
    g = CFG.get("gates", {}).get("voice_floor", {})
    if not g.get("enabled"):
        return {}
    pct = g.get("floor_pct", 3.0)
    return {r["ticker"]: pct for r in results
            if r.get("technicals", {}).get("voice_conviction")}


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
    print(f"{'TKR':<6}{'type':<16}{'S1':>4}{'S2':>4}{'S5':>4}{'S6':>4}{'Cv':>4}{'Comp':>7}  Action")
    for s in demo:
        r = score_ticker(s, CAPEX); ss = r["sub_scores"]
        print(f"{r['ticker']:<6}{r['asset_type']:<16}{ss['S1']:>4}{ss['S2']:>4}{ss['S5']:>4}"
              f"{ss['S6']:>4}{ss['convergence']:>4}{r['composite']:>7}  {r['action']}")
