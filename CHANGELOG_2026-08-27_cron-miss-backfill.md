# 2026-08-27 — Cron miss recovery: 2026-08-26 snapshot backfilled by hand

**Category:** data correction — performance record
**Scope:** `daily_snapshots` and `portfolio_holdings`, 2026-08-26 only
**Portfolio version:** `2026-08-24-v3.4-trendfirst` (unchanged; no rebalance triggered)

---

## What happened

The nightly cron did not fire on 2026-08-26. It was re-run manually on
2026-08-27 at 16:27:50 UTC (12:27 pm ET) — **during market hours**. Because
`TODAY` resolves to the ET calendar date, that run stamped itself `2026-08-27`
and captured **live intraday prices**, with Finnhub's `change_pct` measured off
the 08-26 close.

Net effect before correction:

- 2026-08-26 was absent from the table entirely.
- The 2026-08-27 row held a partial, mid-session move.
- Because thematic `portfolio_value` is a **compounded chain** off the stored
  prior value, the 08-26 session was structurally dropped. SPY is a pure price
  ratio against an inception price and self-heals across gaps; the thematic
  curve does not. A missed cron therefore biases alpha in one direction only.
- Thematic cumulative read **+1.10%** against a correct **+0.22%** — overstated
  by roughly **0.88 pp**, and would have stayed overstated on every subsequent
  day had it not been corrected before the next cron run.

## Reconstruction method

`portfolio_holdings.daily_change_pct` is Finnhub `((c - pc) / pc)` — a one-day
move from the prior close. For the missing day T with neighbours P (08-25) and
N (08-27):

```
close_T(t) = price_N(t) / (1 + chg_N(t)/100)
move_T(t)  = close_T(t) / close_P(t) - 1
move_T(pf) = SUM_t [ weight_P(t) * move_T(t) ]
```

Every input came from Supabase. **No external price API was called for any
holding.** Only the SPY leg required outside data (see below).

**Model validation.** The same formula reproduces the stored 08-27 chain:

| | |
|---|---|
| Stored chain, 101,104.52 / 100,461.57 − 1 | **+0.6400%** |
| `SUM(weight_0825 × chg_0827)` | **+0.6409%** |
| Drift | **0.0009 pp** |

The residual is the 2-dp rounding on `daily_change_pct`. Using 08-27 weights
instead gives +0.6643%, a materially worse fit — confirming the engine
compounds prior-day weights against a one-day Finnhub move.

**Independent cross-check.** S&P 500 closed +0.32% on 08-25 (FRED `SP500`
7,677.28; CNBC). The stored 08-25 SPY row reads +0.33%. The quote path
validates against an outside source.

## Values written

Per-name reconstructed 2026-08-26 moves, ordered by contribution:

| Ticker | Wt 8/25 | Close 8/25 | Close 8/26 | Move | Contrib |
|---|---|---|---|---|---|
| LLY | 13.15 | 1,233.66 | 1,189.3827 | −3.589% | −47.2 bp |
| HOOD | 8.91 | 112.09 | 108.5438 | −3.164% | −28.2 bp |
| GLDM | 11.45 | 92.35 | 90.9027 | −1.567% | −17.9 bp |
| SLV | 6.36 | 62.32 | 61.5900 | −1.171% | −7.5 bp |
| IBIT | 12.42 | 44.72 | 44.4618 | −0.577% | −7.2 bp |
| AMZN | 13.14 | 261.06 | 260.2802 | −0.299% | −3.9 bp |
| COPX | 4.14 | 96.32 | 95.5423 | −0.807% | −3.3 bp |
| ASML | 4.97 | 1,744.16 | 1,745.6713 | +0.087% | +0.4 bp |
| SOXX | 4.63 | 514.06 | 515.3884 | +0.258% | +1.2 bp |
| ETHA | 9.49 | 18.60 | 18.6494 | +0.265% | +2.5 bp |
| AIPO | 6.32 | 28.72 | 28.9306 | +0.733% | +4.6 bp |
| GLW | 5.01 | 147.16 | 152.7826 | +3.821% | +19.1 bp |
| **Total** | 99.99 | | | **−0.873%** | **−87.3 bp** |

Resulting `daily_snapshots` row:

| Field | Value |
|---|---|
| `snapshot_date` | 2026-08-26 |
| `portfolio_value` | 99,584.58 |
| `daily_return_pct` | −0.87 |
| `cumulative_return_pct` | −0.42 |
| `spy_value` | 765.75 |
| `spy_cumulative_return_pct` | 4.44 |
| alpha vs SPY | −4.86% |
| `portfolio_version` | `2026-08-24-v3.4-trendfirst` (carried) |

2026-08-26 was the worst single-session relative day in the v3.4 book's life:
**−0.86 pp** of underperformance, driven by a 3.6% LLY drawdown at a 13% weight
plus HOOD giving back most of its +8.17% 08-25 spike. That is the day that fell
through, which is why the omission mattered more than the flat SPY tape
suggested.

---

## Estimates and distortions on record

Three items in the 08-26 row are **not** direct reconstructions. Flagged here
because they are hand-set values inside a published performance series.

### 1. SPY close — externally sourced, not derived

`buildMacroSignals` persists only `{ price, ath, pct_off_ath }`; SPY's
`prev_close` is computed in the quote helper and discarded. The 08-26 SPY close
is therefore **not recoverable from the database** and was derived from the
index ratio:

```
SPY_0826 = 765.91 × (7,675.70 / 7,677.28) = 765.75
```

S&P 500 closes are external (CNBC; FRED `SP500`). This assumes SPY tracked SPX
exactly on the day — true to within a basis point or so in normal conditions,
but it is an **approximation, not a quote**.

### 2. Momentum sleeve — carried FLAT across 08-26

`momentum_value` held at **91,570.41**, `momentum_cumulative_return_pct` at
**−8.43**, `momentum_daily_return_pct` set to **0.00**, `momentum_members`
copied forward (`LLY, AMZN, IBIT, GLDM, ETHA, HOOD, COPX`).

The sleeve's true 08-26 move is unrecoverable — its per-name book is not stored
per day in reconstructable form. Flat-carry is a **real distortion** of the
momentum curve. It was chosen over the alternatives because:

- Leaving `momentum_value` null would cause the next cron run to take the
  `prev.momentum_value == null` branch in `daily-cron.cjs` and **reset the
  sleeve to its starting value with cumulative 0**, erasing the −8.43% track
  record.
- Momentum is a deprecated parallel sleeve (standing call, 2026-08-24);
  Thematic is the book that matters.

A one-day flat spot in a deprecated sleeve is the least-bad option, but it is a
hand-set number and is recorded as such.

### 3. Macro columns left NULL

`spy_rsi`, `rsi_signal`, `polymarket_signals`, `narrative_signals`,
`bullish_assets`, `portfolio`, `macro_signals`, `technicals` are all null on the
08-26 row. These are point-in-time reads that cannot be reconstructed after the
fact. Verified safe: no `prevSnapshot` read in `daily-cron.cjs` touches any of
them. Any UI tile rendering macro state for 08-26 will show blank.

---

## Unverified

The per-name moves are forced by data already in Supabase, so the only failure
mode is Finnhub having returned a bad `pc` for a specific ticker on the 08-27
midday quote. **GLW +3.82% and LLY −3.59%** — the largest positive and negative
contributors — were **not** confirmed against an independent price source;
searches returned stale results. The 08-25 SPX cross-check above validates the
quote path in general but not these two prints specifically.

---

## Follow-up

**`backfill_20260826.cjs` (v1) is superseded — do not run it.** It built the
snapshot row from a hardcoded six-column whitelist against a twenty-column
table, silently dropping `daily_return_pct` (blank Performance cell) and all
four `momentum_*` fields. That second omission was the dangerous one: it turned
a safe gap into a latent momentum reset, caught by reading the cron source
rather than by any warning. Both were patched by hand after the fact.

Replacement: **`backfill_missing_day.cjs`**, which clones the prior row's full
key set, classifies every column, and **hard-fails on any unclassified column**
so a schema change aborts loudly instead of nulling a new field quietly. It also
requires the SPY close as an explicit flag (no hardcoded default), enforces a
one-business-day gap, and prints a column-coverage report in dry run.

**Cron behaviour confirmed, not assumed:** `daily-cron.cjs` selects on
`snapshot_date = TODAY` and issues a full-row `update` when a row exists, so the
stale 2026-08-27 intraday row is overwritten wholesale by the 23:17 UTC run
rather than skipped. No deletion was required.

**Open, unrelated:** `systemMap.ts` L242 still hardcodes v3.3 sleeve bars
(`AI Compute 50.5%`, `Tokenization 8.5%`), wrong by ~25 pp under v3.4, and L162
still reads `S4 Tokenization: Sept '26 dated, not actioned`. L399 designates
that file as the changelog of record until `system_changelog` exists — this
entry should be reflected there in the same pass.
