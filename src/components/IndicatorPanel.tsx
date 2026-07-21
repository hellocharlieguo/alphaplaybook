// src/components/IndicatorPanel.tsx — right-rail indicator checklist for the Trading tab.
// Each row: enable/disable toggle (redraws the chart) + current reading + expandable
// explanation (general copy from indicator_docs + computed current-read line).

import { useState } from 'react'
import type { ReactNode, CSSProperties } from 'react'
import type { Theme } from './Dashboard'

export interface IndicatorEntry {
  key: string
  name: string
  reading: ReactNode
  general: string
  currentRead: string
  enabled: boolean
  unavailable?: string // e.g. 'volume unavailable' — renders row disabled
}

interface Props {
  entries: IndicatorEntry[]
  onToggle: (key: string, value: boolean) => void
  theme: Theme
}

export default function IndicatorPanel({ entries, onToggle, theme }: Props) {
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set(['ew']))
  const toggleOpen = (key: string) => {
    setOpenKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const glass: CSSProperties = {
    background: 'rgba(30,29,27,0.38)', backdropFilter: 'blur(32px) saturate(132%)',
    WebkitBackdropFilter: 'blur(32px) saturate(132%)', border: '1px solid rgba(255,255,255,0.11)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)', borderRadius: 16, padding: 14,
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 8, alignItems: 'start',
  }

  return (
    <div style={glass}>
      <div style={{ gridColumn: '1 / -1', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: theme.textTertiary, marginBottom: 2, fontWeight: 600 }}>
        Indicators · toggle on chart, tap to explain
      </div>
      {entries.map((e) => {
        const open = openKeys.has(e.key)
        const disabled = !!e.unavailable
        return (
          <div key={e.key} style={{ border: `1px solid ${theme.border}`, borderRadius: 12, overflow: 'hidden', background: theme.surfaceSubtle, alignSelf: 'start', opacity: disabled ? 0.55 : 1 }}>
            <div onClick={() => toggleOpen(e.key)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 11px', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={e.enabled && !disabled}
                disabled={disabled}
                onClick={(ev) => ev.stopPropagation()}
                onChange={(ev) => onToggle(e.key, ev.target.checked)}
                style={{ accentColor: theme.accent, width: 15, height: 15, cursor: disabled ? 'not-allowed' : 'pointer', flexShrink: 0 }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, flex: 1, color: theme.textPrimary }}>{e.name}</span>
              <span style={{ fontSize: 11.5, color: theme.textSecondary, fontVariantNumeric: 'tabular-nums', textAlign: 'right', lineHeight: 1.35 }}>
                {disabled ? e.unavailable : e.reading}
              </span>
              <span style={{ color: theme.textTertiary, fontSize: 10, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }}>▶</span>
            </div>
            {open && (
              <div style={{ padding: '0 12px 12px 35px', fontSize: 12, lineHeight: 1.55, color: theme.textSecondary }}>
                {e.general}
                <div style={{ marginTop: 7, padding: '7px 10px', borderRadius: 8, background: theme.accentMuted, borderLeft: `2px solid ${theme.accent}` }}>
                  <b style={{ color: theme.textPrimary, fontWeight: 600 }}>Current read:</b> {e.currentRead}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
