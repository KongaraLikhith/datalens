import { useState } from 'react'

const SEV_CONFIG = {
  critical: { border: 'severity-critical', badge: 'badge-critical', label: 'Critical', icon: '🔴' },
  warning:  { border: 'severity-warning',  badge: 'badge-warning',  label: 'Warning',  icon: '🟡' },
  info:     { border: 'severity-info',     badge: 'badge-info',     label: 'Info',     icon: '🔵' },
}

function FindingRow({ finding, delay }) {
  const [open, setOpen] = useState(false)
  const cfg = SEV_CONFIG[finding.severity] || SEV_CONFIG.info

  return (
    <div
      className={`fade-in-up rounded-xl overflow-hidden ${cfg.border}`}
      style={{
        background: '#111f35',
        border: '1px solid rgba(255,255,255,0.05)',
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-base mt-0.5">{cfg.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold text-white text-sm">{finding.check_name}</span>
              <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">{finding.finding}</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-4 py-2.5 text-left text-xs font-medium flex items-center gap-2 transition-colors"
        style={{
          background: 'rgba(255,255,255,0.03)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          color: open ? '#2dd4bf' : '#64748b',
        }}
      >
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="currentColor"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
        >
          <path d="M6 7.5L2 3.5h8L6 7.5z" />
        </svg>
        {open ? 'Hide' : 'View'} Recommendation
      </button>

      {open && (
        <div className="px-4 pb-4 pt-3" style={{ background: 'rgba(20,184,166,0.05)' }}>
          <p className="text-slate-300 text-sm leading-relaxed">{finding.recommendation}</p>
        </div>
      )}
    </div>
  )
}

export default function BiasAudit({ biasAudit }) {
  const critical = biasAudit.filter(f => f.severity === 'critical')
  const warnings = biasAudit.filter(f => f.severity === 'warning')
  const info = biasAudit.filter(f => f.severity === 'info')

  const groups = [
    { label: 'Critical Issues', items: critical, color: '#f87171' },
    { label: 'Warnings', items: warnings, color: '#fbbf24' },
    { label: 'Info', items: info, color: '#2dd4bf' },
  ].filter(g => g.items.length > 0)

  let delay = 0

  return (
    <div id="bias-audit-section" className="fade-in-up" style={{ animationDelay: '160ms' }}>
      <div className="p-6 rounded-xl" style={{ background: '#111f35', border: '1px solid rgba(20,184,166,0.1)' }}>
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-lg font-semibold text-white">⚖️ Bias &amp; Quality Findings</h2>
          <span className="ml-auto text-xs text-slate-500">{biasAudit.length} total findings</span>
        </div>

        {biasAudit.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <div className="text-3xl mb-2">✅</div>
            <p>No significant bias or quality issues detected.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map(group => (
              <div key={group.label}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1" style={{ background: `${group.color}30` }} />
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: group.color }}>
                    {group.label} ({group.items.length})
                  </span>
                  <div className="h-px flex-1" style={{ background: `${group.color}30` }} />
                </div>
                <div className="space-y-3">
                  {group.items.map((f, i) => {
                    const d = delay++ * 60
                    return <FindingRow key={`${f.check_name}-${i}`} finding={f} delay={d} />
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
