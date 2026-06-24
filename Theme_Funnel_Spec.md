# AlphaPlaybook — Theme Funnel Spec
*v2 — 2026-06-22. Derived from the six most recent Visser / Pomp-Visser pods (6/6 → 6/21).*
*Status: **design / target architecture** — not yet wired into the engine. The live engine still scores per-ticker composites; this is the Spec-C direction.*

---

## 1. Philosophy — why a funnel

The old engine blends voice and quant into one per-ticker composite (~70% qualitative / 30% quant) and the universe is "names Visser said." That makes **voice do two jobs at once** — pick the themes *and* pick the tickers — and lets a name ride convergence into a big weight on voice alone (the HOOD problem).

The funnel separates those jobs:

1. **Voice → themes.** Jordi is authoritative on *where the opportunity is* and how binding it is. Voice sets which themes exist and how much each gets.
2. **Quant → tickers within a theme.** For each live theme, take the *full* pure-play roster (not just names he named) and let entry-quality metrics pick and size the best 2–4.
3. **Weight = theme conviction × within-theme entry quality.** Voice sizes the theme; quant sizes the names inside it.

A name Jordi mentions is a *candidate*, not a mandate. Voice-naming demotes to a small convergence tiebreaker.

---

## 2. The six themes

| Theme | What it is | Status (6/22) |
|---|---|---|
| **AI Hardware Bottleneck** | Optical + chemicals + **memory** — the AI compute input layer | working now |
| **Power & Infrastructure** | Grid / utilities / data-center power / nuclear | binding now |
| **Physical Scarcity** | Silver + copper — AI/robotics/electrification **demand** (picks-and-shovels, not a hedge) | binding buildout |
| **Tokenization** | On-chain rails, stablecoins, exchanges | upcoming (~July) |
| **AI Application** | AI applied to real industries (healthcare) | working / emerging |
| **Monetary Scarcity** | Gold + Bitcoin — pure debasement hedge | paused / accumulate |

**Two reclassifications baked in (6/22):**

- **Silver moved out of monetary scarcity into Physical.** Jordi's silver thesis is the same demand story as copper — solar, solid-state batteries, robotics/hardware buildout ("I want more silver… 10×"), not debasement. Gold stays purely monetary; that contrast is what makes the split clean.
- **Memory folded into the bottleneck theme** (it's the same compute-input bottleneck as optical/chem; ENTG is directly levered to the NAND cycle). Critically, memory's status is **working, not exhausted** — Jordi's own read is "I was too early, it's still going" (sold Micron in the 600s, now past 1000). So memory gets the **×0.5 working-theme** stretch discount, not the full peaked penalty.

---

## 3. Theme weighting — how the numbers are derived

Two signals: **transcript frequency** (objective, biased) and **conviction tier** (judgment, grounded in language).

### 3a. Frequency (de-biased)
Keyword mentions across the 6 pods, **excluding the 6/6 "Why is Bitcoin Crashing?!" special** (an outlier that distorts the steady state):

| Theme | mentions (ex-6/6) |
|---|---|
| Bottleneck (optical+chem+memory) | 110 |
| Power | 66 |
| Tokenization | 61 |
| Monetary | 48 |
| AI App | 34 |
| Physical | 25 |

**The frequency trap (critical):** raw counts misrank conviction. Bitcoin gets huge airtime *because it's crashing*; silver gets few words *because the thesis is simple and he's just buying it*. Memory volume is real (44 mentions in the 6/7 Micron deep-dive). So frequency sets a floor; the conviction multiplier corrects per-mention intensity.

### 3b. Conviction multiplier (per-mention, from the language)

| Theme | × | rationale |
|---|---|---|
| Power | 1.00 | binding, consistent, actively buying energy/grid |
| Bottleneck | 1.10 | working spotlight (ENTG paper, NAND); memory still-working |
| **Physical** | **2.40 — OVERRIDE** | picks-and-shovels for the same buildout; low transcript volume understates it. Bumped from the evidence-only 1.55 to bring it near Power. *This is a deliberate conviction override, not evidence-derived.* |
| AI App | 0.90 | modest, fading in latest pods |
| Tokenization | 0.85 | real but forward (July), accumulating ETH on the dip |
| Monetary | 0.60 | paused hedge, "bear market / below the 200-day," DCA only |

### 3c. Theme cap
**No single theme exceeds 26%** (new rule, theme-level analog of the stock/ETF caps). Raw Bottleneck derived to ~36% — too concentrated, *especially* because the whole theme is extended (poor entries across the board). Capped to 26%; excess reflows proportionally to the other themes.

### 3d. Result — current theme weights

| Theme | weight |
|---|---|
| AI Hardware Bottleneck | 26.0% (at cap) |
| Power | 19.2% |
| Physical Scarcity | 17.4% |
| Tokenization | 15.1% |
| AI Application | 8.9% |
| Monetary Scarcity | 8.4% |

---

## 4. Theme → candidate rosters (the hand-curated universe)

Each ticker gets exactly **one** home (primary-theme rule) for sizing.

- **AI Hardware Bottleneck** → *optical/chem:* GLW · ENTG · COHR · MRVL · LITE · MKSI · AMAT — *memory:* MU · WDC · SNDK *(SK Hynix excluded — Korea/thin-OTC, not on Twelve Data)*
- **Power & Infrastructure** → AIPO (GRID+XLU) · VST · CEG · TLN · NRG · GEV · ETN · POWL · PWR · NVT · VRT · CCJ · URA · OKLO · SMR · FLNC · STEM
- **Physical Scarcity** → SLV · COPX
- **Tokenization** → HOOD · COIN · MSTR · CRCL · ETHA · WGMI
- **AI Application** → LLY · PLTR
- **Monetary Scarcity** → GLDM · IBIT

Overlap: IBIT is digital-gold (Monetary) *and* token base layer (Tokenization) — sized in Monetary only. COPX is industrial copper (Physical), not Monetary.

---

## 5. Within-theme selection & sizing

- **Selection:** rank the roster on entry quality (S5 ladder = DMA position + RSI + stretch-from-50DMA), keep the top **2–4**. Convergence is a small tiebreaker.
- **Sizing:** split the theme weight across live seats **proportional to s5** (entry quality). Better entry → bigger seat.
- **Entry gate:** a name well below its 200-DMA is entry-paused (no new add) unless Spec-A (held hard-money within ±3% of 200-DMA + voice conviction). Benched names → watches.

**Current S5 (6/22 pull, stretch rule):** GLW 58 · COHR 58 · ENTG 56 · MU 54 · SNDK 54 · WDC 47 · AIPO 58 · COPX 72 · SLV 60* · HOOD 47 · LLY 80 · IBIT/GLDM/ETHA 60* (*held-below-200 floor).

**Bottleneck = 4 seats:** GLW, COHR, ENTG (optical/chem) + MU (memory bellwether). MU was a close 4th (54 vs ENTG 56); given the theme was *broadened to include memory*, MU takes the 4th seat so all sub-buckets are represented. SNDK (54, +4800% yr) and WDC (47, highest RSI) stay watches — too stretched to add today.

> **Open rule:** within-theme sizing is pure entry quality, so COPX (clean pullback, 72) > SLV (below-200, 60) even though silver is the louder voice. If the higher-conviction name should lead its theme regardless of entry, blend conviction into the split.

---

## 6. Velocity / stretch rule (SHIPPED 6/22)

S5 velocity penalty keys off **distance above the 50-DMA**, not trailing-1yr. A structural winner sits far above its 200-DMA but near its 50-DMA the whole way up (GLW +243% but consolidating; SNDK +4800%), so trailing-1yr punished winners for winning. Stretch-from-50 only fires on a *recent* run away from trend.

- Bands (Medium): ≥50% → −12 · 25–50% → −8 · 10–25% → −4 · <10% → 0
- Theme discount: ×0.5 in working/binding themes (`s2 ≥ 60`), ×1.0 in peaked
- RSI ≥ 70 guardrail kept separate (catches true verticality)

Implemented via `patch_stretch_velocity.py` → `signal_model_config.json` (`gates.s5_ladder.velocity_penalty`) + `signal_engine.py`. No new data pull (derived from price + dma50). Candidate technicals pulled via `pull_candidates.cjs` (Node, reads `.env.local` `TWELVE_DATA_KEY`, no dotenv, built-in fetch, one `time_series` call/ticker; RSI14 = exact copy of cron `calculateRSI`).

---

## 7. Cap rules

- **Single-stock cap = 12%**, applied to **single stocks only**. **ETFs exempt** — already diversified baskets (why AIPO anchors Power uncapped; lets SLV/COPX/IBIT/GLDM/ETHA ride uncapped too).
- **Theme cap = 26%** — no single theme exceeds it; excess reflows to the other themes proportionally.
- **Paused cap:** held below-200 hard-money/crypto capped at current weight — hold or trim, can't add. Current: IBIT 7 · GLDM 6.5 · ETHA 3.
- **Undeployable theme weight → cash** (reserved dry powder; deployed when a watch graduates).

---

## 8. Current book (6/22) — 12 names + cash

| Name | weight | theme | note |
|---|---|---|---|
| AIPO | 19.2 | Power | ETF, full theme, uncapped |
| HOOD | 12.0 | Tokenization | single-stock cap; tiny overflow → cash |
| COPX | 9.5 | Physical | clean pullback entry |
| LLY | 8.9 | AI App | single live seat |
| SLV | 7.9 | Physical | below-200, accumulate |
| GLW | 6.7 | Bottleneck | clean entry, leads theme |
| COHR | 6.7 | Bottleneck | |
| ENTG | 6.4 | Bottleneck | |
| MU | 6.2 | Bottleneck | memory bellwether (4th seat) |
| IBIT | 4.2 | Monetary | paused |
| GLDM | 4.2 | Monetary | paused |
| ETHA | 3.0 | Tokenization | paused |
| SGOV | 5.1 | Cash | |

Notes: heavily accumulate-mode (IBIT/GLDM/ETHA paused, SLV below-200) — that's the tape, scarcity and crypto are below trend. AIPO at 19.2% is the top line but it's a diversified GRID+XLU basket, not single-name risk. The whole Bottleneck theme is extended right now (best entry is COHR/GLW at 58), which is why the theme cap matters — don't over-size into stretched names.

---

## 9. Watches (graduate on 200-DMA reclaim)

| Name | theme | status | condition |
|---|---|---|---|
| VST | Power | −1.7% below 200-DMA | 2nd power seat; relieves AIPO concentration |
| GEV / CCJ / VRT | Power | below 200-DMA | additional power seats |
| SNDK | Bottleneck | +59% stretch, RSI 73 | memory seat on a pullback |
| WDC | Bottleneck | +34% stretch, RSI 62 | memory seat on a pullback |
| COIN | Tokenization | −31% below 200-DMA | operator seat; reclaim 200-DMA AND out-score HOOD |
| PLTR | AI App | −25% below, RSI 34 | 2nd AI-App seat |
| MSTR / CRCL | Tokenization | TBD | needs technicals pulled |

---

## 10. Open decisions / next steps

1. **Within-theme copper-vs-silver** — pure entry (current, COPX>SLV) vs. blend conviction so the louder name leads.
2. **The two knobs** — theme cap (26%) and the Physical override multiplier (2.40) are the tunable judgment layers; everything else is evidence-derived.
3. **AIPO concentration** — 19.2% in one ETF; relieved when VST/GEV graduate into a 2nd power seat.
4. **Pull MSTR/CRCL** — so Tokenization has >1 live seat and HOOD's overflow can deploy.
5. **As-of consistency** — Bottleneck names are 6/22 technicals, the rest 6/9; re-pull the full book same-date before going live.
6. **Theme status maintenance** — re-derive as Jordi's emphasis shifts (CPI regime flip, tokenization starts working, memory peaks).
7. **Engine wiring** — target spec; live engine still per-ticker composites. Building the funnel = Spec C.
