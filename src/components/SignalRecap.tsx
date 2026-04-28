import { useState } from 'react'

interface SignalRecapProps {
  snapshot: {
    snapshot_date: string
    spy_rsi: number | null
    rsi_signal: string | null
    polymarket_signals: any[] | null
    narrative_signals: any[] | null
    bullish_assets: any[] | null
  } | null
}

export default function SignalRecap({ snapshot }: SignalRecapProps) {
  const [expandedPlay, setExpandedPlay] = useState<string | null>('narrative')

  if (!snapshot) {
    return (
      <div className="text-center py-16 text-white/30">
        No snapshot data yet. Signals will appear after the first cron run.
      </div>
    )
  }

  const narrativeSignals = snapshot.narrative_signals || []
  const crowdSignals = snapshot.polymarket_signals || []
  const rsi = snapshot.spy_rsi
  const rsiSignal = snapshot.rsi_signal

  // Group narrative signals by source
  const narrativeBySource: Record<string, any[]> = {}
  for (const s of narrativeSignals) {
    const key = s.source || 'unknown'
    if (!narrativeBySource[key]) narrativeBySource[key] = []
    narrativeBySource[key].push(s)
  }

  const sourceLabels: Record<string, string> = {
    visser: 'Jordi Visser / Pomp',
    allin: 'All-In Podcast',
    moonshots: 'Moonshots (Peter Diamandis)',
  }

  return (
    <div className="space-y-4">
      {/* --- PLAY 1: NARRATIVE --- */}
      <SignalCard
        play="Play 1"
        title="Narrative Signals"
        color="violet"
        count={narrativeSignals.length}
        expanded={expandedPlay === 'narrative'}
        onToggle={() => setExpandedPlay(expandedPlay === 'narrative' ? null : 'narrative')}
      >
        {narrativeSignals.length === 0 ? (
          <div className="text-white/30 text-sm py-4">
            No narrative signals today. Signals improve with transcript availability.
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(narrativeBySource).map(([source, signals]) => (
              <div key={source}>
                <div className="text-xs text-white/40 font-medium mb-2 uppercase tracking-wider">
                  {sourceLabels[source] || source}
                </div>
                {signals[0]?.video_title && (
                  <a
                    href={signals[0].video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-violet-400/70 hover:text-violet-300 mb-3 block truncate"
                  >
                    📺 {signals[0].video_title}
                  </a>
                )}
                <div className="grid gap-2">
                  {signals.map((s: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-white/[0.03] rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono font-semibold text-white/90">
                          {s.ticker}
                        </span>
                        <span className="text-xs text-white/40">{s.asset}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DirectionBadge direction={s.direction} />
                        <ConvictionDot conviction={s.conviction} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </SignalCard>

      {/* --- PLAY 2: CROWD --- */}
      <SignalCard
        play="Play 2"
        title="Crowd Signals"
        color="amber"
        count={crowdSignals.length}
        expanded={expandedPlay === 'crowd'}
        onToggle={() => setExpandedPlay(expandedPlay === 'crowd' ? null : 'crowd')}
      >
        {crowdSignals.length === 0 ? (
          <div className="text-white/30 text-sm py-4">
            No crowd signals today.
          </div>
        ) : (
          <div className="grid gap-2">
            {crowdSignals.map((s: any, i: number) => (
              <div
                key={i}
                className="bg-white/[0.03] rounded-lg px-3 py-2"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white/60 leading-tight flex-1 mr-3">
                    {s.market}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono text-white/80">
                      {(s.probability * 100).toFixed(0)}%
                    </span>
                    <DirectionBadge direction={s.direction} />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {(s.mapped_assets || []).map((ticker: string, j: number) => (
                    <span
                      key={j}
                      className="text-[10px] font-mono bg-amber-500/10 text-amber-400/80 rounded px-1.5 py-0.5"
                    >
                      {ticker}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </SignalCard>

      {/* --- PLAY 3: QUANT --- */}
      <SignalCard
        play="Play 3"
        title="Quant Signal"
        color="cyan"
        count={rsi !== null ? 1 : 0}
        expanded={expandedPlay === 'quant'}
        onToggle={() => setExpandedPlay(expandedPlay === 'quant' ? null : 'quant')}
      >
        {rsi === null ? (
          <div className="text-white/30 text-sm py-4">
            No RSI data today.
          </div>
        ) : (
          <div className="space-y-4">
            {/* RSI Gauge */}
            <div className="bg-white/[0.03] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/60">SPY 14-Day RSI</span>
                <span
                  className={`text-2xl font-mono font-bold ${
                    rsi < 25
                      ? 'text-emerald-400'
                      : rsi > 70
                        ? 'text-red-400'
                        : 'text-white'
                  }`}
                >
                  {rsi.toFixed(1)}
                </span>
              </div>

              {/* RSI Bar */}
              <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${rsi}%`,
                    background:
                      rsi < 25
                        ? '#34d399'
                        : rsi > 70
                          ? '#f87171'
                          : 'linear-gradient(90deg, #34d399, #fbbf24, #f87171)',
                  }}
                />
                {/* Oversold / Overbought markers */}
                <div
                  className="absolute top-0 h-full w-px bg-white/20"
                  style={{ left: '25%' }}
                />
                <div
                  className="absolute top-0 h-full w-px bg-white/20"
                  style={{ left: '70%' }}
                />
              </div>

              <div className="flex justify-between mt-1.5 text-[10px] text-white/25">
                <span>0</span>
                <span>Oversold &lt;25</span>
                <span>Overbought &gt;70</span>
                <span>100</span>
              </div>

              {/* Signal interpretation */}
              <div className="mt-3 flex items-center gap-2">
                <DirectionBadge
                  direction={
                    rsiSignal === 'oversold'
                      ? 'bullish'
                      : rsiSignal === 'overbought'
                        ? 'bearish'
                        : 'neutral'
                  }
                />
                <span className="text-xs text-white/40">
                  {rsiSignal === 'oversold'
                    ? 'Market oversold — potential bounce. Favoring SPY, QQQ, XSD.'
                    : rsiSignal === 'overbought'
                      ? 'Market overbought — trimming risk. Rotating to SGOV, GLDM.'
                      : 'Neutral — holding current positions.'}
                </span>
              </div>
            </div>
          </div>
        )}
      </SignalCard>

      {/* --- BULLISH ASSETS RANKING --- */}
      <BullishAssetsSection assets={snapshot.bullish_assets || []} />
    </div>
  )
}

// ============================================================================
// BULLISH ASSETS RANKING
// ============================================================================

function BullishAssetsSection({ assets }: { assets: any[] }) {
  if (assets.length === 0) {
    return (
      <div className="bg-[#0d1220] border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-sm font-semibold text-white/80">Bullish Asset Rankings</span>
        </div>
        <div className="text-white/30 text-sm">
          No bullish convergence detected today. This means signals are mostly neutral or bearish across sources.
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#0d1220] border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-sm font-semibold text-white/80">Bullish Asset Rankings</span>
        </div>
        <span className="text-xs text-white/30">{assets.length} ticker{assets.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="grid gap-2">
        {assets.map((asset: any, i: number) => (
          <div
            key={i}
            className="flex items-center justify-between bg-white/[0.03] rounded-lg px-4 py-3"
          >
            <div className="flex items-center gap-4">
              <span className="text-xs text-white/20 font-mono w-4">#{i + 1}</span>
              <span className="text-sm font-mono font-semibold text-white/90">{asset.ticker}</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Source badges */}
              <div className="flex gap-1">
                {(asset.sources || []).map((src: string, j: number) => (
                  <span
                    key={j}
                    className={`text-[10px] rounded px-1.5 py-0.5 ${
                      src === 'narrative'
                        ? 'bg-violet-500/15 text-violet-400/80'
                        : src === 'crowd'
                          ? 'bg-amber-500/15 text-amber-400/80'
                          : 'bg-cyan-500/15 text-cyan-400/80'
                    }`}
                  >
                    {src}
                  </span>
                ))}
              </div>

              {/* Convergence badge */}
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  asset.source_count >= 3
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : asset.source_count >= 2
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-white/10 text-white/50'
                }`}
              >
                {asset.convergence}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// SHARED COMPONENTS
// ============================================================================

function SignalCard({
  play,
  title,
  color,
  count,
  expanded,
  onToggle,
  children,
}: {
  play: string
  title: string
  color: 'violet' | 'amber' | 'cyan'
  count: number
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  const colors = {
    violet: {
      bg: 'from-violet-500/10 to-violet-600/5',
      border: 'border-violet-500/20',
      dot: 'bg-violet-400',
      tag: 'text-violet-400',
    },
    amber: {
      bg: 'from-amber-500/10 to-amber-600/5',
      border: 'border-amber-500/20',
      dot: 'bg-amber-400',
      tag: 'text-amber-400',
    },
    cyan: {
      bg: 'from-cyan-500/10 to-cyan-600/5',
      border: 'border-cyan-500/20',
      dot: 'bg-cyan-400',
      tag: 'text-cyan-400',
    },
  }

  const c = colors[color]

  return (
    <div className={`bg-gradient-to-br ${c.bg} border ${c.border} rounded-xl overflow-hidden`}>
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${c.dot}`} />
          <span className={`text-xs font-medium ${c.tag}`}>{play}</span>
          <span className="text-sm font-semibold text-white/90">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/30">
            {count} signal{count !== 1 ? 's' : ''}
          </span>
          <span className="text-white/30 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}

function DirectionBadge({ direction }: { direction: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    bullish: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: '▲ Bullish' },
    bearish: { bg: 'bg-red-500/15', text: 'text-red-400', label: '▼ Bearish' },
    neutral: { bg: 'bg-white/10', text: 'text-white/50', label: '● Neutral' },
  }
  const c = config[direction] || config.neutral

  return (
    <span className={`text-[10px] font-medium ${c.bg} ${c.text} rounded px-1.5 py-0.5`}>
      {c.label}
    </span>
  )
}

function ConvictionDot({ conviction }: { conviction: string }) {
  const config: Record<string, { color: string; label: string }> = {
    high: { color: 'bg-emerald-400', label: 'High' },
    medium: { color: 'bg-yellow-400', label: 'Med' },
    low: { color: 'bg-white/30', label: 'Low' },
  }
  const c = config[conviction] || config.low

  return (
    <div className="flex items-center gap-1" title={`${c.label} conviction`}>
      <div className={`w-1.5 h-1.5 rounded-full ${c.color}`} />
    </div>
  )
}
