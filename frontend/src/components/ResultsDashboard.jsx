import OverviewCards from './OverviewCards'
import DataStory from './DataStory'
import BiasAudit from './BiasAudit'
import ColumnExplorer from './ColumnExplorer'
import CorrelationHeatmap from './CorrelationHeatmap'
import HighCorrelationWarnings from './HighCorrelationWarnings'

const GRADE_SCORE_CLASS = (grade) => {
  if (grade === 'A' || grade === 'B') return 'score-badge-AB'
  if (grade === 'C') return 'score-badge-C'
  return 'score-badge-DF'
}

const LensIcon = () => (
  <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="18" stroke="#14b8a6" strokeWidth="2.5" />
    <circle cx="20" cy="20" r="10" fill="rgba(20,184,166,0.12)" stroke="#14b8a6" strokeWidth="2" />
    <circle cx="20" cy="20" r="4" fill="#14b8a6" />
    <line x1="27.5" y1="27.5" x2="35" y2="35" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
)

export default function ResultsDashboard({ data, fileName, onReset }) {
  const { metadata, eda, correlations, high_correlation_warnings, bias_audit, quality_score, data_story } = data
  const grade = quality_score.grade
  const scoreClass = GRADE_SCORE_CLASS(grade)

  return (
    <div>
      {/* Sticky Navbar */}
      <nav
        className="sticky top-0 z-50 px-4 py-3 flex items-center gap-4"
        style={{
          background: 'rgba(10,22,40,0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(20,184,166,0.15)',
        }}
      >
        <div className="flex items-center gap-2">
          <LensIcon />
          <span className="font-bold text-white text-lg hidden sm:block">DataLens</span>
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <span className="text-slate-500 text-sm hidden md:block">|</span>
          <span className="text-slate-300 text-sm truncate max-w-xs">{fileName}</span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div
            className={`px-3 py-1 rounded-full text-sm font-bold ${scoreClass}`}
            title={`Quality Score: ${quality_score.score}/100`}
          >
            Grade {grade} · {quality_score.score}/100
          </div>

          <button
            id="analyze-another-btn"
            onClick={onReset}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: 'rgba(20,184,166,0.12)',
              color: '#2dd4bf',
              border: '1px solid rgba(20,184,166,0.3)',
            }}
          >
            ↩ New Analysis
          </button>
        </div>
      </nav>

      {/* Dashboard content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Section 1: Overview Cards */}
        <section>
          <OverviewCards
            metadata={metadata}
            qualityScore={quality_score}
            biasAudit={bias_audit}
          />
        </section>

        {/* Section 2: AI Data Story */}
        {data_story && (
          <section>
            <DataStory story={data_story} />
          </section>
        )}

        {/* Section 3: Bias Audit */}
        <section>
          <BiasAudit biasAudit={bias_audit} />
        </section>

        {/* Section 4: Column Explorer */}
        <section>
          <ColumnExplorer eda={eda} />
        </section>

        {/* Section 5: Correlation Heatmap */}
        <section>
          <CorrelationHeatmap
            correlations={correlations}
            highCorrWarnings={high_correlation_warnings}
            columns={metadata.columns}
          />
        </section>

        {/* Section 6: High Correlation Warnings */}
        {high_correlation_warnings?.length > 0 && (
          <section>
            <HighCorrelationWarnings warnings={high_correlation_warnings} />
          </section>
        )}

        {/* Footer */}
        <footer className="text-center py-6 text-xs text-slate-600">
          DataLens · AI-Powered Dataset Auditor · Powered by Groq Llama 3.3 70B + FastAPI
        </footer>
      </div>
    </div>
  )
}
