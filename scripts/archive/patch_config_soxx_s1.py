#!/usr/bin/env python3
"""
patch_config_soxx_s1.py — SOXX raw_s1 70 -> 72 in signal_model_config.json.

This is the LIVE config. It is read by signal_engine.py (offline scoring), NOT
by server/daily-cron.cjs, so it does not touch the nightly job or the deployed
book. It IS tracked, and it is what makes a v3.4 freeze reproducible from the
repo -- which is why the correction belongs here rather than staying as an
offline override in rescore_v34.py.

RATIONALE. SOXX raw_s1 70 was set 2026-07-05, before the 7/15 v3.3 de-seating
moved MU (~9% of SOXX) and MRVL (~4.9%) into the basket. Their own axis scores
in this same config are 82 and 83. Exposure-weighted carrier blend:

    0.090*82 + 0.049*83 + 0.861*70 = 71.7  ->  72

A +2 correction, not a re-rating. After cooling x0.80 it moves the effective
score 56.0 -> 57.6. SOXX still ranks last of the bottleneck names on raw S1
(ASML 88, SKHY 84, MRVL 83, MU 82, GLW 80, SOXX 72, and AIPO 85 on its own
axis) -- if this had lifted SOXX above its own constituents that would have
been the tell that the number was bent rather than corrected.

Uses json round-trip with indent=2 rather than string surgery, so the file
stays valid by construction. Verify the diff before committing.

Run:  cd ~/Desktop/alphaplaybook && python3 patch_config_soxx_s1.py
"""
import json, shutil, sys
from datetime import datetime
from pathlib import Path

P = Path("signal_model_config.json"); ts = datetime.now().strftime("%Y%m%d-%H%M%S")

def die(m): sys.exit(f"\n  ABORT: {m}\n")
if not Path(".git").is_dir(): die("cd ~/Desktop/alphaplaybook first")
if not P.is_file(): die(f"{P} not found")

raw = P.read_text(encoding="utf-8")
cfg = json.loads(raw)

try:
    rs = cfg["three_axes"]["bottleneck"]["raw_s1"]
except KeyError as e:
    die(f"raw_s1 path missing: {e}")

cur = rs.get("SOXX")
if cur == 72:
    print("\n  Already 72. Nothing to do.\n"); sys.exit(0)
if cur != 70:
    die(f"SOXX raw_s1 is {cur}, expected 70 -- has this been edited already?")

# sanity: the carrier scores this blend depends on must actually be present
for t, want in (("MU", 82), ("MRVL", 83)):
    if rs.get(t) != want:
        die(f"{t} raw_s1 is {rs.get(t)}, expected {want} -- blend assumption broken")
print("  ok    SOXX=70, MU=82, MRVL=83 confirmed")

rs["SOXX"] = 72
out = json.dumps(cfg, indent=2, ensure_ascii=False) + "\n"
json.loads(out)  # re-parse guard
print("  ok    output re-parses as valid JSON")

shutil.copy2(P, f"{P}.bak.{ts}")
P.write_text(out, encoding="utf-8")
print(f"  ok    backup -> {P}.bak.{ts}")
print(f"  ok    SOXX raw_s1 70 -> 72")
print(f"""
IMPORTANT: json.dumps reformats the whole file. Check the diff is ONLY SOXX
before committing -- if indentation or key order shifted, roll back and do a
string-level edit instead:

    git diff --stat {P}
    git diff {P} | head -40

Then, if clean:
    python3 rescore_v34.py
    git add {P}
    git commit -m "config: SOXX raw_s1 70->72, carrier blend for MU/MRVL held inside the basket"

Rollback:
    cp {P}.bak.{ts} {P}
""")
