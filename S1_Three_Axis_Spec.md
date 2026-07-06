# S1 Four-Axis Redesign — Spec

**Status:** Design locked & BUILT (offline) 2026-07-05. The engine (config block + `s1_axes.py` + `rescore_current_v3.py`) is validated in-repo; `score_ticker` and the live cron are untouched. The live `BASE_PORTFOLIO` still holds the pre-four-axis frozen book until a rescore is frozen.

**Motivation:** the old S1 conflated two spines (AI bottleneck + monetary scarcity) into one hand-set 0.25-weight score. That single number was the source of every distortion we traced: application names structurally capped, hard money inflated but weight-inert, COPX becoming a weight sink, and no forward inflation response anywhere in the engine. The fix is to split S1 into **four independent axes**, each aging on its own clock, so the bottleneck can fade with the AI cycle while the scarcity anchors persist.

S1 keeps its **0.25 composite weight**. The composite formula is unchanged:
```
composite = S1·0.25 + S2·0.20 + S5·0.20 + S4·0.15 + S6·0.10 + Conv·0.10
```
What changes is how each name's S1 is derived.

---

## The three axes

### Axis 1 — Bottleneck (decays with the AI cycle)

**Names:** AIPO, SOXX, GLW, ASML (AI-compute bottleneck).

**Raw scores:** AIPO 85 · SOXX 70 · GLW 80 · ASML 88.

**Clock — stage-decay** as the cycle rotates up the stack (electrons → tokens → agents):

| stage | multiplier |
|---|---|
| binding | ×1.00 |
| working | ×0.92 |
| cooling | ×0.80 |
| exhausted | ×0.60 |

**Current H2-2026 state ("scenario C"):** power (AIPO) is still binding ×1.00; chips (SOXX / GLW / ASML) are cooling ×0.80 — the semis are cooling precisely because the buildout's growth is priced in. Effective S1: AIPO 85 · SOXX 56 · GLW 64 · ASML 70.

This axis is meant to *fade* over the cycle. That's correct — you don't need a permanent bottleneck score for chips that are being commoditized.

### Axis 2 — Monetary Scarcity (persistent, CPI-triggered)

**Names & scores:** IBIT 88 (hardest supply cap, most debasement-levered) · GLDM 85 (central-bank structural bid, purely monetary) · SLV_M 58 (silver's *monetary* half — real but weaker than the pure plays) · ETHA 40 (tokenization-monetary hybrid).

Baselines are **permanent and high** — scarcity is a multi-year structural conviction — but **weight-inert while paused below the 200-DMA**. A high score on a paused name changes the ENTER/WATCH label, not the weight.

**Trigger — CPI, via a graded pause-cap relaxation. NO score multiplier.**

> The score multiplier was dropped deliberately. With baselines already ~90, any multiplier ≥ ~1.11 pins the top names to the 100 ceiling and destroys the silver > BTC > gold ordering, while adding almost no sleeve weight — the pause-cap relaxation already does ~90% of the debasement response. The multiplier was acting on the wrong variable (the score, which is a *permanent conviction*) instead of the cap (how much you're *allowed* to hold, which is what should be regime-dependent).

**Cap-relax schedule** (applied to each monetary name's current weight):
```
cap_multiple(CPI) = 1.0                      if CPI < 4%      (dormant, frozen at current)
                  = 1 + 0.75 · (CPI − 4)      if 4% ≤ CPI < 6.5%
                  = uncapped                  if CPI ≥ 6.5%
```
This is **forward** (works while names are still below their 200-DMA — you accumulate weakness rather than buying strength), **graded** (scales with how hot inflation runs, not a cliff at 4%), and **ordering-preserving** (scores untouched, so BTC > gold > silver-mon holds at every CPI level).

**Current H2-2026 state:** CPI < 4% → **dormant.** IBIT / GLDM / SLV_M all sit at their 3% paused floors, coiled but weight-inert.

### Axis 3 — Physical Scarcity (persistent floor + CapEx-triggered demand)

**Names:** COPX (copper) · SLV_P (silver's industrial half).

**Scores from a 4-dimension rubric:**

| dimension | weight | copper | silver |
|---|---|---|---|
| supply constraint (deficit, mine lead-time, grade decline) | 0.30 | 75 | 80 |
| buildout-demand leverage (AI capex / grid / EV / humanoid) | 0.35 | 85 | 70 |
| low substitutability | 0.20 | 65 | 55 |
| cross-stage breadth | 0.15 | 80 | 60 |
| **weighted score** | | **77** | **68** |

Copper's edge is demand-leverage + breadth (grid *and* EV ~80 kg *and* humanoid ~30-50 kg *and* data-center power). Silver's edge is a tighter supply deficit, but its demand is solar-concentrated and faces thrifting, so it scores below copper.

**Split (like silver's two axes): persistent structural floor + CapEx-triggered demand boost.** The buildout-demand-leverage dimension is the trigger-activated part; supply / substitutability / breadth are the persistent floor.

| name | floor (dormant) | boost | active score (CapEx fires) |
|---|---|---|---|
| COPX | 55 | +22 | 77 |
| SLV_P | 52 | +16 | 68 |

**Trigger — AI CapEx** (repurpose the existing `capex_multiplier` signal as the physical-demand trigger).

**Mechanical asymmetry (important):**
- **COPX is above its 200-DMA → free pool, score-driven.** The trigger only nudges its score (floor 55 → 77), which convexity compresses into a small swing (~9% dormant → ~13% on trigger).
- **SLV_P is below its 200-DMA → pause-gated.** The trigger *releases the pause*, producing a big swing (~3.5% dormant → ~9.5% on trigger).

So in a buildout surge, **silver-physical is the high-torque add** (it was suppressed by the pause) while **copper just firms up** (already held through the cycle).

---

## Dual-asset handling

- **Silver = two engine rows**, summed for execution/reporting: `SLV_M` (monetary 58, Axis 2) + `SLV_P` (physical floor 52 / boost 68, Axis 3). Total ≈ 6.5% dormant. Silver is the only genuinely dual scarcity asset — it responds to CPI on its monetary half and to CapEx on its physical half.
- **Copper = one row**, single-axis, floor 55 + CapEx boost → 77.

## Application layer — not a scarcity axis

LLY 48 / AMZN 42 / HOOD 55 keep **low S1 by design** — they profit *from* the bottleneck but aren't the bottleneck or hard money. Their conviction comes from S2 (stage/timing) and S4 (catalyst). A separate **application-dominance axis** is an orthogonal, **unbuilt** lever: LLY at S1 48 lands ~10% target; it would need ~72 on a dominance axis to justify its deployed 13%.

## Scarcity-sleeve cap

A ~45% cap on the combined scarcity sleeve (monetary + physical) is a **tail guardrail** for the both-triggers-fire regime (CPI ≥ 4% AND CapEx booming), where scarcity reaches ~55% uncapped and guts the AI-compute basket. It is **not binding in the dormant base case** (scarcity ~24%). Anchor the level to the old 26% theme-cap logic, scaled up because "scarcity" here is a super-sleeve of two axes.

---

## Regime behavior

**H2-2026 dormant base case** — neither trigger, chips cooling, copper floor 55:

| ticker | axis | target | deployed |
|---|---|---|---|
| AIPO | bottleneck | 18.0% | 18.0 |
| GLW | bottleneck | 8.0% | 9.0 |
| ASML | bottleneck | 7.5% | 4.0 |
| SOXX | bottleneck | 4.0% | 15.0 |
| LLY | app-dominance | 13.5% | 13.0 |
| AMZN | app-dominance | 12.5% | 7.0 |
| HOOD | app-dominance | 9.0% | 9.0 |
| COPX | physical | 7.5% | 4.5 |
| IBIT | monetary | 3.0% | 3.0 |
| GLDM | monetary | 3.0% | 3.0 |
| SLV_M | monetary | 3.0% | (6.5 SLV) |
| SLV_P | physical | 3.5% | (6.5 SLV) |
| ETHA | monetary | 2.5% | 2.5 |
| SGOV | cash | 5.0% | 5.5 |

Sleeves: AI-compute **37.5%** · app-token **35%** · scarcity **22.5%** · cash **5.0%**. (Silver total = 6.5%.)

### Regime behavior (four-axis book)

| regime | scarcity | AI-comp | app/tok | BTC | gold | SLV_P | COPX | LLY | AMZN |
|---|---|---|---|---|---|---|---|---|---|
| BASE (neither) | 22.5% | 37.5% | 35.0% | 3.0 | 3.0 | 3.5 | 7.5 | 13.5 | 12.5 |
| CPI debase 6% | 34.5% | 31.0% | 29.5% | 7.5 | 7.5 | 3.5 | 5.5 | 12.0 | 10.5 |
| CPI deep 6.5% (uncap) | 45.0%\* | 27.4% | 23.1% | 17.1 | 14.2 | 2.8 | 3.3 | 10.0 | 8.4 |
| CapEx surge | 31.0% | 33.0% | 31.0% | 3.0 | 3.0 | 7.5 | 12.0 | 12.5 | 11.0 |
| BOTH fire | 45.1%\* | 27.9% | 22.2% | 15.9 | 12.8 | 3.5 | 7.1 | 9.7 | 8.0 |

\* = 45% scarcity cap binds. The app layer *funds* the scarcity surge — LLY/AMZN release weight (13.5→10, 12.5→8.4) into the debasement bid rather than blocking it. No crowd-out; the cap catches only the genuine tail.

**CPI debasement (CPI ≥ 4%, buildout dormant):** monetary sleeve wakes via cap-relax. BTC 18 / gold 15.5 lead, silver-mon follows at ~6, physical unchanged. Scarcity → ~53%.

**CapEx surge (buildout booms, CPI < 4%):** physical sleeve wakes. Silver-physical surges (3.5 → 9.5, pause release), copper firms (9 → 13). BTC/gold don't move. Scarcity → ~32%.

**Both fire:** scarcity → ~55% uncapped → **apply the 45% cap** (excess reflows to AI/app; AIPO recovers to ~21%).

---

## Drift vs the deployed book (four-axis)
- AMZN 7 → 12.5 — application-dominance axis corrects the old voice-floor underweight.

- SOXX 15 → 4 — discretionary core-basket overweight; engine sheds it as chips cool AND the app layer bids weight away.
- COPX 4.5 → 7.5 — physical-axis re-rating.
- LLY 13 → 13.5 — **now engine-justified** via the application-dominance axis (was 10 pre-axis).
- ASML 4 → 7.5 — engine wants the pure chokepoint heavier.

---

## Config wiring (draft — for the build, not yet applied)

Replace `two_spines` in `signal_model_config.json` with a `three_axes` block:

```json
{
  "three_axes": {
    "bottleneck": {
      "names": ["AIPO", "SOXX", "GLW", "ASML"],
      "stage_decay": { "binding": 1.00, "working": 0.92, "cooling": 0.80, "exhausted": 0.60 },
      "current_stage": { "AIPO": "binding", "SOXX": "cooling", "GLW": "cooling", "ASML": "cooling" }
    },
    "monetary_scarcity": {
      "names": ["IBIT", "GLDM", "SLV_M", "ETHA"],
      "trigger": "cpi",
      "multiplier": null,
      "cap_relax": { "floor_cpi": 4.0, "slope_per_pt": 0.75, "uncap_cpi": 6.5 }
    },
    "physical_scarcity": {
      "names": ["COPX", "SLV_P"],
      "trigger": "capex",
      "floor": { "COPX": 55, "SLV_P": 52 },
      "boost": { "COPX": 22, "SLV_P": 16 }
    }
  },
  "dual_assets": {
    "SLV": { "monetary_row": "SLV_M", "physical_row": "SLV_P", "sum_for_execution": true }
  },
  "scarcity_sleeve_cap_pct": 45
}
```

**Build steps when green-lit:**
1. Add the `three_axes` block + rubric to `signal_model_config.json` and the scoring doc.
2. Wire `macro_signals.regime` (CPI, currently display-only) → the monetary cap-relax.
3. Wire `capex_multiplier` → the physical floor+boost.
4. Teach the engine to score silver as two summed rows (`SLV_M` + `SLV_P`).
5. Regenerate the book through `rescore_current_v2.py` so it's reproducible; diff vs the live book before any cron push.

---

## Open decisions (deferred)

- **App-sleeve cap** — the application layer sits at ~35% dormant with NO cap (parallel to the 45% scarcity cap). Not binding in base/debasement (app releases weight when scarcity fires), but a strong-application regime could push it higher. A ~30-32% cap would guardrail the LLY/AMZN flagship pair. **Not yet set.**
- **Scarcity cap level** — locked at 45%; binds only in deep-debasement / both-fire (a tail brake, confirmed).
- **The first freeze** — this four-axis book is a large rebalance vs deployed (SOXX 15→4, AMZN 7→12.5, ASML 4→7.5, COPX 4.5→7.5). Stage deliberately.

## Status
- **BUILT & validated in-repo 2026-07-05:** all four axes, config block, s1_axes.py, rescore_current_v3.py. score_ticker + cron untouched.
- Live `BASE_PORTFOLIO` still holds the pre-four-axis frozen book until a rescore is frozen.
