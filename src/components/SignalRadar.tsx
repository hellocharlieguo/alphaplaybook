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

const THEME_META: { name: string; tag: string; blurb: string; binding?: boolean }[] = [
  { name: 'AI Buildout',     tag: 'Agents eat compute',     blurb: 'Visser: AI agents are a new kind of demand that will number in the billions. \u201cWe will not have enough compute for the agents.\u201d Lumentum, an optical-parts maker, says it is sold out through 2029.', binding: true },
  { name: 'AI Applied',      tag: 'Don\u2019t pick the assistant', blurb: 'Big tech now fights over the same customers with personal AI assistants. Visser: \u201cI don\u2019t know how these guys are going to make money off of it.\u201d He would rather own the computing power they all need.' },
  { name: 'Tokenized Rails', tag: 'Crypto is about agents', blurb: '\u201cWhen it comes to crypto, this is 100% for me about agents.\u201d Stripe, Samsung and OKX are building stablecoin and tokenized-stock rails, and he named privacy as a new theme.' },
  { name: 'Monetary',        tag: 'Be patient on bitcoin',  blurb: 'Bitcoin is in a bull market that needs patience: \u201cFor Christ\u2019s sake, be patient.\u201d Crypto rose this year even as rates climbed and gold fell.' },
]

interface Holding { ticker?: string; category?: string }

export default function SignalRadar({ theme: t, portfolio }: { theme: Theme; portfolio?: Holding[] | null }) {
  const display = "'Manrope', sans-serif"

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
    <span style={{ fontFamily: "'Manrope', sans-serif", fontVariantNumeric: 'tabular-nums', fontSize: 9.5, color: ACCENT, background: 'rgba(224,145,92,0.15)', padding: '1px 5px', borderRadius: 3 }}>{sym}</span>
  )

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2px 12px', marginBottom: 14 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: t.textPrimary, fontFamily: display }}>Themes</span>
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
              ...glass,
              borderRadius: 10, padding: '12px 11px', display: 'flex', flexDirection: 'column',
            }}>
              <span style={{
                alignSelf: 'flex-start', fontSize: 10, marginBottom: 7, padding: '1px 7px', borderRadius: 4,
                background: 'rgba(255,255,255,0.07)',
                color: t.textSecondary,
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
    </div>
  )
}
