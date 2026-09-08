# Weekly Workflow — v3.4 scoring section

**Replaces the old §5 "run rescore_current_v3.py" step. That script and
`rescore_v34.py` both implement the retired composite method — do not run either.**

**Revision 2026-09-07.** Changes from the prior revision:

- **§5.2 nomination sweep is new and mandatory.** Added because the 9/07 cycle missed Solana — Visser named it three consecutive weeks and it was invisible to a method that only greps existing holdings.
- **§5.7 freeze criteria now address the adoption wave.** It was listed as an input but appeared nowhere in the criteria, so a wave advance had no stated answer.
- **§5.8 names every surface that must be updated**, including `SignalRadar.tsx`, which had no owner and went stale two cycles.
- **"One rung at a time" is now a named rule (§5.5)** rather than a note inside a worksheet `why` string. It has governed two consecutive ETHA decisions.
- **§5.0 documents the packet-based chat protocol.**
- `NO VOICE SUPPORT` total corrected 23.0% → 9.1% (LLY's flag cleared 8/24).

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

The cycle runs as a conversation against two artifacts: the transcripts and the packet.

1. Add the week's transcripts to Project files.
2. Say **"run weekly workflow."**
3. Run the command block that comes back:
   ```
   cd ~/Desktop/alphaplaybook
   python3 cycle_packet.py --pull
   python3 cycle_scan.py --dir <transcript dir> --since <window>
   open packet/
   ```
4. Attach `packet/cycle_YYYY-MM-DD.md` and paste the sweep output.
5. Receive: analysis, freeze recommendation, updated `v34_worksheet.html`, voice-card patches, and the git command sequence.
6. Run the git sequence. **Claude cannot touch the repo** — it produces files and commands; execution is manual.

**Blockers are reported before numbers, never after.** A duplicate transcript
capture, a stale `corr_matrix.json`, or a packet section that fell back to a raw
grep invalidates everything downstream of it.

**If `--pull` fails** on the network or the Twelve Data key, drop the flag, run
the packet offline, and paste `node pull_candidates.cjs` output separately.
Section E will say the technicals are cached and stale rather than pretend
otherwise. Do not score entry bands on a stale capture.

**The recommended classification is built into the worksheet, not held for
approval.** Rejecting it is cheap — the alternative's effect is stated alongside
it and the rebuild is one command.

---

## 5.1 · What actually changes week to week

| input | cadence | trigger |
|---|---|---|
| **sub-theme timing** | **weekly — this is the live one** | Visser's stage calls, with a quote |
| technicals (px, d50, d200) | weekly | `node pull_candidates.cjs` |
| quality | rarely | market structure changed — merger, new entrant, monopoly broken |
| trend conviction | rarely | the trend's standing changed |
| **adoption wave** | ~twice a year | **observable evidence** the next wave started, not an announcement |
| correlations | monthly | `python3 pull_correlations.py` |
| trend weight override | only when overruling the engine | log it |

Everything else is derived. Trend weights, trend timing, S5 and name weights are
**outputs** — if one looks wrong, an input is wrong.

### Voice tiers

| tier | voice | cadence | authority |
|---|---|---|---|
| L1 | Visser | Fri (Pomp) + Sun (weekly) | **Only voice that may move theme weights.** |
| L2 | Camillo | irregular, via Grok | Nomination + convergence bonus. Cannot move themes. |
| L2 | ZaStocks | weekly, via Grok | **Corroboration-only.** Counts only when Visser or Camillo point at the same name. Never seats alone. |

**Capture integrity, checked first.** Confirm each file's stated window matches
the intended one. The `8_17-8_24` ZaStocks output was byte-identical to
`8_10-8_17` and went undetected for a week. A missing capture is reported as a
gap, never silently filled from the prior window.

---

## 5.2 · Nomination sweep — MANDATORY, RUNS FIRST

```
python3 cycle_scan.py --dir <transcripts> --since <window>
```

Every other step greps for things **already in the book**, to confirm or refute
twelve existing seats. That direction is blind by construction to anything L1
names that has no seat. The sweep runs the other way: extract every entity, diff
against `BASE_PORTFOLIO` plus the candidate list, emit **named-but-unseated**
with quote and date.

Four output blocks:

1. **Named but unseated** — not in book, not tracked. The blind spot.
2. **Named, already watchlisted** — context, ranked below the above.
3. **Book names with mention counts** — **zero is the signal.** A held name with no mention is a classification aging without refresh.
4. **Structural language** — taxonomy, ranking, role-assignment and wave-transition phrasing. Noun greps cannot find these; they are where L1's structure changes.

**Maintain the alias table.** Transcripts garble proper nouns — "Salana",
"Marll", "Dra Miller". Grepping the correct spelling returns zero. A missing
alias is a name that cannot be found.

**Mention count is a pointer, not evidence.** GLDM registered four hits in the
9/07 window, all from a host's statistic and ad reads, while Visser said nothing
about gold. Every count still requires reading the quote.

**Output is a recommendation to investigate, not a seat.** New names enter as
*watch-not-seat* and require measured correlations before scoring.

---

## 5.3 · Run it

```
cd ~/Desktop/alphaplaybook
node --check pull_candidates.cjs && node pull_candidates.cjs
python3 rescore_trendfirst.py
```

Paste the fresh px / d50 / d200 into the worksheet, set any timing changes from
this week's transcripts, then **export changes** and keep the block with the
cycle notes. The export carries every deviation from baseline with its reason.

Before scoring, confirm `corr_matrix.json` and the worksheet's embedded `CORR`
agree — the packet reports this. If they drift:
`python3 inject_corr.py v34_worksheet.html`.

---

## 5.4 · Evidence rule — enforced in the sheet

Every timing and quality classification carries a **source**: an exact quote plus
date, or an explicit `NO VOICE SUPPORT` flag. Click any ticker to see it.

- **No quote → no timing change.** A stage call without a transcript line is drift. Absence of a mention is not a stage call; silence ages a classification, it does not move it.
- `NO VOICE SUPPORT` names are structural seats on market analysis. Legitimate, but the total should be watched — 9.1% of the book on 2026-09-07 (ASML, COPX), down from 23.0% on 8/23 when LLY's flag cleared.
- **A voice naming a theme is not a leg on a ticker.** Theme conviction reaches the model through timing; it does not size a name directly.
- Convergence is measured from the `voice_mentions` ledger, not asserted. If there is no row, the leg does not exist regardless of what the transcript says. Log it.

---

## 5.5 · Classification rules

Timing ladder: `binding · working · cooling · forward · exhausted` →
`1.00 · 0.92 · 0.80 · 0.72 · 0.60`.
Quality: `sole · basket · duopoly · leader · contested`.
Conviction: `certain · strong · forming · speculative · watch`.

- **One rung at a time.** A stage advances by one rung on new evidence. A thesis restated a week later is not new evidence. This rejected ETHA `working→binding` on both 8/31 and 9/07.
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
the shortest. One 215-close name re-cut all twenty and the only symptom was
AIPO–SOXX drifting 0.8565 → 0.87. Use a long-history proxy for newly listed
vehicles.

---

## 5.7 · Freeze criteria

**Freeze when any of these fire:** ticker-set change, OR a stage flip, OR a
candidate clearing all gates. Otherwise **confirm-the-book**, stated explicitly,
with the drift figure recorded.

**The adoption wave is NOT a freeze trigger on its own.** It re-rates AI Buildout
internally without changing trend weight. The 9/07 advance moved 2.9pp with a
0.7pp maximum — rebalancing noise, not worth a version number on a track record
intended to support subscribers. Log it in the worksheet and carry it into the
next qualifying freeze.

**Turnover alone is not a criterion.** Technical drift moves weights every week;
that is the engine working, not a reason to trade.

**A freeze must be reproducible from committed files.** `corr_matrix.json` and
the worksheet inputs are part of that, not scratch. A dirty working tree blocks a
freeze.

---

## 5.8 · Surfaces

Five surfaces carry book or voice content and drift independently. The packet
reports them; **all are owned by this step.**

| surface | holds | update when |
|---|---|---|
| `server/daily-cron.cjs` | `BASE_PORTFOLIO`, freeze label | **only on a freeze** |
| `v34_worksheet.html` | canonical scoring, always the latest cycle | **every cycle** |
| `src/data/voiceCards.ts` | editorials + `asOf` per voice | **every cycle** |
| `src/components/SignalRadar.tsx` | `THEME_META` chips | **every cycle** |
| `src/data/systemMap.ts` | weights, freeze label, file roles | on a freeze, or when roles change |

**A stale `asOf` is worse than a stale editorial** — it claims evidence that does
not exist. Update every voice's stamp, including voices with no new capture,
where the stamp stays put *and the header records why*.

---

## 5.9 · Patch discipline

- Anchored find-replace, exact strings, `count==1` abort, timestamped `.bak` before touching anything.
- Brace-matched replacement for multi-line spans. **Never regex dot-all** — a `re.DOTALL` match once spanned two functions and deleted ~500 lines including `finnhubQuote`, causing a production `ReferenceError` and requiring `git revert` plus force-push.
- Verify: `npm run build` (never `dev`) for frontend, `node --check` for `.cjs`, `py_compile` for Python.
- `git add` targeted files only. **Never `git add -A`.**
- **Check `local vs origin` before declaring anything shipped.** On 9/07 four commits sat unpushed and the site served stale content all day while everything looked committed.

---

## 5.10 · Close

1. Update the queue: items closed, opened, moved.
2. Record what was *not* done, and why.
3. Note what to watch into next week — names on band boundaries, classifications aging without refresh, captures needing a re-run.

---

## What this replaced, and why

The composite method sized names by a weighted sum and pinned the top name to
`target_top_pct` — so the largest position's weight carried no information about
its conviction. Trend-first makes every judgement a named rung on a shared
ladder, derives everything else, and measures breadth from real correlations
instead of counting sub-themes.

Full rationale, ladders, wave matrix and the retired-mechanisms list:
**`Trend_First_Spec.md`**.
