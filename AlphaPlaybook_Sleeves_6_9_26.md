# AlphaPlaybook Sleeves — 6/9/26 Full Rescore

**Supersedes:** `AlphaPlaybook_Sleeves_6_1_26.md` (5/28 rescore, 6/1 Rule-B reweight)
**Engine:** Decision Engine **v2.3** (`signal_engine.py` + `portfolio_normalizer.py` + `signal_model_config.json`)
**Evidence base:** 6/3 TFTC Visser · 6/6 Pomp–Visser · 6/7 Visser solo ("Fireworks Show Is Over") · 6/8 Camillo (Calum Johnson — methodology only, zero new tickers)
**Technicals:** 6/9 cron snapshot (Twelve Data 20/50/200 DMAs, RSI-14, trailing-1y) · CapEx regime GREEN (77% YoY, ×1.0)
**Reproduce:** `python3 rescore_final_6_9.py` (aggressive) · `python3 conservative_compact_v3.py` (conservative compact)

---

## Narrative shift this rescore prices in

1. **Hardware/power "fireworks show is over"** — rotation (not bear market), choppy 3–6 months, two-sided market. Power complex de-weighted to basket form.
2. **BTC bear market** (−50%, below 200-day by Visser's own definition; he nibbles the 200-week, says no need to be involved until the 200-day is reclaimed; buying ETH through the drop). Crypto-beta cut at the company end, hard-money paused-not-sold.
3. **New application leg: LLY** — "largest US company by 2030," peptides-as-API-keys; new ATHs; named across 6/6 + 6/7 + the paper.
4. **Energy hedge** — Visser bought XOM and CVX on 6/7 (Hormuz odds <50% normalize before October, oil migrating higher, >4% CPI regime); framed explicitly as defense, not doubles/triples.
5. **Batteries reaffirmed** — FLNC +44%, "a necessity," distinct from cooling power-gen. Protected from the cooling sweep; velocity-trimmed by the S5 ladder instead.
6. **>4% CPI regime = composition rotation, not cash raise** — negative real yields make cash the wrong defense; cash floor stays 5%.

---

## AGGRESSIVE sleeve — LIVE (k=2.81, 16 holdings + cash)

| # | Ticker | Composite | S5 | Weight | Gate / note |
|---|--------|----------:|---:|-------:|-------------|
| 1 | SLV | 79.7 | 60 | **18.0** | Anchor. Below-200 held (no add); exit-exempt hard money |
| 2 | GLW | 71.2 | 52 | **9.5** | Optical; parabolic-language yellow flag stands (S5 corrected ~50) |
| 3 | LLY | 68.0 | 80* | **7.0** | NEW — application satellite (S1=45 by design: satellite, not spine) |
| 4 | IBIT | 75.5 | 60 | **7.0** | PAUSED below-200 (frozen at current weight; paused ≠ sold) |
| 5 | GLDM | 74.6 | 60 | **6.5** | PAUSED below-200 |
| 6 | HOOD | 66.0 | 60 | **6.0** | Camillo convergence + mom.up un-pause |
| 7 | AIPO | 65.3 | 58 | **5.5** | Power theme now basket-only |
| 8 | XLE | 65.2 | 70* | **5.5** | NEW — energy hedge (basket chosen over XOM+CVX singles, 6/9 decision) |
| 9 | ENTG | 64.0 | 72 | **5.0** | S2 still working |
| 10 | SGOV | — | — | **5.0** | Cash floor |
| 11 | BE | 63.4 | 38 | **4.5** | Voice floor ARMED (Camillo), not bound |
| 12 | COPX | 62.6 | 62 | **4.5** | Structural cross-stage hold (S3 grid + S5 copper) |
| 13 | WGMI | 60.1 | 38 | **3.5** | Reclaim optionality (highest-beta 200-day-reclaim expression) |
| 14 | FLNC | 59.7 | 38 | **3.5** | Conviction lifted (S2 70/S4 65 per 6/7); velocity penalty caps size |
| 15 | MRVL | 59.9 | 31 | **3.5** | "Doubles and triples" conviction vs +290% 1y — brake-sized |
| 16 | ETHA | 67.7 | 60 | **3.0** | PAUSED below-200; Visser accumulating ETH through the drop |
| 17 | XSD | 56.4 | 48 | **2.5** | Index-beta optionality — KEPT (6/9 decision) |

\* hand-set legacy S5 (no cron technicals at rescore time) — retires automatically at next rescore now that the cron computes DMAs/RSI for all holdings.

**Theme shape vs 6/1:** power/infra 32.0 → **21.5** · crypto-beta 22.5 → **19.5** · energy 0 → **5.5** · application 0 → **7.0** · monetary core 24.5 (unchanged) · optical/compute 15.5 → **20.5** · cash 5.5 → 5.0. Sub-3.5% tail: ~23% → **16%** of capital.

### Exits (6/9, all approved)

| Ticker | 6/1 weight | Mechanism | Rationale |
|--------|-----------:|-----------|-----------|
| **CEG** | 7.5% | **RULE C** (first firing) | Trim gate (−16 pts) + accelerant (below-200 + mom-down) + theme held via AIPO (which holds CEG). A broken single name whose theme is owned diversified is clutter, not a position. |
| **TXN** | 4.5% | Conviction exit | Thinnest Visser linkage in the power set (S2=60, 1 lens); rode the theme, never a named conviction; partial look-through via XSD/AIPO. |
| **AMZN** | (draft only) | Evidence-gate fail | Thesis rested on stale Camillo material; 6/8 appearance added zero tickers; Visser's application conviction is LLY. Never entered. |

---

## CONSERVATIVE sleeve — COMPACT redesign (OFFLINE BY DESIGN, 9 tickers, k=0.81)

Theme spec (C, 6/9): metals / BTC proxy / oil / pharma / AI / cash. Sub-10 by construction. Drops the entire power complex (~40.5% of the 19-name form) — coherent with the cooling call. Registered as `conservative_compact` variant (target_top 16% — the 11% top calibrated for 19 holdings degenerates to flat weights at 9 names). Restricted-name substitutions honored (no IBIT/WGMI/AIPO/ETHA; BTC proxy = MSTR).

| # | Ticker | Theme | Composite | Weight | Gate / note |
|---|--------|-------|----------:|-------:|-------------|
| 1 | GLW | AI — optical | 71.2 | **16.0** | |
| 2 | LLY | Pharma / application | 68.0 | **14.5** | |
| 3 | XLE | Oil | 65.2 | **13.5** | |
| 4 | COPX | Copper | 62.6 | **12.0** | |
| 5 | SGOV | Cash | — | **12.0** | 12% floor |
| 6 | MRVL | AI — optical | 59.9 | **11.0** | Velocity-trimmed |
| 7 | SLV | Silver | 79.7 | **11.0** | PAUSED (just below 200-DMA: $58.99 vs $60.87) |
| 8 | GLDM | Gold | 74.6 | **6.0** | PAUSED (just below 200-DMA: $84.25 vs $87.32) |
| 9 | MSTR | BTC proxy | 58.7 | **4.0** | MANUAL pause-cap (no technicals yet; BTC −50% ⇒ certainly below 200; conservative unpause = reclaim_200dma). Remove the manual cap once technicals exist. |

**Known structural quirk (intentional):** the top of the book is gate-driven, not conviction-driven — SLV is the highest composite but the conservative entry-pause (reclaim-the-200 to unpause) freezes it at the prior 11%. On reclaim, SLV re-solves to the 16% top slot and GLDM lifts — the sleeve gets MORE metals-heavy on confirmation, the right direction of travel.

---

## Locked decisions this session

1. **Rule C** (engine v2.3, `gates.rule_c`): accelerant fired + theme ETF-covered ⇒ **EXIT, not floor**. Coverage read from `coverage_discount.redundant_by_sleeve` (shared source of truth with Rule B) or the `etf_redundant` input flag. Voice-floor names exempt. Unit-tested: fires on CEG conditions; exempts voice names; skips uncovered names and non-accelerant cases.
2. **Voice floor 3% LIVE** — `weight = max(engine_weight, 3.0)` for `voice_conviction=True` names; exit-gate exempt; evidence-gated to recent reaffirmation. BE armed (not bound this run).
3. **TXN + AMZN conviction exits** approved with rationale above.
4. **XSD kept** at 2.5% as index-beta optionality.
5. **XLE over XOM+CVX** — one-line energy hedge for simplicity (the two supermajors are ~one thesis in two lines).
6. **Rebalance convention:** trade to engine target weights at each rescore, including paused names — the pause is encoded upstream in the weights (frozen at current weight), so trading to targets *implements* the pause. Taxable guidance unchanged: move on >3–4% target changes, tolerate small drift (config `turnover_note`).

## Open flags / next

- **BE Rule-B flag:** `etf_redundant=True` was not set for BE in the 6/9 runs (CEG exited regardless). Fold back in at next rescore, or rule that the voice floor supersedes Rule B for live-voice names. Effect if applied: BE ~−0.5–1%.
- **Hand-set S5 retirement:** LLY (80), XLE (70), MSTR (38) auto-retire next rescore — the cron now computes per-ticker DMAs/RSI/1y for the full book.
- **MSTR manual pause-cap** removal once its technicals flow.
- **Queue:** Cleveland nowcast wire-up → Kalshi migration (Polymarket→Kalshi + odds→S4) → Macro regime gate spec (FRED + nowcast + Kalshi 2-of-3, company-type multiplier, NOT a cash raise) → Phase 2.5 full both-sleeve rescore.
- **Radar:** Dell (Visser: one of the most important companies to watch — but hardware-top timing fails the add test); 800V DC thematic paper (~next week); MU re-entry $500 nibble / $400 aggressive.
