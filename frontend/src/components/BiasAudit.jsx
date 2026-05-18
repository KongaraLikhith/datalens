import { useState } from 'react'

const SEV_CONFIG = {
  critical: { border: 'severity-critical', badge: 'badge-critical', label: 'Critical', icon: '🔴' },
  warning:  { border: 'severity-warning',  badge: 'badge-warning',  label: 'Warning',  icon: '🟡' },
  info:     { border: 'severity-info',     badge: 'badge-info',     label: 'Info',     icon: '🔵' },
}

const ELI5_DICTIONARY = {
  'Class Imbalance': "Imagine a classroom where 90% of students are girls and 10% are boys. If a teacher only pays attention to girls, they won't understand the boys well. In data, if one category dominates, the AI learns to ignore the others.",
  'Missing Data': "It's like a puzzle with missing pieces. If too many pieces are missing, you can't see the whole picture.",
  'Systematic Missing Data Bias': "This is when data isn't missing randomly. Imagine if only people with low incomes skipped a survey question. The results would be skewed because you're missing a specific group's perspective.",
  'Sampling Bias Signal': "This happens when your data doesn't represent the real world. Like surveying only basketball players to find the average height of a person.",
  'Potential Data Leakage': "It's like having the answer key while taking a test. If a feature gives away the answer too easily, the AI won't learn the real patterns.",
  'Low Variance Feature': "A feature where almost everyone has the same value. Like asking 'Do you need oxygen to live?'. It doesn't help distinguish between people.",
  'Small Sample Size': "Trying to predict the weather based on only two days of observation. You need more examples to find real patterns.",
  'DateTime Gap Detected': "It's like a diary where weeks of entries are ripped out. You're missing what happened during that time.",
  'High Outlier Density': "An outlier is someone completely different from the rest. Like a person who is 8 feet tall. If you have too many, they can distort what's 'normal'."
}

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

function FindingRow({ finding, delay }) {
  const [open, setOpen] = useState(false)
  const cfg = SEV_CONFIG[finding.severity] || SEV_CONFIG.info
  const eli5Text = ELI5_DICTIONARY[finding.check_name];

  return (
    <div
      className={`fade-in-up rounded-xl ${cfg.border} relative hover:z-50`}
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
              {eli5Text && <Tooltip term={finding.check_name} text={eli5Text} />}
              <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">{finding.finding}</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full px-4 py-2.5 text-left text-xs font-medium flex items-center gap-2 transition-colors ${!open ? 'rounded-b-xl' : ''}`}
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
        {open ? 'Hide' : 'View'} Action Plan
      </button>

      {open && (
        <div className="px-4 pb-4 pt-3 flex flex-col gap-3 rounded-b-xl" style={{ background: 'rgba(20,184,166,0.05)' }}>
          <div>
            <p className="text-[#2dd4bf] text-xs font-semibold mb-1 uppercase tracking-wider">Recommendation</p>
            <p className="text-slate-300 text-sm leading-relaxed">{finding.recommendation}</p>
          </div>
          
          {finding.code_fix && (
            <div>
              <p className="text-[#0ea5e9] text-xs font-semibold mb-1 uppercase tracking-wider">Python Quick Fix</p>
              <pre className="p-3 rounded-lg text-xs overflow-x-auto" style={{ background: '#0a1628', border: '1px solid rgba(14,165,233,0.2)', color: '#e2e8f0' }}>
                <code>{finding.code_fix}</code>
              </pre>
            </div>
          )}
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
    <div id="bias-audit-section" className="fade-in-up relative hover:z-50" style={{ animationDelay: '160ms' }}>
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
