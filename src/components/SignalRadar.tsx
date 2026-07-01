import type { CSSProperties } from 'react'
import type { Theme } from './Dashboard'

const ACCENT = '#e0915c'

const glass: CSSProperties = {
  background: 'rgba(30,29,27,0.38)',
  backdropFilter: 'blur(32px) saturate(132%)',
  WebkitBackdropFilter: 'blur(32px) saturate(132%)',
  border: '1px solid rgba(255,255,255,0.11)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
}

// Visser's 5-stage AI cycle — the framework the Thesis Clock points at.
const STAGES: { n: number; name: string; status: string }[] = [
  { n: 1, name: 'Memory', status: 'working' },
  { n: 2, name: 'Optical · chem', status: 'working' },
  { n: 3, name: 'Power · silver', status: 'now' },
  { n: 4, name: 'Tokenization', status: 'Jul catalyst' },
  { n: 5, name: 'Agentic', status: '2027+' },
]

/**
 * Signal Radar — a qualitative snapshot of what Visser (via his own pod + Pomp's)
 * is currently emphasizing. NOT scores or weights (that's the Decision Engine /
 * Portfolio tab). This is the "what's he talking about and which way is it trending"
 * radar — the early-warning layer that tells you WHEN themes/stage are shifting.
 *
 * UPDATE WORKFLOW: when you upload new Visser/Pomp transcripts, Claude regenerates
 * the RADAR const below and you swap it in (one-block edit), commit, push.
 * Snapshot-with-direction-arrows; sourced from the latest ~5 podcasts.
 */

type Direction = 'up' | 'down' | 'flat'

interface RadarTheme {
  name: string
  direction: Direction      // is he emphasizing this MORE or LESS lately
  note: string              // one-line of what he's saying
}

interface RadarData {
  asOf: string
  stageCall: { stage: number; name: string; status: string; shift: string }
  themes: RadarTheme[]
  notableMoves: string[]
  sources: string
}

// ============================================================================
// Generated from the latest ~5 Visser / Pomp podcasts (as of 2026-06-09;
// evidence: 6/3 TFTC, 6/6 Pomp, 6/7 solo).
// Swap this whole const when new transcripts are uploaded.
// ============================================================================
const RADAR: RadarData = {
  asOf: 'June 2026 · Visser',
  stageCall: {
    stage: 3,
    name: 'Power + Silver',
    status: 'binding now',
    shift: 'Signaling rotation toward Stage 4 (Tokenization) — DTCC launch July 2026, watching BTC/ETH 50-day MA as the trigger.',
  },
  themes: [
    { name: 'Crypto / Bitcoin', direction: 'up',   note: 'Calls BTC the "next parabola" — same consolidation pattern as Micron before its run. Watching 50-day MA for confirmation.' },
    { name: 'Tokenization / ETH', direction: 'up',   note: 'Bought ETH. "AI agents need food and that food is tokens." DTCC tokenization launch July 2026.' },
    { name: 'Silver',            direction: 'up',   note: '"No-brainer" — dual industrial + monetary, 6th-year supply deficit, gold/silver ratio compressing.' },
    { name: 'Copper',            direction: 'up',   note: 'Rotation target alongside silver — grid + EV/humanoid demand.' },
    { name: 'AI Application / Eli Lilly', direction: 'up', note: 'New conviction. Peptides are "the API key for the human body." Thinks LLY can be "the largest company in the world" within 5 years — a specialized model on 150 years of trial data. Drug discovery as "human software."' },
    { name: 'Energy / Oil',      direction: 'up',   note: 'Bought Exxon & Chevron — "defensive safe names" as the chip names turn volatile. Hormuz still shut; oil could migrate higher (tail: "$300 oil"). The hedge on the other side of the AI book.' },
    { name: 'Power / Nuclear',   direction: 'flat', note: 'Still the binding bottleneck (Stage 3). Structural hold, not adding aggressively. Batteries (Fluence) reaffirmed as "a necessity."' },
    { name: 'Semiconductors',    direction: 'down', note: 'Taking profits in parabolic semis. Exhaustion model flagging extended AI momentum names; chip names getting more volatile.' },
    { name: 'Memory (MU)',       direction: 'down', note: 'Fully out of Micron (5/17) after a 5-8x run. Explicitly profit-taking, NOT bearish — "I will be looking to accumulate" silver and Bitcoin instead. The rotation in one move.' },
  ],
  notableMoves: [
    'Bought Exxon & Chevron (→ XLE) — energy as a defensive hedge vs AI-name volatility + Hormuz risk',
    'Initiated Eli Lilly (LLY) — peptides / "human software" drug-discovery thesis, application layer',
    'Sold entire Micron (MU) position — trimming names that already had their parabolic move',
    'Bought Ether (ETH) — tokenization / AI-agent demand thesis',
    'Watching Bitcoin & ETH 50-day moving average as the next-parabola signal',
    'Dogecoin as the "retail fire" canary for crypto risk-on',
  ],
  sources: 'Visser — last ~5 podcasts (his own + Pomp). Visser-only; Camillo not feeding radar.',
}

const DIR: Record<Direction, { arrow: string; color: string; label: string }> = {
  up:   { arrow: '↑', color: '#7dba6a', label: 'heating up' },
  down: { arrow: '↓', color: '#c66b5a', label: 'cooling' },
  flat: { arrow: '→', color: '#8a7e6e', label: 'steady' },
}

export default function SignalRadar({ theme: t }: { theme: Theme }) {
  const serif = "'Libre Baskerville', Georgia, serif"
  const display = "'Playfair Display', Georgia, serif"

  return (
    <div style={{ ...glass, borderRadius: 14, padding: '20px 24px', marginTop: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2px 12px', marginBottom: 4 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: t.textPrimary, fontFamily: display }}>Signal Radar</span>
        <span style={{ fontSize: 11, color: t.textTertiary }}>{RADAR.sources} · {RADAR.asOf}</span>
      </div>
      <div style={{ fontSize: 11, color: t.textTertiary, marginBottom: 16, fontStyle: 'italic' }}>
        What Visser is emphasizing now — and which way it's trending. Themes &amp; stage, not weights.
      </div>

      {/* Thesis Clock — the 5-stage cycle, current stage lit */}
      <style>{`
        .ap-stages { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
        @media (max-width: 560px) { .ap-stages { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: ACCENT, fontWeight: 700, fontFamily: serif }}>Thesis Clock</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: t.textPrimary, fontFamily: display }}>
            Stage {RADAR.stageCall.stage} — {RADAR.stageCall.name}
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'rgba(125,186,106,0.15)', color: '#7dba6a' }}>{RADAR.stageCall.status}</span>
        </div>

        <div className="ap-stages" style={{ marginBottom: 12 }}>
          {STAGES.map((s) => {
            const on = s.n === RADAR.stageCall.stage
            return (
              <div key={s.n} style={{
                background: on ? 'rgba(224,145,92,0.12)' : t.surfaceSubtle,
                border: `1px solid ${on ? 'rgba(224,145,92,0.4)' : t.border}`,
                borderRadius: 10, padding: '11px 12px',
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: on ? ACCENT : t.textTertiary, marginBottom: 5 }}>S{s.n}</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: on ? t.textPrimary : t.textSecondary, fontFamily: serif, lineHeight: 1.2, marginBottom: 7 }}>{s.name}</div>
                <span style={{
                  display: 'inline-block', fontSize: 9.5, padding: '2px 7px', borderRadius: 4,
                  background: on ? 'rgba(224,145,92,0.18)' : 'rgba(255,255,255,0.04)',
                  color: on ? '#eaa877' : t.textTertiary,
                }}>{s.status}</span>
              </div>
            )
          })}
        </div>

        <div style={{ fontSize: 12.5, color: t.textSecondary, lineHeight: 1.5, paddingLeft: 12, borderLeft: `3px solid ${ACCENT}` }}>{RADAR.stageCall.shift}</div>
      </div>

      {/* Themes with direction arrows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {RADAR.themes.map((th, i) => {
          const d = DIR[th.direction]
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', background: t.surfaceSubtle, borderRadius: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: d.color, lineHeight: 1.2, minWidth: 18, textAlign: 'center' }}>{d.arrow}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: t.textPrimary, fontFamily: serif }}>{th.name}</span>
                  <span style={{ fontSize: 10, color: d.color, fontWeight: 600 }}>{d.label}</span>
                </div>
                <div style={{ fontSize: 12, color: t.textSecondary, lineHeight: 1.45 }}>{th.note}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Notable moves */}
      <div>
        <div style={{ fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: t.textTertiary, fontWeight: 700, marginBottom: 8, fontFamily: serif }}>Notable position moves</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {RADAR.notableMoves.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: t.textSecondary, lineHeight: 1.4 }}>
              <span style={{ color: t.accent, fontWeight: 700 }}>·</span>
              <span>{m}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footnote */}
      <div style={{ fontSize: 10, color: t.textTertiary, marginTop: 16, paddingTop: 12, borderTop: `1px solid ${t.border}`, fontStyle: 'italic', lineHeight: 1.4 }}>
        Descriptive radar — tracks what the voices are saying to flag when themes or the stage are shifting. Not investment advice. Weights come from the Decision Engine (Portfolio tab).
      </div>
    </div>
  )
}
