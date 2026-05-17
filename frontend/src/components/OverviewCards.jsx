const GRADE_COLORS = { A: '#34d399', B: '#6ee7b7', C: '#fbbf24', D: '#f87171', F: '#dc2626' }

export default function OverviewCards({ metadata, qualityScore, biasAudit }) {
  const issueCount = biasAudit.filter(f => f.severity === 'critical' || f.severity === 'warning').length
  const grade = qualityScore.grade
  const gradeColor = GRADE_COLORS[grade] || '#94a3b8'

  const cards = [
    {
      id: 'card-rows',
      label: 'Total Rows',
      value: metadata.row_count.toLocaleString(),
      icon: '📊',
      sub: `${metadata.column_count} columns · ${metadata.memory_mb} MB`,
    },
    {
      id: 'card-cols',
      label: 'Total Columns',
      value: metadata.column_count,
      icon: '🗂️',
      sub: metadata.columns.map(c => c.type).filter((v, i, a) => a.indexOf(v) === i).join(', '),
    },
    {
      id: 'card-score',
      label: 'Quality Score',
      value: <span style={{ color: gradeColor, fontSize: '2.5rem', fontWeight: 800 }}>{grade}</span>,
      icon: '🏆',
      sub: `${qualityScore.score}/100 · ${qualityScore.summary}`,
    },
    {
      id: 'card-issues',
      label: 'Issues Found',
      value: biasAudit.length,
      icon: '⚠️',
      sub: `${biasAudit.filter(f => f.severity === 'critical').length} critical, ${biasAudit.filter(f => f.severity === 'warning').length} warnings`,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card, idx) => (
        <div
          key={card.id}
          id={card.id}
          className="fade-in-up p-5 rounded-xl"
          style={{
            background: '#111f35',
            border: '1px solid rgba(20,184,166,0.12)',
            animationDelay: `${idx * 80}ms`,
          }}
        >
          <div className="text-2xl mb-2">{card.icon}</div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-1">
            {card.label}
          </div>
          <div className="text-3xl font-bold text-white mb-1">{card.value}</div>
          <div className="text-xs text-slate-500 leading-relaxed">{card.sub}</div>
        </div>
      ))}
    </div>
  )
}
