#!/usr/bin/env python3
"""
patch_systemmap_v341.py

Second pass on src/data/systemMap.ts. Requires patch_systemmap_v34.py to have
run first (checks for its markers and aborts if absent).

Four edits:

  1. NEW  V34_BOOK / TREND_ORDER / trendSum inserted after the SysDetail
          interface. One array is now the only place ticker weights are stated.
  2. themes  bars and holdings GENERATED from V34_BOOK, weights -> v3.4.1
  3. names   ladder labels corrected: binding / working / cooling / forward /
             exhausted. The previous pass wrote "forward 0.80 / dated 0.72 /
             absent 0.60" which was wrong on three of five labels.
  4. engine  three shared-rung ladders separated from the entry band, which
             has its own 1.00 / 0.95 / 0.85 / 0.75 / 0.60 scale; freeze stamp
             -> 2026-08-31-v3.4.1-stageflip

Ground truth for every number here is `git show HEAD:server/daily-cron.cjs`
BASE_PORTFOLIO at 2026-08-31-v3.4.1-stageflip, cross-checked against
v34_worksheet_2026-08-31.html.

Discipline: anchored, count == 1, brace-matched spans, no re.DOTALL,
.bak.<timestamp> before write, refuses to run twice.
"""

import os
import shutil
import sys
from datetime import datetime

TARGET = "src/data/systemMap.ts"

SPAN_GUARD = {
    "engine": (25, 60),
    "themes": (35, 90),
    "names":  (15, 45),
}


def fail(msg):
    print("ABORT: " + msg)
    sys.exit(1)


def find_node_span(src, key):
    marker = "\n  %s: {\n" % key
    hits = src.count(marker)
    if hits != 1:
        fail("node marker for '%s' found %d times, expected 1" % (key, hits))
    start = src.index(marker) + 1
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
        fail("node '%s' span is %d lines, outside expected %d-%d" % (key, n_old, lo, hi))
    print("  %-8s %3d lines -> %3d lines" % (key, n_old, new_body.count("\n") + 1))
    return src[:start] + new_body + src[end:]


# ----------------------------------------------------------------------------
# 1. the shared constant
# ----------------------------------------------------------------------------
ANCHOR = "  parent?: string    // id rendered as a back link\n}\n"

CONST = """
// ---------------------------------------------------------------------------
// THE BOOK -- single source for every weight rendered anywhere in this file.
//
// Mirrors server/daily-cron.cjs BASE_PORTFOLIO at PORTFOLIO_VERSION
// '2026-08-31-v3.4.1-stageflip'. The cron is authoritative; this is a copy for
// display. At the next freeze, edit THIS ARRAY ONLY -- the trend bars and the
// holdings list are both derived from it, so they cannot disagree.
//
// Weights sum to exactly 100.0. Floors in the cron are half-weight, rounded.
// ---------------------------------------------------------------------------
export const V34_BOOK = [
  { tkr: 'LLY',  trend: 'AI Applied',      w: 13.9, act: 'Hold' },
  { tkr: 'AMZN', trend: 'AI Applied',      w: 12.4, act: 'Hold' },
  { tkr: 'IBIT', trend: 'Monetary',        w: 12.2, act: 'Add'  },
  { tkr: 'ETHA', trend: 'Tokenized Rails', w: 11.8, act: 'Add'  },
  { tkr: 'GLDM', trend: 'Monetary',        w:  9.1, act: 'Add'  },
  { tkr: 'HOOD', trend: 'Tokenized Rails', w:  8.0, act: 'Add'  },
  { tkr: 'SLV',  trend: 'Monetary',        w:  7.8, act: 'Hold' },
  { tkr: 'AIPO', trend: 'AI Buildout',     w:  6.2, act: 'Trim' },
  { tkr: 'GLW',  trend: 'AI Buildout',     w:  5.0, act: 'Hold' },
  { tkr: 'ASML', trend: 'AI Buildout',     w:  5.0, act: 'Trim' },
  { tkr: 'SOXX', trend: 'AI Buildout',     w:  4.5, act: 'Trim' },
  { tkr: 'COPX', trend: 'AI Buildout',     w:  4.1, act: 'Hold' },
] as const

// Ordered by weight, descending. Rendering order for the trend bars.
export const TREND_ORDER = ['Monetary', 'AI Applied', 'AI Buildout', 'Tokenized Rails'] as const

export const trendSum = (name: string): number =>
  Math.round(V34_BOOK.filter(h => h.trend === name).reduce((s, h) => s + h.w, 0) * 10) / 10
"""

# ----------------------------------------------------------------------------
# 2. themes
# ----------------------------------------------------------------------------
THEMES = """  themes: {
    eyebrow: 'B2 · Engine, cascade output',
    title: 'Trend weights',
    source: 'rescore_trendfirst.py → frozen into daily-cron.cjs BASE_PORTFOLIO',
    parent: 'engine',
    blocks: [
      { t: 'sec', label: 'Trend mix · v3.4.1' },
      ...TREND_ORDER.map((tr): Block => ({
        t: 'bar', k: tr, v: trendSum(tr).toFixed(1) + '%', pct: trendSum(tr),
      })),
      { t: 'note', text: 'Bars are summed from the holdings below, not typed in — they cannot drift apart. Trend weights are an OUTPUT of the cascade, not an input. Sums to 100.0 exactly. There is no cash row: SGOV left the book at the v3.4 freeze and stays priced only because the momentum sleeve settles its cash residual there.' },
      { t: 'sec', label: 'Versions' },
      { t: 'kv', k: 'v3.4.1 stage flip', v: '8/31/26 · 12 names · 4.06pp turnover' },
      { t: 'kv', k: 'v3.4 trend-first', v: '8/24/26 · 12 names' },
      { t: 'kv', k: 'v3.3 core-satellite', v: '7/15/26 · 14 names' },
      { t: 'kv', k: 'v3.2 top-down', v: '7/13/26 · 15 names' },
      { t: 'kv', k: 'v3.1 / v3.0 sleeve mix', v: 'pending backfill', pending: true },
      { t: 'note', text: 'v3.4.1 is a classification patch, not a methodology change. The cascade is unchanged v3.4; only two timing classifications and three entry bands moved. Ticker set unchanged.' },
      { t: 'sec', label: 'Holdings at freeze' },
      ...V34_BOOK.map((h): Block => ({
        t: 'kv', k: h.tkr + ' · ' + h.trend, v: h.w.toFixed(1) + ' · ' + h.act,
      })),
      { t: 'note', text: 'Floors are half the frozen weight, rounded to 0.1. Actions are the freeze-night instruction, not a standing signal.' },
      { t: 'sec', label: 'What moved on 8/31' },
      { t: 'row', date: '8/31 · flip', pill: 'engine', tone: 'engine', title: 'ETHA forward → working · +2.2', quote: 'The 8/15–8/16 basis was that beginning in September the next constraint becomes financial — dated, not started. It is now started. Visser 8/30 calls it the catalyst point and the most important thing to be spending time on; 8/29 states more money in crypto than ever and more Ethereum than he has ever held. Corroborated by price rather than assertion alone: ETH/BTC breakout, tokenized index outperforming BTC year to date. Held at working rather than binding — one rung at a time.' },
      { t: 'row', date: '8/31 · flip', pill: 'engine', tone: 'engine', title: 'GLDM binding → working · −2.4', quote: 'Visser 8/30 supersedes the 8/16 debasement instruction with an explicit RELATIVE de-rate: gold will not be the fastest horse in the race. Direction is intact — he still expects gold higher — so this maps to timing, not quality. Independently corroborated: GLDM broke its 200-DMA the same week at 87.70 against 89.40, dropping S5 from 58 to 45 and the entry band from 0.85 to 0.75.' },
      { t: 'row', date: '8/28 · bands', pill: 'data', tone: 'data', title: 'Three band shifts on Friday closes', quote: 'LLY 0.85 to 0.95 after falling through its 50-DMA at 1156.75 against 1188. SLV 0.60 to 0.75 on stretch decay. GLDM 0.85 to 0.75. AMZN moved −0.9 with no classification change of its own — LLY simply took more of a shrinking AI Applied pot, which is intra-trend renormalisation working as designed.' },
      { t: 'note', text: 'GLDM and ETHA together account for 56% of this cycle turnover. The AMZN/LLY rounding tie at 13.353685096 dissolved on the LLY band change and needs no correction.' },
      { t: 'sec', label: 'theme_engine.py · recommender, dormant' },
      { t: 'note', text: 'L1 theme weights were retired at the v3.4 lock. The findings below describe theme_engine.py, which no longer feeds the book and has never run in this working tree. Kept because the file is still present and the failure modes are still real if it is ever revived.' },
      { t: 'row', pending: true, pill: 'open', tone: 'open', title: 'No structural backbone in L1', quote: 'Intensity is a pure function of airtime × conviction. A theme with zero airtime falls to the max(0.01) floor, and the only thing holding it up is the ±4%/week limiter clamping it to prior − 4. Over the 8-week stretch where chips scored zero airtime, that is roughly −32 points — the ASML-deletion failure mode the backfill warned about, arriving slowly instead of at once.' },
      { t: 'row', pill: 'data', tone: 'data', title: 'Partial severity degrades quietly', quote: 'A missing input file hard-exits via sys.exit, which is correct. But in L2, sev.severity.get(pillar, 0.6) substitutes 0.6 for any pillar absent from the severity file, and a missing config falls back to CFG_DEFAULT whole. So an absent file fails loudly while an incomplete one does not.' },
      { t: 'row', pill: 'data', tone: 'data', title: 'Has never run in this working tree', quote: 'Line 152 writes theme_weights.json on every successful run and that file does not exist. conviction_tags.json and theme_engine_config.json are also absent, and severity_scores.json is dated 7/15 against an 8/5 engine.' },
    ],
    files: [
      F_THEME,
      { path: 'Trend_First_Spec.md', role: 'spec — canonical v3.4 methodology', status: 'live' },
      { path: 'rescore_trendfirst.py', role: 'offline runner — validated v3.4 engine', status: 'live' },
      { path: 'v34_worksheet_2026-08-31.html', role: 'canonical worksheet — v3.4.1 per-name arithmetic', status: 'live' },
      { path: 'v34_worksheet_2026-08-24.html', role: 'prior worksheet — v3.4 baseline for the delta', status: 'live' },
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
# 3. names -- ladder label correction
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
      { t: 'sec', label: 'Timing ladder' },
      { t: 'kv', k: 'binding', v: '×1.00' },
      { t: 'kv', k: 'working', v: '×0.92' },
      { t: 'kv', k: 'cooling', v: '×0.80' },
      { t: 'kv', k: 'forward', v: '×0.72' },
      { t: 'kv', k: 'exhausted', v: '×0.60 — floor' },
      { t: 'note', text: '0.60 is a floor, not a kill. Fade, never zero. Corrected 9/02: an earlier pass on this card mislabelled the middle rungs as forward / dated / absent. The multipliers were right, the names were not — cooling sits at 0.80 and forward at 0.72. Under v3.4 this ladder applies to every name rather than to S1 alone, and its multipliers act on the above-floor 55, stacking with lambda.' },
    ],
    files: [
      F_ENGINE, F_PULL,
      { path: 'rescore_trendfirst.py', role: 'the live v3.4 offline runner', status: 'live' },
      { path: 'rescore_current_v3.py', role: 'orphaned since 7/6 — not the live engine, do not run', status: 'orphan' },
      { path: 'rescore_v34.py', role: 'retired — superseded by rescore_trendfirst.py, do not run', status: 'orphan' },
      { path: 'patch_gate_no_dma.py', role: 'fourth null-DMA patch — never run', status: 'untracked' },
    ],
  },"""

# ----------------------------------------------------------------------------
# 4. engine -- ladders split, freeze stamp
# ----------------------------------------------------------------------------
ENGINE = """  engine: {
    eyebrow: 'B · Sealed assembly',
    title: 'Engine',
    source: 'voices in → 12 weighted positions out · v3.4 trend-first',
    parts: ['tagging', 'themes', 'pillars', 'seats', 'names'],
    blocks: [
      { t: 'sec', label: 'Assembly' },
      { t: 'kv', k: 'Methodology', v: 'v3.4 trend-first · locked 8/23/26' },
      { t: 'kv', k: 'Frozen as', v: '2026-08-31-v3.4.1-stageflip · 12 names' },
      { t: 'kv', k: 'Parts', v: '5 — one superseded' },
      { t: 'kv', k: 'Human calls', v: '1 — trend conviction (tconv)' },
      { t: 'note', text: 'Supersedes all composite scoring. Trends compete for weight; names compete only inside their own trend. Nothing competes across trends. B3 pillar sizing is retained for version history and no longer runs.' },
      { t: 'sec', label: 'The cascade' },
      { t: 'kv', k: '1 · name_score', v: '55 × timing × quality × wave × entry_band' },
      { t: 'kv', k: '2 · trend_score', v: 'derived_timing × tconv × breadth' },
      { t: 'kv', k: '3 · trend_weight', v: '100 × trend_score / Σ trend_score' },
      { t: 'kv', k: '4 · name_weight', v: 'trend_weight × name_score / Σ in trend' },
      { t: 'note', text: '55 = 100 − floor 45. Multipliers act on the above-floor portion only. A name below the floor scores zero and drops out; if it is the only name in its trend, the trend collapses.' },
      { t: 'sec', label: 'Ladders · three share rungs' },
      { t: 'kv', k: 'Rungs', v: '1.00 · 0.92 · 0.80 · 0.72 · 0.60' },
      { t: 'kv', k: 'Timing', v: 'binding · working · cooling · forward · exhausted' },
      { t: 'kv', k: 'Quality', v: 'sole · basket · duopoly · leader · contested' },
      { t: 'kv', k: 'Wave demand', v: 'coding · enterprise · consumer · embodied · chatbots' },
      { t: 'note', text: 'Accelerating gaps — 0.08, 0.12, 0.08, 0.12 — so the bottom of each ladder costs more than the top. Quality falls to 0 only on an explicit remove. Wave demand also carries a macro rung at 1.00 for trends that sit off the AI curve entirely and run on their own clock. Timing is derived at trend level as the mean of its sub-themes, never asserted separately.' },
      { t: 'sec', label: 'Entry band · its own scale' },
      { t: 'kv', k: 'S5 85–100', v: '×1.00 — pullback, thesis intact' },
      { t: 'kv', k: 'S5 70–84', v: '×0.95 — off highs, has not run' },
      { t: 'kv', k: 'S5 55–69', v: '×0.85 — steady early-stage grind' },
      { t: 'kv', k: 'S5 45–54', v: '×0.75 — near highs, stage peaked' },
      { t: 'kv', k: 'S5 below 45', v: '×0.60 — vertical blowoff' },
      { t: 'note', text: 'The entry band does NOT share the rungs above — it is a separate mapping off the S5 score, and S5 excludes RSI. These five multipliers are not drawn from config; they were set by hand and are the least-validated numbers in the cascade.' },
      { t: 'sec', label: 'Breadth' },
      { t: 'kv', k: 'N_eff', v: '(Σλ)² / Σλ² over 251 sessions' },
      { t: 'note', text: 'Measured from real correlations, not √n. Seven buildout names resolve to 1.95 independent bets; √n claims 2.65, a 36% overstatement. Two uncorrelated application names are worth 2.00. Backward-looking, and correlations tighten as the window shortens — AIPO-SOXX 0.86 at one year against 0.91 at three months, GLDM-IBIT 0.28 against 0.59.' },
      { t: 'sec', label: 'Design decisions' },
      { t: 'row', title: 'RSI removed from S5', quote: 'A cliff, not a slope — 69.9 to 70.0 cost 8 S5 points. It was also the only term ranking gold above bitcoin against the S1 judgment. Removed 8/22, but pull_candidates.cjs kept emitting the retired term until 8/31, so any S5 printed in between understates names with RSI at or above 60.' },
      { t: 'row', title: 'Correlation is not coverage', quote: 'AIPO and SOXX correlate 0.86, but SOXX holds zero utilities or grid. N_eff alone would drop the position the whole thesis points at, merely because power has not decoupled yet. Removals are judged on both.' },
      { t: 'row', pending: true, pill: 'open', tone: 'open', title: 'tconv has the least provenance', quote: 'Trend conviction is the highest-leverage input and the only classification carrying no mandatory source quote or date, unlike timing and quality which both require attribution.' },
      { t: 'row', pending: true, pill: 'open', tone: 'open', title: 'Breadth rewards unrelated names', quote: 'N_eff rises when an uncorrelated name is added, so a name can buy trend weight regardless of conviction. Named in the worksheet as a perverse incentive and not yet fenced.' },
      { t: 'sec', label: 'Worksheet' },
      { t: 'note', text: 'Full per-name arithmetic lives in v34_worksheet_2026-08-31.html — click any cell for its derivation. Deliberately not restated here: a second copy of the numbers is a second thing to drift.' },
    ],
    files: [F_ENGINE, F_CONFIG, F_THEME],
  },"""


def main():
    if not os.path.exists(TARGET):
        fail("%s not found -- run from the repo root" % TARGET)

    with open(TARGET, "r", encoding="utf-8") as fh:
        src = fh.read()
    original = src

    if "Trend weights" not in src:
        fail("v3.4 markers absent -- run patch_systemmap_v34.py first")
    if "V34_BOOK" in src:
        fail("V34_BOOK already present -- this patch appears to have run")

    print("Editing %s (%d lines)\n" % (TARGET, src.count("\n") + 1))

    # -- edit 1: insert the shared constant ---------------------------------
    n = src.count(ANCHOR)
    if n != 1:
        fail("SysDetail interface anchor found %d times, expected 1" % n)
    src = src.replace(ANCHOR, ANCHOR + CONST)
    print("  V34_BOOK inserted after SysDetail  (+%d lines)" % (CONST.count("\n")))

    # -- edits 2-4: node bodies ---------------------------------------------
    for key, body in (("themes", THEMES), ("names", NAMES), ("engine", ENGINE)):
        src = swap_node(src, key, body)

    if src == original:
        fail("no change produced -- refusing to write")

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
