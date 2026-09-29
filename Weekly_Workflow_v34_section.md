# Weekly Workflow — v3.4 scoring section

**Replaces the old §5 "run rescore_current_v3.py" step. That script and
`rescore_v34.py` both implement the retired composite method — do not run either.**

**Revision 2026-09-29.** Changes from the 2026-09-07 revision:

- **Themes come from any voice; tickers are derived, never taken.** Visser, Camillo and ZaStocks may all name themes and trends. Assets are derived from those themes (`theme_map.json`). ZaStocks' tickers are never inputs — his names change too often. Visser and Camillo name-mentions are hints for derivation only.
- **New §5.11 — Book changes.** Every cycle ends with ADD / ADD-WHEN / NOT WORTH IT / ALREADY HELD / REMOVE-REVIEW verdicts, each with a projected book. Adds and removes are no longer left to ad-hoc questions (Solana sat unexpressed for three weeks).
- **§5.4 evidence rule moves to theme level.** A holding needs a theme described by a voice, not a ticker named. Timing changes still require a Visser quote.
- **§5.2 sweep is theme-first** (`cycle_scan.py` v2). §5.2b's four vehicle gates are now engine inputs inside §5.11, not rejection gates.
- **§5.7:** an approved ADD or REMOVE is a ticker-set change and qualifies for a freeze.

Prior revision (2026-09-07): nomination sweep made mandatory; freeze criteria address the adoption wave; §5.8 names every surface; "one rung at a time" named; packet protocol documented.

---

## §5 · Score the book — trend-first

`v34_worksheet.html` is the **canonical scoring document**. Open it, set the
week's inputs, read the weights. `rescore_trendfirst.py` is the offline runner
and reproduces it exactly; if the two disagree, one is stale.

```
cd ~/Desktop/alphaplaybook
open v34_worksheet.html
```

**Canonical is always the latest cycle.** Each cycle writes
`v34_worksheet_YYYY-MM-DD.html` and copies it to `v34_worksheet.html`. Dated
files are immutable snapshots; canonical tracks the newest reading of the book.

---

## 5.0 · Protocol

1. Add the week's transcripts to Project files, and save copies to `~/Desktop/transcripts/` with the voice and date in the name (`9_27_26 Visser Podcast.txt`, `9_21-9_27 Camillo Grok Output.txt`).
2. Say **"run weekly workflow."**
3. Run the command block that comes back:
   ```
   cd ~/Desktop/alphaplaybook
   python3 cycle_packet.py --pull
   python3 cycle_scan.py --dir ~/Desktop/transcripts
   node book_changes.cjs
   open packet/
   ```
4. Attach `packet/cycle_YYYY-MM-DD.md` and paste the sweep and section H output.
5. Receive: analysis, **book changes (§5.11)**, freeze recommendation, updated `v34_worksheet.html`, voice-card patches, and the git command sequence.
6. Run the git sequence. **Claude cannot touch the repo** — it produces files and commands; execution is manual.

**Blockers are reported before numbers, never after.** A duplicate transcript
capture, a stale `corr_matrix.json`, or a packet section that fell back to a raw
grep invalidates everything downstream of it.

**If `--pull` fails** on the network or the Twelve Data key, `cycle_packet.py`
refuses to write the cache and falls back to the newest prior capture, marked
STALE. Do not score entry bands on a stale capture.

**The recommended classification is built into the worksheet, not held for
approval.** Rejecting it is cheap — the alternative's effect is stated alongside
it and the rebuild is one command.

---

## 5.1 · What actually changes week to week

| input | cadence | trigger |
|---|---|---|
| **sub-theme timing** | **weekly — this is the live one** | Visser's stage calls, with a quote |
| **book membership** | **weekly review (§5.11)** | a theme any voice describes, derived to assets, sized by the engine |
| technicals (px, d50, d200) | weekly | `node pull_candidates.cjs` |
| quality | rarely | market structure changed — merger, new entrant, monopoly broken |
| trend conviction | rarely | the trend's standing changed |
| **adoption wave** | ~twice a year | **observable evidence** the next wave started, not an announcement |
| correlations | monthly | `python3 pull_correlations.py` |
| trend weight override | only when overruling the engine | log it |

Everything else is derived. Trend weights, trend timing, S5 and name weights are
**outputs** — if one looks wrong, an input is wrong.

### Voice roles

| voice | cadence | themes & trends | tickers | timing calls |
|---|---|---|---|---|
| **Visser** | Fri (Pomp) + Sun (weekly) | ✅ | hint only — derived like any other | ✅ **only voice** |
| **Camillo** | irregular, via Grok | ✅ | hint only — derived like any other | ❌ |
| **ZaStocks** | weekly, via Grok | ✅ | ❌ **never an input** | ❌ |

**Timing authority stays with Visser.** A theme that only Camillo or ZaStocks
has described enters at `forward` (×0.72) until Visser makes a stage call on it.

**Capture integrity, checked first.** Confirm each file's stated window matches
the intended one. The `8_17-8_24` ZaStocks output was byte-identical to
`8_10-8_17` and went undetected for a week. A missing capture is reported as a
gap, never silently filled from the prior window.

---

## 5.2 · Theme sweep — MANDATORY, RUNS FIRST

```
cd ~/Desktop/alphaplaybook
python3 cycle_scan.py --dir ~/Desktop/transcripts
```

Scans every transcript in the folder; voice and date come from the file name.
Themes and their vehicles live in **`theme_map.json`**. Five blocks:

1. **Themes this window** — by voice, with a quote each. Two or more voices on one theme is flagged as convergence.
2. **Derived candidates** — every vehicle for every theme voiced, marked held / inside a held ETF (with verified % and date) / candidate / watch.
3. **Removal review** — held names whose themes no voice has described for 28+ days.
4. **Structural language** — taxonomy, ranking, stage and long/short framing. **Unmapped lines are listed first: they are where a new theme appears.** Add it to `theme_map.json` and derive its vehicles that cycle.
5. **Name hints** — Visser and Camillo mentions only, as pointers for derivation. ZaStocks' tickers are excluded by construction.

**A lexicon hit is a pointer, not evidence.** "Memory" matched agent-memory talk
on 9/26; GLDM once registered four hits from a host's ad reads. Every theme
still requires reading the quote. Transcripts garble names ("Salana", "Marll") —
grow the lexicons and aliases every week.

---

## 5.3 · Run it

```
cd ~/Desktop/alphaplaybook
node --check pull_candidates.cjs && node pull_candidates.cjs
python3 rescore_trendfirst.py
```

Paste the fresh px / d50 / d200 into the worksheet, set any timing changes from
this week's transcripts, then **export changes** and keep the block with the
cycle notes. Before scoring, confirm `corr_matrix.json` and the worksheet's
embedded `CORR` agree — the packet reports this. If they drift:
`python3 inject_corr.py v34_worksheet.html`.

---

## 5.4 · Evidence rule — enforced in the sheet

Every timing and quality classification carries a **source**: an exact quote plus
date, or an explicit `NO THEME SUPPORT` flag.

- **Support is at theme level.** A holding is supported when a voice describes the theme it expresses. The ticker never needs to be named — deriving assets from themes is the method, not a shortcut. (Replaces "a voice naming a theme is not a leg on a ticker", retired 2026-09-29.)
- **No Visser quote → no timing change.** A stage call without a transcript line is drift. Absence of a mention is not a stage call; silence ages a classification, it does not move it.
- **`NO THEME SUPPORT`** marks a holding whose theme no voice has described within 28 days. Legitimate as a structural seat, but it triggers a removal review in §5.11 and the total should be watched.
- Convergence is measured from the `voice_mentions` ledger and the sweep's theme block, not asserted.

---

## 5.5 · Classification rules

Timing ladder: `binding · working · cooling · forward · exhausted` →
`1.00 · 0.92 · 0.80 · 0.72 · 0.60`.
Quality: `sole · basket · duopoly · leader · contested`.
Conviction: `certain · strong · forming · speculative · watch`.

- **One rung at a time.** A stage advances by one rung on new evidence. A thesis restated a week later is not new evidence.
- **Fix scores, not weights.** Discretionary sizing overrides corrupt the signal. Engine sizing is output; human judgment sets structure.
- **Trend timing is derived** — the mean of member sub-themes. Never asserted.
- **Wave demand applies to AI Buildout only.** Advance on observable evidence — shipped product — never an announcement.
- **Correlation ≠ coverage.** Two names may correlate 0.86 and still cover different things. Judge removals on both.

---

## 5.6 · Scoring mechanics

`name_score = 55 × timing × quality × wave_demand × entry_band(S5)`

The 55 floor means multipliers act only on the above-floor portion. Breadth is
`N_eff` from measured correlations, never `√n`.

**Watch the session count on any correlation refresh.** `pull_correlations.py`
intersects timestamps across all symbols and silently truncates every series to
the shortest. Use a long-history proxy for newly listed vehicles (GSOL, not BSOL).

---

## 5.7 · Freeze criteria

**Freeze when any of these fire:** ticker-set change (**including an approved
§5.11 ADD or REMOVE**), OR a stage flip. Otherwise **confirm-the-book**, stated
explicitly, with the drift figure recorded.

**The adoption wave is NOT a freeze trigger on its own.** Log it in the worksheet
and carry it into the next qualifying freeze.

**Turnover alone is not a criterion.** Technical drift moves weights every week;
that is the engine working, not a reason to trade.

**A freeze must be reproducible from committed files.** `corr_matrix.json`,
`theme_map.json` and the worksheet inputs are part of that, not scratch. A dirty
working tree blocks a freeze.

---

## 5.8 · Surfaces

| surface | holds | update when |
|---|---|---|
| `server/daily-cron.cjs` | `BASE_PORTFOLIO`, freeze label | **only on a freeze** |
| `v34_worksheet.html` | canonical scoring, always the latest cycle | **every cycle** |
| `theme_map.json` | themes → derived vehicles, look-through %s, optional `timing` / `quality` per vehicle | **every cycle** a theme is added or a vehicle re-derived |
| `src/data/voiceCards.ts` | editorials + `asOf` per voice — **plain language, no internal vocabulary** | **every cycle** |
| `src/components/SignalRadar.tsx` | `THEME_META` chips | **every cycle** |
| `src/data/systemMap.ts` | weights, freeze label, file roles | on a freeze, or when roles change |

**A stale `asOf` is worse than a stale editorial** — it claims evidence that does
not exist. **Voice cards are written for readers outside the project**: no seats,
entry bands, moving averages, rungs or tiers.

---

## 5.9 · Patch discipline

- Anchored find-replace, exact strings, `count==1` abort, timestamped backups outside the repo before touching anything.
- Brace-matched replacement for multi-line spans. **Never regex dot-all.**
- Verify: `npm run build` (never `dev`) for frontend, `node --check` for `.cjs`, `py_compile` for Python.
- `git add` targeted files only. **Never `git add -A`.**
- **Check `local vs origin` before declaring anything shipped.**

---

## 5.10 · Close

1. Update the queue: items closed, opened, moved.
2. Record what was *not* done, and why — including every §5.11 verdict that was not acted on.
3. Note what to watch into next week — names on band boundaries, ADD-WHEN triggers, removal reviews pending, classifications aging without refresh.

---

## 5.11 · Book changes — add, remove, derive — EVERY CYCLE

The weekly cycle does not only re-weight twelve existing seats. It asks what the
book *should* hold, every week, and says so even when the answer is "nothing."

**Division of labour:** voices name themes → Claude derives assets → the engine
decides whether and how much.

### Step 1 · Themes this window
From sweep block 1 and a full read of every transcript: each theme or trend any
voice described, with quote, date and voice. A theme new to `theme_map.json` is
added that cycle with its trend assignment (or `UNASSIGNED`).

### Step 2 · Derive assets
For each theme: what must be owned to capture it, and which vehicles trade
against it — ETFs and single names. New themes are researched fresh; existing
themes re-use `theme_map.json`, refreshed when a vehicle changes. **ZaStocks'
tickers are never used; if his theme is valid, the vehicles are derived
independently.** Private companies and tokens with no listed vehicle are
recorded as such.

### Step 3 · Coverage
Diff against holdings **including look-through**. Verify ETF composition against
a live source with a date — never assert it. A name inside a held ETF is
ALREADY HELD at that percentage.

### Step 4 · Engine pass — whether and how much
Run `node book_changes.cjs` (packet section H). It loads the canonical worksheet
engine itself, so projections cannot drift from the scoring method. Every
candidate is scored and gets a **projected book**:
its weight, and which holdings it takes weight from. Inputs, not rejection gates:

- **History** — ≥ 252 sessions, or a long-history proxy.
- **Look-through overlap** — verified %.
- **Correlation** to the nearest holding (1y / 6m / 3m).
- **Entry** — stretch above the 50-DMA and 200-DMA position.
- **Timing** — Visser's stage call if he has made one; otherwise `forward`.

Verdicts:

| verdict | when |
|---|---|
| **ADD** | projected weight **≥ 3%**, and it adds exposure rather than mostly displacing a same-theme holding |
| **ADD-WHEN** | would qualify, but entry is stretched (> 25% over the 50-DMA) or below the 200-DMA. **Trigger stated.** |
| **NOT WORTH IT** | projected < 3%, or it duplicates a same-theme holding (1y corr > 0.90). Number shown so it can be overruled. |
| **PROVISIONAL** | prefix on any ADD / ADD-WHEN whose correlations are not yet measured — the engine drops it from N_eff, so trend-level effect is understated. Add it to `pull_correlations.py` before acting. |
| **ALREADY HELD** | covered inside a held ETF |

### Step 5 · Removals
**REMOVE-REVIEW** when any holds:

- no voice has described the holding's theme for **28 days** (sweep block 3);
- Visser takes its sub-theme to `exhausted`, or quality to `remove`;
- it sits inside another holding above 2% (Rule B — the ASML precedent);
- 1y correlation > 0.90 with a same-theme holding and no coverage difference;
- the vehicle no longer matches the row (spin-off, reconstitution).

**Price never triggers a removal** — the entry band handles price. Every review
carries the projected book *without* the name, because removing a name also
removes breadth (dropping COPX on 9/28 would have cut AI Buildout 25.0 → 21.7).

### Output — the "Book changes" block
Section H is exhaustive — it scores every mapped vehicle. The Book changes block
combines it with sweep block 1: **an ADD is recommended only for a theme voiced
within 28 days.** A strong engine number on a silent theme is logged, not acted on.

Every cycle, never empty. If nothing qualifies, it names the nearest candidate
on each side and the one thing it is missing. An approved ADD or REMOVE is a
ticker-set change and qualifies for a freeze (§5.7).

**Worked example, 2026-09-28:** Solana (speed layer — Visser 9/07, 9/20, 9/27)
→ ADD-WHEN: GSOL projects ~5.8%, drawn mainly from ETHA (13.2 → 9.8) and HOOD
(7.3 → 5.4); trend weight only +0.5pp — mostly an ETH→SOL swap. Trigger: stretch
under 25% (30.0% on 9/28).

---

## What this replaced, and why

The composite method sized names by a weighted sum and pinned the top name to
`target_top_pct` — so the largest position's weight carried no information about
its conviction. Trend-first makes every judgement a named rung on a shared
ladder, derives everything else, and measures breadth from real correlations
instead of counting sub-themes. §5.11 closes the other half: the method could
re-weight what it held, but only an outside question could change *what* it held.

Full rationale, ladders, wave matrix and the retired-mechanisms list:
**`Trend_First_Spec.md`**.
