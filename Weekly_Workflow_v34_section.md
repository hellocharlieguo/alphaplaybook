# Weekly Workflow — v3.4 scoring section

**Replaces the old §5 "run rescore_current_v3.py" step. That script and
`rescore_v34.py` both implement the retired composite method — do not run either.**

**Revision 2026-10-28 (C).** Transcripts live in **Project files only**. Claude reads them there, in full, every cycle. The `~/Desktop/transcripts/` folder and the local `cycle_scan.py --dir` step are retired. Claude runs the sweep itself, in its own workspace, on the Project-file transcripts.

**Revision 2026-10-13.** Changes from the 2026-09-29 revision:

- **Voices propose; data decides (C, 10/13).** No voice — including Visser — moves a timing rung on its own. Every stage move, and every new seat, must pass the **data check (§5.4b)**: dated evidence on the bottleneck itself, plus a pricing read. Data can also *initiate* a move with no voice line; it is then logged as `DATA-INITIATED`.
- **New vehicle-fit test (§5.4b, part C).** A held vehicle must actually express its sub-theme. One that trades mostly like a holding in a *different* sub-theme is flagged for replacement, whatever its narrative fit. Prompted by AIPO: 1y correlation 0.86 to SOXX, 0.60 to the power generators it is meant to express.
- **§5.1 voice-role table and §5.4 evidence rule rewritten** to match. "No Visser quote → no timing change" is retired.
- **Seat rule (§5.6).** A seat is a bottleneck, not a ticker; vehicles of one bottleneck share it. Breadth and trend timing count seats.

Prior revision (2026-09-29): themes from any voice, tickers derived; §5.11 Book changes added; evidence rule moved to theme level; sweep made theme-first.

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

1. Add the week's transcripts to **Project files**, with the voice and date in the name (`9/27/26 Visser Podcast`, `9/21-9/27 Camillo Grok Output`). That is the only place they need to go — no desktop copies.
2. Say **"run weekly workflow."**
3. Claude, without waiting on anything from C:
   - lists Project files and picks every transcript dated after the last cycle;
   - reads each one **in full** with `project_read` (never keyword sampling);
   - saves them to its own workspace and runs `cycle_scan.py --dir <that folder>` for the sweep;
   - pulls the live repo from GitHub (`BASE_PORTFOLIO`, worksheet, `theme_map.json`).
4. Optional: for the canonical Twelve Data capture, C runs:
   ```
   cd ~/Desktop/alphaplaybook
   git pull
   python3 cycle_packet.py --pull
   node book_changes.cjs
   open packet/
   ```
   and attaches `packet/cycle_YYYY-MM-DD.md`. Without it, Claude scores on its own price pull and labels the numbers as such.
5. Receive: analysis, **data check (§5.4b)**, **book changes (§5.11)**, freeze recommendation, updated `v34_worksheet.html`, voice-card patches, and the git command sequence.
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
| **sub-theme timing** | **weekly — this is the live one** | a proposal (any voice, or the data itself) **that passes the §5.4b data check** |
| **book membership** | **weekly review (§5.11)** | a theme any voice describes, derived to assets, data-checked, sized by the engine |
| technicals (px, d50, d200) | weekly | `node pull_candidates.cjs` |
| bottleneck evidence | weekly read, refreshed when a source updates | §5.4b part A sources per sub-theme |
| quality | rarely | market structure changed — merger, new entrant, monopoly broken, **regulated price cap** |
| trend conviction | rarely | the trend's standing changed |
| **adoption wave** | ~twice a year | **observable evidence** the next wave started, not an announcement |
| correlations | monthly | `python3 pull_correlations.py` |
| trend weight override | only when overruling the engine | log it |

Everything else is derived. Trend weights, trend timing, S5 and name weights are
**outputs** — if one looks wrong, an input is wrong.

### Voice roles

| voice | cadence | themes & trends | tickers | timing |
|---|---|---|---|---|
| **Visser** | Fri (Pomp) + Sun (weekly) | ✅ | hint only — derived like any other | **proposes** |
| **Camillo** | irregular, via Grok | ✅ | hint only — derived like any other | **proposes** |
| **ZaStocks** | weekly, via Grok | ✅ | ❌ **never an input** | **proposes** (theme level) |
| **Data check (§5.4b)** | every cycle | — | — | **decides** |

**Voices give ideas; the data decides (C, 10/13).** A proposal from any voice
is a hypothesis. It moves a rung only when §5.4b agrees. The data may also
propose a move no voice made (`DATA-INITIATED`). Visser's quotes are still
recorded as the proposal when he is the source; they are no longer sufficient.

A theme no voice has described still enters at `forward` (×0.72) until the data
check sets a rung.

**Capture integrity, checked first.** Confirm each Project file's stated window matches
the intended one. The `8_17-8_24` ZaStocks output was byte-identical to
`8_10-8_17` and went undetected for a week. A missing capture is reported as a
gap, never silently filled from the prior window.

---

## 5.2 · Theme sweep — MANDATORY, RUNS FIRST

Claude runs `cycle_scan.py` itself on the week's transcripts as read from
**Project files** (saved to its workspace for the scan). Voice and date come from
the Project-file name. Themes and their vehicles live in **`theme_map.json`**. Five blocks:

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

Paste the fresh px / d50 / d200 into the worksheet, set any timing changes that
passed §5.4b, then **export changes** and keep the block with the cycle notes.
Before scoring, confirm `corr_matrix.json` and the worksheet's embedded `CORR`
agree — the packet reports this. If they drift:
`python3 inject_corr.py v34_worksheet.html`.

---

## 5.4 · Evidence rule — enforced in the sheet

Every timing and quality classification carries **two sources**: the proposal
(an exact voice quote plus date, or `DATA-INITIATED`) and the **data check
result** (§5.4b), or an explicit `NO THEME SUPPORT` flag.

- **Support is at theme level.** A holding is supported when a voice describes the theme it expresses. The ticker never needs to be named — deriving assets from themes is the method, not a shortcut.
- **No data check → no timing change.** A voice line alone is a proposal, not a move. A stage call without a passing data check is drift. (Replaces "No Visser quote → no timing change", retired 2026-10-13.)
- **Absence of a mention is not a stage call.** Silence ages a classification; it does not move it. Neither does a voice's framing ("power was phase 1") until the data agrees.
- **`NO THEME SUPPORT`** marks a holding whose theme no voice has described within 28 days. Legitimate as a structural seat, but it triggers a removal review in §5.11 and the total should be watched.
- Convergence is measured from the `voice_mentions` ledger and the sweep's theme block, not asserted.

---

## 5.4b · Data check — voices propose, data decides

Runs every cycle on (1) every proposed rung move, (2) every §5.11 ADD / ADD-WHEN,
and (3) a rotating review of held sub-themes, so each is checked at least monthly
even when nobody proposes a move. Three parts, each with dated sources.

### A · Bottleneck evidence — sets the timing rung

Is the constraint the sub-theme expresses tightening, steady or easing? At least
**two** dated, independent indicators per sub-theme, read for direction:

| indicator type | examples |
|---|---|
| backlog / lead time | turbine backlog GW and delivery year; "sold out through 20XX"; HBM allocation horizon |
| price of the scarce input | DRAM/HBM contract prices; turbine $/kW; capacity-auction clearing price vs cap |
| measured shortfall | auction shortfall MW; reserve-margin gap; supply growth vs demand growth |
| guidance / revisions | supplier guidance, estimate revisions, long-term supply agreements |

| reading | rung |
|---|---|
| tightening on ≥2 indicators | `binding` (or one rung up) |
| mixed, or tight but flat | `working` |
| easing on ≥2 indicators | one rung down |
| no current data | **hold the rung, flag `STALE EVIDENCE`** — never move on narrative |

**One rung at a time** still applies. A voice proposal that the data contradicts
is logged with the contradicting numbers and not acted on.

### B · Pricing read — chooses the vehicle, never the rung

Price never sets timing (S5 and the entry band handle price). The pricing read
answers a different question: **which part of a sub-theme the market has already
paid for.** Per sub-theme, compare its candidate vehicles on:

- 1y return vs. the sub-theme's other vehicles and vs. SPY;
- forward P/E (or EV/EBITDA) vs. the same peers;
- position vs. 50- and 200-DMA.

A sub-theme can be binding while one layer is crowded and another is neglected.
The neglected layer earns the seat only if the reason it lags is understood and
**not a cap on the bottleneck's payout** (a regulated price ceiling, a political
backstop). If it is a cap, record it as a quality judgment (`contested`) or
timing `working`, not `binding`.

### C · Vehicle fit — does the ticker express the theme?

For every held or candidate vehicle:

- **Cross-theme duplication:** 1y correlation to the nearest held name in a *different* sub-theme. **> 0.85 → `VEHICLE MISFIT`** review; the vehicle is mostly buying the other holding.
- **Own-layer fit:** correlation to the sub-theme's pure-play names should exceed the cross-theme figure above.
- **Composition:** for ETFs, % of holdings that are the sub-theme (verified, dated). **< 70% → flag.**

A `VEHICLE MISFIT` goes to §5.11 as a swap candidate with a projected book.

### Output — the "Data check" block

One table per cycle: sub-theme · proposal (voice + quote, or DATA-INITIATED) ·
A reading with sources · rung result · B notes · C flags. Every row dated.

**Worked example, 2026-10-13 — power/grid (AIPO).**
*Proposal:* Visser 10/11 framing ("first phase… Nvidia… Vistra… turbines")
read as "power was phase 1" → downgrade candidate.
*A:* GE Vernova gas backlog 116 GW (Q2), up from 100 GW a quarter earlier,
slots into 2031; global turbine output ~60–70 GW/yr vs >110 GW of orders;
turbine cost +195% since 2019; PJM 2028/29 auction cleared at the $325/MW-day
cap for a third year, 6.8 GW short (uncapped estimate $555) → **tightening on
≥2 → `binding` held. Downgrade rejected.**
*B:* equipment priced (GEV +63% 1y, 47× fwd; PWR +60%, 38×; BE +192%, 74×);
generators neglected (VST −18%, 15.7× fwd; CEG −19%, 23.7×; NRG −33%, 10.2×).
Generator lag is partly a **cap on the payout** (PJM collar; ERCOT ~$30/MWh) →
generators enter at `working`, not `binding`.
*C:* AIPO–SOXX 0.86 / 0.87 / 0.87 (1y / 6m / 3m) vs AIPO–generators ~0.6;
~12% of AIPO is GOOGL / NVDA / AVGO → **`VEHICLE MISFIT`.** Swap candidates to
§5.11: GEV (power/grid; GEV–SOXX 0.61) and VST (power/generation; VST–SOXX 0.44).

---

## 5.5 · Classification rules

Timing ladder: `binding · working · cooling · forward · exhausted` →
`1.00 · 0.92 · 0.80 · 0.72 · 0.60`.
Quality: `sole · basket · duopoly · leader · contested`.
Conviction: `certain · strong · forming · speculative · watch`.

- **One rung at a time.** A stage advances by one rung on new evidence. A thesis restated a week later is not new evidence — and neither is the same data point read twice.
- **Fix scores, not weights.** Discretionary sizing overrides corrupt the signal. Engine sizing is output; human judgment sets structure.
- **Trend timing is derived** — the mean of member sub-themes. Never asserted.
- **Wave demand applies to AI Buildout only.** Advance on observable evidence — shipped product — never an announcement.
- **Correlation ≠ coverage.** Two names may correlate 0.86 and still cover different things. Judge removals on both — and judge *vehicle fit* on both (§5.4b C).

---

## 5.6 · Scoring mechanics

`name_score = 55 × timing × quality × wave_demand × entry_band(S5)`

The 55 floor means multipliers act only on the above-floor portion. Breadth is
`N_eff` from measured correlations, never `√n`.

**Seat rule (C, 2026-10-13): a seat is a bottleneck, not a ticker.** Vehicles that
express the same bottleneck share one seat. The seat scores the **mean** of its
members' scores, members split the seat by their own scores, trend timing averages
seats, and N_eff counts seats (each a score-weighted composite; composite
correlations use an equal-volatility approximation). Seats are set in the
worksheet's `SEAT` map and in `theme_map.json` (`"seat"` on each theme); a theme
with no `seat` key is its own seat. Why: built per-ticker, adding VST beside GEV
took power from 8.0% to 14.6% and made it the largest exposure in the book purely
because a second ticker appeared. A second vehicle should change *how* a bottleneck
is owned, not *how much* of it is owned. Two vehicles belong in one seat when they
are paid by the same constraint (turbines and generators both by the power
shortage); they are separate seats when different constraints pay them (HOOD:
tokenized trading; COIN: agent payments).

**N_eff side effect — check it on every swap.** Replacing a vehicle with a less
correlated one raises its trend's N_eff and therefore its trend weight. That is
the engine rewarding real diversification, but it also moves the other trends.
Every swap projection states the trend-weight change and whether it fits C's
stated trend order; if it does not, propose an override and log it.

**Watch the session count on any correlation refresh.** `pull_correlations.py`
intersects timestamps across all symbols and silently truncates every series to
the shortest. Use a long-history proxy for newly listed vehicles (GSOL, not BSOL).

---

## 5.7 · Freeze criteria

**Freeze when any of these fire:** ticker-set change (**including an approved
§5.11 ADD or REMOVE, or a `VEHICLE MISFIT` swap**), OR a stage flip that passed
§5.4b. Otherwise **confirm-the-book**, stated explicitly, with the drift figure
recorded.

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
| `theme_map.json` | themes → derived vehicles, look-through %s, optional `timing` / `quality` per vehicle, **`evidence` sources per sub-theme (§5.4b A)** | **every cycle** a theme is added, a vehicle re-derived, or an evidence source changes |
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
2. Record what was *not* done, and why — including every §5.11 verdict and every §5.4b proposal that was not acted on, with the data that blocked it.
3. Note what to watch into next week — names on band boundaries, ADD-WHEN triggers, removal reviews pending, `STALE EVIDENCE` flags, classifications aging without refresh.

---

## 5.11 · Book changes — add, remove, derive — EVERY CYCLE

The weekly cycle does not only re-weight the existing seats. It asks what the
book *should* hold, every week, and says so even when the answer is "nothing."

**Division of labour:** voices name themes → Claude derives assets → the data
check confirms the bottleneck and the vehicle → the engine decides whether and
how much.

### Step 1 · Themes this window
From sweep block 1 and a full read of every transcript: each theme or trend any
voice described, with quote, date and voice. A theme new to `theme_map.json` is
added that cycle with its trend assignment (or `UNASSIGNED`). Data-initiated
themes (§5.4b) are listed here too, marked `DATA-INITIATED`.

### Step 2 · Derive assets
For each theme: what must be owned to capture it, and which vehicles trade
against it — ETFs and single names. New themes are researched fresh; existing
themes re-use `theme_map.json`, refreshed when a vehicle changes. **ZaStocks'
tickers are never used; if his theme is valid, the vehicles are derived
independently.** Private companies and tokens with no listed vehicle are
recorded as such.

### Step 3 · Coverage
Diff against holdings **including look-through**. Verify ETF composition against
a live source with a date — never assert it.

**ALREADY HELD is a look-through test** (2026-10-01): a name counts as held only when
(its % of the ETF) × (the ETF's book weight) ≥ **1.5% of the whole book**. Below that it
is scored like any other candidate and correlation decides how much breadth it adds.

### Step 4 · Data check + engine pass
Every candidate first passes §5.4b (A sets its timing; B and C decide the vehicle).
Then run `node book_changes.cjs` (packet section H; `--with SYM --drop SYM`
projects a swap). Every candidate gets a **projected book**: its weight, which
holdings it takes weight from, **and the trend-weight change (§5.6)**. Inputs:

- **History** — ≥ 252 sessions, or a long-history proxy.
- **Look-through overlap** — verified %.
- **Correlation** to the nearest holding (1y / 6m / 3m).
- **Entry** — stretch above the 50-DMA and 200-DMA position.
- **Timing** — from §5.4b A; with no data yet, `forward`.

Verdicts:

| verdict | when |
|---|---|
| **ADD** | projected weight **≥ 3%**, passes §5.4b, and it adds exposure rather than mostly displacing a same-theme holding |
| **ADD-WHEN** | would qualify, but entry is stretched (> 25% over the 50-DMA) or below the 200-DMA. **Trigger stated.** |
| **SWAP** | replaces a `VEHICLE MISFIT` (§5.4b C) in the same sub-theme. Projected book with and without. |
| **NOT WORTH IT** | projected < 3%, or it duplicates a same-theme holding (1y corr > 0.90), or fails §5.4b. Number shown so it can be overruled. |
| **PROVISIONAL** | prefix on any ADD / ADD-WHEN / SWAP whose correlations are not yet measured — add it to `pull_correlations.py` before acting. |
| **ALREADY HELD** | look-through via held ETFs ≥ 1.5% of the book |

### Step 5 · Removals
**REMOVE-REVIEW** when any holds:

- no voice has described the holding's theme for **28 days** (sweep block 3) **and** §5.4b A shows the bottleneck easing or stale;
- §5.4b A takes its sub-theme to `exhausted`, or quality to `remove`;
- §5.4b C flags `VEHICLE MISFIT`;
- its look-through share via another holding reaches 1.5% of the book (it would be held twice);
- 1y correlation > 0.90 with a same-theme holding and no coverage difference;
- the vehicle no longer matches the row (spin-off, reconstitution).

**Price never triggers a removal** — the entry band handles price. Every review
carries the projected book *without* the name, because removing a name also
removes breadth.

### Output — the "Book changes" block
Section H is exhaustive — it scores every mapped vehicle. The Book changes block
combines it with sweep block 1 and the data check: **an ADD is recommended only
for a theme voiced within 28 days, or data-initiated with a passing §5.4b A.**
A strong engine number on a silent, unchecked theme is logged, not acted on.

Every cycle, never empty. If nothing qualifies, it names the nearest candidate
on each side and the one thing it is missing. An approved ADD, REMOVE or SWAP is
a ticker-set change and qualifies for a freeze (§5.7).

**Worked example, 2026-09-28:** Solana (speed layer — Visser 9/07, 9/20, 9/27)
→ ADD-WHEN: GSOL projects ~5.8%, drawn mainly from ETHA (13.2 → 9.8) and HOOD
(7.3 → 5.4); trend weight only +0.5pp — mostly an ETH→SOL swap. Trigger: stretch
under 25% (30.0% on 9/28).

**Worked example, 2026-10-13 (approved, v3.12):** AIPO `VEHICLE MISFIT` → SWAP to
GEV (power/grid, binding/leader) + VST (power/generation, working/leader) sharing
one power seat. Per-ticker seats would have given GEV 7.6 + VST 7.0 = 14.6% power
and AI buildout 37.4%. Under the seat rule: GEV 4.1 + VST 3.7 = 7.8% power (AIPO
was 8.0); seat N_eff 1.62 → 1.87 because the power seat is less tied to SOXX
(0.65) than AIPO was (0.86); trends Buildout 32.2, Rails 26.1, Monetary 22.3,
Applied 19.3. One-way turnover 10.9pp. No override.

---

## What this replaced, and why

The composite method sized names by a weighted sum and pinned the top name to
`target_top_pct` — so the largest position's weight carried no information about
its conviction. Trend-first makes every judgement a named rung on a shared
ladder, derives everything else, and measures breadth from real correlations
instead of counting sub-themes. §5.11 closes the other half: the method could
re-weight what it held, but only an outside question could change *what* it held.
§5.4b (2026-10-13) closes the last gap: a voice's framing could move a rung with
no check that the bottleneck had actually moved, and a vehicle could sit in a
row it did not express.

Full rationale, ladders, wave matrix and the retired-mechanisms list:
**`Trend_First_Spec.md`**.
