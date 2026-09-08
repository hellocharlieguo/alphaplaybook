#!/usr/bin/env python3
"""
patch_packet_coverage.py — add the coverage check to cycle_packet.py section D.

Diffs the WAVE_DEMAND sub-theme rows defined in the worksheet against the
sub-themes actually seated in AI Buildout, and reports any row with demand but
no ticker, with its demand value at the CURRENT wave.

Memory sat as a 1.00-demand row with no seat for months and nothing surfaced it.
This makes that structural, not dependent on anyone remembering to look.

Run from repo root.
"""
import shutil, sys, time

PATH = "cycle_packet.py"
src = open(PATH, encoding="utf-8").read()

if "_coverage_gaps" in src:
    sys.exit("ABORT: patch already applied")

ANCHOR = "def sec_worksheet():"
if src.count(ANCHOR) != 1:
    sys.exit(f"ABORT: anchor found {src.count(ANCHOR)} times, expected 1")

HELPER = '''def _coverage_gaps(src):
    """WAVE_DEMAND rows that have no seated sub-theme, with demand at the live wave."""
    m = re.search(r"WAVE_DEMAND\\s*=\\s*\\{(.*?)\\n\\}", src, re.S)
    if not m:
        return None, None, None
    demand = {}
    for row in re.finditer(r'"([^"]+)"\\s*:\\s*\\[([0-9.,\\s]+)\\]', m.group(1)):
        demand[row.group(1)] = [float(x) for x in row.group(2).split(",") if x.strip()]

    waves = re.search(r"WAVES\\s*=\\s*\\[([^\\]]+)\\]", src)
    wave_list = re.findall(r'"([^"]+)"', waves.group(1)) if waves else []
    cur = re.search(r'let\\s+WAVE\\s*=\\s*"([^"]+)"', src)
    idx = wave_list.index(cur.group(1)) if (cur and cur.group(1) in wave_list) else 1

    try:
        blk = src[src.index('"1 AI buildout"'):src.index('"2 AI applied"')]
    except ValueError:
        return demand, None, idx
    seated = set(re.findall(r'\\["([a-z/ ]+)","[A-Z]+"', blk))
    return demand, seated, idx


'''

REPORT = '''    # --- coverage: demand rows with no seat -----------------------------
    demand, seated, widx = _coverage_gaps(src)
    if demand and seated is not None:
        gaps = [(k, v[widx] if widx < len(v) else v[-1])
                for k, v in demand.items() if k not in seated]
        w("\\n### Coverage — WAVE_DEMAND rows vs seated sub-themes\\n")
        w(f"Engine defines {len(demand)} AI Buildout sub-themes; {len(seated)} are seated.\\n")
        if gaps:
            w("| unseated row | demand at current wave |")
            w("|---|---|")
            for k, d in sorted(gaps, key=lambda r: -r[1]):
                mark = "  **<- max demand tier**" if d >= 1.0 else ""
                w(f"| **{k}** | {d:.2f}{mark} |")
            w("\\nA row with demand and no ticker is unexpressed exposure the engine "
              "already believes in. See workflow 5.2b.")
        else:
            w("Every demand row has a seat.")
        w(f"\\nSeated: {', '.join(sorted(seated))}")


'''

# insert helper before sec_worksheet, and the report at the end of sec_worksheet
i = src.index(ANCHOR)
src = src[:i] + HELPER + src[i:]

END = "# ------------------------------------------------- E. technicals"
if src.count(END) != 1:
    sys.exit(f"ABORT: end anchor found {src.count(END)} times, expected 1")
j = src.index(END)
src = src[:j] + REPORT + src[j:]

bak = f"{PATH}.bak.{time.strftime('%Y%m%d-%H%M%S')}"
shutil.copy2(PATH, bak)
open(PATH, "w", encoding="utf-8").write(src)
print(f"OK  backup={bak}")
print("    section D now reports unseated WAVE_DEMAND rows")
