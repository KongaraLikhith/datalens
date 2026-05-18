import { useState } from 'react'

function Tooltip({ term, text }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center ml-2" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span className="cursor-help text-xs font-bold text-[#2dd4bf] border-b border-dashed border-[#2dd4bf]">ELI5</span>
      {show && (
        <div className="absolute z-50 w-64 p-3 top-full left-1/2 -translate-x-1/2 mt-1 text-xs font-normal text-white rounded-lg shadow-xl" style={{ background: '#0a1628', border: '1px solid #14b8a6' }}>
          <strong>{term}</strong>: {text}
        </div>
      )}
    </span>
  )
}

export default function HighCorrelationWarnings({ warnings }) {
  if (!warnings?.length) return null

  const eli5Text = "When two features are highly correlated, they are essentially providing the same information. Imagine predicting house prices using both 'Area in square feet' and 'Area in square meters'. The AI gets confused about which feature is actually important. We usually drop one of them.";

  return (
    <div id="high-correlation-section" className="fade-in-up relative hover:z-50" style={{ animationDelay: '280ms' }}>
      <div className="p-6 rounded-xl" style={{ background: '#111f35', border: '1px solid rgba(20,184,166,0.1)' }}>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-white">🔗 High Correlation Warnings</h2>
          <Tooltip term="High Correlation" text={eli5Text} />
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
              <p className="text-xs text-slate-500 mt-2 mb-3 leading-relaxed">
                {Math.abs(w.value) > 0.95
                  ? '⚠️ Potential data leakage — consider removing one column'
                  : 'High multicollinearity may affect model interpretability'}
              </p>
              
              <div className="pt-3 border-t" style={{ borderColor: 'rgba(245,158,11,0.2)' }}>
                <p className="text-[#0ea5e9] text-xs font-semibold mb-1 uppercase tracking-wider">Python Quick Fix</p>
                <pre className="p-2 rounded border" style={{ background: '#0a1628', borderColor: 'rgba(14,165,233,0.3)', color: '#e2e8f0' }}>
                  <code className="text-xs">df = df.drop(columns=['{w.col_b}'])</code>
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
