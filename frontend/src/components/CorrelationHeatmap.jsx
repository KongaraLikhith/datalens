import { useState } from 'react'

function interpolateColor(value) {
  // value: -1 to +1
  // -1 → deep red, 0 → near white/dark, +1 → deep indigo
  const clamped = Math.max(-1, Math.min(1, value))
  if (clamped >= 0) {
    // white/neutral → teal
    const t = clamped
    const r = Math.round(226 - t * (226 - 20))
    const g = Math.round(232 - t * (232 - 184))
    const b = Math.round(240 - t * (240 - 166))
    return `rgb(${r},${g},${b})`
  } else {
    // white/neutral → deep red
    const t = -clamped
    const r = Math.round(226 + t * (239 - 226))
    const g = Math.round(232 - t * 232)
    const b = Math.round(240 - t * 240)
    return `rgb(${r},${g},${b})`
  }
}

function textColor(value) {
  return Math.abs(value) > 0.5 ? '#ffffff' : '#1e293b'
}

export default function CorrelationHeatmap({ correlations, highCorrWarnings, columns }) {
  const [tooltip, setTooltip] = useState(null)

  const numericCols = columns.filter(c => c.type === 'numeric').map(c => c.name)
  if (numericCols.length < 2) return null

  // Build lookup map
  const corrMap = {}
  for (const entry of correlations) {
    corrMap[`${entry.col_a}__${entry.col_b}`] = entry.value
    corrMap[`${entry.col_b}__${entry.col_a}`] = entry.value
  }
  const warnSet = new Set(
    highCorrWarnings.map(w => `${w.col_a}__${w.col_b}`)
  )

  const getValue = (a, b) => {
    if (a === b) return 1
    return corrMap[`${a}__${b}`] ?? null
  }

  const isWarning = (a, b) =>
    warnSet.has(`${a}__${b}`) || warnSet.has(`${b}__${a}`)

  return (
    <div id="correlation-heatmap-section" className="fade-in-up" style={{ animationDelay: '240ms' }}>
      <div className="p-6 rounded-xl" style={{ background: '#111f35', border: '1px solid rgba(20,184,166,0.1)' }}>
        <div className="flex items-center gap-2 mb-5">
          <h2 className="text-lg font-semibold text-white">🔥 Correlation Heatmap</h2>
          <span className="text-xs text-slate-500 ml-auto">Pearson · hover for value</span>
        </div>

        {/* Heatmap */}
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'inline-block', minWidth: 'max-content' }}>
            {/* Column headers */}
            <div style={{ display: 'flex', marginLeft: 100 }}>
              {numericCols.map(col => (
                <div key={col} style={{ width: 40, textAlign: 'center', paddingBottom: 4 }}>
                  <div style={{
                    fontSize: 9, color: '#64748b', writingMode: 'vertical-lr',
                    transform: 'rotate(180deg)', height: 60, lineHeight: '1.2',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {col}
                  </div>
                </div>
              ))}
            </div>

            {/* Rows */}
            {numericCols.map(rowCol => (
              <div key={rowCol} style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                {/* Row label */}
                <div style={{
                  width: 96, paddingRight: 8, fontSize: 10, color: '#64748b',
                  textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {rowCol}
                </div>
                {/* Cells */}
                {numericCols.map(colCol => {
                  const val = getValue(rowCol, colCol)
                  const warn = isWarning(rowCol, colCol)
                  const bg = val != null ? interpolateColor(val) : '#1e293b'
                  const tc = val != null ? textColor(val) : '#475569'

                  return (
                    <div
                      key={colCol}
                      className="heatmap-cell tooltip"
                      style={{
                        background: bg,
                        color: tc,
                        outline: warn ? '2px solid #f59e0b' : 'none',
                        outlineOffset: warn ? '-2px' : '0',
                        marginRight: 2,
                      }}
                      onMouseEnter={() => setTooltip({ a: rowCol, b: colCol, val })}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      <span style={{ fontSize: 9, fontWeight: 600 }}>
                        {val != null ? val.toFixed(2) : '—'}
                      </span>
                      {warn && (
                        <div className="tooltip-text" style={{ bottom: 'calc(100% + 4px)' }}>
                          ⚠️ High correlation warning
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-4">
          <span className="text-xs text-slate-500">−1</span>
          <div style={{
            flex: 1, height: 8, borderRadius: 4,
            background: 'linear-gradient(to right, #ef4444, #e2e8f0, #14b8a6)',
          }} />
          <span className="text-xs text-slate-500">+1</span>
          {highCorrWarnings.length > 0 && (
            <span className="text-xs ml-2" style={{ color: '#f59e0b' }}>
              ⬜ = high correlation warning
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
