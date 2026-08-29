# 2026-08-29 — Cron miss recovery: 2026-08-28 backfilled from quoted closes

**Category:** data correction — performance record
**Scope:** `daily_snapshots` and `portfolio_holdings`, 2026-08-28 only
**Portfolio version:** `2026-08-24-v3.4-trendfirst` (carried; no rebalance triggered)
**Related:** `CHANGELOG_2026-08-27_cron-miss-backfill.md` — second miss in three sessions

---

## What happened

The nightly cron did not fire on Friday 2026-08-28. Discovered Saturday
2026-08-29. A manual re-run was blocked by the weekend guard in
`daily-cron.cjs` (~L1861), which is **correct and was not modified** — see
"Guard" below.

This is the **second cron miss in three sessions**. See "Open: why twice."

## Why this was NOT the 08-26 method

`backfill_missing_day.cjs` reconstructs an *interior* gap by back-solving the
missing day's closes from the following session's `c/pc`. Friday 08-28 is the
**trailing edge** — no following session exists, so that script correctly
aborts.

Waiting for Monday would not have worked either. Monday's cron selects its
baseline with `.lt('snapshot_date', TODAY)` → would have found **08-27**, and
its `change_pct` is a one-day Monday-vs-Friday move. Monday's value would have
chained off Thursday, dropping Friday entirely, and a later 08-28 backfill could
not have repaired Monday's already-wrong value.

## Method: direct quoted closes, not reconstruction

Between the close of session T and the open of T+1, Finnhub `/quote` returns
`c` = T's close and `pc` = T−1's close. Run on Saturday, this is Friday's actual
print — **not a derivation**.

Verified by `probe_friday_close.cjs` (read-only) and re-verified at write time:

- For all 12 holdings **and SPY**, Finnhub `pc` matched the stored 2026-08-27
  price to **0.0000** — an exact identity check, not a tolerance.
- Every quote timestamp read **2026-08-28 16:00:00 ET**.

Preconditions enforced before any write: target absent from both tables; target
is a weekday; no snapshot exists after target; target is the first business day
after the latest stored snapshot; every column on the prior row classified.

**This backfill is materially higher quality than the 08-26 one.** Prices are
quoted closes rather than back-solved. SPY is quoted (769.35) rather than
derived from an S&P 500 index ratio, so no tracking assumption is embedded. The
only carried estimate is the momentum flat-carry.

## Values written

| Ticker | Wt 8/27 | Close 8/27 | Close 8/28 | Move | Contrib |
|---|---|---|---|---|---|
| HOOD | 8.76 | 109.76 | 104.26 | −5.01% | −43.9 bp |
| IBIT | 12.64 | 45.29 | 43.90 | −3.07% | −38.8 bp |
| GLDM | 11.36 | 91.17 | 88.20 | −3.26% | −37.0 bp |
| SLV | 6.44 | 62.77 | 60.02 | −4.38% | −28.2 bp |
| AIPO | 6.45 | 29.20 | 28.04 | −3.97% | −25.6 bp |
| ETHA | 9.67 | 18.87 | 18.37 | −2.65% | −25.6 bp |
| SOXX | 4.75 | 525.43 | 508.62 | −3.20% | −15.2 bp |
| GLW | 5.23 | 152.80 | 148.98 | −2.50% | −13.1 bp |
| ASML | 4.97 | 1,735.01 | 1,696.16 | −2.24% | −11.1 bp |
| COPX | 4.16 | 96.45 | 94.42 | −2.10% | −8.8 bp |
| LLY | 12.60 | 1,176.10 | 1,174.61 | −0.13% | −1.6 bp |
| AMZN | 12.96 | 256.26 | 266.43 | +3.97% | +51.4 bp |
| **Total** | 99.99 | | | **−1.975%** | **−197.5 bp** |

| Field | Value |
|---|---|
| `snapshot_date` | 2026-08-28 |
| `portfolio_value` | 98,018.27 |
| `daily_return_pct` | −1.97 |
| `cumulative_return_pct` | −1.98 |
| `spy_value` | 769.35 (quoted) |
| `spy_cumulative_return_pct` | 4.92 |
| alpha vs SPY | **−6.90%** (from −5.17% on 08-27) |

Chain verified end to end: 100,461.57 → 99,584.58 → 99,992.88 → 98,018.27, each
step reproducing the stored `daily_return_pct` to rounding.

## Market read

A broad unwind across the scarcity complex rather than an idiosyncratic hit.
Monetary (IBIT −38.8, GLDM −37.0, SLV −28.2) and Tokenized Rails (HOOD −43.9,
ETHA −25.6) took the damage together — consistent with a single factor. AMZN
+51.4 bp was the sole offset and nearly cancelled HOOD alone. SPY fell only
0.23%, so this was **−1.74 pp of single-session underperformance**, worse than
08-26's −0.86 pp.

(AIPO −3.97% and AMZN +3.97% is coincidence: 28.04/29.20 = −3.973%,
266.43/256.26 = +3.969%.)

## Guard — not a bug, do not remove

`daily-cron.cjs` ~L1861 blocks weekend runs. Its comment is accurate: on a
weekend there is normally no new close, so the P&L pipeline would re-apply the
prior trading day's move and compound the cumulative wrongly (the Jun 6 Saturday
incident). That reasoning assumes the prior session was already recorded. In a
recovery it has not been, which is the narrow case
`backfill_trailing_day.cjs` handles. The guard stays.

## Distortions on record

**Momentum sleeve carried FLAT across 08-28.** `momentum_value` 91,817.65,
`momentum_cumulative_return_pct` −8.18, `momentum_daily_return_pct` 0,
`momentum_members` `[AMZN, IBIT, GLDM, ETHA, HOOD, COPX]` copied forward. The
sleeve's true 08-28 move is unrecoverable. Flat-carry also prevents the cron's
`prev.momentum_value == null` branch from resetting the sleeve to its starting
value with cumulative 0.

Note the sleeve had already changed on 08-27: **six** members, LLY dropped, value
91,817.65 / −8.18% — superseding the 91,570.41 / −8.43% seven-member state of
08-25. The carry took the newer values. Secondary effect: Monday's cron compares
Monday's members against the carried 08-27 list, a one-day staleness in the
held/new/removed union of a deprecated sleeve. Accepted.

**Macro columns NULL** on the 08-28 row (`spy_rsi`, `rsi_signal`,
`polymarket_signals`, `narrative_signals`, `bullish_assets`, `portfolio`,
`macro_signals`, `technicals`). Point-in-time reads, unreconstructable. Verified
safe: no `prevSnapshot` read in `daily-cron.cjs` touches them. UI macro tiles for
08-28 will render blank.

## New tooling

`backfill_trailing_day.cjs` — writes the most recent missing session directly
from quoted closes. Complements `backfill_missing_day.cjs` (interior gaps) and
supersedes the deleted `backfill_20260826.cjs`. Both share the column
classification model: clone the prior row's full key set, hard-fail on any
unclassified column.

`probe_friday_close.cjs` — read-only reconnaissance. Batches all 13 endpoint
checks into one run, prints `pc`-vs-stored and quote timestamps, writes nothing
and proposes nothing.

## Why twice — diagnosed

**The schedule discrepancy is closed.** The workflow reads
`- cron: '17 23 * * 1-5'` = **23:17 UTC, Mon-Fri**. Commit a3626dc's "17:00
UTC" was a field-order misreading of `17 23`. The yml's own inline comment also
said "23:00 UTC" — corrected in the same pass.

**Queue delay is real but harmless.** Write timestamps across 30 sessions land
23:42-00:18 UTC, i.e. **25-57 minutes** after the scheduled 23:17, and the delay
has been shrinking (~57 min in late July, ~25 min since 08-14). This never
caused a date error, because `TODAY` is ET-based: a run at 00:14 UTC is still
8:14 pm ET on the snapshot date. The design is sound.

**So the misses are dropped runs, not late runs.** GitHub silently declines to
execute scheduled workflows under load. Nothing in the system reports this.

*Caveat on the timestamp audit:* `created_at` is the INSERT timestamp and the
cron's `update` branch does not touch it, so the table cannot distinguish "cron
ran and updated" from "never ran" on any date where a row already existed. The
08-27 entry reads 16:27 UTC — that is the manual intraday run; the evening cron
did fire and overwrote it (its values are close data chaining correctly off
08-26). Only the two genuine gaps are visible as misses.

## Mitigation shipped

Second schedule added: `- cron: '47 0 * * 2-6'` — 00:47 UTC Tue-Sat = **8:47 pm
ET Mon-Fri**, the same ET trading day as the primary, so the ET weekday guard at
`daily-cron.cjs` ~L1861 passes.

Paired with a mandatory early exit, gated on a `BACKUP_RUN` env set only when
the backup schedule fires (`github.event.schedule` matched in the workflow). The
guard exits before Step 1 when `TODAY`'s snapshot already exists.

**The early exit is not optional.** `runNarrativePipeline` and
`runCrowdPipeline` do plain `.insert()` into `signals` (~L355, ~L514), not
upserts. An unguarded second run would duplicate every signal row on the days
the primary succeeded — most days. Fixing a twice-in-three-months miss by
corrupting the signal ledger daily would be a bad trade. The P&L path is already
idempotent (`daily_snapshots` takes the `update` branch, `portfolio_holdings`
upserts on `snapshot_date,ticker`), so the snapshot write needs no such guard.

Applied via `patch_backup_cron.py` — anchored find-replace, `count==1` aborts,
timestamped `.bak`, line-delta check refusing any patch that removes lines,
`node --check` with auto-restore, post-write grep, and an idempotence guard.

**Verification due Tuesday:** the 00:47 UTC run should log `snapshot already
present — exiting before Step 1`. If it instead logs `primary appears dropped`
on a day the primary clearly succeeded, the `github.event.schedule` expression
is not resolving and the run is proceeding full — the signal-duplication case.

## Still open

The backup reduces the failure rate; it does not eliminate it. If **both** runs
are dropped the gap recurs, and nothing still reports it. Both misses so far
were caught by eye on the dashboard.

This matters because recovery degrades with delay: a gap noticed before the next
session is repairable by `backfill_trailing_day.cjs` from quoted closes; noticed
later it degrades to interior reconstruction; and **two consecutive missed
sessions defeat both scripts**, since `daily_change_pct` is a one-day move and
neither tool can span a two-day gap.

A gap check that actually notifies remains unbuilt.
