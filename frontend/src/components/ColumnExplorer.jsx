import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <p style={{ color: '#94a3b8', marginBottom: 2 }}>{label}</p>
      <p style={{ color: '#6366f1', fontWeight: 600 }}>Count: {payload[0].value}</p>
    </div>
  )
}

function MissingBar({ pct }) {
  const color = pct > 50 ? '#ef4444' : pct > 20 ? '#f59e0b' : '#6366f1'
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-slate-500">Missing values</span>
        <span className="text-xs font-semibold" style={{ color }}>{pct}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
      </div>
    </div>
  )
}

function StatGrid({ stats, type }) {
  if (type === 'numeric') {
    const items = [
      ['Mean', stats.mean], ['Median', stats.median], ['Std Dev', stats.std],
      ['Min', stats.min], ['Max', stats.max], ['P25', stats.p25], ['P75', stats.p75],
      ['Skewness', stats.skewness], ['Kurtosis', stats.kurtosis],
    ].filter(([, v]) => v != null)

    return (
      <div className="grid grid-cols-3 gap-2 mb-4">
        {items.map(([label, val]) => (
          <div key={label} className="rounded-lg p-2.5 text-center"
            style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="text-xs text-slate-500 mb-0.5">{label}</div>
            <div className="text-sm font-semibold text-white">{typeof val === 'number' ? val.toFixed(2) : val}</div>
          </div>
        ))}
        {stats.outlier_count > 0 && (
          <div className="rounded-lg p-2.5 text-center" style={{ background: 'rgba(248,113,113,0.1)' }}>
            <div className="text-xs text-red-400 mb-0.5">Outliers</div>
            <div className="text-sm font-semibold text-red-300">{stats.outlier_count}</div>
          </div>
        )}
      </div>
    )
  }

  if (type === 'categorical' || type === 'boolean') {
    return (
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="rounded-lg p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div className="text-xs text-slate-500 mb-0.5">Unique Values</div>
          <div className="text-sm font-semibold text-white">{stats.unique_count}</div>
        </div>
      </div>
    )
  }
  return null
}

function NumericChart({ histogram }) {
  if (!histogram?.length) return null
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={histogram} margin={{ top: 0, right: 0, bottom: 20, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="bin_label" tick={{ fontSize: 9, fill: '#64748b' }} angle={-30} textAnchor="end" interval={0} />
        <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" radius={[3, 3, 0, 0]}>
          {histogram.map((_, i) => (
            <Cell key={i} fill={`hsl(${245 + i * 5}, 70%, ${55 + i * 2}%)`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function CategoricalChart({ topValues }) {
  if (!topValues?.length) return null
  const data = topValues.slice(0, 8).map(v => ({ name: v.value, count: v.count, pct: v.pct }))
  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-slate-400 w-20 shrink-0 truncate" title={item.name}>{item.name}</span>
          <div className="flex-1 h-5 rounded overflow-hidden" style={{ background: '#334155' }}>
            <div
              className="h-full rounded flex items-center justify-end pr-1.5 transition-all"
              style={{
                width: `${item.pct}%`,
                background: `hsl(${245 + i * 15}, 65%, 60%)`,
                minWidth: '2px',
              }}
            >
              {item.pct > 15 && <span className="text-xs text-white font-medium">{item.pct}%</span>}
            </div>
          </div>
          <span className="text-xs text-slate-500 w-10 text-right">{item.count}</span>
        </div>
      ))}
    </div>
  )
}

export default function ColumnExplorer({ eda }) {
  const [activeTab, setActiveTab] = useState(0)

  if (!eda?.length) return null
  const col = eda[activeTab]

  return (
    <div id="column-explorer-section" className="fade-in-up" style={{ animationDelay: '200ms' }}>
      <div className="p-6 rounded-xl" style={{ background: '#111f35', border: '1px solid rgba(20,184,166,0.1)' }}>
        <h2 className="text-lg font-semibold text-white mb-4">🔬 Column Explorer</h2>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-1.5 mb-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {eda.map((c, i) => (
            <button
              key={c.column}
              onClick={() => setActiveTab(i)}
              className={`px-3 py-1.5 text-xs font-medium transition-all ${i === activeTab ? 'tab-active' : 'tab-inactive'}`}
            >
              {c.column}
              {c.stats.missing_pct > 20 && <span className="ml-1 text-red-400">•</span>}
            </button>
          ))}
        </div>

        {/* Column detail */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h3 className="font-semibold text-white">{col.column}</h3>
            <span className="badge badge-neutral capitalize">{col.type}</span>
            {col.type === 'numeric' && col.stats.outlier_count > 0 && (
              <span className="badge badge-warning">{col.stats.outlier_count} outliers</span>
            )}
          </div>

          <MissingBar pct={col.stats.missing_pct || 0} />

          <div className="mt-4">
            <StatGrid stats={col.stats} type={col.type} />
          </div>

          {col.type === 'numeric' && (
            <div>
              <div className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Distribution</div>
              <NumericChart histogram={col.histogram} />
            </div>
          )}

          {(col.type === 'categorical' || col.type === 'boolean') && col.top_values?.length > 0 && (
            <div>
              <div className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wide">Top Values</div>
              <CategoricalChart topValues={col.top_values} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
