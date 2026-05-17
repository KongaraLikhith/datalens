import { useState, useRef, useEffect, useCallback } from 'react'
import { analyzeDataset } from '../api/analyze'

const LOADING_MESSAGES = [
  'Parsing your dataset...',
  'Running bias detection...',
  'Scoring data quality...',
  'Generating AI insights...',
  'Computing correlations...',
  'Finalizing your report...',
]

const LensIcon = () => (
  <svg width="42" height="42" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="18" stroke="#14b8a6" strokeWidth="2.5" />
    <circle cx="20" cy="20" r="10" fill="rgba(20,184,166,0.12)" stroke="#14b8a6" strokeWidth="2" />
    <circle cx="20" cy="20" r="4" fill="#14b8a6" />
    <line x1="27.5" y1="27.5" x2="35" y2="35" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="16" cy="16" r="2" fill="rgba(255,255,255,0.25)" />
  </svg>
)

const UploadIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 32V16M24 16L18 22M24 16L30 22" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 36C8.13 36 5 32.87 5 29C5 25.43 7.68 22.48 11.15 22.07C11.52 17.5 15.35 14 20 14C21.14 14 22.23 14.22 23.22 14.62C24.9 11.81 27.93 10 31.38 10C36.68 10 41 14.32 41 19.62C41 19.75 41 19.87 40.99 20C42.8 21.24 44 23.28 44 25.62C44 29.62 40.73 32.87 36.73 32.99" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function UploadScreen({ onResults }) {
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState(0)
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (isLoading) {
      intervalRef.current = setInterval(() => {
        setLoadingMsg(i => (i + 1) % LOADING_MESSAGES.length)
      }, 2000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [isLoading])

  const handleFile = useCallback((f) => {
    if (!f) return
    if (!f.name.endsWith('.csv')) {
      setError('Please upload a CSV file (.csv)')
      return
    }
    setError('')
    setFile(f)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)

  const handleLoadSample = async () => {
    try {
      const res = await fetch('/sample_data.csv')
      const blob = await res.blob()
      const sampleFile = new File([blob], 'sample_data.csv', { type: 'text/csv' })
      setFile(sampleFile)
      setError('')
    } catch {
      setError('Could not load sample file.')
    }
  }

  const handleAnalyze = async () => {
    if (!file) { setError('Please select a CSV file first.'); return }
    setIsLoading(true)
    setError('')
    try {
      const data = await analyzeDataset(file)
      onResults(data, file.name)
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background: 'radial-gradient(ellipse at 60% 20%, rgba(20,184,166,0.1) 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(14,165,233,0.07) 0%, transparent 50%), #0a1628'
      }}>

      {/* Decorative orbs */}
      <div style={{
        position: 'fixed', top: '8%', left: '8%', width: 320, height: 320,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '12%', right: '6%', width: 380, height: 380,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="w-full max-w-lg fade-in-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-3">
            <LensIcon />
            <h1 className="text-4xl font-bold" style={{
              background: 'linear-gradient(135deg, #14b8a6, #2dd4bf, #0ea5e9)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>DataLens</h1>
          </div>
          <p className="text-slate-400 text-center text-base leading-relaxed">
            Upload any dataset. Uncover hidden biases in seconds.
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <span className="badge badge-info">AI Powered</span>
            <span className="badge badge-neutral">Bias Detection</span>
            <span className="badge badge-neutral">EDA</span>
          </div>
        </div>

        {/* Card */}
        <div className="glass-card p-8 shadow-2xl">
          {/* Upload zone */}
          <div
            id="upload-dropzone"
            className={`upload-zone p-8 text-center mb-4 ${isDragging ? 'drag-over' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={e => handleFile(e.target.files[0])}
              id="csv-file-input"
            />
            <div className="flex flex-col items-center gap-3">
              <UploadIcon />
              {file ? (
                <div>
                  <p className="font-semibold" style={{ color: '#2dd4bf' }}>{file.name}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {(file.size / 1024).toFixed(1)} KB · Click to change
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-slate-300">Drop your CSV here or click to browse</p>
                  <p className="text-sm text-slate-500 mt-1">Only .csv files are supported</p>
                </div>
              )}
            </div>
          </div>

          {/* Load sample */}
          <button
            id="load-sample-btn"
            onClick={handleLoadSample}
            className="w-full mb-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              color: '#2dd4bf',
              border: '1px solid rgba(20,184,166,0.3)',
              background: 'transparent',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(20,184,166,0.6)'; e.currentTarget.style.background = 'rgba(20,184,166,0.07)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(20,184,166,0.3)'; e.currentTarget.style.background = 'transparent' }}
          >
            ✨ Load Sample Dataset (Student Performance)
          </button>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.3)',
              color: '#fca5a5',
            }}>
              {error}
            </div>
          )}

          {/* Analyze button */}
          <button
            id="analyze-btn"
            onClick={handleAnalyze}
            disabled={isLoading || !file}
            className="w-full py-3.5 rounded-xl font-semibold text-white transition-all text-base"
            style={{
              background: isLoading || !file
                ? 'rgba(20,184,166,0.2)'
                : 'linear-gradient(135deg, #14b8a6, #0d9488)',
              cursor: isLoading || !file ? 'not-allowed' : 'pointer',
              boxShadow: isLoading || !file ? 'none' : '0 4px 24px rgba(20,184,166,0.35)',
            }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-3">
                <svg className="spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <span className="text-sm">{LOADING_MESSAGES[loadingMsg]}</span>
              </div>
            ) : (
              '🔍 Analyze Dataset'
            )}
          </button>

          {/* Features hint */}
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            {['8 Bias Checks', 'AI Data Story', 'Quality Score'].map(f => (
              <div key={f} className="py-2 px-1 rounded-lg text-xs text-slate-500"
                style={{ background: 'rgba(20,184,166,0.04)', border: '1px solid rgba(20,184,166,0.1)' }}>
                {f}
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-5">
          Built with FastAPI + Groq Llama 3.3 70B · All analysis runs locally
        </p>
      </div>
    </div>
  )
}
