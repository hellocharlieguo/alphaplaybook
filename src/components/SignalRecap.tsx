interface SignalRecapProps {
  snapshot: any | null
}

export default function SignalRecap({ snapshot }: SignalRecapProps) {
  if (!snapshot) {
    return (
      <div className="bg-[#0d1220] border border-white/10 rounded-xl p-8 text-center">
        <div className="text-white/30 text-lg mb-2">No signal data yet</div>
        <div className="text-white/20 text-sm">
          Signals will appear here once the daily cron job runs for the first time.
        </div>
      </div>
    )
  }

  const narrativeSignals = snapshot.narrative_signals ?? []
  const polymarketSignals = snapshot.polymarket_signals ?? []
  const bullishAssets = snapshot.bullish_assets ?? []

  return (
    <div className="space-y-4">
      {/* Bullish Assets Cross-Reference */}
      {bullishAssets.length > 0 && (
        <div className="bg-[#0d1220] border border-emerald-500/20 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-emerald-400 mb-3">
            Bullish Asset Rankings
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {bullishAssets.map((asset: any, i: number) => (
              <div
                key={i}
                className="bg-white/5 rounded-lg p-3 text-center border border-white/5"
              >
                <div className="text-base font-semibold">{asset.ticker}</div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <span
                    className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                      asset.signal_count === 3
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : asset.signal_count === 2
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-white/10 text-white/50'
                    }`}
                  >
                    {asset.signal_count}/3
                  </span>
                </div>
                <div className="text-[10px] text-white/30 mt-1">
                  {asset.sources?.join(' · ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Narrative Signals - Play 1 */}
      <div className="bg-[#0d1220] border border-violet-500/20 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-violet-400" />
          <h3 className="text-sm font-semibold text-violet-400">
            Play 1: Narrative — Visser / Pomp
          </h3>
        </div>
        {narrativeSignals.length === 0 ? (
          <div className="text-white/20 text-sm">No narrative signals yet.</div>
        ) : (
          <div className="space-y-2">
            {narrativeSignals.map((signal: any, i: number) => (
              <div key={i} className="bg-white/5 rounded-lg p-3 border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{signal.ticker}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        signal.direction === 'bullish'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : signal.direction === 'bearish'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-white/10 text-white/50'
                      }`}
                    >
                      {signal.direction}
                    </span>
                    {signal.conviction && (
                      <span className="text-xs text-white/30">{signal.conviction}</span>
                    )}
                  </div>
                </div>
                {signal.quote && (
                  <div className="text-xs text-white/40 italic">"{signal.quote}"</div>
                )}
                {signal.source && (
                  <div className="text-[10px] text-white/20 mt-1">{signal.source}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Crowd Signals - Play 2 */}
      <div className="bg-[#0d1220] border border-amber-500/20 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <h3 className="text-sm font-semibold text-amber-400">
            Play 2: Crowd — Polymarket
          </h3>
        </div>
        {polymarketSignals.length === 0 ? (
          <div className="text-white/20 text-sm">No crowd signals yet.</div>
        ) : (
          <div className="space-y-2">
            {polymarketSignals.map((signal: any, i: number) => (
              <div key={i} className="bg-white/5 rounded-lg p-3 border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{signal.market}</span>
                  <span className="text-sm font-semibold text-amber-400">
                    {(signal.probability * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5 mt-1">
                  <div
                    className="bg-amber-400/60 h-1.5 rounded-full transition-all"
                    style={{ width: `${signal.probability * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium ${
                      signal.direction === 'bullish'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : signal.direction === 'bearish'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-white/10 text-white/50'
                    }`}
                  >
                    {signal.direction}
                  </span>
                  <span className="text-[10px] text-white/30">
                    {signal.mapped_assets?.join(', ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quant Signal - Play 3 */}
      <div className="bg-[#0d1220] border border-cyan-500/20 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-cyan-400" />
          <h3 className="text-sm font-semibold text-cyan-400">
            Play 3: Quant — SPY RSI (14)
          </h3>
        </div>
        <div className="bg-white/5 rounded-lg p-4 border border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold tracking-tight">
                {snapshot.spy_rsi !== null ? Number(snapshot.spy_rsi).toFixed(1) : '—'}
              </div>
              <div className="text-xs text-white/30 mt-1 capitalize">
                {snapshot.rsi_signal ?? 'Awaiting data'}
              </div>
            </div>
            <div className="text-right">
              <RsiGauge value={snapshot.spy_rsi} />
            </div>
          </div>
          {/* RSI Scale */}
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-white/20 mb-1">
              <span>Oversold (0)</span>
              <span>Neutral (50)</span>
              <span>Overbought (100)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-gradient-to-r from-emerald-500/40 via-white/10 to-red-500/40 relative">
              {snapshot.spy_rsi !== null && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-cyan-400 shadow-lg shadow-cyan-400/30"
                  style={{ left: `${Math.min(Math.max(snapshot.spy_rsi, 0), 100)}%`, transform: 'translate(-50%, -50%)' }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RsiGauge({ value }: { value: number | null }) {
  if (value === null) return null
  const label = value < 30 ? 'OVERSOLD' : value > 70 ? 'OVERBOUGHT' : 'NEUTRAL'
  const color = value < 30 ? 'text-emerald-400' : value > 70 ? 'text-red-400' : 'text-white/50'
  return (
    <div className={`text-xs font-bold px-3 py-1.5 rounded-lg bg-white/5 ${color}`}>
      {label}
    </div>
  )
}
