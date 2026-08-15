import { useEffect, useRef, useState } from 'react'
import type { Theme } from './Dashboard'
import {
  STAGE_W, STAGE_H, SYS_LANES, SYS_NODES, SYS_EDGES, SYS_EDGE_TRACKS,
  SYS_LABELS, SYS_DETAILS, RETICLE,
} from '../data/systemMap'
import type { Block } from '../data/systemMap'

// System tab — the pipeline as a tilted node graph. Display-only: reads nothing,
// writes nothing. Content lives in src/data/systemMap.ts.
//
// Depth budget (translateZ): reticle -70 / lanes -30 / wires -14 / nodes 0
// / hover +34 / selected +72. Perspective 1500px on the wrapper.

const HUMAN = '#d8c46a' // human-gate amber; System-tab semantics, not a global token
const GLASS = 'rgba(30,29,27,0.38)'
const GLASS_DEEP = 'rgba(20,20,22,0.92)'
const BLUR = 'blur(32px) saturate(132%)'
const INSET = 'inset 0 1px 0 rgba(255,255,255,0.08)'

export default function SystemTab({ theme }: { theme: Theme }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [parallax, setParallax] = useState(true)
  const stageRef = useRef<HTMLDivElement>(null)

  // Parallax: rAF-throttled writes to two CSS custom properties. The declared
  // transition on .sys-stage eases the tilt rather than snapping per frame.
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    if (!parallax) {
      stage.style.setProperty('--ry', '0deg')
      stage.style.setProperty('--rx', '0deg')
      return
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.innerWidth <= 1100) return

    let raf = 0
    let px = 0
    let py = 0
    const apply = () => {
      raf = 0
      stage.style.setProperty('--ry', (px * 7).toFixed(2) + 'deg')
      stage.style.setProperty('--rx', (-py * 4).toFixed(2) + 'deg')
    }
    const onMove = (e: MouseEvent) => {
      px = e.clientX / window.innerWidth - 0.5
      py = e.clientY / window.innerHeight - 0.5
      if (!raf) raf = window.requestAnimationFrame(apply)
    }
    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [parallax])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const detail = selected ? SYS_DETAILS[selected] : null

  const accentRGBA = (a: number) => hexToRgba(theme.accent, a)

  const css = `
.sys-persp { perspective: 1500px; perspective-origin: 50% 42%; }
.sys-stage {
  position: relative; width: ${STAGE_W}px; height: ${STAGE_H}px;
  transform-style: preserve-3d;
  transform: rotateX(13deg) rotateY(var(--ry, 0deg)) rotateX(var(--rx, 0deg));
  transition: transform .45s cubic-bezier(.2,.7,.3,1);
}
.sys-svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.sys-wires { transform: translateZ(-14px); }
.sys-reticle { transform: translateZ(-70px); opacity: .55; }
.sys-lane {
  position: absolute; border: 1px solid ${theme.border}; border-radius: 10px;
  background: linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0));
  transform: translateZ(-30px);
}
.sys-lane-label {
  position: absolute; top: -9px; left: 16px; background: ${theme.bg}; padding: 0 8px;
  font-family: ui-monospace, Menlo, monospace; font-size: 9.5px; letter-spacing: .18em;
  color: ${theme.textTertiary}; text-transform: uppercase;
}
.sys-node {
  position: absolute; width: 150px; min-height: 86px; text-align: left;
  background: ${GLASS}; backdrop-filter: ${BLUR}; -webkit-backdrop-filter: ${BLUR};
  border: 1px solid ${theme.border}; border-radius: 8px; box-shadow: ${INSET};
  padding: 10px 11px; color: inherit; font-family: inherit; cursor: pointer;
  transform-style: preserve-3d;
  transition: transform .3s cubic-bezier(.2,.7,.3,1), box-shadow .3s, border-color .3s;
}
.sys-node::before {
  content: ''; position: absolute; inset: 3px; border-radius: 5px; pointer-events: none; opacity: .55;
  background:
    linear-gradient(${theme.textTertiary},${theme.textTertiary}) 0 0/8px 1px no-repeat,
    linear-gradient(${theme.textTertiary},${theme.textTertiary}) 0 0/1px 8px no-repeat,
    linear-gradient(${theme.textTertiary},${theme.textTertiary}) 100% 100%/8px 1px no-repeat,
    linear-gradient(${theme.textTertiary},${theme.textTertiary}) 100% 100%/1px 8px no-repeat;
}
.sys-node:hover {
  transform: translateZ(34px); border-color: ${theme.textTertiary};
  box-shadow: ${INSET}, 0 14px 34px rgba(0,0,0,.45);
}
.sys-node:focus-visible { outline: 2px solid ${theme.accent}; outline-offset: 3px; }
.sys-node.is-sel {
  transform: translateZ(72px); border-color: ${accentRGBA(0.7)};
  box-shadow: ${INSET}, 0 0 34px ${accentRGBA(0.24)}, 0 18px 44px rgba(0,0,0,.5);
}
.sys-node.is-sel::before {
  opacity: 1;
  background:
    linear-gradient(${theme.accent},${theme.accent}) 0 0/10px 1px no-repeat,
    linear-gradient(${theme.accent},${theme.accent}) 0 0/1px 10px no-repeat,
    linear-gradient(${theme.accent},${theme.accent}) 100% 100%/10px 1px no-repeat,
    linear-gradient(${theme.accent},${theme.accent}) 100% 100%/1px 10px no-repeat;
}
.sys-eb { font-family: ui-monospace, Menlo, monospace; font-size: 8.5px; letter-spacing: .16em;
  text-transform: uppercase; color: ${theme.textTertiary}; margin-bottom: 4px; }
.sys-nt { font-size: 12.5px; font-weight: 600; line-height: 1.22; letter-spacing: -.005em; color: ${theme.textPrimary}; }
.sys-nd { font-family: ui-monospace, Menlo, monospace; font-size: 9.5px; color: ${theme.textSecondary};
  line-height: 1.5; margin-top: 5px; }
.sys-ring { position: absolute; top: 9px; right: 9px; width: 8px; height: 8px; border-radius: 50%;
  border: 1.5px solid ${theme.positive}; }
.sys-ring::after { content: ''; position: absolute; inset: -4px; border-radius: 50%;
  border: 1px solid ${hexToRgba(theme.positive, 0.3)}; animation: sysPulse 2.8s ease-out infinite; }
@keyframes sysPulse { 0% { transform: scale(.7); opacity: .9 } 100% { transform: scale(1.5); opacity: 0 } }
.sys-flow { stroke-dasharray: 3 9; animation: sysDash 2.4s linear infinite; }
@keyframes sysDash { to { stroke-dashoffset: -24 } }
.sys-wlbl { font-family: ui-monospace, Menlo, monospace; font-size: 8.5px; fill: ${theme.textTertiary}; letter-spacing: .08em; }

.sys-insp {
  position: fixed; top: 0; right: 0; height: 100vh; width: 420px; z-index: 60;
  background: ${GLASS_DEEP}; backdrop-filter: ${BLUR}; -webkit-backdrop-filter: ${BLUR};
  border-left: 1px solid ${accentRGBA(0.3)};
  box-shadow: -30px 0 70px rgba(0,0,0,.6), inset 1px 0 0 rgba(255,255,255,.06);
  transform: translateX(100%); transition: transform .38s cubic-bezier(.2,.7,.3,1);
  overflow-y: auto; padding: 26px 26px 60px;
}
.sys-insp.is-open { transform: translateX(0); }

@media (prefers-reduced-motion: reduce) { .sys-stage, .sys-node, .sys-insp, .sys-flow, .sys-ring::after {
  animation: none !important; transition: none !important; } }
@media (max-width: 1100px) {
  .sys-persp { perspective: none; }
  .sys-stage { transform: none !important; }
  .sys-insp { width: 100%; }
}
`

  return (
    <div>
      <style>{css}</style>

      {/* header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 500, color: theme.textPrimary, letterSpacing: '-0.01em' }}>
            System — how the book gets made
          </div>
          <div style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 10.5, color: theme.textSecondary, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 5 }}>
            v3.3 · frozen 7/15/26 · <span style={{ color: theme.accent }}>click any node for its history</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <Legend theme={theme} />
          <button
            onClick={() => setParallax((p) => !p)}
            style={{
              fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 10, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: parallax ? theme.accent : theme.textTertiary,
              background: 'none', border: `1px solid ${parallax ? hexToRgba(theme.accent, 0.4) : theme.border}`,
              borderRadius: 4, padding: '4px 9px', cursor: 'pointer',
            }}
          >
            parallax {parallax ? 'on' : 'off'}
          </button>
        </div>
      </div>

      {/* stage */}
      <div style={{ overflowX: 'auto', overflowY: 'hidden', paddingBottom: 20 }}>
        <div className="sys-persp">
          <div className="sys-stage" ref={stageRef}>

            <svg className="sys-svg sys-reticle" viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} xmlns="http://www.w3.org/2000/svg">
              <g fill="none" stroke={theme.textPrimary} strokeWidth="1" opacity="0.10">
                {RETICLE.radii.map((r, i) => (
                  <circle key={r} cx={RETICLE.cx} cy={RETICLE.cy} r={r}
                    strokeDasharray={['', '30 12', '2 6', '1 14'][i]} />
                ))}
              </g>
            </svg>

            <svg className="sys-svg sys-wires" viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} xmlns="http://www.w3.org/2000/svg">
              <defs>
                <marker id="sysArrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M0,0 L8,4 L0,8 z" fill={theme.accent} opacity="0.75" />
                </marker>
              </defs>
              <g fill="none" stroke={theme.textPrimary} strokeWidth="1" opacity="0.13">
                {SYS_EDGE_TRACKS.map((d, i) => <path key={i} d={d} />)}
              </g>
              {SYS_EDGES.map((e, i) => (
                <path
                  key={i}
                  d={e.d}
                  className={e.flow ? 'sys-flow' : undefined}
                  fill="none"
                  stroke={e.tone === 'green' ? theme.positive : e.tone === 'default' ? theme.negative : theme.accent}
                  strokeWidth={e.tone === 'copper' ? 1.5 : 1.3}
                  opacity={e.tone === 'copper' ? 0.8 : e.tone === 'green' ? 0.45 : 0.55}
                  markerEnd={e.arrow ? 'url(#sysArrow)' : undefined}
                />
              ))}
              {SYS_LABELS.map((l) => (
                <text key={l.text} className="sys-wlbl" x={l.x} y={l.y}>{l.text}</text>
              ))}
            </svg>

            {SYS_LANES.map((lane) => (
              <div key={lane.label} className="sys-lane" style={{ left: lane.x, top: lane.y, width: lane.w, height: lane.h }}>
                <span className="sys-lane-label">{lane.label}</span>
              </div>
            ))}

            {SYS_NODES.map((n) => {
              const stripe = n.kind === 'engine' ? theme.accent : n.kind === 'human' ? HUMAN : n.kind === 'write' ? theme.negative : null
              return (
                <button
                  key={n.id}
                  className={`sys-node${selected === n.id ? ' is-sel' : ''}`}
                  onClick={() => setSelected(n.id)}
                  aria-pressed={selected === n.id}
                  style={{
                    left: n.x, top: n.y,
                    borderLeft: stripe ? `2px solid ${stripe}` : undefined,
                  }}
                >
                  {n.history && <span className="sys-ring" />}
                  <div className="sys-eb" style={stripe ? { color: stripe } : undefined}>{n.eyebrow}</div>
                  <div className="sys-nt">{n.title}</div>
                  <div className="sys-nd">{n.sub}</div>
                </button>
              )
            })}

          </div>
        </div>
      </div>

      {/* inspector */}
      <aside className={`sys-insp${detail ? ' is-open' : ''}`} aria-live="polite" aria-hidden={!detail}>
        {detail && (
          <>
            <button
              onClick={() => setSelected(null)}
              aria-label="Close"
              style={{
                position: 'absolute', top: 20, right: 22, width: 26, height: 26,
                background: 'none', border: `1px solid ${theme.border}`, borderRadius: 5,
                color: theme.textSecondary, cursor: 'pointer', fontSize: 14, lineHeight: 1,
              }}
            >✕</button>
            <div style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: theme.accent }}>
              {detail.eyebrow}
            </div>
            <div style={{ fontSize: 21, fontWeight: 500, margin: '6px 0 3px', color: theme.textPrimary, letterSpacing: '-0.01em' }}>
              {detail.title}
            </div>
            <div style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 10, color: theme.textTertiary, letterSpacing: '0.05em', marginBottom: 20 }}>
              {detail.source}
            </div>
            {detail.blocks.map((b, i) => <BlockView key={i} block={b} theme={theme} />)}
          </>
        )}
      </aside>
    </div>
  )
}

// ---------------------------------------------------------------- pieces

function Legend({ theme }: { theme: Theme }) {
  const items: { label: string; color: string; ring?: boolean }[] = [
    { label: 'input', color: theme.textTertiary },
    { label: 'engine', color: theme.accent },
    { label: 'human gate', color: HUMAN },
    { label: 'write / deploy', color: theme.negative },
    { label: 'has history', color: theme.positive, ring: true },
  ]
  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
      {items.map((it) => (
        <span key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 10, color: theme.textSecondary, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          <span style={{
            width: 9, height: 9, display: 'inline-block',
            borderRadius: it.ring ? '50%' : 2,
            background: it.ring ? 'transparent' : it.color,
            border: it.ring ? `1.5px solid ${it.color}` : 'none',
          }} />
          {it.label}
        </span>
      ))}
    </div>
  )
}

function BlockView({ block, theme }: { block: Block; theme: Theme }) {
  const mono = 'ui-monospace, Menlo, monospace'
  const hair = `1px solid ${hexToRgba(theme.textPrimary, 0.05)}`

  if (block.t === 'sec') {
    return (
      <div style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: theme.textSecondary, margin: '24px 0 10px', paddingBottom: 6, borderBottom: `1px solid ${theme.border}` }}>
        {block.label}
      </div>
    )
  }

  if (block.t === 'note') {
    return <div style={{ fontFamily: mono, fontSize: 10, color: theme.textTertiary, marginTop: 16, lineHeight: 1.6 }}>{block.text}</div>
  }

  if (block.t === 'kv') {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 0', borderBottom: hair, fontSize: 12.5, opacity: block.pending ? 0.5 : 1 }}>
        <span style={{ color: theme.textSecondary }}>{block.k}</span>
        <span style={{ fontFamily: mono, fontSize: 11.5, textAlign: 'right', color: theme.textPrimary }}>{block.v}</span>
      </div>
    )
  }

  if (block.t === 'bar') {
    return (
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 0', fontSize: 12.5 }}>
          <span style={{ color: theme.textSecondary }}>{block.k}</span>
          <span style={{ fontFamily: mono, fontSize: 11.5, color: theme.textPrimary }}>{block.v}</span>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: hexToRgba(theme.textPrimary, 0.08), overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${block.pct}%`, background: `linear-gradient(90deg, ${theme.accent}, ${hexToRgba(theme.accent, 0.3)})` }} />
        </div>
      </div>
    )
  }

  // row
  const toneColor =
    block.pill?.tone === 'book' ? theme.positive :
    block.pill?.tone === 'engine' || block.pill?.tone === 'open' ? theme.accent :
    theme.textSecondary

  return (
    <div style={{ padding: '10px 0', borderBottom: hair, fontSize: 12.5, opacity: block.pending ? 0.6 : 1 }}>
      {block.pill && (
        <span style={{
          display: 'inline-block', fontFamily: mono, fontSize: 8.5, letterSpacing: '0.1em',
          textTransform: 'uppercase', padding: '2px 6px', borderRadius: 3, marginRight: 7,
          border: `1px solid ${hexToRgba(toneColor, 0.5)}`, color: toneColor,
        }}>{block.pill.label}</span>
      )}
      {block.date && (
        <span style={{ fontFamily: mono, fontSize: 10, color: theme.textTertiary, letterSpacing: '0.05em', marginRight: 8 }}>{block.date}</span>
      )}
      <span style={{ color: theme.textPrimary }}>{block.title}</span>
      {block.quote && (
        <span style={{ display: 'block', color: theme.textSecondary, fontSize: 11.5, lineHeight: 1.5, marginTop: 3 }}>{block.quote}</span>
      )}
    </div>
  )
}

// Theme tokens are hex; a few surfaces need alpha. Falls back to the raw string
// if a token is ever changed to rgb()/hsl().
function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim())
  if (!m) return hex
  const r = parseInt(m[1], 16)
  const g = parseInt(m[2], 16)
  const b = parseInt(m[3], 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
