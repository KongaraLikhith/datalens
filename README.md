# DataLens — AI-Powered Dataset Auditor

> Upload any dataset. Uncover hidden biases in seconds.

---

## 🎯 Problem Statement

Real-world datasets are riddled with hidden biases, imbalanced classes, and data quality issues that silently corrupt machine learning models. Data scientists spend 80% of their time on data preparation, yet systematic bias detection is rarely done before modelling. DataLens automates the entire audit pipeline — from EDA to executive briefing — so you can move from raw CSV to actionable insights in seconds.

---

## ⚙️ How It Works

1. **Upload** a CSV dataset through the drag-and-drop interface
2. **Backend** runs the 8-check bias audit pipeline (class imbalance, missing data patterns, sampling bias, near-duplicate columns, low variance, small sample size, datetime gaps, outlier density)
3. **Correlation matrix** flags high-correlation pairs that may indicate data leakage
4. **Quality score** (0–100) is computed from missing data and bias findings
5. **Groq Llama 3.3 70B** generates a 3-paragraph executive briefing in natural language instantly
6. **Dashboard** renders all results with interactive charts, a correlation heatmap, and collapsible recommendations in a stunning Deep Navy & Teal UI

---

## ✨ Features

- 🔍 **Automated EDA** — statistics, histograms, and top value distributions for every column
- ⚖️ **8-Check Bias Audit** — class imbalance, missing data patterns, sampling bias, data leakage, low variance, small sample size, datetime gaps, outlier density
- 🔥 **Interactive Correlation Heatmap** — Pearson matrix with color scale and warning highlights
- 🤖 **AI Data Story** — Groq Llama 3.3 70B executive briefing (3 paragraphs, professional tone, blazing fast)
- **AI Chatbot Assistant** — Interactive chat window to ask questions about the dataset findings directly
- **ELI5 Tooltips** — Beginner-friendly "Explain Like I'm 5" definitions for complex data science terminology
- **Python Quick Fixes** — Actionable code snippets provided for detected bias and data quality issues
- 🏆 **Quality Score** — 0–100 with letter grade A/B/C/D/F
- 📊 **Column Explorer** — tabs per column, Recharts bar charts, missing % progress bars
- 🌙 **Deep Navy & Teal Theme** — A unique, custom-designed dark mode interface
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
# Edit .env and set GROQ_API_KEY=your_actual_key
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
# Edit backend/.env and set GROQ_API_KEY=your_actual_key
docker-compose up --build
# Open http://localhost:80
```

### Get a Groq API Key
1. Go to [Groq Console](https://console.groq.com/keys)
2. Create a new, free API key
3. Add to `backend/.env`: `GROQ_API_KEY=your_key_here`

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, Tailwind CSS 3, Recharts |
| Backend | FastAPI, Uvicorn, Python 3.11 |
| Data Analysis | Pandas, NumPy, SciPy, scikit-learn |
| AI Layer | Groq Llama 3.3 70B (via REST) |
| HTTP Client | HTTPX |
| Containerization | Docker, Docker Compose, Nginx |

---

## 📂 Project Structure

```
datalens/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI app, CORS, /api/analyze
│   │   ├── analyzer.py      # 8-check bias audit pipeline
│   │   └── gemini_client.py # Groq Llama-3.3-70b API integration
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
│   │   │   ├── HighCorrelationWarnings.jsx
│   │   │   └── Chatbot.jsx
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
