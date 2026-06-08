from signal_engine import SignalInput, score_ticker, compute_pause_caps
from portfolio_normalizer import normalize
CAPEX = 77.0

def mk(tkr, comp, held=False, below=False, momup=False, cur=None, etf=False, macro=False):
    s1 = (comp - 50*0.65)/0.25
    return SignalInput(tkr, "macro_hardmoney" if macro else "company", is_etf=etf,
        s1_bottleneck=s1, s2_timing=50, s5_entry_quality=50, s4_catalyst=50,
        s6_valuation_risk=50, lenses_pointing=0,
        price=(90 if below else 110), dma200=100,
        held=held, current_weight=cur, mom_up=momup)

def run(book, sleeve="aggressive", overrides=None):
    results = [score_ticker(s, CAPEX) for s in book]
    caps = compute_pause_caps(results, sleeve=sleeve, exit_overrides=overrides or {})
    out = normalize(results, sleeve=sleeve, manual_overrides=overrides, paused_caps=caps)
    return out, caps

print("="*70); print("TEST B — high-conviction held name below-200, no mom_up (aggressive)"); print("="*70)
book = [mk("BIG",85), mk("PAUSED",85, held=True, below=True, momup=False, cur=3.0),
        mk("MID",70), mk("SGOV",51, etf=True)]
out, caps = run(book, "aggressive")
w = out["weights_pct"]
print("  caps:", caps, "| paused_capped:", out["paused_capped"])
print("  weights:", {t:w[t] for t in ["BIG","PAUSED","MID","SGOV"]}, "sum", out["total_pct"])
assert "PAUSED" in caps and w["PAUSED"] == 3.0, "PAUSED must be frozen at current 3.0%"
assert "PAUSED" in out["paused_capped"], "PAUSED should be flagged capped"
assert w["BIG"] > w["PAUSED"], "freed weight should flow to BIG"
assert out["total_pct"] == 100.0
print("  PASS: PAUSED frozen at 3.0%, excess redistributed, sum=100\n")

print("="*70); print("TEST C — same name WITH mom_up (aggressive un-pauses)"); print("="*70)
book = [mk("BIG",85), mk("PAUSED",85, held=True, below=True, momup=True, cur=3.0),
        mk("MID",70), mk("SGOV",51, etf=True)]
out, caps = run(book, "aggressive")
print("  caps:", caps, "| paused_capped:", out["paused_capped"], "| PAUSED wt:", out["weights_pct"]["PAUSED"])
assert "PAUSED" not in caps, "mom_up should un-pause -> no cap"
assert out["weights_pct"]["PAUSED"] > 3.0, "un-paused name sizes to conviction"
print("  PASS: mom_up un-pauses; PAUSED sized to conviction\n")

print("="*70); print("TEST D — conservative ignores mom_up (needs 200-reclaim)"); print("="*70)
book = [mk("BIG",85), mk("PAUSED",85, held=True, below=True, momup=True, cur=3.0),
        mk("MID",70), mk("SGOV",51, etf=True)]
out, caps = run(book, "conservative")
print("  caps:", caps, "| PAUSED wt:", out["weights_pct"]["PAUSED"])
assert "PAUSED" in caps and out["weights_pct"]["PAUSED"] == 3.0, "conservative stays paused below-200"
print("  PASS: conservative caps below-200 even with mom_up\n")

print("="*70); print("TEST E — paused name whose target is BELOW current: cap doesn't bind"); print("="*70)
# low conviction, held below-200, large current weight -> trims down naturally.
# realistic-size book so the convexity squeezes a low-comp name toward the 2% floor.
book = [mk("A",85), mk("B",83), mk("C",80), mk("D",78), mk("E",75), mk("MID",70),
        mk("WEAK",50, held=True, below=True, momup=False, cur=10.0), mk("SGOV",51, etf=True)]
out, caps = run(book, "aggressive")
print("  caps:", caps, "| paused_capped:", out["paused_capped"], "| WEAK wt:", out["weights_pct"]["WEAK"])
assert "WEAK" in caps, "still flagged as paused..."
assert "WEAK" not in out["paused_capped"], "...but cap doesn't BIND (target < current)"
assert out["weights_pct"]["WEAK"] < 10.0, "low-conviction name trims DOWN (allowed)"
print("  PASS: downward move allowed; cap only binds on would-be adds\n")

print("="*70); print("TEST F — EXITing name skipped by pause + dropped"); print("="*70)
book = [mk("BIG",85), mk("GONE",80, held=True, below=True, momup=False, cur=5.0),
        mk("MID",70), mk("SGOV",51, etf=True)]
out, caps = run(book, "aggressive", overrides={"GONE":0})
print("  caps:", caps, "| dropped:", out["dropped_avoid_exit"], "| GONE in weights:", "GONE" in out["weights_pct"])
assert "GONE" not in caps, "EXITing name must not be paused"
assert "GONE" in out["dropped_avoid_exit"], "GONE should be dropped"
print("  PASS: exit takes precedence; GONE dropped, not paused\n")

print("ALL PHASE 2b TESTS PASSED")
