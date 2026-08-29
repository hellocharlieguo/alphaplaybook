# Weekly Workflow — v3.4 scoring section

**Replaces the old §5 "run rescore_current_v3.py" step. That script and
`rescore_v34.py` both implement the retired composite method — do not run either.**

---

## §5 · Score the book — trend-first

`v34_worksheet.html` is the **canonical scoring document**. Open it, set the
week's inputs, read the weights. `rescore_trendfirst.py` is the offline runner
and reproduces it exactly; if the two disagree, one is stale.

```
cd ~/Desktop/alphaplaybook
open v34_worksheet.html
```

### 5a · What actually changes week to week

| input | cadence | trigger |
|---|---|---|
| **sub-theme timing** | **weekly — this is the live one** | Visser's stage calls, with a quote |
| technicals (px, d50, d200) | weekly | `node pull_candidates.cjs` |
| quality | rarely | market structure changed — merger, new entrant, monopoly broken |
| trend conviction | rarely | the trend's standing changed |
| **adoption wave** | ~twice a year | **observable evidence** the next wave started, not an announcement |
| correlations | monthly | `python3 pull_correlations.py` |
| trend weight override | only when overruling the engine | log it |

Everything else is derived. Trend weights, trend timing, S5 and name weights are
**outputs** — if one looks wrong, an input is wrong.

### 5b · Run it

```
cd ~/Desktop/alphaplaybook
node --check pull_candidates.cjs && node pull_candidates.cjs
python3 rescore_trendfirst.py
```

Paste the fresh px / d50 / d200 into the worksheet, set any timing changes from
this week's transcripts, then **export changes** and keep the block with the
cycle notes. The export carries every deviation from baseline with its reason.

### 5c · Evidence rule — unchanged, now enforced in the sheet

Every timing and quality classification carries a **source**: an exact quote plus
date, or an explicit `NO VOICE SUPPORT` flag. Click any ticker to see it.

- No quote → no timing change. A stage call without a transcript line is drift.
- `NO VOICE SUPPORT` names are structural seats on market analysis. Legitimate,
  but the total should be watched — it was 23.0% of the book on 2026-08-23.
- A voice naming a **theme** is not a leg on a **ticker**. Theme conviction
  reaches the model through timing; it does not size a name directly.

### 5d · Freeze criteria — unchanged

Ticker-set change, OR a stage flip, OR a candidate clearing all gates.
Otherwise confirm-the-book. A freeze must be reproducible from committed files:
`corr_matrix.json` and the worksheet inputs are part of that, not scratch.

---

## What this replaced, and why

The composite method sized names by a weighted sum and pinned the top name to
`target_top_pct` — so the largest position's weight carried no information about
its conviction. Trend-first makes every judgement a named rung on a shared
ladder, derives everything else, and measures breadth from real correlations
instead of counting sub-themes.

Full rationale, ladders, wave matrix and the retired-mechanisms list:
**`Trend_First_Spec.md`**.
