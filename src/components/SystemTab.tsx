import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { Theme } from './Dashboard'
import {
  STAGE_W, STAGE_H, ENGINE_BOX,
  SYS_ZONES, SYS_NODES, SYS_EDGES, SYS_LABELS, SYS_DETAILS,
} from '../data/systemMap'
import type { Block, SysFile } from '../data/systemMap'

// System tab — blueprint schematic on a frosted panel.
// Display-only: reads nothing, writes nothing. Content in src/data/systemMap.ts.
//
// Legibility model: the panel is a near-opaque surface (PANEL) so the Basalt
// backdrop never sits directly behind text. Boxes are a lighter cool slate
// (BOX) so they read as objects ON that surface. Role colour lives on the left
// border and the drawing reference, never in the fill — fills stay neutral so
// text contrast is constant.

const PANEL = 'rgba(26,26,29,0.88)'
const PANEL_BLUR = 'blur(26px) saturate(120%)'
const BOX = 'rgba(44,47,54,0.96)'
const BOX_HOVER = 'rgba(54,58,67,0.98)'
const INSET = 'inset 0 1px 0 rgba(255,255,255,0.09)'
const HUMAN = '#d8c46a' // human-gate amber — System-tab semantics, no global token

const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace'

export default function SystemTab({ theme }: { theme: Theme }) {
  const [selected, setSelected] = useState<string | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Very slight cursor tilt. rAF-throttled; off under reduced motion and on narrow screens.
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.innerWidth <= 1100) return
    let raf = 0, px = 0, py = 0
    const apply = () => {
      raf = 0
      stage.style.setProperty('--ry', (px * 4).toFixed(2) + 'deg')
      stage.style.setProperty('--rx', (6 - py * 2.5).toFixed(2) + 'deg')
    }
    const onMove = (e: MouseEvent) => {
      px = e.clientX / window.innerWidth - 0.5
      py = e.clientY / window.innerHeight - 0.5
      if (!raf) raf = window.requestAnimationFrame(apply)
    }
    window.addEventListener('mousemove', onMove)
    return () => { window.removeEventListener('mousemove', onMove); if (raf) window.cancelAnimationFrame(raf) }
  }, [])

  const detail = selected ? SYS_DETAILS[selected] : null
  const rgba = (hex: string, a: number) => hexToRgba(hex, a)

  // Clicking the same element again closes the inspector — no trip to the ✕.
  const toggle = (id: string) => setSelected((prev) => (prev === id ? null : id))
  const roleColor = (kind: string) =>
    kind === 'engine' ? theme.accent : kind === 'human' ? HUMAN : kind === 'write' ? theme.negative : null

  const css = `
.sys-panel{
  margin-top:4px;border-radius:14px;border:1px solid ${theme.border};
  background:${PANEL};backdrop-filter:${PANEL_BLUR};-webkit-backdrop-filter:${PANEL_BLUR};
  box-shadow:${INSET},0 24px 60px rgba(0,0,0,.5);overflow:hidden;
}
.sys-head{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;flex-wrap:wrap;
  padding:18px 24px 16px;border-bottom:1px solid ${theme.border};}
.sys-legend{display:flex;gap:14px;flex-wrap:wrap;padding:11px 24px;
  border-bottom:1px solid ${theme.border};background:rgba(255,255,255,.018);}
/* Generous side padding: the perspective tilt pushes the near edge of the
   stage outward, and .sys-panel has overflow:hidden, so a tight pad clips the
   A- and D-column cards. 56px covers the worst case at ry = 4deg. */
.sys-scroll{overflow-x:auto;overflow-y:hidden;padding:30px 56px 26px;}
.sys-persp{perspective:1900px;perspective-origin:50% 44%;}
.sys-stage{position:relative;width:${STAGE_W}px;height:${STAGE_H}px;transform-style:preserve-3d;
  transform:rotateX(var(--rx,6deg)) rotateY(var(--ry,0deg));transition:transform .5s cubic-bezier(.2,.7,.3,1);}
.sys-svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;transform:translateZ(-10px);}

.sys-zone{position:absolute;border:1px dashed rgba(255,255,255,.13);border-radius:12px;transform:translateZ(-24px);}
.sys-zone > span{position:absolute;top:-8px;left:14px;background:#1c1c20;padding:0 8px;border-radius:3px;
  font-family:${MONO};font-size:9px;letter-spacing:.18em;color:${theme.textTertiary};text-transform:uppercase;}

.sys-box{position:absolute;width:152px;min-height:70px;padding:10px 12px;border-radius:10px;
  border:1px solid rgba(255,255,255,.16);background:${BOX};
  box-shadow:${INSET},0 6px 18px rgba(0,0,0,.45);
  text-align:left;font-family:inherit;color:inherit;cursor:pointer;transform-style:preserve-3d;
  transition:transform .25s cubic-bezier(.2,.7,.3,1),border-color .25s,box-shadow .25s,background .25s;}
.sys-box:hover{transform:translateZ(20px);background:${BOX_HOVER};border-color:rgba(255,255,255,.38);
  box-shadow:${INSET},0 12px 28px rgba(0,0,0,.55);}
.sys-box:focus-visible{outline:2px solid ${theme.accent};outline-offset:3px;}
.sys-box.is-sel{border-color:${theme.accent};transform:translateZ(42px);
  box-shadow:${INSET},0 0 30px ${rgba(theme.accent,.35)};}

.sys-engine{position:absolute;border-radius:12px;border:1.5px solid ${rgba(theme.accent,.75)};
  background:linear-gradient(180deg,rgba(58,44,33,.96),rgba(44,36,29,.96));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 8px 24px rgba(0,0,0,.5);
  text-align:left;font-family:inherit;color:inherit;cursor:pointer;transform-style:preserve-3d;
  transition:transform .25s cubic-bezier(.2,.7,.3,1),box-shadow .25s;padding:15px 17px;}
.sys-engine:hover{transform:translateZ(22px);}
.sys-engine:focus-visible{outline:2px solid ${theme.accent};outline-offset:3px;}
.sys-engine.is-sel{transform:translateZ(44px);box-shadow:0 0 40px ${rgba(theme.accent,.35)};}


.sys-ring{position:absolute;top:9px;right:10px;width:7px;height:7px;border-radius:50%;
  border:1.5px solid ${theme.positive};box-shadow:0 0 8px ${rgba(theme.positive,.6)};}

.sys-insp{position:fixed;top:0;right:0;height:100vh;width:390px;z-index:60;background:rgba(24,24,27,.97);
  border-left:1px solid ${rgba(theme.accent,.4)};box-shadow:-30px 0 70px rgba(0,0,0,.7);
  transform:translateX(100%);transition:transform .35s cubic-bezier(.2,.7,.3,1);
  overflow-y:auto;padding:26px 24px 60px;}
.sys-insp.is-open{transform:translateX(0);}

.sys-part{display:block;width:100%;text-align:left;background:rgba(52,55,63,.5);
  border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:9px 11px;margin-bottom:7px;
  cursor:pointer;font-family:inherit;color:inherit;transition:border-color .2s,background .2s;}
.sys-part:hover{border-color:${rgba(theme.accent,.6)};background:rgba(62,66,75,.7);}
.sys-part:focus-visible{outline:2px solid ${theme.accent};outline-offset:2px;}
.sys-back{display:inline-flex;align-items:center;gap:6px;background:none;border:none;padding:0 0 12px;
  cursor:pointer;font-family:${MONO};font-size:10px;letter-spacing:.12em;text-transform:uppercase;
  color:${theme.accent};}
.sys-back:hover{color:${theme.textPrimary};}
.sys-file{display:block;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.06);}
.sys-file:last-child{border-bottom:none;}

@media (prefers-reduced-motion:reduce){
  .sys-stage,.sys-box,.sys-engine,.sys-insp,.sys-part,.sys-file{transition:none !important;}
}
@media (max-width:1100px){
  .sys-persp{perspective:none;}
  .sys-stage{transform:none !important;}
  .sys-insp{width:100%;}
}
`

  return (
    <div>
      <style>{css}</style>

      <div className="sys-panel">
        {/* header + title block */}
        <div className="sys-head">
          <div>
            <div style={{ fontSize: 19, fontWeight: 500, color: theme.textPrimary, letterSpacing: '-0.01em' }}>
              System — how the book gets made
            </div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: theme.textSecondary, letterSpacing: '0.09em', textTransform: 'uppercase', marginTop: 5 }}>
              click any box for detail, history and the files it touches
            </div>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 9.5, color: theme.textTertiary, letterSpacing: '0.1em', lineHeight: 1.85, textAlign: 'right', textTransform: 'uppercase' }}>
            REV <b style={{ color: theme.textSecondary, fontWeight: 400 }}>v3.3-CORESAT</b><br />
            FROZEN <b style={{ color: theme.textSecondary, fontWeight: 400 }}>2026-07-15</b><br />
            DETAIL <b style={{ color: theme.textSecondary, fontWeight: 400 }}>B</b>
          </div>
        </div>

        {/* legend */}
        <div className="sys-legend">
          {[
            { label: 'input', color: theme.textTertiary },
            { label: 'engine', color: theme.accent },
            { label: 'human gate', color: HUMAN },
            { label: 'write / deploy', color: theme.negative },
            { label: 'has history', color: theme.positive, ring: true },
          ].map((it) => (
            <span key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: MONO, fontSize: 9.5, color: theme.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
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

        {/* drawing */}
        <div className="sys-scroll">
          <div className="sys-persp">
            <div className="sys-stage" ref={stageRef}>

              <svg className="sys-svg" viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <marker id="sysArrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M0,0 L8,4 L0,8 z" fill={theme.accent} />
                  </marker>
                </defs>
                {SYS_EDGES.map((e, i) => (
                  <path
                    key={i}
                    d={e.d}
                    fill="none"
                    stroke={e.tone === 'feedback' ? theme.negative : 'rgba(255,255,255,0.30)'}
                    strokeWidth={1.2}
                    strokeDasharray={e.tone === 'feedback' ? '5 4' : undefined}
                    opacity={e.tone === 'wire' ? 1 : 0.8}
                    markerEnd={e.arrow ? 'url(#sysArrow)' : undefined}
                  />
                ))}
                {SYS_LABELS.map((l) => (
                  <text key={l.text} x={l.x} y={l.y}
                    fontFamily={MONO} fontSize="8.5" fill={theme.textTertiary} letterSpacing="1">
                    {l.text}
                  </text>
                ))}
              </svg>

              {SYS_ZONES.map((z) => (
                <div key={z.label} className="sys-zone" style={{ left: z.x, top: z.y, width: z.w, height: z.h }}>
                  <span>{z.label}</span>
                </div>
              ))}

              {SYS_NODES.map((n) => {
                const c = roleColor(n.kind)
                return (
                  <button
                    key={n.id}
                    className={`sys-box${selected === n.id ? ' is-sel' : ''}`}
                    onClick={() => toggle(n.id)}
                    style={{ left: n.x, top: n.y, borderLeft: c ? `3px solid ${c}` : undefined }}
                  >
                    {n.history && <span className="sys-ring" />}
                    <div style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: '0.16em', color: c ?? theme.textTertiary }}>{n.ref}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginTop: 3, lineHeight: 1.2, color: theme.textPrimary }}>{n.title}</div>
                    <div style={{ fontFamily: MONO, fontSize: 9.5, color: theme.textSecondary, marginTop: 5, lineHeight: 1.45 }}>{n.sub}</div>
                  </button>
                )
              })}

              {/* sealed engine assembly */}
              <button
                className={`sys-engine${selected === 'engine' ? ' is-sel' : ''}`}
                onClick={() => toggle('engine')}
                style={{ left: ENGINE_BOX.x, top: ENGINE_BOX.y, width: ENGINE_BOX.w, height: ENGINE_BOX.h }}
              >
                <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', color: theme.accent }}>B · ENGINE</div>
                <div style={{ fontSize: 20, fontWeight: 600, marginTop: 4, letterSpacing: '-0.01em', color: '#fff' }}>Engine</div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: '#c9c4bd', marginTop: 6, lineHeight: 1.55 }}>
                  voices in → 14 weighted positions out
                </div>
                <div style={{ position: 'absolute', left: 17, bottom: 13, fontFamily: MONO, fontSize: 8.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: theme.textTertiary, whiteSpace: 'nowrap' }}>
                  5 parts · 1 human call · click to open
                </div>
              </button>


            </div>
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
                background: 'none', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 6,
                color: theme.textSecondary, cursor: 'pointer', fontSize: 14, lineHeight: 1,
              }}
            >✕</button>
            <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: theme.accent }}>{detail.eyebrow}</div>
            <div style={{ fontSize: 19, fontWeight: 500, margin: '6px 0 3px', color: theme.textPrimary }}>{detail.title}</div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: theme.textTertiary, marginBottom: 16 }}>{detail.source}</div>

            {detail.parent && (
              <button className="sys-back" onClick={() => setSelected(detail.parent!)}>
                ← back to {SYS_DETAILS[detail.parent].title}
              </button>
            )}

            {detail.blocks.map((b, i) => <BlockView key={i} block={b} theme={theme} />)}

            {detail.parts && detail.parts.length > 0 && (
              <>
                <div style={SEC(theme)}>Internals · {detail.parts.length} parts</div>
                {detail.parts.map((pid) => {
                  const p = SYS_DETAILS[pid]
                  if (!p) return null
                  const isGate = pid === 'seats'
                  return (
                    <button
                      key={pid}
                      className="sys-part"
                      onClick={() => setSelected(pid)}
                      style={isGate ? { borderLeft: `3px solid ${HUMAN}` } : undefined}
                    >
                      <div style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: '0.16em', color: isGate ? HUMAN : theme.accent }}>
                        {p.eyebrow}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2, color: theme.textPrimary }}>{p.title}</div>
                      <div style={{ fontFamily: MONO, fontSize: 9.5, color: theme.textSecondary, marginTop: 3 }}>{p.source}</div>
                    </button>
                  )
                })}
              </>
            )}

            {detail.files && detail.files.length > 0 && (
              <>
                <div style={SEC(theme)}>Files touched · {detail.files.length}</div>
                {detail.files.map((f) => <FileRow key={f.path} file={f} theme={theme} />)}
                <div style={{ fontFamily: MONO, fontSize: 9.5, color: theme.textTertiary, marginTop: 12, lineHeight: 1.6 }}>
                  Hand-authored. Tier C will generate this from repo imports and git metadata.
                </div>
              </>
            )}
          </>
        )}
      </aside>
    </div>
  )
}

// ---------------------------------------------------------------- blocks

function SEC(theme: Theme): CSSProperties {
  return {
    fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase',
    color: theme.textSecondary, margin: '20px 0 9px', paddingBottom: 6,
    borderBottom: '1px solid rgba(255,255,255,0.12)',
  }
}

const FILE_TONE: Record<SysFile['status'], { label: string; key: 'ok' | 'warn' | 'bad' | 'info' }> = {
  live:       { label: 'live',       key: 'ok' },
  stale:      { label: 'stale',      key: 'warn' },
  modified:   { label: 'modified',   key: 'warn' },
  orphan:     { label: 'orphan',     key: 'bad' },
  untracked:  { label: 'untracked',  key: 'warn' },
  unverified: { label: 'unverified', key: 'info' },
  proposed:   { label: 'proposed',   key: 'info' },
}

function FileRow({ file, theme }: { file: SysFile; theme: Theme }) {
  const t = FILE_TONE[file.status]
  const color =
    t.key === 'ok' ? theme.positive :
    t.key === 'bad' ? theme.negative :
    t.key === 'warn' ? theme.accent :
    theme.textTertiary
  return (
    <div className="sys-file" style={{ opacity: t.key === 'info' ? 0.72 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ fontFamily: MONO, fontSize: 11, color: theme.textPrimary, wordBreak: 'break-all' }}>{file.path}</span>
        <span style={{
          flexShrink: 0, fontFamily: MONO, fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase',
          padding: '1px 5px', borderRadius: 3, border: `1px solid ${hexToRgba(color, 0.5)}`, color,
        }}>{t.label}</span>
      </div>
      <div style={{ fontSize: 11.5, color: theme.textSecondary, marginTop: 3, lineHeight: 1.5 }}>{file.role}</div>
    </div>
  )
}

function BlockView({ block, theme }: { block: Block; theme: Theme }) {
  const hair = '1px solid rgba(255,255,255,0.06)'

  if (block.t === 'sec') {
    return (
      <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: theme.textSecondary, margin: '18px 0 8px', paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
        {block.label}
      </div>
    )
  }

  if (block.t === 'note') {
    return <div style={{ fontFamily: MONO, fontSize: 10, color: theme.textTertiary, marginTop: 14, lineHeight: 1.65 }}>{block.text}</div>
  }

  if (block.t === 'kv') {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 0', borderBottom: hair, fontSize: 12.5, opacity: block.pending ? 0.5 : 1 }}>
        <span style={{ color: theme.textSecondary }}>{block.k}</span>
        <span style={{ fontFamily: MONO, fontSize: 11.5, textAlign: 'right', color: theme.textPrimary }}>{block.v}</span>
      </div>
    )
  }

  if (block.t === 'bar') {
    return (
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 0', fontSize: 12.5 }}>
          <span style={{ color: theme.textSecondary }}>{block.k}</span>
          <span style={{ fontFamily: MONO, fontSize: 11.5, color: theme.textPrimary }}>{block.v}</span>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.09)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${block.pct}%`, background: `linear-gradient(90deg, ${theme.accent}, ${hexToRgba(theme.accent, 0.3)})` }} />
        </div>
      </div>
    )
  }

  const toneColor =
    block.tone === 'book' ? theme.positive :
    block.tone === 'engine' || block.tone === 'open' ? theme.accent :
    theme.textSecondary

  return (
    <div style={{ padding: '10px 0', borderBottom: hair, fontSize: 12.5, opacity: block.pending ? 0.6 : 1 }}>
      {block.pill && (
        <span style={{
          display: 'inline-block', fontFamily: MONO, fontSize: 8.5, letterSpacing: '0.1em',
          textTransform: 'uppercase', padding: '2px 6px', borderRadius: 3, marginRight: 7,
          border: `1px solid ${hexToRgba(toneColor, 0.5)}`, color: toneColor,
        }}>{block.pill}</span>
      )}
      {block.date && (
        <span style={{ fontFamily: MONO, fontSize: 10, color: theme.textTertiary, letterSpacing: '0.05em', marginRight: 8 }}>{block.date}</span>
      )}
      <span style={{ color: theme.textPrimary }}>{block.title}</span>
      {block.quote && (
        <span style={{ display: 'block', color: theme.textSecondary, fontSize: 11.5, lineHeight: 1.55, marginTop: 3 }}>{block.quote}</span>
      )}
    </div>
  )
}

// Theme tokens are hex; a few surfaces need alpha. Returns the raw string
// unchanged if a token is ever switched to rgb()/hsl().
function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim())
  if (!m) return hex
  return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${alpha})`
}
