# AlphaPlaybook — Signal Engine Reference (S1–S6)

What every signal does, how they combine into a weight, and the four-axis S1 redesign (locked 2026-07-07). This is the offline Decision Engine that regenerates `BASE_PORTFOLIO`; the live cron holds the frozen output.

> **2026-07-09 — S4 (Catalyst) removed.** The near-term-catalyst slot was redundant with S1's monetary axis (every liquid Kalshi market that would have driven it — BTC/ETH/CPI — is a scarcity/debasement input S1 axis 2 already captures) and its level-multiplier form reintroduced the saturation bug axis 2 avoids. Its 0.15 was redistributed S1+S2 (option C): **S1 0.25→0.30, S2 0.20→0.30.** Labels are intentionally left S1/S2/S5/S6 (no renumber), so the composite skips S3/S4 and lists S5 before S6.

---

## How a weight is built

```
composite         = S1·0.30 + S2·0.30 + S5·0.20 + S6·0.10 + Convergence·0.10
                    ↓  × CapEx regime multiplier (green ×1.0)
weighting_score   = 45 + (composite − 45) · λ        ← Rule B: λ≈0.92 on single names
                                                        covered by a held ETF (ETFs & non-
                                                        covered singles exempt at λ=1.0)
                    ↓
weight            ∝ (weighting_score − 45)^k          ← k solved each run so the top
                                                        *addable* name hits target_top = 18%
                    ↓  then apply, in order:
                    pause caps (held below-200 hard money frozen at current weight)
                    voice floors (Visser/Camillo names ≥ floor_pct, never dropped)
                    5% cash floor (SGOV) · 2% minimum position · redistribute residual
```

Two distinctions to keep straight:
- **composite** sets the ENTER/WATCH/EXIT **action** and the eligibility gate (composite < 45 → dropped).
- **weighting_score** (composite after the Rule-B haircut) is what actually feeds the convexity curve. That's why a covered single name can show a composite–WScr gap but keep its WATCH label.
- **A high score ≠ high weight.** A paused-below-200 name (or a capped one) can score ENTER yet be weight-inert — the cap binds before the score. This is why "hard money too high" doesn't distort the dormant book.

---

## S1 — Bottleneck / Scarcity centrality · weight 0.30 (heaviest)

The thesis anchor: how central is this name to the structural story. Pure judgment (nothing computes it). Because it's the heaviest input, a re-classification swings the whole composite.

**S1 is FOUR independent axes** (bottleneck, monetary, physical, application-dominance), each on its own clock (replacing the old single conflated score; dominance axis added in the 7/7 freeze). S1 carries 0.30 (raised from 0.25 when S4 was removed 2026-07-09); what changed with the axis redesign is how each name's S1 is derived. See `S1_Three_Axis_Spec.md` for the full spec.

### Axis 1 — Bottleneck (AI compute) — *decays with the cycle*
Names: AIPO, SOXX, GLW, ASML. Raw scores: AIPO 85 · SOXX 70 · GLW 80 · ASML 88 (ASML highest = EUV monopoly, the literal chokepoint; SOXX lowest = diversified basket dilutes the bottleneck signal).

Stage-decay multiplier as the cycle rotates up the stack (electrons → tokens → agents):

| stage | ×mult |
|---|---|
| binding | 1.00 |
| working | 0.92 |
| cooling | 0.80 |
| exhausted | 0.60 |

The 0.60 floor is deliberate — an exhausted bottleneck **fades to a small residual hold, it isn't force-sold** (×0 would zero the 0.30 slot and crater the composite to AVOID/EXIT). Whether a decayed name stays is then decided by S5/S2, not vetoed by S1 alone. Current H2-2026 state: power (AIPO) binding ×1.00; chips (SOXX/GLW/ASML) cooling ×0.80.

### Axis 2 — Monetary Scarcity — *persistent, CPI-triggered*
Names: IBIT 88 (hardest supply cap) · GLDM 85 (central-bank bid) · SLV_M 58 (silver's monetary half) · ETHA 40. Baselines are **permanent and high** but **weight-inert while paused below the 200-DMA**.

**Trigger = CPI, via a graded pause-cap relaxation — NO score multiplier.** (A multiplier on already-high baselines just saturates them to the 100 ceiling and destroys the silver>BTC>gold ordering; the cap-relax does ~90% of the work anyway.)
```
cap_multiple(CPI) = 1.0                    if CPI < 4%   (dormant, frozen at current)
                  = 1 + 0.75·(CPI − 4)      if 4% ≤ CPI < 6.5%
                  = uncapped                if CPI ≥ 6.5%
```
Forward (works below-200 — you accumulate weakness, not chase strength), graded, and ordering-preserving. Dormant sub-4%.

### Axis 3 — Physical Scarcity — *persistent floor + CapEx-triggered demand*
Names: COPX (copper) · SLV_P (silver's industrial half). Scores from a 4-dimension rubric (supply .30 / buildout-demand-leverage .35 / low-substitutability .20 / cross-stage-breadth .15): **copper 77, silver 68.**

Split into a persistent floor + a CapEx-triggered demand boost:

| name | floor (dormant) | boost | active (CapEx fires) |
|---|---|---|---|
| COPX | 55 | +22 | 77 |
| SLV_P | 52 | +16 | 68 |

Trigger = AI CapEx (the existing `capex_multiplier` signal). **Asymmetry:** COPX is above-200 (free pool, score-driven → small surge ~9→13); SLV_P is below-200 (pause-gated → big surge 3.5→9.5 when the trigger releases the pause).

### Silver & the application layer
- **Silver is dual** — two engine rows (SLV_M monetary + SLV_P physical), summed for execution. It's the only asset that responds to *both* triggers (CPI on its monetary half, CapEx on its physical half).
- **Application names now score on a 4th axis — Application-Dominance (BUILT, live in the 7/7 freeze).** A rubric (data-moat .30 / durability .25 / ai-efficiency .25 / TAM .20) gives LLY 68 / AMZN 60 / HOOD 61 — replacing the old hand-set lows (48/42/55) and giving LLY's deployed 13.5% an engine basis rather than a manual override. They profit *from* the bottleneck but aren't the bottleneck or hard money; S2 (stage timing) still carries much of their conviction. See axis 4 in `S1_Four_Axis_Spec.md`.

---

## S2 — Stage / Timing · weight 0.30
Where the theme sits in Visser's 5-stage cycle *right now*, and whether it's the binding stage. This is where the application layer earns its keep despite low S1 — LLY carries S2 90 because Visser is actively rotating up the stack. Stage 3 (Power + Silver) binding now; Stage 4 (Tokenization) forward catalyst; Stage 5 (Agentic/humanoids) 2027+.

## S5 — Entry Quality · weight 0.20 — *the only computed signal*
Auto-derived from live price / DMA / RSI — everything else is judgment, this is math. **Anti-momentum**: rewards good entries, penalizes stretched ones, so structural winners aren't bought at the top.
- Trend position off the 20/50/200-DMA ladder (riding above 50 ≈ 58 base; pullback below 50 ≈ 72, a better entry).
- Stretch-velocity penalty off **distance above the 50-DMA** (not trailing-1yr): ≥50%→−12 / 25–50%→−8 / 10–25%→−4 / <10%→0, ×0.5 for working themes. (This fix stopped hammering names up big on the year but consolidating near their 50-DMA.)
- RSI ≥ 70 guardrail kept separate (catches true verticality).
- Held-below-200 floor at 55 (paused names aren't force-sold on a bad tape).

## S6 — Valuation Risk · weight 0.10
A downside/crowding haircut — how much you're overpaying and how far it could unwind. Lower is safer; parabolic multiples score worse. Pairs with S5 to keep the book from chasing froth.

## Convergence — Cross-voice agreement · weight 0.10
Now **cross-voice** (Visser / Camillo / ZaStocks), computed upstream in `pull_candidates.cjs` from `BASE_PORTFOLIO` membership + the `voice_mentions` ledger (decay windows: Visser 120d / Camillo 75d / ZaStocks 45d; positive-conviction filter). Payout: 2 lenses → 60, 3 → 100. **ZaStocks is corroboration-only** — his leg counts only when Visser or Camillo also point at the name; he never seats a name alone and never trips a voice floor by himself. (Aschenbrenner dropped from the auto-count 2026-07-02.)

---

## Regime multipliers & guardrails (the "×, don't zero" family)

All of these are **graded haircuts with a floor above zero** — the engine fades conviction rather than forcing binary exits, which keeps it from whipsawing held positions on a single signal turning.

- **Stage-decay** (S1 bottleneck): ×1.0 → ×0.60 as the cycle ages. Hard money exempt.
- **CapEx multiplier**: portfolio-wide circuit breaker on the company/AI spine. Green ×1.0; steps down if AI capex collapses. Also serves as the physical-scarcity trigger.
- **Rule B (coverage discount)**: λ≈0.92 on single names covered by a held ETF. ETFs and non-covered singles exempt. This is the *only* term pushing back toward diversification — it's weak against a large bottleneck-centrality gap, which is why the engine tends to prefer concentrated chokepoints (ASML) over diversified baskets (SOXX).
- **CPI cap-relax** (S1 monetary): graded pause-cap relaxation, not a score change.

Only two things take a name to zero weight: the hard eligibility gate (composite < 45) and an explicit exit. Every multiplier floors above zero.

---

## Core principle

**Fix scores, not weights.** You move the thesis inputs (S1–S6) and the engine produces the weights. Overriding an output weight directly breaks the discipline — and the drift between the engine's book and the deployed book is the honest signal of where discretionary overrides live (e.g., SOXX's core-basket overweight, LLY's flagship premium).
