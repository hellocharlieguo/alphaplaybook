#!/usr/bin/env python3
"""AlphaPlaybook theme_engine.py — top-down weight recommender.

Turns conviction tags (from the transcript tagger) + measured severity (severity_probe.cjs)
into recommended L1 theme weights and L2 pillar weights. The name-level split (L4) is left to
the existing composite engine (signal_engine.py); this file owns L1 + L2 only.

METHOD (all decided 7/13/26):
  L1 themes  = airtime x direction_sign x conviction, normalized, +/-4%/wk limiter vs prior.
               (beneficiary attribution: agent/humanoid DEMAND talk credits the theme that
                BENEFITS — Compute — not the surface theme. The tags carry beneficiary_theme.)
  L2 pillars = TWO-LENS BACKBONE (severity x stage-binding, NO vol-adjust) + conviction tilt,
               normalized to the compute theme total.
  seat count = resolved (1 name) / contested (split) — human config, not computed here.

Inputs:  conviction_tags.json, severity_scores.json, theme_engine_config.json
Output:  recommended theme + pillar weights (prints; writes theme_weights.json).
This is a RECOMMENDER — Charlie audits/overrides before any freeze. It never writes the cron.
"""
import json, sys, os

CFG_DEFAULT = {
    # --- L1 structural backbone (added 8/18/26) ---
    # Conviction in the theme itself, independent of how much airtime it drew.
    # Calibrated so zero tilt reproduces v3.3: 50.5 / 20.1 / 15.1 / 8.3 + 6 cash.
    "structural_conviction": {
        "AI Compute": 90,
        "AI Application": 39,
        "Monetary Scarcity": 27,
        "Tokenization": 16,
    },
    "theme_stage": {
        "AI Compute": "binding",
        "AI Application": "working",
        "Monetary Scarcity": "binding",
        "Tokenization": "working",
    },
    # 0.5 -> silence x1.00, full advocacy x1.50, sustained caution x0.50
    "airtime_influence": 0.5,
    # null until calibrated against a real conviction_tags.json; compute_l1 exits
    # rather than guessing the units of `airtime`.
    "airtime_reference": None,

    "prior_theme_weights": {
        # re-anchored to the v3.3 freeze 8/18/26 — the limiter clamps against
        # this, so a stale prior pulls the engine toward a dead allocation.
        "AI Compute": 50.5,
        "AI Application": 20.0,
        "Monetary Scarcity": 15.0,
        "Tokenization": 8.5,
        "Cash": 6.0,
    },
    "theme_move_limit_pct": 4.0,
    "cash_fixed_pct": 6.0,
    "stage_mult": {"binding": 1.00, "working": 0.92, "cooling": 0.80, "exhausted": 0.60},
    # pillar stage-binding (from the tags' temporality / hand read). vol NOT used (no-vol decided).
    "pillar_stage": {"Power": "binding", "Chips": "working", "Memory": "working", "Interconnect": "binding", "Copper": "working"},
    # conviction tilt per pillar from the week's tags (advocacy=+, caution=-); modest multiplier
    "pillar_conviction_tilt": {"Power": 0.00, "Chips": 0.00, "Memory": 0.10, "Interconnect": -0.08, "Copper": 0.00},
    # seat structure: resolved -> [one name]; contested -> [names, split by composite downstream]
    "pillars": {
        "Power": {"names": ["AIPO"], "resolved": True},
        "Chips": {"names": ["ASML"], "resolved": True},
        "Memory": {"names": ["MU", "SKHY"], "resolved": False},
        "Interconnect": {"names": ["MRVL", "GLW"], "resolved": False},
        "Copper": {"names": ["COPX"], "resolved": False},
    },
    # within-contested-pillar split (from composite engine; here as last-known for a full book preview)
    "name_split": {"Memory": {"MU": 0.5, "SKHY": 0.5}, "Interconnect": {"GLW": 1.00}},
    # non-compute theme -> name split (composite-derived, for the preview book)
    "theme_name_split": {
        "AI Application": {"LLY": 0.6, "AMZN": 0.4},
        "Monetary Scarcity": {"SLV": 0.44, "IBIT": 0.28, "GLDM": 0.28},
        "Tokenization": {"HOOD": 0.62, "ETHA": 0.38},
    },
}
DIR_SIGN = {"advocacy": 1.0, "neutral": 0.0, "caution": -1.0}


def load(fn, fallback=None):
    if os.path.exists(fn):
        return json.load(open(fn))
    if fallback is not None:
        return fallback
    sys.exit(f"missing {fn}")


def compute_l1(tags, cfg):
    """Theme weight = structural conviction x stage_mult, modulated by airtime.

    Structural is the backbone: a theme nobody mentioned this week keeps its
    weight. Airtime tilts within +/- airtime_influence rather than determining
    the result, so silence (tilt 0, x1.00) and sustained caution (tilt -1,
    x1-influence) are no longer the same output. Same shape as compute_l2.
    """
    themes = [t for t in cfg["prior_theme_weights"] if t != "Cash"]
    struct = cfg["structural_conviction"]
    stages = cfg.get("theme_stage", {})
    sm = cfg["stage_mult"]
    infl = cfg.get("airtime_influence", 0.5)
    ref = cfg.get("airtime_reference")

    net = {t: 0.0 for t in themes}
    air = {t: 0.0 for t in themes}
    for tag in tags["tags"]:
        th = tag.get("beneficiary_theme") or tag["theme"]
        if th not in net:
            continue
        a = tag.get("airtime", 0.0)
        sign = DIR_SIGN.get(tag.get("direction", "neutral"), 0.0)
        net[th] += a * sign * tag.get("conviction", 0.0)
        air[th] += a

    # airtime units are undefined until a real conviction_tags.json exists.
    # Fail loudly rather than scaling the tilt against a guessed reference.
    if any(air.values()) and not ref:
        sys.exit("airtime_reference is null in config — calibrate it from a real "
                 "conviction_tags.json before the airtime tilt can be scaled.")

    intensity = {}
    for t in themes:
        base = struct.get(t, 0.0) * sm[stages.get(t, "working")]
        tilt = 0.0 if not ref else max(-1.0, min(1.0, net[t] / ref))
        intensity[t] = max(base * (1 + infl * tilt), 0.01)

    avail = 100 - cfg["cash_fixed_pct"]
    tot = sum(intensity.values())
    raw = {t: intensity[t] / tot * avail for t in themes}

    # rate-of-change guard only; renormalisation below can still carry a theme
    # slightly past its own clamp.
    lim = cfg["theme_move_limit_pct"]
    prior = cfg["prior_theme_weights"]
    limited = {}
    for t in raw:
        p = prior.get(t, raw[t])
        limited[t] = min(max(raw[t], p - lim), p + lim)

    s = sum(limited.values())
    out = {t: round(limited[t] / s * avail, 1) for t in limited}
    out["Cash"] = cfg["cash_fixed_pct"]
    return out, raw


def compute_l2(compute_pct, sev, cfg):
    """Pillar weight = severity x stage_mult x (1+tilt), no-vol, normalized to compute_pct."""
    sm = cfg["stage_mult"]
    raw = {}
    for pil, meta in cfg["pillars"].items():
        s = sev["severity"].get(pil.lower(), 0.6)
        stage = cfg["pillar_stage"].get(pil, "working")
        tilt = cfg["pillar_conviction_tilt"].get(pil, 0.0)
        raw[pil] = s * sm[stage] * (1 + tilt)
    tot = sum(raw.values())
    return {pil: round(raw[pil] / tot * compute_pct, 1) for pil in raw}


def build_book(themes, pillars, cfg):
    """Full preview book: pillars->names (resolved=1, contested=split), other themes->names."""
    book = {}
    for pil, w in pillars.items():
        meta = cfg["pillars"][pil]
        if meta["resolved"] or len(meta["names"]) == 1:
            book[meta["names"][0]] = w
        else:
            split = cfg["name_split"].get(pil, {n: 1 / len(meta["names"]) for n in meta["names"]})
            for n in meta["names"]:
                book[n] = round(w * split[n], 1)
    for th, split in cfg["theme_name_split"].items():
        tw = themes.get(th, 0.0)
        for n, frac in split.items():
            book[n] = round(tw * frac, 1)
    book["SGOV"] = themes.get("Cash", 6.0)
    resid = round(100 - sum(book.values()), 1)
    book["SGOV"] = round(book["SGOV"] + resid, 1)
    return book


def main():
    cfg = load("theme_engine_config.json", CFG_DEFAULT)
    tags = load("conviction_tags.json")
    sev = load("severity_scores.json", {"severity": {"power": .9, "chips": .85, "memory": .93, "interconnect": .6, "copper": .55}})

    themes, raw_intensity = compute_l1(tags, cfg)
    pillars = compute_l2(themes["AI Compute"], sev, cfg)
    book = build_book(themes, pillars, cfg)

    print("=" * 58)
    print("THEME_ENGINE — recommended weights (audit before freeze)")
    print("=" * 58)
    print(f"\nL1 THEMES (airtime x direction x conviction, +/-{cfg['theme_move_limit_pct']}% limiter):")
    for t, w in themes.items():
        print(f"  {t:<20} {w:>5.1f}%   (uncapped {raw_intensity.get(t, 0):.1f})")
    print(f"\nL2 PILLARS within AI Compute ({themes['AI Compute']}%)  [severity x stage, no-vol]:")
    for p, w in pillars.items():
        meta = cfg["pillars"][p]
        tag = "resolved->concentrate" if meta["resolved"] else f"contested->split {meta['names']}"
        print(f"  {p:<13} {w:>5.1f}%   sev {sev['severity'][p.lower()]:.2f} x stage {cfg['pillar_stage'][p]:<8} [{tag}]")
    print(f"\nFULL PREVIEW BOOK ({len(book)} names):")
    for tk, w in sorted(book.items(), key=lambda kv: -kv[1]):
        print(f"  {tk:<6} {w:>5.1f}%")
    print(f"  {'SUM':<6} {sum(book.values()):>5.1f}%")

    json.dump({"themes": themes, "pillars": pillars, "book": book}, open("theme_weights.json", "w"), indent=2)
    print("\nwrote theme_weights.json  (recommender output — Charlie audits, then freeze via patch)")


if __name__ == "__main__":
    main()
