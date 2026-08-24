# 2026-08-24 — v3.4 trend-first frozen to live

**Version:** `2026-07-15-v3.3-coresat` → `2026-08-24-v3.4-trendfirst`
**Holdings:** 14 → 12
**Canonical:** `v34_worksheet_2026-08-24.html` · **Spec:** `Trend_First_Spec.md`
**Method locked:** 2026-08-23 · **Book frozen:** 2026-08-24

This is a **method change**, not a rebalance. Performance before and after this
date is not continuous and must stay version-segmented. The composite
(S1/S2/S5/S6/convergence) no longer exists.

---

## Weights

| ticker | v3.4 | v3.3 | Δ | trend |
|---|---:|---:|---:|---|
| LLY | 13.4 | 10.0 | +3.4 | AI Applied |
| AMZN | 13.3 | 10.0 | +3.3 | AI Applied |
| IBIT | 12.5 | 4.0 | +8.5 | Monetary |
| GLDM | 11.5 | 4.0 | +7.5 | Monetary |
| ETHA | 9.6 | 2.5 | +7.1 | Tokenized Rails |
| HOOD | 8.3 | 6.0 | +2.3 | Tokenized Rails |
| SLV | 6.4 | 7.0 | −0.6 | Monetary |
| AIPO | 6.3 | 16.0 | −9.7 | AI Buildout |
| GLW | 5.0 | 4.5 | +0.5 | AI Buildout |
| ASML | 5.0 | 7.0 | −2.0 | AI Buildout |
| SOXX | 4.6 | 12.0 | −7.4 | AI Buildout |
| COPX | 4.1 | 3.0 | +1.1 | AI Buildout |

Trends: Monetary 30.4 · AI Applied 26.7 · AI Buildout 25.0 · Tokenized 17.9 · Cash 0.0

| trend | derived timing | conviction | breadth (N_eff) | score |
|---|---:|---|---:|---:|
| AI buildout | 0.904 | certain | 1.75 of 5 | 1.585 |
| AI applied | 0.920 | strong | 2.00 of 2 | 1.689 |
| Tokenized rails | 0.820 | **strong** | 1.50 of 2 | 1.131 |
| Monetary | 1.000 | certain | 1.92 of 3 | 1.920 |

## Seat decisions logged

- **SKHY** (8.0% → 0) — retired. Unscoreable: no SMA50 until ~2026-09-18, no
  SMA200 until ~2027-04. Also the book's highest single-position compliance
  risk (new ADR, thin liquidity). Removing it reduces that exposure.
- **SGOV** (6.0% → 0) — retired. The v3.4 cascade has no cash row; the 6% floor
  was a v3.3 construction choice. The `portfolio['SGOV']` cash-floor guard in
  `buildPortfolio()` was removed in the same commit — leaving it would
  dereference `undefined` and kill the nightly run.
- **MU, WDC** — dropped 2026-08-23 on measured redundancy (MU 0.82 correlation
  to SOXX and genuinely ~9% of it). Logged here as the freeze that enacts them.

## Classification changes this cycle

- **Tokenized rails conviction `forming` → `strong`.** The standing gate was an
  observable cadence shift rather than an announced one. Visser announced weekly
  crypto content for September on 8/15 and **launched it early on 8/23**:
  *"The crypto stuff will be a video and papers that come out probably weekly."*
  Corroborating: Clarity Act pressure at the White House crypto event, Genius Act
  rulemaking comment 8/17, Treasury Secretary quoting Satoshi, Druckenmiller 13F
  into crypto/Hyperliquid, his 46-name tokenized index now positive on the year.
  Effect: ETHA +1.0, HOOD +0.9, everything else −0.1 to −0.3.
- **LLY voice flag cleared** (documentation only, no rung change). Visser 8/23:
  *"I moved into Eli Lilly, which made new all-time highs this week"*; *"Eli Lilly
  will be the biggest company in 5 years."* Timing held at `working` because
  *"I think that is starting"* is working, not binding. The `NO VOICE SUPPORT`
  roster falls from ASML/COPX/LLY (23.0%) to **ASML/COPX (9.1%)**.
- **No sub-theme timing changes.** Visser's crowding call (*"the physical part of
  AI has been discounted, everyone's long it"*, *"the fireworks show is over"*)
  had no sub-theme to land on, and trend timing is derived, so it correctly moved
  nothing. First live test of that design.
- **Wave held at `coding agents`**, third consecutive week.

## Settings shipped as-is — each one line to reverse

- **Hard-money sleeve cap OFF.** GLDM+IBIT+SLV = **30.4%** against a 15% cap that
  is defined in the worksheet but `on:false`. Turning it on would reflow ~15pp
  (IBIT → 6.2, GLDM → 5.7, SLV → 3.1; AMZN/LLY → ~16.9 each).
- **No cash line.** Cash 6.0% → 0.0%.

## Known limitations at freeze

- **Technicals are Friday 2026-08-21 closes.** IBIT sits +0.9% over its 200-DMA,
  GLDM +1.6%, ETHA +1.7% — **30.3% of the book is one session from an S5 band
  change**. An IBIT 200-DMA loss moves it 12.5 → ~10.2 (S5 56→43, band 0.85→0.60).
  Contained within Monetary, since S5 does not feed trend score.
- **Layer 2 was dark this cycle.** The `8_17-8_24` ZaStocks file is a byte-identical
  duplicate of the `8_10-8_17` window; no new Camillo since 8/9. Every L2 input is
  carried, not refreshed. The freeze rests entirely on Visser.
- **Trailing 1-year return excluded by design** — IBIT is down ~32% on the year and
  still reads stretched.
- **N_eff is backward-looking**; correlations tighten as the window shortens
  (AIPO–SOXX 0.86 at 1y → 0.91 at 3m).

## Still open

- `Methodology.tsx` is stale **and public-facing** — it documents the retired
  composite (S4 Catalyst w:15, Aschenbrenner as a convergence lens). Now
  materially wrong about a live, frozen book. Needs its own pass.
- `probe_source.cjs` may still be a macOS Finder stub (`probe_source.textClipping`).
- SIL (silver miners) — new Visser nomination 8/23, *"SIL is much bigger"*.
  Watch-not-seat: needs technicals, a `corr_matrix.json` refresh, and a coverage
  test against SLV and COPX before it can enter.
