"""
train_milk_model.py
===================
Trains a Random Forest classifier on synthetic milk purity data
and saves the model to ml/milk_model.pkl

Run from inside cattle-farm-backend/:
    python ml/train_milk_model.py

Requires:
    pip install scikit-learn pandas numpy joblib
"""

import numpy as np
import pandas as pd
import joblib
import os
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, accuracy_score
from sklearn.pipeline import Pipeline

SEED = 42
np.random.seed(SEED)

FEATURES = [
    "fat_percent",      # standard: 3.5–6.0 %
    "snf_percent",      # standard: 8.0–9.0 %
    "ph_level",         # standard: 6.6–6.8
    "temperature",      # collection °C, ideal ≤ 10
    "adulteration",     # 0–1 sensor score (<0.15 = clean)
    "bacteria_count",   # CFU/ml × 10³ (safe < 100)
]
LABELS    = ["pass", "fail"]
LABEL_MAP = {"pass": 1, "fail": 0}
IDX_MAP   = {1: "pass", 0: "fail"}


def generate_milk_data(n_samples: int = 2500) -> pd.DataFrame:
    rows = []

    # ── Pure milk (PASS, ~55%) ────────────────────────────────────────────────
    n_pass = int(n_samples * 0.55)
    rows.append(pd.DataFrame({
        "fat_percent":    np.random.normal(4.5,  0.5,  n_pass).clip(3.5,  6.0),
        "snf_percent":    np.random.normal(8.5,  0.3,  n_pass).clip(8.0,  9.0),
        "ph_level":       np.random.normal(6.7,  0.05, n_pass).clip(6.6,  6.8),
        "temperature":    np.random.normal(6.0,  1.5,  n_pass).clip(2.0,  10.0),
        "adulteration":   np.random.uniform(0,    0.12, n_pass),
        "bacteria_count": np.random.normal(40,   20,   n_pass).clip(5,    95),
        "label": ["pass"] * n_pass,
    }))

    # ── Borderline milk (FAIL, ~25%) — minor issues ───────────────────────────
    n_border = int(n_samples * 0.25)
    rows.append(pd.DataFrame({
        "fat_percent":    np.random.normal(3.2,  0.3,  n_border).clip(2.0, 3.5),
        "snf_percent":    np.random.normal(7.6,  0.3,  n_border).clip(6.5, 8.0),
        "ph_level":       np.random.normal(6.5,  0.1,  n_border).clip(6.2, 6.6),
        "temperature":    np.random.normal(13.0, 2.0,  n_border).clip(10,  18),
        "adulteration":   np.random.uniform(0.15, 0.35, n_border),
        "bacteria_count": np.random.normal(130,  30,   n_border).clip(100, 220),
        "label": ["fail"] * n_border,
    }))

    # ── Adulterated / contaminated milk (FAIL, ~20%) ─────────────────────────
    n_bad = n_samples - n_pass - n_border
    rows.append(pd.DataFrame({
        "fat_percent":    np.random.normal(2.0,  0.5,  n_bad).clip(0.5, 3.5),
        "snf_percent":    np.random.normal(6.5,  0.5,  n_bad).clip(5.0, 8.0),
        "ph_level":       np.random.normal(6.3,  0.2,  n_bad).clip(5.5, 6.6),
        "temperature":    np.random.normal(18.0, 4.0,  n_bad).clip(10,  30),
        "adulteration":   np.random.uniform(0.35, 1.0,  n_bad),
        "bacteria_count": np.random.normal(280,  80,   n_bad).clip(100, 600),
        "label": ["fail"] * n_bad,
    }))

    df = pd.concat(rows, ignore_index=True).sample(frac=1, random_state=SEED)
    df["label_enc"] = df["label"].map(LABEL_MAP)
    return df


def compute_purity_score(row) -> float:
    """Heuristic purity score 0-100 for display in the UI."""
    score = 100.0
    if not (3.5 <= row["fat_percent"] <= 6.0):    score -= 20
    if not (8.0 <= row["snf_percent"] <= 9.0):    score -= 15
    if not (6.6 <= row["ph_level"] <= 6.8):       score -= 20
    if row["temperature"] > 10:                    score -= min((row["temperature"] - 10) * 2, 20)
    if row["adulteration"] > 0.15:                score -= 30
    if row["bacteria_count"] > 100:               score -= min((row["bacteria_count"] - 100) / 10, 25)
    return max(round(score, 1), 0)


def train():
    print("=" * 55)
    print("  CattleMind — Milk Purity Classifier Training")
    print("=" * 55)

    print("\n[1/5] Generating synthetic milk quality dataset …")
    df = generate_milk_data(2500)
    print(f"      Samples : {len(df)}")
    print(f"      Balance :\n{df['label'].value_counts().to_string()}")

    X = df[FEATURES].values
    y = df["label_enc"].values

    print("\n[2/5] Train / test split (80/20) …")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=SEED, stratify=y
    )

    print("\n[3/5] Training Random Forest classifier …")
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("rf", RandomForestClassifier(
            n_estimators      = 200,
            max_depth         = 10,
            min_samples_split = 4,
            min_samples_leaf  = 2,
            class_weight      = "balanced",
            random_state      = SEED,
            n_jobs            = -1,
        )),
    ])
    pipeline.fit(X_train, y_train)

    print("\n[4/5] Evaluating …")
    y_pred    = pipeline.predict(X_test)
    acc       = accuracy_score(y_test, y_pred)
    cv_scores = cross_val_score(pipeline, X, y, cv=5, scoring="accuracy")

    print(f"\n  Test accuracy        : {acc:.4f}  ({acc*100:.1f}%)")
    print(f"  CV accuracy (5-fold) : {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
    print("\n  Classification Report:")
    print(classification_report(y_test, y_pred, target_names=LABELS))

    rf = pipeline.named_steps["rf"]
    print("  Feature importances:")
    for feat, imp in sorted(zip(FEATURES, rf.feature_importances_), key=lambda x: -x[1]):
        bar = "█" * int(imp * 40)
        print(f"    {feat:<18} {imp:.4f}  {bar}")

    print("\n[5/5] Saving model …")
    save_path = os.path.join(os.path.dirname(__file__), "milk_model.pkl")
    joblib.dump({
        "pipeline":   pipeline,
        "features":   FEATURES,
        "labels":     LABELS,
        "label_map":  LABEL_MAP,
        "idx_map":    IDX_MAP,
        "accuracy":   round(acc, 4),
        "cv_mean":    round(cv_scores.mean(), 4),
    }, save_path)

    print(f"  Saved → {save_path}")
    print(f"  File size : {os.path.getsize(save_path) / 1024:.1f} KB")
    print("=" * 55)


def test_inference():
    save_path = os.path.join(os.path.dirname(__file__), "milk_model.pkl")
    bundle    = joblib.load(save_path)
    pipeline  = bundle["pipeline"]
    idx_map   = bundle["idx_map"]

    print("\n  Quick inference test:")
    test_cases = [
        # [fat,  snf,  ph,  temp, adlt, bact]
        [4.5,  8.6,  6.7,  6.0, 0.05,  40],   # clean → pass
        [3.2,  7.6,  6.5, 14.0, 0.20, 140],   # borderline → fail
        [1.8,  6.4,  6.2, 22.0, 0.70, 350],   # adulterated → fail
    ]
    expected = ["pass", "fail", "fail"]

    for case, exp in zip(test_cases, expected):
        arr   = np.array([case])
        pred  = pipeline.predict(arr)[0]
        proba = pipeline.predict_proba(arr)[0]
        label = idx_map[pred]
        conf  = max(proba) * 100
        ok    = "✓" if label == exp else "✗"
        print(f"    {ok} Predicted: {label:<6}  confidence {conf:.1f}%   expected: {exp}")


if __name__ == "__main__":
    train()
    test_inference()