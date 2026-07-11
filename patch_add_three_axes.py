#!/usr/bin/env python3
"""
patch_add_three_axes.py — adds the `three_axes` block (FOUR axes) to signal_model_config.json.
ADDITIVE ONLY: one new top-level key, nothing else touched. score_ticker + all existing keys
unchanged. .bak backup, aborts if the key already exists, JSON-validated.
Run from repo root: cd ~/Desktop/alphaplaybook && python3 ~/Downloads/patch_add_three_axes.py
"""
import json, os, sys, shutil, time
CFG="signal_model_config.json"
if not os.path.isfile(CFG):
    print("ABORT: signal_model_config.json not found. Run from repo root."); sys.exit(1)
c=json.load(open(CFG))
if "three_axes" in c:
    print("ABORT: 'three_axes' already present — nothing to do (idempotent)."); sys.exit(0)
BLOCK={
  "_doc":"S1 four-axis (locked 2026-07-05, S1_Three_Axis_Spec.md). bottleneck decays w/ AI cycle; monetary=CPI cap-relax (no score mult); physical=floor+CapEx boost; application_dominance=franchise moat (persistent). Silver dual (SLV_M+SLV_P). Consumed by s1_axes.py + rescore_current_v3.py. score_ticker untouched.",
  "bottleneck":{"names":["AIPO","SOXX","GLW","ASML"],"raw_s1":{"AIPO":85,"SOXX":70,"GLW":80,"ASML":88},
    "stage_decay":{"binding":1.0,"working":0.92,"cooling":0.80,"exhausted":0.60}},
  "monetary_scarcity":{"names":["IBIT","GLDM","SLV_M","ETHA"],"scores":{"IBIT":88,"GLDM":85,"SLV_M":58,"ETHA":40},
    "trigger":"cpi","cap_relax":{"floor_cpi":4.0,"slope_per_pt":0.75,"uncap_cpi":6.5}},
  "physical_scarcity":{"names":["COPX","SLV_P"],
    "rubric":{"dims":["supply","demand_leverage","substitutability","breadth"],"weights":[0.30,0.35,0.20,0.15],
              "copper":[75,85,65,80],"silver":[80,70,55,60]},
    "floor":{"COPX":55,"SLV_P":52},"boost":{"COPX":22,"SLV_P":16},"trigger":"capex"},
  "application_dominance":{"names":["LLY","AMZN","HOOD"],
    "_doc":"4th axis. Scores app-layer names on how dominant AI makes the franchise, instead of penalizing them on bottleneck. Persistent (no trigger). AMZN ai-efficiency dim haircut to 62 for Visser hyperscaler-caution.",
    "rubric":{"dims":["proprietary_data_moat","franchise_durability","ai_efficiency_leverage","tam_scale"],
              "weights":[0.30,0.25,0.25,0.20],
              "LLY":[75,72,60,63],"AMZN":[60,62,62,55],"HOOD":[55,55,65,72]}},
  "dual_assets":{"SLV":{"monetary_row":"SLV_M","physical_row":"SLV_P"}},
  "scarcity_sleeve_cap_pct":45
}
bak=f"{CFG}.bak.{time.strftime('%Y%m%d-%H%M%S')}"; shutil.copy2(CFG,bak)
c["three_axes"]=BLOCK
tmp=CFG+".tmp"; json.dump(c,open(tmp,"w"),indent=2)
try:
    json.load(open(tmp)); os.replace(tmp,CFG)
except Exception as e:
    os.remove(tmp); shutil.copy2(bak,CFG); print("ABORT: JSON validation failed, restored.",e); sys.exit(1)
print(f"OK: four-axis three_axes block added to {CFG} (backup {bak}).")
print("Next: drop s1_axes.py + rescore_current_v3.py next to signal_engine.py, then `python3 rescore_current_v3.py`.")
print("Targeted commit:  git add signal_model_config.json s1_axes.py rescore_current_v3.py")
