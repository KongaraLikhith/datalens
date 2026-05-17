"""Generate synthetic student performance sample data for DataLens demo."""
import random
import numpy as np
import pandas as pd

random.seed(42)
np.random.seed(42)

N = 150

student_ids = [f"S{str(i).zfill(4)}" for i in range(1, N + 1)]
ages = np.random.randint(15, 19, N)
genders = np.random.choice(["male", "female"], N, p=[0.52, 0.48])

# study_hours: mostly 5-20 but with outliers
study_hours = np.clip(np.random.exponential(scale=8, size=N), 1, 60).astype(float)
# Add deliberate outliers
study_hours[5] = 55.0
study_hours[23] = 58.0
study_hours[77] = 60.0
study_hours[110] = 0.5

attendance = np.clip(np.random.normal(75, 15, N), 10, 100).round(1)

# math_score: base
math_score = np.clip(np.random.normal(65, 15, N), 20, 100).round(1)

# science_score: highly correlated with math (r > 0.9)
noise = np.random.normal(0, 5, N)
science_score = np.clip(0.92 * math_score + noise + 5, 20, 100).round(1)

# english_score: moderately correlated
english_score = np.clip(
    np.random.normal(60, 18, N) * 0.3 + math_score * 0.5 + 10,
    20, 100
).round(1)

# passed_exam: based on average score
avg_score = (math_score + science_score + english_score) / 3
passed_exam = (avg_score >= 55).astype(bool)

# socioeconomic_index: 25% missing
socio = np.random.uniform(1, 10, N).round(2)
missing_mask = np.random.choice([True, False], N, p=[0.25, 0.75])
socio_with_missing = np.where(missing_mask, np.nan, socio)

# school_type: 91% urban (class imbalance)
school_type = np.random.choice(["urban", "rural", "suburban"], N, p=[0.91, 0.05, 0.04])

# tutoring: yes/no
tutoring = np.random.choice(["yes", "no"], N, p=[0.35, 0.65])

df = pd.DataFrame(
    {
        "student_id": student_ids,
        "age": ages,
        "gender": genders,
        "study_hours_per_week": study_hours.round(1),
        "attendance_pct": attendance,
        "math_score": math_score,
        "english_score": english_score,
        "science_score": science_score,
        "passed_exam": passed_exam,
        "socioeconomic_index": socio_with_missing,
        "school_type": school_type,
        "tutoring": tutoring,
    }
)

out_path = r"C:\Users\likki\Documents\ML Hack\datalens\frontend\public\sample_data.csv"
df.to_csv(out_path, index=False)
print(f"Saved {len(df)} rows to {out_path}")
print(df.describe())
print(f"\nschool_type value counts:\n{df['school_type'].value_counts(normalize=True)}")
print(f"\nMissing socioeconomic_index: {df['socioeconomic_index'].isna().mean():.1%}")
print(f"\nCorr(math, science): {df['math_score'].corr(df['science_score']):.3f}")
