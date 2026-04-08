interface PortfolioProps {
  snapshot: any | null
}

export default function Portfolio({ snapshot }: PortfolioProps) {
  const portfolio = snapshot?.portfolio ?? []

  if (portfolio.length === 0) {
    return (
      <div className="bg-[#0d1220] border border-white/10 rounded-xl p-8 text-center">
        <div className="text-white/30 text-lg mb-2">No portfolio data yet</div>
        <div className="text-white/20 text-sm">
          Portfolio allocations will appear here once the daily cron job runs.
        </div>
      </div>
    )
  }

  const totalValue = snapshot?.portfolio_value ?? 250000

  return (
    <div className="space-y-4">
      {/* Portfolio Summary */}
      <div className="bg-[#0d1220] border border-white/10 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white/60 mb-4">Model Portfolio</h3>

        {/* Allocation Bar */}
        <div className="w-full h-8 rounded-lg overflow-hidden flex mb-4">
          {portfolio.map((holding: any, i: number) => {
            const colors = [
              'bg-emerald-500', 'bg-cyan-500', 'bg-violet-500', 'bg-amber-500',
              'bg-rose-500', 'bg-blue-500', 'bg-lime-500', 'bg-orange-500',
              'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-yellow-500',
            ]
            return (
              <div
                key={i}
                className={`${colors[i % colors.length]} opacity-70 hover:opacity-100 transition-opacity relative group`}
                style={{ width: `${holding.weight_pct}%` }}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {holding.ticker}: {holding.weight_pct}%
                </div>
              </div>
            )
          })}
        </div>

        {/* Holdings Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-white/30 border-b border-white/5">
                <th className="text-left py-2 font-medium">Ticker</th>
                <th className="text-right py-2 font-medium">Weight</th>
                <th className="text-right py-2 font-medium">Value</th>
                <th className="text-right py-2 font-medium">Daily Chg</th>
                <th className="text-left py-2 pl-4 font-medium">Signal Sources</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.map((holding: any, i: number) => {
                const value = (totalValue * (holding.weight_pct / 100))
                const dailyChange = holding.daily_change_pct ?? 0
                return (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3">
                      <span className="font-semibold text-sm">{holding.ticker}</span>
                    </td>
                    <td className="text-right py-3">
                      <span className="text-sm text-white/70">{holding.weight_pct.toFixed(1)}%</span>
                    </td>
                    <td className="text-right py-3">
                      <span className="text-sm text-white/70">${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </td>
                    <td className="text-right py-3">
                      <span
                        className={`text-sm font-medium ${
                          dailyChange > 0
                            ? 'text-emerald-400'
                            : dailyChange < 0
                              ? 'text-red-400'
                              : 'text-white/30'
                        }`}
                      >
                        {dailyChange > 0 ? '+' : ''}{dailyChange.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 pl-4">
                      <div className="flex gap-1 flex-wrap">
                        {(holding.signal_sources ?? []).map((source: string, j: number) => (
                          <span
                            key={j}
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              source === 'narrative'
                                ? 'bg-violet-500/20 text-violet-400'
                                : source === 'crowd'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : source === 'quant'
                                    ? 'bg-cyan-500/20 text-cyan-400'
                                    : 'bg-white/10 text-white/40'
                            }`}
                          >
                            {source}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
