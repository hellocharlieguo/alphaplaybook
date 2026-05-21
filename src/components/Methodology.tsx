import { useState } from 'react'
import type { Theme } from './Dashboard'

/**
 * AlphaPlaybook — Methodology tab (the Decision Engine).
 * Matches the app's newspaper aesthetic + Theme prop pattern.
 *
 * DYNAMIC DATA:
 *   - Pass the latest `snapshot` (same DailySnapshot the other tabs use).
 *   - Capex read + current Visser stage are read from the snapshot when present,
 *     with safe fallbacks so the tab never renders stale/blank.
 *
 * To wire in Dashboard.tsx:
 *   import Methodology from './Methodology'
 *   ...add 'methodology' to the Tab type and tabs[] array...
 *   {activeTab === 'methodology' && <Methodology snapshot={latestSnapshot} theme={t} />}
 *
 * BACKEND (optional): to make capex/stage truly live, add two columns to
 * daily_snapshots and have daily-cron write them:
 *   - capex_yoy_pct    (number)  e.g. 77
 *   - visser_stage     (integer) 1..5  (the "thesis clock")
 * If absent, the fallbacks below are used.
 */

interface DecisionSnapshot {
  capex_yoy_pct?: number | null
  visser_stage?: number | null
  snapshot_date?: string | null
}

const STAGES: Record<number, { name: string; assets: string }> = {
  1: { name: 'Memory', assets: 'past — exhausted' },
  2: { name: 'Optical / Chemicals', assets: 'still working — MRVL, GLW' },
  3: { name: 'Power + Silver', assets: 'NOW — AIPO, XLU, SLV, BTC, power' },
  4: { name: 'Tokenization', assets: '~Jul 2026 — ETHA, HOOD, COIN' },
  5: { name: 'Agentic / Humanoids', assets: '2027+ — TSLA, robotics, BOTZ' },
}

const SIGNALS = [
  { id: 'S1', name: 'Bottleneck', w: 25, d: 'Two scarcity spines: AI inputs (power, compute, memory) AND monetary scarcity (gold, silver, BTC in a debasement regime). Co-equal. Tightly scoped — a random growth stock cannot claim "scarcity."' },
  { id: 'S2', name: 'Timing', w: 20, d: "Is the bottleneck binding NOW in Visser's 5-stage cycle? Stage 3 (Power + Silver) is current." },
  { id: 'S5', name: 'Entry Quality', w: 20, d: 'ANTI-MOMENTUM. A name up large is a reason to own LESS — the asymmetry decayed. Pullback / down = high; parabolic = penalized hard. No fundamental cushion: signals stay independent.' },
  { id: 'S4', name: 'Catalyst', w: 15, d: 'Asset-type routed. Company: earnings, >100MW deals, launches. Hard-money: each on its OWN driver (silver deficit, gold/CB buying, BTC ETF flows), informed by liquid Kalshi/Polymarket macro odds.' },
  { id: 'S6', name: 'Valuation / Crowding', w: 10, d: 'Over-owned or over-valued? Forward P/E, IV percentile, insider selling.' },
  { id: 'CV', name: 'Convergence', w: 10, d: 'How many of the 3 lenses agree — Visser / Aschenbrenner / Camillo. 3=100, 2=60, 1=20.' },
]

const LOOP: [string, string, string][] = [
  ['1', 'Feed in transcripts (Visser, Camillo, Aschenbrenner…)', 'YOU'],
  ['2', 'Parse themes from transcripts', 'CLAUDE'],
  ['3', 'Themes → candidate tickers (with tradeoffs)', 'CLAUDE'],
  ['4', 'Gather 6 signals (web search) → composite', 'CLAUDE / ENGINE'],
  ['5', 'Composite → exact weights → shares', 'ENGINE'],
  ['6', 'Entry/exit flags · then execution timing', 'ENGINE / YOU'],
  ['7', 'New transcript → diff themes → re-score → loop', 'CLAUDE'],
]

const PIPELINE = [
  { n: '01', t: 'Inputs', d: 'Search the web to score the 6 signals per ticker + the portfolio-wide capex read.' },
  { n: '02', t: 'Score', d: 'Weighted sum x capex multiplier = composite (0-100).' },
  { n: '03', t: 'Decide', d: 'Composite maps to an action and a position-size tier.' },
  { n: '04', t: 'Normalize', d: 'Convert to exact weights summing to 100%, respecting hard risk caps.' },
  { n: '05', t: 'Act', d: 'Scorecard + weights + share counts + exit flags. You approve every trade.' },
]

const DECISION = [
  { range: '>= 78', action: 'Strong Entry', tier: 'Top conviction', wt: 'highest weight', tone: 'pos' },
  { range: '65-77', action: 'Enter', tier: 'Core', wt: 'mid-high', tone: 'pos' },
  { range: '55-64', action: 'Starter / Watch', tier: 'Satellite', wt: 'mid-low', tone: 'mid' },
  { range: '45-54', action: 'Hold (no new entry)', tier: 'Floor', wt: '2% floor', tone: 'mid' },
  { range: '< 45', action: 'Avoid / Exit', tier: '-', wt: '0%', tone: 'neg' },
]

const TRIGGERS: [string, string][] = [
  ['Composite drops >= 10 pts since last run', 'Trim one tier down'],
  ['Composite drops >= 20 pts', 'Exit fully'],
  ['Visser stage flips (e.g. memory peaks)', 'Trim that sleeve 25-50%'],
  ['Name parabolic AND position up > 50%', 'Sell ~1/3, keep core'],
  ['Valuation flips to bubble + insider selling', 'Cap position; no adds'],
  ['Capex cascade RED two quarters running', 'Trim high-beta 25%, raise cash'],
  ['Capex cascade NEGATIVE', 'Defensive: shift to SGOV / XLU / GLDM / XLV'],
  ['Thesis break (bottleneck resolved/bypassed)', 'Exit regardless of price'],
]

const CADENCE: [string, string][] = [
  ['WEEKLY', 'Refresh fast signals only - catalysts (S4) + price/momentum (S5). Re-run on held names. Check exit/trim flags.'],
  ['MONTHLY', 'Full re-score of all 6 signals. Run normalizer, compare to current book, rebalance. Save run to state.'],
  ['QUARTERLY', "Re-check the thesis stage. Update the 'thesis clock' (current stage) + tier baselines. Aligns with 13F season + earnings."],
  ['EVENT-DRIVEN', 'Re-run affected names on any >100MW power contract, hyperscaler capex revision, or a contributor changing stance.'],
]

function capexRegime(yoy: number) {
  if (yoy >= 40) return { label: 'GREEN', mult: 'x1.00', tone: 'pos' as const }
  if (yoy >= 25) return { label: 'AMBER', mult: 'x0.92', tone: 'mid' as const }
  if (yoy >= 0) return { label: 'RED', mult: 'x0.82', tone: 'neg' as const }
  return { label: 'NEGATIVE', mult: 'x0.65', tone: 'neg' as const }
}

export default function Methodology({ snapshot, theme: t }: { snapshot: DecisionSnapshot | null; theme: Theme }) {
  const [open, setOpen] = useState<string | null>('S1')

  const capexYoY = snapshot?.capex_yoy_pct ?? 77
  const stageNum = snapshot?.visser_stage ?? 3
  const regime = capexRegime(capexYoY)
  const stage = STAGES[stageNum] ?? STAGES[3]
  const toneColor = (tone: string) => (tone === 'pos' ? t.positive : tone === 'neg' ? t.negative : t.accent)

  const serif = "'Libre Baskerville', Georgia, serif"
  const display = "'Playfair Display', Georgia, serif"
  const mono = 'ui-monospace, SFMono-Regular, monospace'

  const card = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    background: t.cardPrimary, border: '1px solid ' + t.border, borderRadius: 8, ...extra,
  })
  const h2: React.CSSProperties = {
    fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase', color: t.textSecondary,
    borderBottom: '1px solid ' + t.border, paddingBottom: 8, margin: '32px 0 16px', fontFamily: serif, fontWeight: 700,
  }

  return (
    <div style={{ fontFamily: serif, color: t.textPrimary }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
      <style>{`
        .de-pipe { display:grid; grid-template-columns:repeat(5,1fr); gap:0; }
        .de-capex { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
        .de-dec { display:grid; grid-template-columns:.7fr 1.1fr 1fr 1.3fr; gap:10px; align-items:center; }
        .de-trow { display:grid; grid-template-columns:1.6fr 1fr; gap:14px; align-items:center; }
        .de-cad { display:grid; grid-template-columns:130px 1fr; gap:14px; align-items:center; }
        @media (max-width:768px){
          .de-pipe{ grid-template-columns:1fr; }
          .de-capex{ grid-template-columns:1fr 1fr; }
          .de-dec{ grid-template-columns:1fr 1fr; }
          .de-dec .de-hide{ display:none; }
          .de-trow,.de-cad{ grid-template-columns:1fr; }
        }
      `}</style>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: t.accent, fontFamily: serif, fontWeight: 700 }}>Methodology</div>
        <h1 style={{ fontFamily: display, fontSize: 38, fontWeight: 900, margin: '6px 0 10px', letterSpacing: -0.5, color: t.textPrimary }}>The Decision Engine</h1>
        <p style={{ color: t.textSecondary, fontSize: 14, lineHeight: 1.6, maxWidth: 680, margin: 0, fontFamily: serif }}>
          Every ticker runs through the same six questions, scored and weighted into a single conviction number, then converted into exact target weights. Decision-support, not autopilot: you approve every trade.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
          <div style={{ ...card({ padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: 8 }), borderColor: toneColor(regime.tone) }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: toneColor(regime.tone), display: 'inline-block' }} />
            <span style={{ fontSize: 12.5, color: t.textSecondary }}>Capex cascade:&nbsp;
              <b style={{ color: toneColor(regime.tone) }}>{regime.label}</b>
              &nbsp;/ +{capexYoY}% YoY / mult <span style={{ fontFamily: mono }}>{regime.mult}</span>
            </span>
          </div>
          <div style={card({ padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: 8 })}>
            <span style={{ fontSize: 12.5, color: t.textSecondary }}>Thesis clock:&nbsp;
              <b style={{ color: t.accent }}>Stage {stageNum} - {stage.name}</b>
              <span style={{ color: t.textTertiary }}>&nbsp;({stage.assets})</span>
            </span>
          </div>
        </div>
      </div>

      <div style={h2}>The pipeline</div>
      <div className="de-pipe">
        {PIPELINE.map((p, i) => (
          <div key={p.n} style={card({ padding: '15px 14px', borderRadius: i === 0 ? '8px 0 0 8px' : i === PIPELINE.length - 1 ? '0 8px 8px 0' : 0, borderRight: i === PIPELINE.length - 1 ? '1px solid ' + t.border : 'none', position: 'relative' })}>
            <div style={{ fontSize: 11, color: t.accent, fontWeight: 700, letterSpacing: 1, fontFamily: mono }}>{p.n}</div>
            <div style={{ fontSize: 15, fontWeight: 700, margin: '3px 0 5px', fontFamily: display, color: t.textPrimary }}>{p.t}</div>
            <div style={{ fontSize: 11.5, color: t.textSecondary, lineHeight: 1.45 }}>{p.d}</div>
          </div>
        ))}
      </div>

      <div style={h2}>The loop <span style={{ textTransform: 'none', letterSpacing: 0, color: t.textTertiary, fontWeight: 400 }}>- who does what</span></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {LOOP.map(([n, what, who]) => {
          const isYou = who.includes('YOU')
          const isEngine = who === 'ENGINE'
          const whoColor = isYou ? '#a78bfa' : isEngine ? t.negative : t.positive
          return (
            <div key={n} style={{ ...card({ padding: '10px 14px' }), display: 'grid', gridTemplateColumns: '26px 1fr auto', gap: 12, alignItems: 'center' }}>
              <span style={{ fontFamily: mono, fontWeight: 800, color: t.accent, fontSize: 13, textAlign: 'center' }}>{n}</span>
              <span style={{ fontSize: 13, color: t.textPrimary }}>{what}</span>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: whoColor, border: '1px solid ' + whoColor, borderRadius: 5, padding: '2px 8px', whiteSpace: 'nowrap' }}>{who}</span>
            </div>
          )
        })}
      </div>
      <p style={{ fontSize: 12, color: t.textTertiary, marginTop: 10, lineHeight: 1.5, fontStyle: 'italic', fontFamily: serif }}>
        Claude owns every judgment step (themes, ticker discovery, reading signals, theme-change detection) — always with your approval. The engine owns the deterministic math (signal→score, score→weight). You are the approval gate throughout.
      </p>

      <div style={h2}>1. The six signals <span style={{ textTransform: 'none', letterSpacing: 0, color: t.textTertiary, fontWeight: 400 }}>- tap to expand</span></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {SIGNALS.map((s) => {
          const isOpen = open === s.id
          return (
            <button key={s.id} onClick={() => setOpen(isOpen ? null : s.id)}
              style={{ ...card({ padding: '13px 15px' }), borderColor: isOpen ? t.accent : t.border, cursor: 'pointer', textAlign: 'left', font: 'inherit', color: 'inherit', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: t.accent, background: t.tickerBg, borderRadius: 6, padding: '2px 8px', minWidth: 34, textAlign: 'center' }}>{s.id}</span>
                <span style={{ fontWeight: 700, fontSize: 14, minWidth: 150, fontFamily: serif }}>{s.name}</span>
                <span style={{ flex: 1, height: 6, background: t.surfaceSubtle, borderRadius: 4, overflow: 'hidden' }}>
                  <span style={{ display: 'block', height: '100%', width: (s.w * 2.5) + '%', background: t.accent, borderRadius: 4 }} />
                </span>
                <span style={{ fontFamily: mono, fontWeight: 700, fontSize: 13, minWidth: 36, textAlign: 'right' }}>{s.w}%</span>
              </div>
              {isOpen && <div style={{ color: t.textSecondary, fontSize: 13, lineHeight: 1.5, marginTop: 10, paddingLeft: 46 }}>{s.d}</div>}
            </button>
          )
        })}
      </div>
      <div style={card({ marginTop: 14, padding: '13px 15px', borderStyle: 'dashed', fontFamily: mono, fontSize: 12.5, color: t.textSecondary, textAlign: 'center' })}>
        composite = ( S1*.25 + S2*.20 + S5*.20 + S4*.15 + S6*.10 + Conv*.10 ) <b style={{ color: t.accent }}>x capex multiplier</b>
      </div>

      <div style={h2}>2. The capex multiplier <span style={{ textTransform: 'none', letterSpacing: 0, color: t.textTertiary, fontWeight: 400 }}>- the portfolio-wide circuit breaker</span></div>
      <div className="de-capex">
        {[
          { l: 'GREEN', s: '>= 40% YoY', m: 'x1.00', tone: 'pos' },
          { l: 'AMBER', s: '25-40%', m: 'x0.92', tone: 'mid' },
          { l: 'RED', s: '< 25%', m: 'x0.82', tone: 'neg' },
          { l: 'NEGATIVE', s: 'shrinking', m: 'x0.65', tone: 'neg' },
        ].map((c) => {
          const active = c.l === regime.label
          return (
            <div key={c.l} style={card({ padding: 14, textAlign: 'center', borderColor: active ? toneColor(c.tone) : t.border, background: active ? t.surfaceSubtle : t.cardPrimary })}>
              <b style={{ display: 'block', fontSize: 14, letterSpacing: 0.5, color: toneColor(c.tone), fontFamily: serif }}>{c.l}</b>
              <span style={{ display: 'block', fontSize: 11.5, color: t.textTertiary, margin: '3px 0 6px' }}>{c.s}</span>
              <em style={{ fontStyle: 'normal', fontFamily: mono, fontWeight: 700, fontSize: 15, color: toneColor(c.tone) }}>{c.m}</em>
            </div>
          )
        })}
      </div>

      <div style={h2}>3. Composite to action to size</div>
      <div style={card({ overflow: 'hidden' })}>
        <div className="de-dec" style={{ padding: '11px 15px', background: t.surfaceSubtle, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: t.textTertiary, fontWeight: 700 }}>
          <span>Composite</span><span>Action</span><span className="de-hide">Tier</span><span className="de-hide">Target weight</span>
        </div>
        {DECISION.map((d) => (
          <div key={d.range} className="de-dec" style={{ padding: '11px 15px', borderTop: '1px solid ' + t.border, fontSize: 13 }}>
            <span style={{ fontFamily: mono, fontWeight: 700 }}>{d.range}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <i style={{ width: 8, height: 8, borderRadius: '50%', background: toneColor(d.tone), display: 'inline-block' }} />{d.action}
            </span>
            <span className="de-hide" style={{ color: t.textSecondary }}>{d.tier}</span>
            <span className="de-hide" style={{ color: t.textTertiary }}>{d.wt}</span>
          </div>
        ))}
      </div>
      <div style={card({ marginTop: 12, padding: '11px 14px', borderLeft: '3px solid ' + t.accent, borderRadius: '0 8px 8px 0', fontSize: 12, color: t.textSecondary, lineHeight: 1.5 })}>
        <b style={{ color: t.textPrimary }}>One set of numbers.</b> Weight is conviction-proportional, scaled so the top name hits the target (18% aggressive / 11% conservative). Conviction enters through the scores, never a post-hoc override &mdash; if a weight feels wrong, fix the score. No single-stock cap; the capped top, 2% per-name floor, and cash floor are the long-only substitute for a put-hedge.
      </div>

      <div style={h2}>4. When to act - exit & trim triggers</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {TRIGGERS.map(([trig, act]) => (
          <div key={trig} className="de-trow" style={card({ padding: '11px 15px', fontSize: 13 })}>
            <span style={{ color: t.textPrimary }}>{trig}</span>
            <span style={{ color: t.accent, fontWeight: 700, textAlign: 'right' }}>{act}</span>
          </div>
        ))}
      </div>

      <div style={h2}>5. When to run it</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {CADENCE.map(([tag, what]) => (
          <div key={tag} className="de-cad" style={card({ padding: '12px 15px' })}>
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, color: t.badgeText, background: t.badgeBg, padding: '4px 10px', borderRadius: 5, textAlign: 'center', fontFamily: serif }}>{tag}</span>
            <span style={{ fontSize: 13, color: t.textSecondary, lineHeight: 1.45 }}>{what}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: t.textTertiary, marginTop: 12, lineHeight: 1.5, fontStyle: 'italic', fontFamily: serif }}>
        The only field edited routinely is the <b style={{ fontStyle: 'normal', color: t.textSecondary }}>thesis clock</b> - flip the stage when the cycle rotates (e.g. 3 to 4 when tokenization binds, ~Jul 2026). That single change re-weights every timing score.
      </p>

      <div style={{ marginTop: 28, paddingTop: 16, borderTop: '1px solid ' + t.border, fontSize: 12, color: t.textTertiary, lineHeight: 1.6, fontStyle: 'italic', fontFamily: serif }}>
        Search, score, normalize, approve, deploy, log, next run diffs for exits. Pro-cyclical by design; the capex multiplier and exit triggers are the circuit breakers. Decision-support only.
      </div>
    </div>
  )
}
