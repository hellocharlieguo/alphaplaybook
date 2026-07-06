"""
s1_axes.py — three-axis S1 computation for AlphaPlaybook (offline rescore engine).
Reads the `three_axes` block from signal_model_config.json and returns each name's
regime-adjusted S1. score_ticker() is untouched — it just receives the S1 this produces.

Axes:
  bottleneck  -> raw S1 x stage_decay (binding/working/cooling/exhausted)
  monetary    -> flat score; regime acts on the CAP (cap_relax), not the score
  physical    -> floor + CapEx-triggered demand boost
Silver is dual: SLV_M (monetary) + SLV_P (physical); summed downstream.
"""
def axes(cfg): return cfg["three_axes"]

def rubric_score(block, metal):
    w = block["rubric"]["weights"]; v = block["rubric"][metal]
    return round(sum(wi*vi for wi, vi in zip(w, v)))

def bottleneck_s1(name, stage, cfg):
    b = axes(cfg)["bottleneck"]
    return round(b["raw_s1"][name] * b["stage_decay"][stage])

def monetary_s1(name, cfg):
    return axes(cfg)["monetary_scarcity"]["scores"][name]

def physical_s1(name, capex_on, cfg):
    p = axes(cfg)["physical_scarcity"]
    return p["floor"][name] + (p["boost"][name] if capex_on else 0)

def dominance_s1(name, cfg):
    b = axes(cfg)["application_dominance"]
    w = b["rubric"]["weights"]; v = b["rubric"][name]
    return round(sum(wi*vi for wi, vi in zip(w, v)))

def cap_relax_multiple(cpi, cfg):
    """monetary pause-cap multiple. 1.0 dormant (<4%); graded 4-6.5%; None = uncap (>=6.5%)."""
    cr = axes(cfg)["monetary_scarcity"]["cap_relax"]
    if cpi < cr["floor_cpi"]: return 1.0
    if cpi >= cr["uncap_cpi"]: return None
    return round(1.0 + cr["slope_per_pt"] * (cpi - cr["floor_cpi"]), 3)

def s1_for(name, regime, cfg):
    """dispatch a name to its axis and return regime-adjusted S1. regime = {cpi, capex_on, stages{}}."""
    a = axes(cfg)
    if name in a["bottleneck"]["names"]:
        return bottleneck_s1(name, regime["stages"][name], cfg)
    if name in a["monetary_scarcity"]["names"]:
        return monetary_s1(name, cfg)
    if name in a["physical_scarcity"]["names"]:
        return physical_s1(name, regime["capex_on"], cfg)
    if name in a.get("application_dominance", {}).get("names", []):
        return dominance_s1(name, cfg)
    return None   # application/other names carry their own hand-set S1 (not an axis)
