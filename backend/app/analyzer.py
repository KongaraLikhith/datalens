"""
DataLens — core analysis pipeline.

Runs in this order:
  1. Basic metadata
  2. Automated EDA (per column)
  3. Correlation matrix
  4. Bias & quality audit (8 checks)
  5. Overall data quality score
  6. AI data story (Gemini)
"""
from __future__ import annotations

import math
import re
from typing import Any

import numpy as np
import pandas as pd
from scipy import stats as scipy_stats


# ---------------------------------------------------------------------------
# Type inference
# ---------------------------------------------------------------------------

def _infer_type(series: pd.Series) -> str:
    # Check boolean FIRST before numeric (pandas bool is also numeric)
    if pd.api.types.is_bool_dtype(series):
        return "boolean"
    # Check for object columns with boolean-like string values
    if series.dtype == object:
        unique_lower = set(str(v).lower() for v in series.dropna().unique())
        if unique_lower <= {"true", "false", "yes", "no", "t", "f"}:
            return "boolean"
    if pd.api.types.is_datetime64_any_dtype(series):
        return "datetime"
    if pd.api.types.is_numeric_dtype(series):
        return "numeric"
    # Try parsing as datetime
    sample = series.dropna().head(50)
    if len(sample) > 0:
        try:
            parsed = pd.to_datetime(sample, errors="raise")
            if not parsed.isna().all():
                return "datetime"
        except Exception:
            pass
    # Boolean-like strings (broader check for numeric-looking booleans)
    unique_lower = set(str(v).lower() for v in series.dropna().unique())
    if unique_lower <= {"true", "false", "yes", "no", "1", "0", "t", "f"}:
        return "boolean"
    return "categorical"



# ---------------------------------------------------------------------------
# 1. Basic metadata
# ---------------------------------------------------------------------------

def extract_metadata(df: pd.DataFrame) -> dict:
    columns = []
    for col in df.columns:
        columns.append({"name": col, "type": _infer_type(df[col])})
    return {
        "row_count": len(df),
        "column_count": len(df.columns),
        "memory_mb": round(df.memory_usage(deep=True).sum() / 1024 / 1024, 4),
        "columns": columns,
    }


# ---------------------------------------------------------------------------
# 2. Automated EDA
# ---------------------------------------------------------------------------

def _safe_float(val) -> float | None:
    try:
        f = float(val)
        return None if (math.isnan(f) or math.isinf(f)) else round(f, 4)
    except Exception:
        return None


def _histogram(series: pd.Series, bins: int = 10) -> list[dict]:
    clean = series.dropna()
    if len(clean) == 0:
        return []
    counts, edges = np.histogram(clean.astype(float), bins=bins)
    result = []
    for i, count in enumerate(counts):
        label = f"{edges[i]:.2f}–{edges[i+1]:.2f}"
        result.append({"bin_label": label, "count": int(count)})
    return result


def _outlier_count_iqr(series: pd.Series) -> int:
    clean = series.dropna().astype(float)
    if len(clean) < 4:
        return 0
    q1, q3 = clean.quantile(0.25), clean.quantile(0.75)
    iqr = q3 - q1
    lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    return int(((clean < lower) | (clean > upper)).sum())


def compute_eda(df: pd.DataFrame, metadata: dict) -> list[dict]:
    eda = []
    for col_info in metadata["columns"]:
        col = col_info["name"]
        col_type = col_info["type"]
        series = df[col]
        missing_pct = round(series.isna().mean() * 100, 2)

        if col_type == "numeric":
            numeric = pd.to_numeric(series, errors="coerce")
            clean = numeric.dropna()
            outliers = _outlier_count_iqr(numeric)
            eda.append(
                {
                    "column": col,
                    "type": col_type,
                    "stats": {
                        "missing_pct": missing_pct,
                        "mean": _safe_float(clean.mean()),
                        "median": _safe_float(clean.median()),
                        "std": _safe_float(clean.std()),
                        "min": _safe_float(clean.min()),
                        "max": _safe_float(clean.max()),
                        "p25": _safe_float(clean.quantile(0.25)),
                        "p75": _safe_float(clean.quantile(0.75)),
                        "skewness": _safe_float(scipy_stats.skew(clean)) if len(clean) > 2 else None,
                        "kurtosis": _safe_float(scipy_stats.kurtosis(clean)) if len(clean) > 2 else None,
                        "outlier_count": outliers,
                    },
                    "histogram": _histogram(numeric),
                    "top_values": [],
                }
            )
        elif col_type == "boolean":
            # Treat boolean as categorical for EDA
            vc = series.astype(str).value_counts(dropna=True).head(10)
            total_non_null = series.notna().sum()
            top_values = [
                {
                    "value": str(k),
                    "count": int(v),
                    "pct": round(v / total_non_null * 100, 2) if total_non_null else 0,
                }
                for k, v in vc.items()
            ]
            eda.append(
                {
                    "column": col,
                    "type": col_type,
                    "stats": {
                        "missing_pct": missing_pct,
                        "unique_count": int(series.nunique()),
                    },
                    "histogram": top_values,
                    "top_values": top_values,
                }
            )
        elif col_type == "datetime":
            eda.append(
                {
                    "column": col,
                    "type": col_type,
                    "stats": {"missing_pct": missing_pct},
                    "histogram": [],
                    "top_values": [],
                }
            )
        else:  # categorical
            vc = series.value_counts(dropna=True).head(10)
            total_non_null = series.notna().sum()
            top_values = [
                {
                    "value": str(k),
                    "count": int(v),
                    "pct": round(v / total_non_null * 100, 2) if total_non_null else 0,
                }
                for k, v in vc.items()
            ]
            eda.append(
                {
                    "column": col,
                    "type": col_type,
                    "stats": {
                        "missing_pct": missing_pct,
                        "unique_count": int(series.nunique()),
                    },
                    "histogram": top_values,  # reuse histogram slot as bar data
                    "top_values": top_values,
                }
            )
    return eda


# ---------------------------------------------------------------------------
# 3. Correlation matrix
# ---------------------------------------------------------------------------

def compute_correlations(df: pd.DataFrame) -> tuple[list[dict], list[dict]]:
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if len(numeric_cols) < 2:
        return [], []

    corr_matrix = df[numeric_cols].corr(method="pearson")
    correlations = []
    warnings = []

    for i, col_a in enumerate(numeric_cols):
        for j, col_b in enumerate(numeric_cols):
            if j <= i:
                continue
            val = corr_matrix.loc[col_a, col_b]
            if math.isnan(val):
                continue
            val_r = round(float(val), 4)
            entry = {"col_a": col_a, "col_b": col_b, "value": val_r}
            correlations.append(entry)
            if abs(val_r) > 0.85:
                warnings.append(entry)

    return correlations, warnings


# ---------------------------------------------------------------------------
# 4. Bias & quality audit
# ---------------------------------------------------------------------------

def run_bias_audit(df: pd.DataFrame, metadata: dict, correlations: list[dict]) -> list[dict]:
    findings: list[dict] = []
    col_types = {c["name"]: c["type"] for c in metadata["columns"]}
    row_count = metadata["row_count"]

    # (a) Class imbalance check
    for col, ctype in col_types.items():
        if ctype in ("categorical", "boolean"):
            vc = df[col].value_counts(normalize=True, dropna=True)
            if len(vc) == 0:
                continue
            top_pct = float(vc.iloc[0]) * 100
            top_val = vc.index[0]
            if top_pct > 90:
                findings.append(
                    {
                        "check_name": "Class Imbalance",
                        "severity": "critical",
                        "finding": (
                            f"Column '{col}': '{top_val}' accounts for "
                            f"{top_pct:.1f}% of non-null values — severe imbalance."
                        ),
                        "recommendation": (
                            f"Apply oversampling (SMOTE) or undersampling before training. "
                            f"Consider whether '{col}' can be a reliable feature."
                        ),
                        "code_fix": (
                            f"from imblearn.over_sampling import SMOTE\n"
                            f"smote = SMOTE()\n"
                            f"# X_resampled, y_resampled = smote.fit_resample(X, df['{col}'])"
                        ),
                    }
                )
            elif top_pct > 80:
                findings.append(
                    {
                        "check_name": "Class Imbalance",
                        "severity": "warning",
                        "finding": (
                            f"Column '{col}': '{top_val}' accounts for "
                            f"{top_pct:.1f}% of non-null values."
                        ),
                        "recommendation": (
                            "Monitor model performance across minority classes. "
                            "Consider stratified sampling."
                        ),
                        "code_fix": (
                            f"from sklearn.model_selection import train_test_split\n"
                            f"# X_train, X_test, y_train, y_test = train_test_split(X, df['{col}'], stratify=df['{col}'])"
                        ),
                    }
                )

    # (b) Missing data pattern check
    for col in df.columns:
        missing_pct = df[col].isna().mean() * 100
        severity = None
        if missing_pct > 50:
            severity = "critical"
        elif missing_pct > 20:
            severity = "warning"
        if severity:
            findings.append(
                {
                    "check_name": "Missing Data",
                    "severity": severity,
                    "finding": (
                        f"Column '{col}' has {missing_pct:.1f}% missing values."
                    ),
                    "recommendation": (
                        "Investigate why values are missing. Use imputation (median/mode) "
                        "or consider dropping the column if >70% missing."
                    ),
                    "code_fix": (
                        f"if {missing_pct:.1f} > 70:\n"
                        f"    df = df.drop(columns=['{col}'])\n"
                        f"else:\n"
                        f"    val = df['{col}'].median() if pd.api.types.is_numeric_dtype(df['{col}']) else df['{col}'].mode()[0]\n"
                        f"    df['{col}'] = df['{col}'].fillna(val)"
                    ),
                }
            )

        # Check if missingness correlates with categorical columns
        if missing_pct > 5 and missing_pct < 95:
            missing_indicator = df[col].isna().astype(int)
            for other_col, other_type in col_types.items():
                if other_col == col:
                    continue
                if other_type in ("categorical", "boolean"):
                    groups = df.groupby(df[other_col].astype(str))[col].apply(
                        lambda s: s.isna().mean()
                    )
                    if len(groups) >= 2 and (groups.max() - groups.min()) > 0.2:
                        findings.append(
                            {
                                "check_name": "Systematic Missing Data Bias",
                                "severity": "warning",
                                "finding": (
                                    f"Missingness in '{col}' varies significantly across "
                                    f"groups of '{other_col}' — potential systematic bias."
                                ),
                                "recommendation": (
                                    "Investigate if data collection procedures differ by group. "
                                    "Missing-not-at-random (MNAR) data can introduce serious bias."
                                ),
                            }
                        )
                        break  # one finding per column is enough

    # (c) Sampling bias signal (skewness)
    for col, ctype in col_types.items():
        if ctype == "numeric":
            numeric = pd.to_numeric(df[col], errors="coerce").dropna()
            if len(numeric) > 2:
                skew = float(scipy_stats.skew(numeric))
                if abs(skew) > 2:
                    direction = "right" if skew > 0 else "left"
                    findings.append(
                        {
                            "check_name": "Sampling Bias Signal",
                            "severity": "warning",
                            "finding": (
                                f"Column '{col}' is highly skewed ({direction}-skewed, "
                                f"skewness={skew:.2f}) — may indicate non-representative sampling."
                            ),
                            "recommendation": (
                                "Consider log or Box-Cox transformation to normalise. "
                                "Validate that the sample distribution matches the real population."
                            ),
                        }
                    )

    # (d) Near-duplicate column detection (correlation > 0.95)
    for entry in correlations:
        if abs(entry["value"]) > 0.95:
            findings.append(
                {
                    "check_name": "Potential Data Leakage",
                    "severity": "critical",
                    "finding": (
                        f"Columns '{entry['col_a']}' and '{entry['col_b']}' have "
                        f"correlation {entry['value']:.3f} — potential data leakage "
                        "or duplicate features."
                    ),
                    "recommendation": (
                        "Drop one of these columns before modelling to prevent leakage "
                        "and multicollinearity."
                    ),
                    "code_fix": f"df = df.drop(columns=['{entry['col_b']}'])",
                }
            )

    # (e) Low variance features
    for col, ctype in col_types.items():
        series = df[col]
        if ctype == "numeric":
            numeric = pd.to_numeric(series, errors="coerce").dropna()
            unique_count = numeric.nunique()
            std_val = float(numeric.std()) if len(numeric) > 1 else 0.0
            if unique_count < 3 or std_val < 0.01:
                findings.append(
                    {
                        "check_name": "Low Variance Feature",
                        "severity": "warning",
                        "finding": (
                            f"Column '{col}' has very low variance "
                            f"(std={std_val:.4f}, unique values={unique_count}) — "
                            "likely a low-information feature."
                        ),
                        "recommendation": (
                            "Consider removing this feature — it provides little "
                            "discriminative power for most models."
                        ),
                    }
                )
        elif ctype == "categorical":
            unique_count = series.nunique()
            if unique_count < 3:
                findings.append(
                    {
                        "check_name": "Low Variance Feature",
                        "severity": "info",
                        "finding": (
                            f"Column '{col}' has only {unique_count} unique values."
                        ),
                        "recommendation": (
                            "Verify this is intentional. If the column adds no predictive "
                            "value, consider removing it."
                        ),
                    }
                )

    # (f) Small sample size warning
    if row_count < 100:
        findings.append(
            {
                "check_name": "Small Sample Size",
                "severity": "critical",
                "finding": (
                    f"Dataset has only {row_count} rows — statistical findings are unreliable."
                ),
                "recommendation": (
                    "Collect more data before drawing conclusions. Most statistical tests "
                    "and ML models require at least 1,000 rows for reliable results."
                ),
            }
        )
    elif row_count < 500:
        findings.append(
            {
                "check_name": "Small Sample Size",
                "severity": "info",
                "finding": (
                    f"Dataset has {row_count} rows — results may have limited statistical power."
                ),
                "recommendation": (
                    "Consider collecting more data for stronger statistical confidence, "
                    "especially for complex models."
                ),
            }
        )

    # (g) Date/time gaps
    for col, ctype in col_types.items():
        if ctype == "datetime":
            try:
                dt_series = pd.to_datetime(df[col], errors="coerce").dropna().sort_values()
                if len(dt_series) > 2:
                    diffs = dt_series.diff().dropna()
                    median_gap = diffs.median()
                    if median_gap and median_gap.total_seconds() > 0:
                        large_gaps = diffs[diffs > 2 * median_gap]
                        if len(large_gaps) > 0:
                            findings.append(
                                {
                                    "check_name": "DateTime Gap Detected",
                                    "severity": "warning",
                                    "finding": (
                                        f"Column '{col}' has {len(large_gaps)} irregular "
                                        f"time gap(s) > 2× the median interval "
                                        f"({median_gap})."
                                    ),
                                    "recommendation": (
                                        "Investigate whether gaps represent missing data or "
                                        "expected breaks. Consider interpolation or flagging "
                                        "gap periods."
                                    ),
                                }
                            )
            except Exception:
                pass

    # (h) Outlier density check
    for col, ctype in col_types.items():
        if ctype == "numeric":
            numeric = pd.to_numeric(df[col], errors="coerce")
            clean = numeric.dropna()
            if len(clean) < 4:
                continue
            q1, q3 = clean.quantile(0.25), clean.quantile(0.75)
            iqr = q3 - q1
            if iqr == 0:
                continue
            lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
            outlier_pct = float(((clean < lower) | (clean > upper)).mean()) * 100
            if outlier_pct > 10:
                findings.append(
                    {
                        "check_name": "High Outlier Density",
                        "severity": "warning",
                        "finding": (
                            f"Column '{col}' has {outlier_pct:.1f}% outliers (IQR method) — "
                            "may distort model training."
                        ),
                        "recommendation": (
                            "Apply robust scaling (RobustScaler) or winsorize the column. "
                            "Investigate whether outliers are genuine or data-entry errors."
                        ),
                        "code_fix": (
                            f"import numpy as np\n"
                            f"lower = df['{col}'].quantile(0.01)\n"
                            f"upper = df['{col}'].quantile(0.99)\n"
                            f"df['{col}'] = np.clip(df['{col}'], lower, upper)"
                        ),
                    }
                )

    return findings


# ---------------------------------------------------------------------------
# 5. Overall data quality score
# ---------------------------------------------------------------------------

def compute_quality_score(df: pd.DataFrame, bias_findings: list[dict]) -> dict:
    avg_missing = float(df.isna().mean().mean()) * 100
    missing_penalty = avg_missing * 2

    critical_count = sum(1 for f in bias_findings if f["severity"] == "critical")
    warning_count = sum(1 for f in bias_findings if f["severity"] == "warning")
    bias_penalty = critical_count * 15 + warning_count * 5

    score = max(0, round(100 - missing_penalty - bias_penalty))

    if score >= 90:
        grade, summary = "A", "Excellent data quality with minimal issues."
    elif score >= 80:
        grade, summary = "B", "Good data quality with some areas for improvement."
    elif score >= 70:
        grade, summary = "C", "Moderate data quality — several issues require attention."
    elif score >= 60:
        grade, summary = "D", "Poor data quality — significant remediation needed before use."
    else:
        grade, summary = "F", "Critical data quality issues — this dataset is not ready for analysis."

    return {"score": score, "grade": grade, "summary": summary}


# ---------------------------------------------------------------------------
# 6. Top interesting stats helper (for Gemini prompt)
# ---------------------------------------------------------------------------

def _pick_top_stats(eda: list[dict]) -> list[str]:
    stats = []
    for col_eda in eda:
        col = col_eda["column"]
        s = col_eda.get("stats", {})
        if col_eda["type"] == "numeric":
            missing = s.get("missing_pct", 0)
            skew = s.get("skewness")
            outliers = s.get("outlier_count", 0)
            if missing > 10:
                stats.append(f"{col}: {missing}% missing values")
            if skew and abs(skew) > 1.5:
                stats.append(f"{col}: skewness={skew:.2f}")
            if outliers > 5:
                stats.append(f"{col}: {outliers} outliers detected")
        elif col_eda["type"] == "categorical":
            top = col_eda.get("top_values", [])
            if top:
                stats.append(f"{col}: top value '{top[0]['value']}' = {top[0]['pct']}%")
    return stats[:5]


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

async def analyze_dataframe(df: pd.DataFrame) -> dict:
    from app.gemini_client import generate_data_story  # avoid circular import

    # 1. Metadata
    metadata = extract_metadata(df)

    # 2. EDA
    eda = compute_eda(df, metadata)

    # 3. Correlations
    correlations, high_corr_warnings = compute_correlations(df)

    # 4. Bias audit
    bias_audit = run_bias_audit(df, metadata, correlations)

    # 5. Quality score
    quality_score = compute_quality_score(df, bias_audit)

    # 6. AI data story
    top_stats = _pick_top_stats(eda)
    data_story = await generate_data_story(
        row_count=metadata["row_count"],
        column_count=metadata["column_count"],
        column_names_and_types=metadata["columns"],
        top_stats=top_stats,
        bias_findings=bias_audit,
        quality_score=quality_score,
    )

    return {
        "metadata": metadata,
        "eda": eda,
        "correlations": correlations,
        "high_correlation_warnings": high_corr_warnings,
        "bias_audit": bias_audit,
        "quality_score": quality_score,
        "data_story": data_story,
    }
