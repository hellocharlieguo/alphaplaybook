#!/usr/bin/env python3
"""
patch_config_soxx_minimal.py — SOXX raw_s1 70 -> 72, ONE-LINE diff.

Replaces the json round-trip version, which was semantically correct but
reformatted 8 unrelated lines (ensure_ascii=False unescaping \\u2014 into
literal em-dashes). String surgery instead, so git diff shows exactly one
changed line on a tracked config that underpins the track record.

RATIONALE. SOXX raw_s1 70 was set 2026-07-05, before the 7/15 v3.3 de-seating
moved MU (~9% of SOXX) and MRVL (~4.9%) into the basket. Their own axis scores
in this same config are 82 and 83:
    0.090*82 + 0.049*83 + 0.861*70 = 71.7  ->  72
A +2 correction for what SOXX now carries, not a re-rating. SOXX still ranks
last of the bottleneck names on raw S1.
"""
import json, re, shutil, sys
from datetime import datetime
from pathlib import Path

P = Path("signal_model_config.json"); ts = datetime.now().strftime("%Y%m%d-%H%M%S")
def die(m): sys.exit(f"\n  ABORT: {m}\n")
if not Path(".git").is_dir(): die("cd ~/Desktop/alphaplaybook first")
if not P.is_file(): die(f"{P} not found")

raw = P.read_text(encoding="utf-8")
cfg = json.loads(raw)
rs = cfg.get("three_axes", {}).get("bottleneck", {}).get("raw_s1", {})

if rs.get("SOXX") == 72:
    print("\n  Already 72. Nothing to do.\n"); sys.exit(0)
if rs.get("SOXX") != 70: die(f"SOXX raw_s1 is {rs.get('SOXX')}, expected 70")
for t, want in (("MU", 82), ("MRVL", 83)):
    if rs.get(t) != want: die(f"{t} raw_s1 is {rs.get(t)}, expected {want} - blend assumption broken")
print("  ok    SOXX=70, MU=82, MRVL=83 confirmed")

pat = re.compile(r'("SOXX"\s*:\s*)70\b')
hits = pat.findall(raw)
if len(hits) != 1: die(f'"SOXX": 70 found {len(hits)}x, expected exactly 1')
print("  ok    anchor unique")

out = pat.sub(r"\g<1>72", raw, count=1)
new = json.loads(out)  # parse guard
if new["three_axes"]["bottleneck"]["raw_s1"]["SOXX"] != 72: die("value did not take")
if len(out.splitlines()) != len(raw.splitlines()): die("line count changed - not a minimal edit")
if sum(a != b for a, b in zip(out.splitlines(), raw.splitlines())) != 1:
    die("more than one line differs - not a minimal edit")
print("  ok    exactly one line differs; output re-parses")

shutil.copy2(P, f"{P}.bak.{ts}")
P.write_text(out, encoding="utf-8")
print(f"  ok    backup -> {P}.bak.{ts}")
print(f"""  ok    SOXX raw_s1 70 -> 72

    git diff --stat {P}      # expect: 1 insertion, 1 deletion
    python3 cleanup_v34.py && python3 rescore_v34.py

Rollback:
    cp {P}.bak.{ts} {P}
""")
