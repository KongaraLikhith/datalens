# DataLens — AI-Powered Dataset Auditor

> Upload any dataset. Uncover hidden biases in seconds.

---

## 📸 Screenshots

*Upload the sample_data.csv and screenshot the results dashboard here.*

---

## 🎯 Problem Statement

Real-world datasets are riddled with hidden biases, imbalanced classes, and data quality issues that silently corrupt machine learning models. Data scientists spend 80% of their time on data preparation, yet systematic bias detection is rarely done before modelling. DataLens automates the entire audit pipeline — from EDA to executive briefing — so you can move from raw CSV to actionable insights in seconds.

---

## ⚙️ How It Works

1. **Upload** a CSV dataset through the drag-and-drop interface
2. **Backend** runs the 8-check bias audit pipeline (class imbalance, missing data patterns, sampling bias, near-duplicate columns, low variance, small sample size, datetime gaps, outlier density)
3. **Correlation matrix** flags high-correlation pairs that may indicate data leakage
4. **Quality score** (0–100) is computed from missing data and bias findings
5. **Gemini 1.5 Flash** generates a 3-paragraph executive briefing in natural language
6. **Dashboard** renders all results with interactive charts, a correlation heatmap, and collapsible recommendations

---

## ✨ Features

- 🔍 **Automated EDA** — statistics, histograms, and top value distributions for every column
- ⚖️ **8-Check Bias Audit** — class imbalance, missing data patterns, sampling bias, data leakage, low variance, small sample size, datetime gaps, outlier density
- 🔥 **Interactive Correlation Heatmap** — Pearson matrix with color scale and warning highlights
- 🤖 **AI Data Story** — Gemini 1.5 Flash executive briefing (3 paragraphs, professional tone)
- 🏆 **Quality Score** — 0–100 with letter grade A/B/C/D/F
- 📊 **Column Explorer** — tabs per column, Recharts bar charts, missing % progress bars
- 🌙 **Dark-themed dashboard** — indigo primary on slate-950 background
- 📱 **Fully responsive** — works on mobile (375px) to 4K desktop
- 🐳 **Docker Compose** — one command to run everything

---

## 🚀 Setup Instructions

### Option 1: Local Development (Recommended for dev)

**Prerequisites**: Python 3.11+, Node.js 20+

**Backend**
```bash
cd datalens/backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your_actual_key
uvicorn app.main:app --reload --port 8000
```

**Frontend** (in a separate terminal)
```bash
cd datalens/frontend
npm install
npm run dev
# Open http://localhost:5173
```

### Option 2: Docker Compose

```bash
cd datalens
cp backend/.env.example backend/.env
# Edit backend/.env and set GEMINI_API_KEY=your_actual_key
docker-compose up --build
# Open http://localhost:80
```

### Get a Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Add to `backend/.env`: `GEMINI_API_KEY=your_key_here`

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, Tailwind CSS 3, Recharts |
| Backend | FastAPI, Uvicorn, Python 3.11 |
| Data Analysis | Pandas, NumPy, SciPy, scikit-learn |
| AI Layer | Google Gemini 1.5 Flash (via REST) |
| HTTP Client | HTTPX |
| Containerization | Docker, Docker Compose, Nginx |

---

## 📡 Sample API Response

```json
{
  "metadata": {
    "row_count": 150,
    "column_count": 12,
    "memory_mb": 0.0388,
    "columns": [{"name": "age", "type": "numeric"}, ...]
  },
  "eda": [
    {
      "column": "math_score",
      "type": "numeric",
      "stats": {"mean": 65.2, "median": 64.8, "std": 14.9, "skewness": 0.12, ...},
      "histogram": [{"bin_label": "20.00–28.00", "count": 3}, ...],
      "top_values": []
    }
  ],
  "correlations": [{"col_a": "math_score", "col_b": "science_score", "value": 0.929}],
  "high_correlation_warnings": [{"col_a": "math_score", "col_b": "science_score", "value": 0.929}],
  "bias_audit": [
    {
      "check_name": "Class Imbalance",
      "severity": "critical",
      "finding": "Column 'school_type': 'urban' accounts for 94.7% of values",
      "recommendation": "Apply SMOTE or stratified sampling..."
    }
  ],
  "quality_score": {"score": 66, "grade": "D", "summary": "Poor data quality..."},
  "data_story": "This dataset represents student performance..."
}
```

---

## 📂 Project Structure

```
datalens/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI app, CORS, /api/analyze
│   │   ├── analyzer.py      # 8-check bias audit pipeline
│   │   └── gemini_client.py # Gemini REST client
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── public/
│   │   └── sample_data.csv  # 150-row synthetic student dataset
│   ├── src/
│   │   ├── api/analyze.js
│   │   ├── components/
│   │   │   ├── UploadScreen.jsx
│   │   │   ├── ResultsDashboard.jsx
│   │   │   ├── OverviewCards.jsx
│   │   │   ├── DataStory.jsx
│   │   │   ├── BiasAudit.jsx
│   │   │   ├── ColumnExplorer.jsx
│   │   │   ├── CorrelationHeatmap.jsx
│   │   │   └── HighCorrelationWarnings.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── vite.config.js
│   └── package.json
├── docker-compose.yml
├── generate_sample_data.py
└── README.md
```

---

## 📄 License

MIT License — free to use, modify, and distribute.
