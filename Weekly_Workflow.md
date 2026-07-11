# AlphaPlaybook — Weekly Workflow

The Monday routine: from new transcripts + macro data to an updated (or confirmed) book. Every terminal command runs from the repo root — begin each with `cd ~/Desktop/alphaplaybook`.

---

## The mental model (read this first)

**Three input streams feed different parts of the engine:**

| stream | drives | layer |
|---|---|---|
| **Visser** (his pod + Pomp/Visser) | thesis, stage calls, theme shape → S1 stage-decay, S2, S4 | Layer 1 |
| **Camillo + ZaStocks** | candidate *names* + convergence only (NOT theme weights) | Layer 2 |
| **Macro data** (CPI, AI CapEx) | the two S1 axis triggers (monetary / physical) | — |

**The key thing your instinct glossed over:** transcripts don't "run through the engine" mechanically. Claude *reads* them and updates the **hand-set scores** (S1 stages, S2, S4, the voice ledger), *then* the engine computes on those. Four of the six signals are judgment; only S5 (entry) is auto-computed from price. So there's a read-and-score step in the middle — that's where the weekly thinking happens.

**What actually changes week-to-week:** rarely the themes (the 5 buckets are stable). Usually the **stage calls** (is power still binding? are chips cooling more?), **new candidate names**, and **convergence**. Those shift weights *within* the existing themes.

---

## The sequence

### 0 · Gather (Monday morning)
Collect whatever's new — cadence varies, so "whatever arrived since last week":
- Visser transcripts (his solo pod + any Pomp/Visser episode) — the week's macro thesis.
- ZaStocks Grok task output (scheduled; native X access, no scraping).
- Any new Camillo transcript (less frequent).
- **Macro state:** current CPI YoY (is it still < 4%?) and the AI CapEx trend (accelerating, plateauing, decelerating?). These set the axis triggers and don't come from the transcripts.

### 1 · Claude reads Visser → updates the thesis scores (Layer 1)
Upload the Visser transcripts. From them, update:
- **Stage calls** → the bottleneck-axis decay (binding / working / cooling / exhausted per name). *This is the big one* — e.g., "power still binding, chips cooling" is scenario C. If Visser signals power is now "working" not "binding," AIPO fades.
- **S2 (timing)** — which stage is live, is the theme heating or cooling.
- **S1 scarcity conviction** — any shift in the monetary/physical framing.
- **S4 (catalysts)** — new dated events (tokenization launches, Fed pivots, etc.).
- Exact transcript quotes required before accepting a conviction claim (evidence standard).

### 2 · Claude reads Camillo / ZaStocks → updates the voice ledger (Layer 2)
Upload ZaStocks Grok output + any Camillo transcript. From them, update the `voice_mentions` ledger:
- New names + conviction level (`Added` / `Adding-Holding` / `Watching` count as positive legs; `Mentioned` / `Caution` do not).
- **ZaStocks is corroboration-only** — his name counts toward convergence only if Visser or Camillo also point at it. He never seats a name alone and never trips a voice floor by himself.
- This feeds `lenses_pointing` (convergence) and the Camillo/Visser voice floors. It does **not** move theme weights.
- **New names are candidates, not holdings** — they land on the watch list and must clear the quant gates (§4–5) before they can seat.

### 3 · Set the axis triggers from macro
- **CPI** → monetary cap-relax. < 4% = dormant (hard money stays paused at floors). ≥ 4% = graded relaxation begins.
- **AI CapEx** → physical boost. Plateaued = COPX/SLV_P at floors. Accelerating = the +boost fires (silver-physical surges, copper firms).

### 4 · Pull technicals (S5)
Get fresh RSI / DMA / stretch for held names + any new candidates:
```
cd ~/Desktop/alphaplaybook
node pull_candidates.cjs
```
This reads `TWELVE_DATA_KEY` from `.env.local`, pulls the 265-day series, and outputs RSI14 + DMA10/20/50/200 + ret1y + stretch → the inputs S5 computes from. Paste the output into the rescore's SignalInput rows.

### 5 · Rescore → target weights
```
cd ~/Desktop/alphaplaybook
python3 rescore_current_v3.py
```
Runs the three-axis engine with the current regime (stages from §1, CPI/CapEx from §3) → composites → normalize → **target weights + the four-regime validation table.** This is the book the engine *wants*.

### 6 · Review the drift
Compare target vs the deployed `BASE_PORTFOLIO`. For each material drift, decide: **close it (engine-pure) or keep it (conscious override)?**
- Engine-pure moves worth taking: sleeves the engine correctly re-rates (e.g., ASML/COPX built up as physical/bottleneck scores shift).
- Conscious overrides to keep on purpose: SOXX's diversification overweight, LLY's flagship premium — the engine scores centrality, not diversification or narrative conviction, so these will always show as "drift." Keeping them is a portfolio-construction choice, not an engine error.
- Rule: **fix scores, not weights.** If you disagree with a drift, adjust the thesis score (a stage call, an S2), don't hand-edit the target.

### 7 · Freeze — only if warranted
Not every week ends in a freeze. If the thesis/stages/names haven't materially moved, the book stands and you're done (the cron keeps updating technicals and drift daily). If changes are warranted, freeze the new targets into the live cron via a `.bak`-guarded, `node --check`-validated patch:
```
cd ~/Desktop/alphaplaybook
python3 patch_base_portfolio.py        # regenerated for the new book
node --check server/daily-cron.cjs
git add server/daily-cron.cjs
git commit -m "Rebalance: <what changed and why>"
git push origin main
```
Bump `PORTFOLIO_VERSION` if the ticker set changes (triggers the rebalance branch). The 7pm ET cron picks it up.

### 8 · Update the watch list
New candidate names that haven't cleared their gates → track for the trigger (usually a 200-DMA reclaim). They graduate on the gate, not on the mention. Head-to-head the strongest when a seat opens (e.g., TEM vs PLTR for the AI-Application 2nd seat — take the higher S5, not both).

---

## Cadence notes

- **Visser posts ~2×/week**; Camillo and ZaStocks are less regular. Process whatever's new — a light week (no fresh Camillo, stages unchanged) may need no freeze at all.
- **The cron runs daily at 7pm ET regardless** — it refreshes prices, RSI, and drift on the *existing* book. The weekly workflow is about the *qualitative* layer (thesis, names, convergence) that the cron can't infer.
- **Market-holiday guard**: the cron skips the quant pipeline when SPY's date ≠ today (next test: Labor Day 9/7/26).
- **Don't `git add -A`** — targeted adds only, so an unreviewed engine or config change never rides along with a book freeze.

---

## One-line summary

**Gather (Visser + Camillo/ZaStocks + macro) → Claude reads & updates the hand-set scores → pull technicals → rescore → review drift → freeze only if warranted → update watchlist.** The engine turns *scores* into *weights*; the weekly job is keeping the scores honest.
