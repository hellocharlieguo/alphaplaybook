# AlphaPlaybook — Model Sleeves (6/1/26)

**Decision Engine v2.2** · supersedes `AlphaPlaybook_Sleeves_5_28_26.md`
North star: **Long scarcity, short abundance.** Visser Stage **S3 (Power + Silver)** — no stage flip.

Scores are the validated **5/28 v2.1 rescore** (latest 5 Visser transcripts: 5/10, 5/16, 5/17, 5/23, 5/24).
Weights are **reweighted 6/1 under Rule B** (single-name redundancy discount). Composites unchanged.

---

## What changed on 6/1 — Rule B (single-name redundancy discount)

**Problem it fixes:** a single stock carrying idiosyncratic risk was outweighing the diversified
thematic ETF that already expresses the same theme. CEG (one nuclear operator, its own
reactor/PPA/outage/regulatory risk) sat at 12% — above AIPO (10%), the AI-power basket that
*already holds CEG* plus ~50 other power names. A single-name blowup could hit the book on a
company headline that has nothing to do with the power-buildout thesis being expressed.

**The rule:** a single stock whose **theme is already held via a thematic ETF** takes an
idiosyncratic-risk haircut on its **weighting score only**:

    weighting_score = 45 + (composite - 45) * lambda      (lambda = 0.814)

- `composite` is **unchanged** → entry-tier labels and trim/exit triggers are unaffected.
- Only the normalizer's convexity curve `(score - 45)^k` consumes `weighting_score`.
- **Exempt:** ETFs (lambda = 1.0); and single names whose theme has **no** held ETF —
  optical **GLW / MRVL** stay full-weight (trivial membership in a broad basket like XSD is
  NOT theme coverage).
- **Replaces** the old ad-hoc 12% single-stock cap on CEG. The scoring rule now does that job.
- `lambda` is the judgment knob: 0.80 → CEG ~7%, **0.814 → CEG ~7.5%**, 0.83 → ~8%.

**Redundant names by sleeve:**
- Aggressive: **CEG, BE** (both inside AIPO — CEG ~3.5%, BE ~6%).
- Conservative: **CEG, VST** (both inside the held NLR nuclear ETF and XLU utilities ETF).
- Conservative **BE NOT discounted** — decided 6/1: conservative holds no AI-power ETF (no AIPO),
  and GRID is grid-equipment, not distributed-power/fuel-cell, so BE's theme isn't ETF-covered here.

---

## AGGRESSIVE sleeve — LIVE (deployed to cron)
top 18% · cash floor 5% · k = 6.03 · 17 holdings · **no single-stock cap**

| # | Ticker | Theme | Weight | Composite | Note |
|---|--------|-------|-------:|----------:|------|
| 1 | SLV | Monetary Scarcity | 18.0% | 82.8 | |
| 2 | WGMI | Power & Infrastructure | 10.5% | 79.0 | thematic ETF |
| 3 | AIPO | Power & Infrastructure | 10.5% | 79.0 | thematic ETF |
| 4 | CEG | Power & Infrastructure | 7.5% | 83.9 | **Rule B** (redundant w/ AIPO) |
| 5 | IBIT | Monetary Scarcity | 7.0% | 76.2 | |
| 6 | GLDM | Monetary Scarcity | 6.5% | 75.8 | |
| 7 | GLW | Compute (optical) | 6.0% | 74.8 | exempt (no optical ETF) |
| 8 | SGOV | Cash | 5.5% | 51.0 | cash floor |
| 9 | TXN | Power & Infrastructure | 4.5% | 73.1 | |
| 10 | FLNC | Power & Infrastructure | 4.5% | 72.8 | |
| 11 | MRVL | Compute (optical) | 4.5% | 72.4 | exempt (no optical ETF) |
| 12 | ETHA | Monetary Scarcity | 3.0% | 69.5 | |
| 13 | ENTG | Compute (chemicals) | 3.0% | 69.2 | |
| 14 | BE | Power & Infrastructure | 2.5% | 72.4 | **Rule B** (redundant w/ AIPO) |
| 15 | COPX | Power & Infrastructure | 2.5% | 67.2 | structural cross-stage hedge |
| 16 | HOOD | Monetary Scarcity | 2.0% | 58.4 | |
| 17 | XSD | Compute | 2.0% | 51.2 | |
| | **Total** | | **100.0%** | | weighted-avg composite ≈ 73.6 |

**Deltas from 5/28 → 6/1:** CEG 12.0 → **7.5** (cap retired, Rule B), AIPO 10.0 → **10.5**
(theme now outweighs the single name — the intended ordering), BE 4.0 → **2.5**,
WGMI 10.0 → 10.5, IBIT 6.5 → 7.0, GLDM 6.0 → 6.5, GLW 5.0 → **6.0**, MRVL 4.0 → **4.5**,
TXN/FLNC 4.0 → 4.5, ENTG 2.5 → 3.0, SGOV 4.5 → 5.5. Membership unchanged (17 names).

---

## CONSERVATIVE sleeve — OFFLINE BY DESIGN (not deployed to cron)
top 11% · cash floor 12% · k = 4.07 · 19 holdings
Offline is a standing design decision, unrelated to API limits — do not infer it's deployable.
Restricted (no access) names substituted: IBIT→MSTR, WGMI/AIPO→NLR+GRID+XLU, ETHA→COIN.

| # | Ticker | Theme | Weight | Composite | Note |
|---|--------|-------|-------:|----------:|------|
| 1 | SGOV | Cash | 12.5% | 51.0 | cash floor |
| 2 | SLV | Monetary Scarcity | 11.0% | 82.8 | |
| 3 | NLR | Power (nuclear ETF) | 8.0% | 79.5 | thematic ETF |
| 4 | CEG | Power (nuclear) | 6.5% | 83.9 | **Rule B** (redundant w/ NLR+XLU) |
| 5 | GRID | Power (grid ETF) | 6.0% | 75.9 | thematic ETF |
| 6 | GLDM | Monetary Scarcity | 6.0% | 75.8 | |
| 7 | VST | Power (nuclear/merchant) | 5.5% | 81.3 | **Rule B** (redundant w/ NLR+XLU) |
| 8 | XLU | Utilities (defensive) | 5.5% | 75.2 | thematic ETF |
| 9 | GLW | Compute (optical) | 5.5% | 74.8 | exempt |
| 10 | TXN | Power & Infrastructure | 4.5% | 73.1 | |
| 11 | BE | Power & Infrastructure | 4.5% | 72.4 | full-weight (no AI-power ETF here) |
| 12 | MRVL | Compute (optical) | 4.5% | 72.4 | exempt |
| 13 | MSTR | Bitcoin (equity) | 4.0% | 71.8 | IBIT substitute |
| 14 | ENTG | Compute (chemicals) | 3.5% | 69.2 | |
| 15 | XLE | Energy (defensive) | 3.0% | 68.1 | |
| 16 | COPX | Copper | 3.0% | 67.2 | structural |
| 17 | COIN | Exchange/tokenization | 2.5% | 65.0 | ETHA substitute |
| 18 | XLV | Healthcare (defensive) | 2.0% | 55.8 | |
| 19 | XSD | Compute | 2.0% | 51.2 | |
| | **Total** | | **100.0%** | | weighted-avg composite ≈ 71.6 |

---

## Reproduce
Offline engine (Python), from the repo root:

    python3 portfolio_normalizer.py

Prints both sleeves. Aggressive output is transcribed into `BASE_PORTFOLIO` in `daily-cron.cjs`
(the cron ships final weights; the nightly boost is disabled). Conservative is engine-output /
reference only. Regenerate **both sleeves together** when rescoring; only the `sleeve=` arg differs.

## Engine files (offline scoring pipeline — Python, not part of the deployed app)
- `signal_engine.py` — scores 6 signals → composite + `weighting_score` (Rule B).
- `portfolio_normalizer.py` — conviction-proportional weighting on `weighting_score`.
- `signal_model_config.json` — v2.2; holds the `coverage_discount` block (lambda, redundant lists).

## On the horizon (unchanged queue)
Crypto-beta tactical haircut (IBIT/ETHA/HOOD/MSTR/COIN) per 5/30–5/31 Visser; LLY + oil/energy
candidate rescore; CPI panel; History→Performance merge; Leopold 3rd frozen voice card.
