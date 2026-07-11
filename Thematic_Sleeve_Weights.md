# AlphaPlaybook — Thematic Sleeve Weights (LIVE)

**Frozen:** 2026-07-07 · `portfolio_version = '2026-06-29-v3.0-themes.1'` · verified in Supabase `daily_snapshots`.
This is the first freeze off the four-axis S1 engine (see `S1_Four_Axis_Spec.md`). 13 holdings + cash, 5 display buckets. Weights drift daily off these targets; they reset only on a `PORTFOLIO_VERSION` bump (next Monday freeze).

## Live book

| Ticker | Bucket (display) | S1 axis | Weight |
|---|---|---|---:|
| AIPO | AI Compute | bottleneck | 18.0% |
| LLY | AI Application | app-dominance | 13.5% |
| AMZN | AI Application | app-dominance | 12.5% |
| HOOD | Tokenization | app-dominance | 9.0% |
| COPX | AI Compute | physical scarcity | 7.5% |
| GLW | AI Compute | bottleneck | 7.5% |
| ASML | AI Compute | bottleneck | 7.0% |
| SLV | Monetary Scarcity | dual (monetary + physical) | 6.5% |
| SGOV | Cash | — | 6.0% |
| SOXX | AI Compute | bottleneck | 4.0% |
| IBIT | Monetary Scarcity | monetary | 3.0% |
| GLDM | Monetary Scarcity | monetary | 3.0% |
| ETHA | Tokenization | monetary | 2.5% |
| | | **Total** | **100.0%** |

## Sleeve mix

| Sleeve | Weight |
|---|---:|
| AI Compute (AIPO+GLW+ASML+SOXX+COPX) | 44.0% |
| AI Application (LLY+AMZN) | 26.0% |
| Tokenization (HOOD+ETHA) | 11.5% |
| Monetary Scarcity (SLV+GLDM+IBIT) | 12.5% |
| Cash (SGOV) | 6.0% |

*(By S1 axis, not display bucket: bottleneck ~36.5%, app-dominance ~35%, scarcity ~22.5% [monetary + physical, incl. silver's split], cash 6%.)*

## What changed this freeze (vs the prior ~6/30 book)

| Ticker | Old | New | Δ | why |
|---|---:|---:|---:|---|
| SOXX | 15.0% | 4.0% | −11.0 | chips cooling (decay) + engine values the chokepoint (ASML), not the diversified basket |
| AMZN | 7.0% | 12.5% | +5.5 | application-dominance axis corrects an old voice-floor underweight |
| ASML | 4.0% | 7.0% | +3.0 | pure EUV chokepoint (raw S1 88), engine wants it heavier |
| COPX | 4.5% | 7.5% | +3.0 | physical-scarcity axis re-rating |
| LLY | 13.0% | 13.5% | +0.5 | now engine-justified (dominance 68), no longer a hand-override |
| SGOV | 5.5% | 6.0% | +0.5 | cash residual |
| GLW | 9.0% | 7.5% | −1.5 | cooling with the semi complex |

One-way turnover: **12.5%**.

## Mechanics
- **Rebalance vs drift:** the cron (`daily-cron.cjs` line 1289) fires the rebalance branch when the prior snapshot's `portfolio_version` ≠ the code's `PORTFOLIO_VERSION`. Since the ticker set was unchanged, the version bump (`v3.0-themes` → `v3.0-themes.1`) is what forced the reset. Fires once, then drifts on price.
- **Silver is dual** in the engine (SLV_M monetary + SLV_P physical) but collapses to a single **SLV** row in the live book.
- **Regenerate** this book via the offline engine: `python3 rescore_current_v3.py` (four-axis), then freeze with `patch_base_portfolio_4axis.py`.

## Standing watch
- **FLNC** — only corroborated ZaStocks candidate (Visser holds Fluence); ~+4.9% below its 200-DMA → watch, not a seat.
- **BTC / silver 200-DMA reclaim** — the trigger that uncaps the monetary sleeve and rotates the book mechanically.
