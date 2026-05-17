/**
 * DataLens API client
 * Sends a CSV file to the backend and returns the full analysis result.
 */
export async function analyzeDataset(file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/analyze', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(err.detail || `HTTP ${response.status}`)
  }

  return response.json()
}
