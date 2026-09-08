#!/usr/bin/env python3
"""
patch_systemmap_v34.py

Brings src/data/systemMap.ts up to v3.4 trend-first. Six edits:

  1. flowmap `freeze` node   sub: 'v3.3-coresat' -> 'v3.4-trendfirst'
  2. engine  node            12 names, v3.4 cascade, ladders, worksheet pointer
  3. themes  node            4 trend bars, 12-name book, v3.4 version row
  4. pillars node            retired-with-history (kept reachable in parts)
  5. seats   node            human call -> trend conviction; WDC marked v3.3-era
  6. names   node            stage-decay ladder 4 rungs -> v3.4 five rungs

Discipline:
  - anchored find/replace, every one guarded count == 1
  - node bodies located by BRACE MATCHING, never re.DOTALL
  - block-length guard on every span before it is replaced
  - .bak.<timestamp> written before the file is touched
  - refuses to run twice (idempotency check on v3.4 markers)
"""

import os
import re
import shutil
import sys
from datetime import datetime

TARGET = "src/data/systemMap.ts"

# span sanity: (min_lines, max_lines) each node body is expected to occupy
SPAN_GUARD = {
    "engine":  (5, 40),
    "themes":  (20, 80),
    "pillars": (10, 45),
    "seats":   (10, 40),
    "names":   (10, 45),
}


def fail(msg):
    print("ABORT: " + msg)
    sys.exit(1)


def find_node_span(src, key):
    """Locate `  <key>: {` and return (start, end) by counting braces.

    end is the index just past the closing `},` of the node. No regex spans
    the body, so a stray brace in a quoted string is the only failure mode --
    and that would be caught by the block-length guard below.
    """
    marker = "\n  %s: {\n" % key
    hits = src.count(marker)
    if hits != 1:
        fail("node marker for '%s' found %d times, expected 1" % (key, hits))

    start = src.index(marker) + 1          # keep the leading newline outside
    brace = src.index("{", start)
    depth = 0
    i = brace
    in_str = None
    while i < len(src):
        ch = src[i]
        if in_str:
            if ch == "\\":
                i += 2
                continue
            if ch == in_str:
                in_str = None
        elif ch in "'\"`":
            in_str = ch
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                end = i + 1
                if src[end:end + 1] == ",":
                    end += 1
                return start, end
        i += 1
    fail("unbalanced braces while scanning node '%s'" % key)


def swap_node(src, key, new_body):
    start, end = find_node_span(src, key)
    old = src[start:end]
    n_old = old.count("\n") + 1
    lo, hi = SPAN_GUARD[key]
    if not (lo <= n_old <= hi):
        fail("node '%s' span is %d lines, outside expected %d-%d "
             "-- file is not what this patch was written against"
             % (key, n_old, lo, hi))
    print("  %-8s %3d lines -> %3d lines" % (key, n_old, new_body.count("\n") + 1))
    return src[:start] + new_body + src[end:]


# ----------------------------------------------------------------------------
# 2. engine
# ----------------------------------------------------------------------------
ENGINE = """  engine: {
    eyebrow: 'B · Sealed assembly',
    title: 'Engine',
    source: 'voices in → 12 weighted positions out · v3.4 trend-first',
    parts: ['tagging', 'themes', 'pillars', 'seats', 'names'],
    blocks: [
      { t: 'sec', label: 'Assembly' },
      { t: 'kv', k: 'Methodology', v: 'v3.4 trend-first · locked 8/23/26' },
      { t: 'kv', k: 'Frozen as', v: '2026-08-24-v3.4-trendfirst · 12 names' },
      { t: 'kv', k: 'Parts', v: '5 — one superseded' },
      { t: 'kv', k: 'Human calls', v: '1 — trend conviction (tconv)' },
      { t: 'note', text: 'Supersedes all composite scoring. Trends compete for weight; names compete only inside their own trend. Nothing competes across trends. B3 pillar sizing is retained for version history and no longer runs.' },
      { t: 'sec', label: 'The cascade' },
      { t: 'kv', k: '1 · name_score', v: '55 × timing × quality × wave × entry_band' },
      { t: 'kv', k: '2 · trend_score', v: 'derived_timing × tconv × breadth' },
      { t: 'kv', k: '3 · trend_weight', v: '100 × trend_score / Σ trend_score' },
      { t: 'kv', k: '4 · name_weight', v: 'trend_weight × name_score / Σ in trend' },
      { t: 'note', text: '55 = 100 − floor 45. Multipliers act on the above-floor portion only. Applied to the full scale the four ladders compound to a 5,500× spread with cells at zero, violating fade-never-zero.' },
      { t: 'sec', label: 'Ladders · all four' },
      { t: 'kv', k: 'Rungs', v: '1.00 · 0.92 · 0.80 · 0.72 · 0.60' },
      { t: 'kv', k: 'Timing', v: 'derived — mean of sub-themes, never asserted' },
      { t: 'kv', k: 'Quality', v: 'odds owning this name captures the trend' },
      { t: 'kv', k: 'Breadth', v: 'N_eff = (Σλ)² / Σλ² over 251 sessions' },
      { t: 'note', text: 'Breadth is measured from real correlations, not √n. Seven buildout names resolve to 1.95 independent bets; √n claims 2.65, a 36% overstatement. Timing is derived rather than asserted because asserting it twice had set buildout binding with only one of seven members binding.' },
      { t: 'sec', label: 'Design decisions' },
      { t: 'row', title: 'RSI removed from S5', quote: 'A cliff, not a slope — 69.9 to 70.0 cost 8 S5 points. It was also the only term ranking gold above bitcoin against the S1 judgment. Removed 8/22.' },
      { t: 'row', title: 'Correlation is not coverage', quote: 'AIPO and SOXX correlate 0.86, but SOXX holds zero utilities or grid. N_eff alone would drop the position the whole thesis points at, merely because power has not decoupled yet. Removals are judged on both.' },
      { t: 'row', pending: true, pill: 'open', tone: 'open', title: 'tconv has the least provenance', quote: 'Trend conviction is the highest-leverage input and the only classification carrying no mandatory source quote or date, unlike timing and quality which both require attribution.' },
      { t: 'sec', label: 'Worksheet' },
      { t: 'note', text: 'Full per-name arithmetic lives in v34_worksheet_2026-08-24.html — click any cell for its derivation. Deliberately not restated here: a second copy of the numbers is a second thing to drift.' },
    ],
    files: [F_ENGINE, F_CONFIG, F_THEME],
  },"""

# ----------------------------------------------------------------------------
# 3. themes
# ----------------------------------------------------------------------------
THEMES = """  themes: {
    eyebrow: 'B2 · Engine, cascade output',
    title: 'Trend weights',
    source: 'rescore_trendfirst.py → frozen into daily-cron.cjs BASE_PORTFOLIO',
    parent: 'engine',
    blocks: [
      { t: 'sec', label: 'Trend mix · v3.4' },
      { t: 'bar', k: 'Monetary', v: '30.4%', pct: 30.4 },
      { t: 'bar', k: 'AI Applied', v: '26.7%', pct: 26.7 },
      { t: 'bar', k: 'AI Buildout', v: '25.0%', pct: 25.0 },
      { t: 'bar', k: 'Tokenized Rails', v: '17.9%', pct: 17.9 },
      { t: 'note', text: 'Trend weights are an OUTPUT of the cascade, not an input. Sums to 100.0 exactly. There is no cash row — SGOV left the book at the v3.4 freeze and stays priced only because the momentum sleeve settles its cash residual there.' },
      { t: 'sec', label: 'Versions' },
      { t: 'kv', k: 'v3.4 trend-first', v: '8/24/26 · 12 names' },
      { t: 'kv', k: 'v3.3 core-satellite', v: '7/15/26 · 14 names' },
      { t: 'kv', k: 'v3.2 top-down', v: '7/13/26 · 15 names' },
      { t: 'kv', k: 'v3.1 / v3.0 sleeve mix', v: 'pending backfill', pending: true },
      { t: 'sec', label: 'Holdings at freeze' },
      { t: 'kv', k: 'LLY · AI Applied', v: '13.4 · Hold' },
      { t: 'kv', k: 'AMZN · AI Applied', v: '13.3 · Hold' },
      { t: 'kv', k: 'IBIT · Monetary', v: '12.5 · Add' },
      { t: 'kv', k: 'GLDM · Monetary', v: '11.5 · Add' },
      { t: 'kv', k: 'ETHA · Tokenized Rails', v: '9.6 · Add' },
      { t: 'kv', k: 'HOOD · Tokenized Rails', v: '8.3 · Add' },
      { t: 'kv', k: 'SLV · Monetary', v: '6.4 · Hold' },
      { t: 'kv', k: 'AIPO · AI Buildout', v: '6.3 · Trim' },
      { t: 'kv', k: 'GLW · AI Buildout', v: '5.0 · Hold' },
      { t: 'kv', k: 'ASML · AI Buildout', v: '5.0 · Trim' },
      { t: 'kv', k: 'SOXX · AI Buildout', v: '4.6 · Trim' },
      { t: 'kv', k: 'COPX · AI Buildout', v: '4.1 · Hold' },
      { t: 'note', text: 'Floors are half the frozen weight, rounded to 0.1. Actions are the freeze-night instruction, not a standing signal. LLY and AMZN compute identically at 13.353685096 — an exact 50/50 split of the AI Applied trend weight — and the −0.1 needed to sum to 100.0 was absorbed by AMZN. Open: it belongs on the largest non-tied name instead.' },
      { t: 'sec', label: 'Dimmed rows' },
      { t: 'note', text: 'Dimmed rows are not yet backfilled. Cells stay empty rather than estimated.' },
      { t: 'sec', label: 'theme_engine.py · recommender, dormant' },
      { t: 'note', text: 'L1 theme weights were retired at the v3.4 lock. The findings below describe theme_engine.py, which no longer feeds the book and has never run in this working tree. Kept because the file is still present and the failure modes are still real if it is ever revived.' },
      { t: 'row', pending: true, pill: 'open', tone: 'open', title: 'No structural backbone in L1', quote: 'Intensity is a pure function of airtime × conviction. A theme with zero airtime falls to the max(0.01) floor, and the only thing holding it up is the ±4%/week limiter clamping it to prior − 4. Over the 8-week stretch where chips scored zero airtime, that is roughly −32 points — the ASML-deletion failure mode the backfill warned about, arriving slowly instead of at once. The limiter is load-bearing in a way that may not have been intended.' },
      { t: 'row', pill: 'data', tone: 'data', title: 'Partial severity degrades quietly', quote: 'A missing input file hard-exits via sys.exit, which is correct. But in L2, sev.severity.get(pillar, 0.6) substitutes 0.6 for any pillar absent from the severity file, and a missing config falls back to CFG_DEFAULT whole. So an absent file fails loudly while an incomplete one does not.' },
      { t: 'row', pill: 'data', tone: 'data', title: 'Has never run in this working tree', quote: 'Line 152 writes theme_weights.json on every successful run and that file does not exist. conviction_tags.json and theme_engine_config.json are also absent, and severity_scores.json is dated 7/15 against an 8/5 engine.' },
    ],
    files: [
      F_THEME,
      { path: 'Trend_First_Spec.md', role: 'spec — canonical v3.4 methodology', status: 'live' },
      { path: 'rescore_trendfirst.py', role: 'offline runner — validated v3.4 engine', status: 'live' },
      { path: 'v34_worksheet_2026-08-24.html', role: 'canonical worksheet — per-name arithmetic', status: 'live' },
      { path: 'server/daily-cron.cjs', role: 'BASE_PORTFOLIO — the frozen book, source of truth', status: 'live' },
      { path: 'corr_matrix.json', role: 'input — 251-session correlations behind N_eff', status: 'live' },
      { path: 'conviction_tags.json', role: 'input to the dormant recommender; presence not confirmed', status: 'unverified' },
      { path: 'severity_scores.json', role: 'input to the dormant recommender; gitignored', status: 'unverified' },
      { path: 'theme_weights.json', role: 'output of the dormant recommender; absent', status: 'unverified' },
      { path: 'src/components/SignalRadar.tsx', role: 'theme radar — Dashboard does not import it; check before trusting', status: 'unverified' },
      { path: 'src/components/Portfolio.tsx', role: 'renders the resulting holdings table', status: 'live' },
    ],
  },"""

# ----------------------------------------------------------------------------
# 4. pillars
# ----------------------------------------------------------------------------
PILLARS = """  pillars: {
    eyebrow: 'B3 · Superseded 8/23/26',
    title: 'Pillar sizing · v3.3 composite',
    source: 'signal_engine.py + signal_model_config.json — retained for version history',
    parent: 'engine',
    blocks: [
      { t: 'sec', label: 'Retired' },
      { t: 'note', text: 'This is the composite scoring that built v3.0 through v3.3. It was superseded by the v3.4 trend-first cascade on 8/23/26 and no longer sets any weight in the live book. Kept visible because the version rows under B2 reference books this produced, and deleting it would make that history unauditable.' },
      { t: 'sec', label: 'Composite weights · historical' },
      { t: 'kv', k: 'S1 bottleneck', v: '0.30', pending: true },
      { t: 'kv', k: 'S2 timing', v: '0.30', pending: true },
      { t: 'kv', k: 'S5 entry quality', v: '0.20', pending: true },
      { t: 'kv', k: 'S6 valuation risk', v: '0.10', pending: true },
      { t: 'kv', k: 'convergence bonus', v: '0.10', pending: true },
      { t: 'note', text: 'Labels deliberately skip S3 and S4. S5 appears before S6 by design. Of these only S5 survives into v3.4, as the entry-band input to name_score — and with RSI removed from it.' },
      { t: 'sec', label: 'S1 four-axis · historical' },
      { t: 'kv', k: '1 · Bottleneck', v: 'AIPO 85 · ASML 88 · GLW 80', pending: true },
      { t: 'kv', k: '2 · Monetary', v: 'IBIT 88 · GLDM 85', pending: true },
      { t: 'kv', k: '3 · Physical', v: 'COPX 55+22 · SLV 52+16', pending: true },
      { t: 'kv', k: '4 · App dominance', v: 'LLY 68 · HOOD 61 · AMZN 60', pending: true },
      { t: 'row', pill: 'open', tone: 'open', title: 'Axis 3 boost has no v3.4 successor', quote: 'The Axis-3 physical boost was the only link from hyperscaler capex to copper and silver weight. Trend-first has nothing equivalent. Big-4 2026 capex verified 8/17 at roughly $725B against $410B, up 77% year on year with Q2 guidance raises. Open: give it a home in the wave-demand column, or document the loss.' },
    ],
    files: [
      F_ENGINE, F_CONFIG,
      { path: 'Signal_Engine_Reference.md', role: 'spec — describes the retired composite', status: 'stale' },
      { path: 'S1_Four_Axis_Spec.md', role: 'spec — describes the retired composite, still carries S4 · 0.15', status: 'stale' },
    ],
  },"""

# ----------------------------------------------------------------------------
# 5. seats
# ----------------------------------------------------------------------------
SEATS = """  seats: {
    eyebrow: 'B4 · Human call',
    title: 'Trend conviction',
    source: 'the one step in the assembly the engine does not perform',
    parent: 'engine',
    blocks: [
      { t: 'sec', label: 'Principle' },
      { t: 'note', text: 'Under v3.4 the human call is trend conviction (tconv), not seat count. Concentration still scales with winner-certainty rather than cycle stage, and size stays engine output. The engine sizes what you classify; it does not classify.' },
      { t: 'sec', label: 'Standing rule' },
      { t: 'row', title: 'Fix scores, not weights', quote: 'a discretionary weight override undermines the system. If a weight looks wrong, the score is wrong. This is why the nightly convergence-boost and RSI-trim in the cron stay disabled — they double-counted signals the engine already prices in.' },
      { t: 'sec', label: 'Open decision · v3.3 era' },
      { t: 'row', pill: 'open', tone: 'open', title: 'WDC — cold storage / nearline HDD', quote: 'raised under v3.3 as the only uncovered axis. WDC and STX hold above 80% share, 2026 output sold out, LTAs through 2027–28. SNDK is watch-not-seat: +570% YTD triggered the full velocity penalty and it rents rather than owns the bottleneck. Not re-tested against the v3.4 cascade.' },
    ],
    files: [
      F_WEEKLY,
      { path: 'Weekly_Workflow_v34_section.md', role: 'canonical v3.4 run order', status: 'untracked' },
      { path: 'Weekly_Workflow_v2.docx', role: 'revised run order — superseded by the v3.4 section', status: 'untracked' },
    ],
  },"""

# ----------------------------------------------------------------------------
# 6. names
# ----------------------------------------------------------------------------
NAMES = """  names: {
    eyebrow: 'B5 · Engine, name split',
    title: 'Name split',
    source: 'coverage discount and the v3.4 ladders',
    parent: 'engine',
    blocks: [
      { t: 'sec', label: 'Rule B' },
      { t: 'kv', k: 'lambda', v: '0.814' },
      { t: 'kv', k: 'Applies to', v: 'single names inside a held ETF' },
      { t: 'kv', k: 'Supersedes', v: '12% single-stock cap (6/1/26)' },
      { t: 'note', text: 'MU and MRVL were removed as standalones because both are real SOXX holdings. WDC, SNDK and GLW are confirmed absent from SOXX — no lambda discount applies. Rule B survives v3.4 unchanged; it is the same principle as the coverage test that keeps AIPO despite its 0.86 correlation to SOXX.' },
      { t: 'sec', label: 'Ladder · v3.4, all four multipliers' },
      { t: 'kv', k: 'binding', v: '×1.00' },
      { t: 'kv', k: 'working', v: '×0.92' },
      { t: 'kv', k: 'forward', v: '×0.80' },
      { t: 'kv', k: 'dated', v: '×0.72' },
      { t: 'kv', k: 'absent', v: '×0.60 — floor' },
      { t: 'note', text: '0.60 is a floor, not a kill. Fade, never zero. The same five rungs apply to timing, quality, wave demand and trend conviction alike — the v3.3 four-rung S1-only stage decay (binding / working / cooling / exhausted) is retired. Multipliers act on the above-floor 55, and stack multiplicatively with lambda.' },
    ],
    files: [
      F_ENGINE, F_PULL,
      { path: 'rescore_trendfirst.py', role: 'the live v3.4 offline runner', status: 'live' },
      { path: 'rescore_current_v3.py', role: 'orphaned since 7/6 — not the live engine, do not run', status: 'orphan' },
      { path: 'rescore_v34.py', role: 'retired — superseded by rescore_trendfirst.py, do not run', status: 'orphan' },
      { path: 'patch_gate_no_dma.py', role: 'fourth null-DMA patch — never run', status: 'untracked' },
    ],
  },"""


def main():
    if not os.path.exists(TARGET):
        fail("%s not found -- run from the repo root" % TARGET)

    with open(TARGET, "r", encoding="utf-8") as fh:
        src = fh.read()
    original = src

    # idempotency: refuse to run twice
    if "v3.4-trendfirst" in src and "Trend weights" in src:
        fail("file already carries v3.4 markers -- patch appears to have run")

    print("Editing %s (%d lines)\n" % (TARGET, src.count("\n") + 1))

    # -- edit 1: flowmap freeze node ----------------------------------------
    old = "sub: 'v3.3-coresat'"
    new = "sub: 'v3.4-trendfirst'"
    n = src.count(old)
    if n != 1:
        fail("flowmap freeze sub found %d times, expected 1" % n)
    src = src.replace(old, new)
    print("  freeze   sub -> v3.4-trendfirst")

    # -- edits 2-6: node bodies ---------------------------------------------
    for key, body in (
        ("engine", ENGINE),
        ("themes", THEMES),
        ("pillars", PILLARS),
        ("seats", SEATS),
        ("names", NAMES),
    ):
        src = swap_node(src, key, body)

    if src == original:
        fail("no change produced -- refusing to write")

    # -- backup then write ---------------------------------------------------
    stamp = datetime.now().strftime("%Y%m%d%H%M%S")
    backup = "%s.bak.%s" % (TARGET, stamp)
    shutil.copy2(TARGET, backup)
    with open(TARGET, "w", encoding="utf-8") as fh:
        fh.write(src)

    delta = (src.count("\n") + 1) - (original.count("\n") + 1)
    print("\nbackup  %s" % backup)
    print("written %s  (%+d lines)" % (TARGET, delta))
    print("\nNext:  npm run build")


if __name__ == "__main__":
    main()
