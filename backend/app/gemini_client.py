"""Groq API client for DataLens data story generation.

Uses the OpenAI-compatible Groq API with llama-3.3-70b-versatile (free tier).
Add GROQ_API_KEY to backend/.env to enable this feature.
"""
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"  # Free 70B model on Groq


async def generate_data_story(
    row_count: int,
    column_count: int,
    column_names_and_types: list[dict],
    top_stats: list[str],
    bias_findings: list[dict],
    quality_score: dict,
) -> str:
    """Call Groq Llama-3.3-70B to generate a 3-paragraph executive data story."""
    if not GROQ_API_KEY:
        return (
            "AI data story unavailable — add GROQ_API_KEY to backend/.env "
            "to enable this feature. Get a free key at console.groq.com."
        )

    col_summary = ", ".join(
        f"{c['name']} ({c['type']})" for c in column_names_and_types
    )
    findings_text = "; ".join(
        f"[{f['severity'].upper()}] {f['check_name']}: {f['finding']}"
        for f in bias_findings
    ) or "No significant bias findings detected."

    stats_text = "\n".join(top_stats) if top_stats else "N/A"

    user_prompt = (
        f"Dataset overview: {row_count} rows, {column_count} columns.\n"
        f"Columns: {col_summary}\n"
        f"Key statistics:\n{stats_text}\n"
        f"Bias findings: {findings_text}\n"
        f"Data quality score: {quality_score.get('score', 'N/A')}/100 "
        f"(Grade: {quality_score.get('grade', 'N/A')})\n\n"
        "Write a 3-paragraph executive data story:\n"
        "Paragraph 1: What this dataset appears to represent and its scale.\n"
        "Paragraph 2: The 3 most important data quality or bias findings and why they matter.\n"
        "Paragraph 3: Top 3 recommended next steps before using this data for decisions.\n"
        "Keep it professional, specific, and non-technical. No bullet points."
    )

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {
                "role": "system",
                "content": "You are a senior data analyst writing a concise executive briefing.",
            },
            {
                "role": "user",
                "content": user_prompt,
            },
        ],
        "temperature": 0.7,
        "max_tokens": 800,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
    except httpx.HTTPStatusError as exc:
        return f"AI story generation failed (HTTP {exc.response.status_code}): {exc.response.text[:200]}"
    except Exception as exc:  # noqa: BLE001
        return f"AI story generation failed: {exc}"
