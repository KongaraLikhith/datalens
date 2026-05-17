import { useState } from 'react'
import UploadScreen from './components/UploadScreen'
import ResultsDashboard from './components/ResultsDashboard'

export default function App() {
  const [results, setResults] = useState(null)
  const [fileName, setFileName] = useState('')

  const handleResults = (data, name) => {
    setResults(data)
    setFileName(name)
  }

  const handleReset = () => {
    setResults(null)
    setFileName('')
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a1628' }}>
      {results ? (
        <ResultsDashboard
          data={results}
          fileName={fileName}
          onReset={handleReset}
        />
      ) : (
        <UploadScreen onResults={handleResults} />
      )}
    </div>
  )
}
