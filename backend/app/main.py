"""DataLens FastAPI application."""
import io
import os
import traceback
from pathlib import Path

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.analyzer import analyze_dataframe

app = FastAPI(
    title="DataLens API",
    description="AI-Powered Dataset Auditor — bias detection, EDA, and data stories.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/analyze")
async def analyze(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as exc:
        raise HTTPException(
            status_code=422, detail=f"Could not parse CSV: {exc}"
        ) from exc

    if df.empty:
        raise HTTPException(status_code=422, detail="The uploaded CSV file is empty.")

    try:
        result = await analyze_dataframe(df)
    except Exception as exc:  # noqa: BLE001
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Analysis failed: {exc}"
        ) from exc

    return result

from pydantic import BaseModel
from app.gemini_client import chat_with_data

class ChatRequest(BaseModel):
    messages: list[dict]
    context: str

@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        response = await chat_with_data(request.messages, request.context)
        return {"response": response}
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Chat failed: {exc}") from exc


# Serve built React frontend (only present in Docker/production build)
STATIC_DIR = Path(__file__).parent.parent / "static"

if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        index = STATIC_DIR / "index.html"
        return FileResponse(str(index))
