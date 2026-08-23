# Trend-First Scoring — v3.4 Spec

**Status:** LOCKED 2026-08-23. Supersedes the composite method entirely.
**Canonical reference:** `v34_worksheet.html` — interactive, click any cell for its arithmetic.
**Offline runner:** `rescore_trendfirst.py` — reproduces the worksheet exactly (validated to 0.1pp on all 12 holdings).

---

## The cascade

```
name score   = 55 × timing × quality × wave_demand × entry_band(S5)
trend score  = derived_timing × conviction × breadth
trend weight = 100 × trend_score / Σ(all trend scores)
name weight  = trend_weight × (name score / Σ scores in that trend)
```

Four trends. Every name sits in exactly one sub-theme inside one trend. **Nothing competes across trends** — a name is only ever ranked against genuine substitutes.

`55` is `100 − floor_score`. Multipliers act on the **above-floor portion only**, which is the form config specifies for stage decay (`ws = floor + (composite − floor) × mult`). Applying them to the whole scale let the ladders compound: spread across the 25 timing×quality combinations was 5,500× with three cells at zero, violating "fade, never zero." Correct form spans 2.8×.

---

## The four ladders

All share five rungs: **1.00 / 0.92 / 0.80 / 0.72 / 0.60**. Gaps accelerate (0.08, 0.12, 0.08, 0.12) so the bottom of each ladder costs more than the top. 0.60 is a floor — fade, never zero.

| ladder | asks | rungs |
|---|---|---|
| **timing** | where this bottleneck sits in its own cycle | binding · working · cooling · forward · exhausted |
| **quality** | odds that owning this captures the trend | sole · basket · duopoly · leader · contested · **remove (×0)** |
| **conviction** | how sure the trend is (trend level) | certain · strong · forming · speculative · watch |
| **entry band** | S5 → multiplier | ≥85 ×1.00 · 70–84 ×0.95 · 55–69 ×0.85 · 45–54 ×0.75 · <45 ×0.60 |

**Quality is the key design choice.** A monopoly and a whole-theme basket both score high, for opposite reasons — one has no alternative, the other owns every alternative. That is the breadth term the old severity scale never had, and it is why SOXX no longer needs a hand-set floor.

---

## S5 — computed, never typed

```
base = px < d200 ? 45 : (px < d50 ? 72 : 58)
st   = (px − d50) / d50 × 100
rp   = st ≥ 50 ? 12 : st ≥ 25 ? 8 : st ≥ 10 ? 4 : 0
S5   = clamp(5, 95, base − rp × 0.5)
```

**RSI removed 2026-08-22.** It was a cliff, not a slope — 69.9 → 70.0 cost 8 points of S5 and 25% of weight — and it was the only thing ranking gold above bitcoin when S1 said the reverse.

**Trailing 1-year return excluded by design** (6/22/26). Known consequence: IBIT is down ~32% on the year, has bounced 19.5% off its 50-DMA, and reads as stretched. The model sees recent velocity; Visser's "Bitcoin has not moved yet" sees the multi-year position. Both are real; the model only sees one.

---

## Breadth — measured, not counted

`N_eff = (Σλ)² / Σλ²` from the return-correlation matrix. Seven identical names → 1.0; seven independent → 7.0.

**Why this replaced √n.** √n assumed each sub-theme was an independent bet. Measured on 251 sessions of daily log returns:

| | n | √n | N_eff |
|---|---:|---:|---:|
| AI buildout (7 names, pre-cull) | 7 | 2.65 | **1.95** |
| AI applied (AMZN, LLY at r=0.04) | 2 | 1.41 | **2.00** |

Two uncorrelated names delivered more breadth than seven correlated ones. √n was paying for fake diversification and inflating whichever trend was sliced most finely.

**Limitations, on the record:**
- Backward-looking. Correlations tighten as the window shortens (AIPO-SOXX 0.86 at 1y → 0.91 at 3m).
- Creates a perverse incentive: an unrelated name buys trend weight regardless of conviction.
- **Correlation ≠ coverage.** AIPO correlates 0.86 to SOXX but SOXX holds *zero* utilities or grid equipment. N_eff would drop the position the entire thesis points at, because power hasn't decoupled *yet*. Coverage is structural; correlation is recent behaviour. Judge removals on both.

---

## Wave demand — AI buildout only

One global adoption wave; different waves stress different parts of the stack.

| sub-theme | chatbots | coding | enterprise | consumer | embodied |
|---|---:|---:|---:|---:|---:|
| power/grid | 0.92 | 1.00 | 1.00 | 1.00 | 0.92 |
| semis basket | 0.92 | 0.92 | 0.92 | 0.92 | 1.00 |
| memory | 0.80 | 1.00 | 1.00 | 1.00 | 0.80 |
| storage / nearline | 0.72 | 0.80 | 1.00 | 0.80 | 0.72 |
| optical | 0.72 | 0.92 | 1.00 | 1.00 | 0.72 |
| lithography | 0.92 | 0.92 | 0.92 | 0.92 | 0.92 |
| copper input | 0.80 | 0.80 | 0.92 | 1.00 | 1.00 |

Trends 2–4 are not downstream of the AI adoption curve and sit at 1.00.

**Current wave: `coding agents`.** Visser 8/16 — *"This year was about agents, the agentic economy opening"*; enterprise agents are *"coming. Not having started yet."* Confirmed unchanged 8/23. Advance only on **observable evidence** the next wave has started, not on an announcement.

---

## Trend timing is derived

`trend_timing = mean(sub-theme timing multipliers)`.

It was being asserted twice. AI buildout had been set `binding` while only 1 of its 7 sub-themes was binding — real mean 0.880, overstating the trend by ~3 points. Deriving it also means it cannot drift: change a sub-theme's stage and the trend follows.

*Simplification:* a plain mean counts a 2%-weight sub-theme the same as a 20% one. Weighting by score would be more accurate but circular.

---

## Retired — do not reintroduce without a decision

| | why |
|---|---|
| `target_top_pct` | pinned the #1 name to a constant, so its weight carried no information about its conviction |
| composite S1/S2/S5/S6/conv | replaced by the cascade above |
| `single_stock_cap` | superseded 2026-06-01 by Rule B |
| L1 theme weights | trend weights are an OUTPUT now, not an input |
| convergence bonus | voices reach the model through timing and quality — one opinion, one place |
| RSI in S5 | threshold cliff at 70 |
| √n breadth | overstated breadth by 36% on the buildout |

**Still available, currently off:** sleeve caps (standing risk rule, spans trends) and per-trend weight overrides. Both log to the export when used.

---

## Every classification carries a source

Timing and quality each have a quote-plus-date, or an explicit **NO VOICE SUPPORT** flag. As of 2026-08-23 that flag covers **ASML, COPX and LLY — 23.0% of the book** — structural seats on market analysis rather than voice conviction. Deliberate, not drift, and it should stay visible.
