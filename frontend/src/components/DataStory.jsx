const SparkleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"
      fill="url(#sparkle-grad)" stroke="none" />
    <defs>
      <linearGradient id="sparkle-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#14b8a6" />
        <stop offset="1" stopColor="#2dd4bf" />
      </linearGradient>
    </defs>
  </svg>
)

export default function DataStory({ story }) {
  if (!story) return null

  // Split into paragraphs
  const paragraphs = story
    .split('\n')
    .map(p => p.trim())
    .filter(p => p.length > 0)

  return (
    <div id="data-story-section" className="fade-in-up" style={{ animationDelay: '120ms' }}>
      <div className="gradient-border-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <SparkleIcon />
          <h2 className="text-lg font-semibold text-white">AI Executive Briefing</h2>
          <span className="ml-auto badge badge-info text-xs">Groq Llama 3.3 70B</span>
        </div>

        <div className="space-y-4">
          {paragraphs.map((para, i) => (
            <p
              key={i}
              className="text-slate-300 leading-relaxed text-sm"
              style={{
                borderLeft: i === 0 ? '3px solid #6366f1' : 'none',
                paddingLeft: i === 0 ? '12px' : '0',
              }}
            >
              {para}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
