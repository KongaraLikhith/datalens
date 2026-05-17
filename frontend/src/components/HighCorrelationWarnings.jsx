export default function HighCorrelationWarnings({ warnings }) {
  if (!warnings?.length) return null

  return (
    <div id="high-correlation-section" className="fade-in-up" style={{ animationDelay: '280ms' }}>
      <div className="p-6 rounded-xl" style={{ background: '#111f35', border: '1px solid rgba(20,184,166,0.1)' }}>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-white">🔗 High Correlation Warnings</h2>
          <span className="badge badge-warning ml-auto">{warnings.length} pairs</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {warnings.map((w, i) => (
            <div
              key={i}
              className="p-4 rounded-xl fade-in-up"
              style={{
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.25)',
                animationDelay: `${i * 60}ms`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <code className="text-yellow-300 text-sm font-semibold bg-yellow-500/10 px-2 py-0.5 rounded">
                  {w.col_a}
                </code>
                <span className="text-slate-500 text-xs">↔</span>
                <code className="text-yellow-300 text-sm font-semibold bg-yellow-500/10 px-2 py-0.5 rounded">
                  {w.col_b}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Pearson correlation</span>
                <span className="text-lg font-bold" style={{ color: Math.abs(w.value) > 0.95 ? '#f87171' : '#fbbf24' }}>
                  {w.value.toFixed(3)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {Math.abs(w.value) > 0.95
                  ? '⚠️ Potential data leakage — consider removing one column'
                  : 'High multicollinearity may affect model interpretability'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
