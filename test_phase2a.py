from signal_engine import (SignalInput, score_ticker, apply_gates,
                           save_composites, load_prior_composites, HIST_DIR)
import os, shutil, json
CAPEX = 77.0

# clean history
if os.path.isdir(HIST_DIR): shutil.rmtree(HIST_DIR)

print("="*70); print("TEST 1 — Asymmetric S5 floor (held + below-200)"); print("="*70)
# A held name that has broken below its 200-DMA, with a genuinely weak entry score (40).
held_below = SignalInput("CEG","company", s1_bottleneck=90,s2_timing=100,
    s5_entry_quality=40, s4_catalyst=70,s6_valuation_risk=65,lenses_pointing=2,
    price=255, dma200=322, held=True, mom_down=True)
not_held_below = SignalInput("CEG","company", s1_bottleneck=90,s2_timing=100,
    s5_entry_quality=40, s4_catalyst=70,s6_valuation_risk=65,lenses_pointing=2,
    price=255, dma200=322, held=False, mom_down=True)
rh = score_ticker(held_below, CAPEX); rn = score_ticker(not_held_below, CAPEX)
print(f"  held below-200:   S5={rh['sub_scores']['S5']} (floored={rh['s5_floored']}) composite={rh['composite']}")
print(f"  NOT-held below200: S5={rn['sub_scores']['S5']} (floored={rn['s5_floored']}) composite={rn['composite']}")
assert rh['s5_floored'] is True and rh['sub_scores']['S5'] == 60, "held should floor S5 to 60"
assert rn['s5_floored'] is False and rn['sub_scores']['S5'] == 40, "non-held should NOT floor"
assert rh['composite'] > rn['composite'], "floor should lift held composite vs raw"
print("  PASS: held below-200 floors S5 40->60; non-held untouched; composite lifted\n")

# above-200 held name: floor must NOT apply
above = SignalInput("MRVL","company", s1_bottleneck=80,s5_entry_quality=40,
    price=263, dma200=103, held=True)
ra = score_ticker(above, CAPEX)
assert ra['s5_floored'] is False and ra['sub_scores']['S5'] == 40, "above-200 must not floor"
print("  PASS: held but ABOVE-200 -> no floor (entry quality scores normally)\n")

print("="*70); print("TEST 2 — Exit gate (TRIM / EXIT / ACCELERANT / exempt)"); print("="*70)
def mk(tkr, comp, atype="company", below=False, momdown=False):
    # back out s1 to hit composite `comp` with others neutral, GREEN x1.0
    s1 = (comp - 50*0.65)/0.25
    return SignalInput(tkr, atype, s1_bottleneck=s1, s2_timing=50, s5_entry_quality=50,
        s4_catalyst=50, s6_valuation_risk=50, lenses_pointing=0,
        price=(90 if below else 110), dma200=100, mom_down=momdown, held=True)

book = [
    mk("STAY", 72),                              # no prior-vs drop -> nothing
    mk("TRIMME", 60, below=True, momdown=True),  # will drop 12 -> TRIM; company+below+momdown -> ACCEL
    mk("EXITME", 50),                            # will drop 22 -> EXIT
    mk("HOLDPULL", 64, below=False, momdown=False), # drop 11 -> TRIM, but no price confirm -> NO accel
    mk("SLV", 60, atype="macro_hardmoney", below=True, momdown=True), # exempt -> TRIM, NO accel
]
results = [score_ticker(s, CAPEX) for s in book]
# prior composites: set so the drops above happen
prior = {"STAY":72, "TRIMME":72, "EXITME":72, "HOLDPULL":75, "SLV":72}
results, exits, log = apply_gates(results, prior)
print("  gate log:")
for l in log: print("   ", l)
print("  exit_overrides:", exits)
byt = {r['ticker']: r for r in results}
assert exits == {"EXITME": 0}, f"only EXITME should force-exit, got {exits}"
assert byt["TRIMME"]["weighting_score"] < byt["TRIMME"]["composite"], "TRIMME should be accel-cut"
assert any("ACCELERANT" in l for l in log if l.startswith("TRIMME")), "TRIMME needs accelerant"
assert not any("ACCELERANT" in l for l in log if l.startswith("HOLDPULL")), "HOLDPULL no price confirm -> no accel"
assert not any("ACCELERANT" in l for l in log if l.startswith("SLV")), "SLV exempt -> no accel"
assert any(l.startswith("SLV") and "TRIM" in l for l in log), "SLV should still TRIM (rides composite)"
print("  PASS: TRIM rides composite; EXIT forces out; accelerant fires only for")
print("        company+below-200+mom-down; HOLDPULL (no confirm) & SLV (exempt) trim only\n")

print("="*70); print("TEST 3 — Composite persistence round-trip"); print("="*70)
p = save_composites(results, run_date="2026-06-05")
print("  saved:", os.path.basename(p), "->", json.load(open(p)))
save_composites([{"ticker":"STAY","composite":99}], run_date="2026-06-06")
prior_loaded = load_prior_composites(before_date="2026-06-06")  # should load 06-05
assert prior_loaded.get("EXITME") == byt["EXITME"]["composite"], "prior load should return 06-05 map"
print("  PASS: load_prior_composites(before 06-06) returns the 06-05 file\n")

print("ALL PHASE 2a TESTS PASSED")
