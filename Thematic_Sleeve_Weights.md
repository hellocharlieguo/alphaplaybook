# AlphaPlaybook — Thematic Sleeve Weights

**Live book:** `2026-07-15-v3.3-coresat` · frozen 2026-07-15 · 14 holdings
**Construction:** top-down (themes → pillars → names) with a **core-satellite** structure.

---

## The live book (v3.3)

| Name | Weight | Theme | Role |
|---|---:|---|---|
| AIPO | 16.0% | AI Compute | **CORE** — power-infrastructure basket |
| SOXX | 12.0% | AI Compute | **CORE** — broad semiconductor basket |
| LLY | 10.0% | AI Application | app anchor (50/50 with AMZN) |
| AMZN | 10.0% | AI Application | consumer-agent platform (50/50 with LLY) |
| SKHY | 8.0% | AI Compute | memory conviction — SK Hynix HBM pure-play |
| ASML | 7.0% | AI Compute | satellite — EUV monopoly |
| SLV | 7.0% | Monetary Scarcity | silver (dual monetary + physical) |
| HOOD | 6.0% | Tokenization | financial rails |
| SGOV | 6.0% | Cash | T-bills / dry powder |
| GLW | 4.5% | AI Compute | satellite — optical fiber (Corning) |
| IBIT | 4.0% | Monetary Scarcity | bitcoin |
| GLDM | 4.0% | Monetary Scarcity | gold |
| COPX | 3.0% | AI Compute | satellite — copper miners |
| ETHA | 2.5% | Tokenization | ethereum |
| | **100.0%** | | |

**Sleeve mix:** AI Compute 50.5 · AI Application 20.0 · Monetary Scarcity 15.0 · Tokenization 8.5 · Cash 6.0

---

## The core-satellite structure (why the book looks like this)

**Cores = diversified baskets, sized biggest.** AIPO (power) and SOXX (semis) are the two largest holdings. The logic is *early-innings breadth*: when the winners within a theme aren't yet decided, own the basket as the anchor rather than betting the sleeve on single names. This is a deliberate flip from the earlier "concentrate the resolved chokepoint" stance.

**Satellites = specific chokepoints, additive to the cores.** ASML, SKHY, GLW, COPX are concentrated tilts, each chosen because SOXX does **not** meaningfully cover it:
- **ASML** — EUV lithography monopoly; Amsterdam-listed, ~absent from SOXX's US index. The one semi chokepoint the basket doesn't give you.
- **SKHY** — SK Hynix (50–70% of global HBM); Korean, not in SOXX. Carries the memory conviction.
- **GLW** — Corning optical fiber; a materials name, not in the semi basket.
- **COPX** — copper miners; not a semiconductor holding.

**Removed as redundant:** MU (~9% of SOXX) and MRVL (~4.9% of SOXX) were dropped as standalone names — SOXX now carries that exposure. Effective memory ≈ SKHY 8 + SOXX's Micron slice ≈ 9.1%.

**Core-satellite ordering holds:** AIPO 16 > SOXX 12 > all satellites (SKHY 8, ASML 7, GLW 4.5, COPX 3).

---

## Key decisions embedded in v3.3

- **S4 signal removed** (option-C composite weights: S1 .30 / S2 .30 / S5 .20 / S6 .10 / conv .10).
- **Memory is a different cycle** — AI/agentic demand is secular, not the old commodity boom-bust. Micron's Q3'26 gross margin hit a record 84.9% (validated); the shortage narrative is data-confirmed, not just conviction.
- **ASML boosted 5→7** — the monopoly kept screening underweight under pure severity scoring because severity measures "binding now," not "irreplaceable." The two-lens engine is structurally blind to moat; ASML's size is a deliberate override reflecting that.
- **Scarcity held at theme level (15%)** despite the silver/BTC selloff — conviction is set top-down, the entry-pause is a within-theme timing note (weight returns on 200-DMA reclaim).

---

## Standing watch list

- **BTC / silver 200-DMA reclaim** — key trigger; uncaps the monetary sleeve.
- **VST / CEG** — power 2nd-seat candidates (note: both already inside AIPO; a standalone seat = deliberate overweight).
- **TEM vs PLTR** — AI-Application 2nd-seat, head-to-head on a reclaim.
- **DRAM ETF** — alternative memory vehicle (SK Hynix + Samsung + Micron) if concentrating SKHY feels too rich; carries ~14% cash drag.
- **SKHY re-score ~Sept** — seated on thesis only (3-day-old ADR, no technicals); validate entry once it has price history.

---

## Notes

- Weights drift daily on price; reset to these targets on a `PORTFOLIO_VERSION` change or ticker-set change.
- SKHY carries no technicals yet (listed 2026-07-10) — thesis-seated, S5 neutral until ~50 trading days.
- Pillar weights come from the two-lens backbone (severity × stage, no-vol); name splits within contested pillars from the composite engine. See `Weekly_Workflow_v2.docx`.
