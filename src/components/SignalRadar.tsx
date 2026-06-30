import type { CSSProperties } from 'react'
import type { Theme } from './Dashboard'

const ACCENT = '#e0915c'

const glass: CSSProperties = {
  background: 'rgba(26,26,29,0.40)',
  backdropFilter: 'blur(30px) saturate(120%)',
  WebkitBackdropFilter: 'blur(30px) saturate(120%)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)',
}

const THEME_META: { name: string; tag: string; blurb: string; binding?: boolean }[] = [
  { name: 'AI Compute',        tag: 'binding now',  blurb: 'Power + chips + copper; trimming parabolic semis.', binding: true },
  { name: 'AI Application',    tag: 'up the stack', blurb: 'LLY "human software," AMZN efficiency flywheel.' },
  { name: 'Tokenization',      tag: 'rotating in',  blurb: 'Agents need food; that food is tokens.' },
  { name: 'Monetary Scarcity', tag: 'paused <200',  blurb: 'Silver no-brainer, BTC next parabola; buying weakness.' },
]

interface Holding { ticker?: string; category?: string }

export default function SignalRadar({ theme: t, portfolio }: { theme: Theme; portfolio?: Holding[] | null }) {
  const display = "'Playfair Display', Georgia, serif"

  const holdings: Holding[] = Array.isArray(portfolio) ? portfolio : []
  const tickersFor = (name: string): string[] => {
    const seen: string[] = []
    for (const h of holdings) {
      if (!h || h.category !== name || !h.ticker) continue
      const sym = String(h.ticker)
      if (!seen.includes(sym)) seen.push(sym)
    }
    return seen
  }

  const Chip = ({ sym }: { sym: string }) => (
    <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 9.5, color: ACCENT, background: 'rgba(224,145,92,0.15)', padding: '1px 5px', borderRadius: 3 }}>{sym}</span>
  )

  return (
    <div style={{ ...glass, borderRadius: 14, padding: '20px 24px', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2px 12px', marginBottom: 14 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: t.textPrimary, fontFamily: display }}>Themes</span>
        <span style={{ fontSize: 11, color: t.textTertiary }}>Visser · June 2026</span>
      </div>

      <style>{`
        .ap-theme-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        @media (max-width: 720px) { .ap-theme-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
      <div className="ap-theme-grid" style={{ marginBottom: 12 }}>
        {THEME_META.map((m) => {
          const syms = tickersFor(m.name)
          return (
            <div key={m.name} style={{
              background: m.binding ? 'rgba(224,145,92,0.10)' : t.surfaceSubtle,
              border: `1px solid ${m.binding ? ACCENT : t.border}`,
              borderRadius: 10, padding: '12px 11px', display: 'flex', flexDirection: 'column',
            }}>
              <span style={{
                alignSelf: 'flex-start', fontSize: 10, marginBottom: 7, padding: '1px 7px', borderRadius: 4,
                background: m.binding ? ACCENT : 'rgba(255,255,255,0.07)',
                color: m.binding ? '#1a1a1d' : t.textSecondary,
              }}>{m.tag}</span>
              <span style={{ fontSize: 15, color: t.textPrimary, fontFamily: display, lineHeight: 1.2, marginBottom: 5 }}>{m.name}</span>
              <span style={{ fontSize: 11.5, color: t.textSecondary, lineHeight: 1.45, marginBottom: 10 }}>{m.blurb}</span>
              <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 'auto' }}>
                {syms.length ? syms.map((s) => <Chip key={s} sym={s} />) : <span style={{ fontSize: 10, color: t.textTertiary }}>—</span>}
              </span>
            </div>
          )
        })}
      </div>

      <div style={{ fontSize: 11, color: t.textTertiary, margin: '0 2px' }}>
        Watch · Robotics / physical autonomy — Stage 5, 2027+ <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>KOID</span>
      </div>
    </div>
  )
}
