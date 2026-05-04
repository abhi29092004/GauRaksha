"""
train_health_model.py
=====================
Trains a Random Forest classifier on synthetic cattle health data
and saves the model + scaler to ml/health_model.pkl

Run from inside cattle-farm-backend/:
    python ml/train_health_model.py

Requires:
    pip install scikit-learn pandas numpy joblib
"""

import numpy as np
import pandas as pd
import joblib
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.pipeline import Pipeline

# ── Reproducibility ───────────────────────────────────────────────────────────
SEED = 42
np.random.seed(SEED)

# ── Feature names — must match HealthInput fields in routers/health.py ────────
FEATURES = [
    "temperature",        # °C  normal: 38.0–39.5
    "heart_rate",         # bpm normal: 40–70
    "respiratory_rate",   # breaths/min  normal: 15–40
    "milk_yield",         # litres/day
    "body_condition",     # BCS 1–5   ideal: 3–4
    "activity_level",     # 0–10 sensor score
]
LABELS    = ["low", "medium", "high"]
LABEL_MAP = {"low": 0, "medium": 1, "high": 2}
IDX_MAP   = {0: "low", 1: "medium", 2: "high"}


# ── Synthetic data generator ──────────────────────────────────────────────────
def generate_cattle_data(n_samples: int = 3000) -> pd.DataFrame:
    """
    Generates realistic synthetic cattle vital signs.
    Each row is labelled low / medium / high risk using
    veterinary reference ranges.
    """
    rows = []

    # ── healthy cattle (low risk, ~50 % of data) ─────────────────────────────
    n_low = n_samples // 2
    rows_low = {
        "temperature":       np.random.normal(38.8,  0.3,  n_low).clip(38.0, 39.5),
        "heart_rate":        np.random.normal(55.0,  6.0,  n_low).clip(40,   70),
        "respiratory_rate":  np.random.normal(25.0,  4.0,  n_low).clip(15,   35),
        "milk_yield":        np.random.normal(14.0,  3.0,  n_low).clip(8,    25),
        "body_condition":    np.random.normal(3.4,   0.3,  n_low).clip(3.0,  4.5),
        "activity_level":    np.random.normal(6.5,   1.0,  n_low).clip(5,    10),
        "label":             ["low"] * n_low,
    }
    rows.append(pd.DataFrame(rows_low))

    # ── mildly stressed cattle (medium risk, ~30 %) ───────────────────────────
    n_med = int(n_samples * 0.30)
    rows_med = {
        "temperature":       np.random.normal(39.8,  0.4,  n_med).clip(39.2, 40.5),
        "heart_rate":        np.random.normal(72.0,  8.0,  n_med).clip(60,   85),
        "respiratory_rate":  np.random.normal(36.0,  4.0,  n_med).clip(28,   45),
        "milk_yield":        np.random.normal(8.0,   2.0,  n_med).clip(3,    12),
        "body_condition":    np.random.normal(2.5,   0.3,  n_med).clip(2.0,  3.0),
        "activity_level":    np.random.normal(3.5,   1.0,  n_med).clip(2,    5),
        "label":             ["medium"] * n_med,
    }
    rows.append(pd.DataFrame(rows_med))

    # ── sick cattle (high risk, ~20 %) ───────────────────────────────────────
    n_high = n_samples - n_low - n_med
    rows_high = {
        "temperature":       np.random.normal(40.8,  0.5,  n_high).clip(40.0, 42.5),
        "heart_rate":        np.random.normal(88.0, 10.0,  n_high).clip(75,  120),
        "respiratory_rate":  np.random.normal(48.0,  6.0,  n_high).clip(40,   70),
        "milk_yield":        np.random.normal(3.5,   1.5,  n_high).clip(0,     7),
        "body_condition":    np.random.normal(1.8,   0.3,  n_high).clip(1.0,  2.2),
        "activity_level":    np.random.normal(1.5,   0.7,  n_high).clip(0,    2.5),
        "label":             ["high"] * n_high,
    }
    rows.append(pd.DataFrame(rows_high))

    df = pd.concat(rows, ignore_index=True).sample(frac=1, random_state=SEED)
    df["label_enc"] = df["label"].map(LABEL_MAP)
    return df


# ── Training ──────────────────────────────────────────────────────────────────
def train():
    print("=" * 55)
    print("  CattleMind — Random Forest Health Model Training")
    print("=" * 55)

    # 1. Generate data
    print("\n[1/5] Generating synthetic cattle health dataset …")
    df = generate_cattle_data(n_samples=3000)
    print(f"      Total samples : {len(df)}")
    print(f"      Class balance :\n{df['label'].value_counts().to_string()}")

    X = df[FEATURES].values
    y = df["label_enc"].values

    # 2. Train / test split
    print("\n[2/5] Splitting into train (80%) / test (20%) …")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=SEED, stratify=y
    )

    # 3. Build pipeline  (scaler → Random Forest)
    print("\n[3/5] Training Random Forest classifier …")
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("rf", RandomForestClassifier(
            n_estimators    = 200,      # number of trees
            max_depth       = 12,       # prevent overfitting
            min_samples_split = 5,
            min_samples_leaf  = 2,
            class_weight    = "balanced",  # handles class imbalance
            random_state    = SEED,
            n_jobs          = -1,          # use all CPU cores
        )),
    ])
    pipeline.fit(X_train, y_train)

    # 4. Evaluate
    print("\n[4/5] Evaluating model …")
    y_pred = pipeline.predict(X_test)
    acc    = accuracy_score(y_test, y_pred)

    # Cross-validation
    cv     = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
    cv_scores = cross_val_score(pipeline, X, y, cv=cv, scoring="accuracy")

    print(f"\n  Test accuracy        : {acc:.4f}  ({acc*100:.1f}%)")
    print(f"  CV accuracy (5-fold) : {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    print("\n  Classification Report:")
    print(classification_report(y_test, y_pred, target_names=LABELS))

    print("  Confusion Matrix (rows=actual, cols=predicted):")
    cm = confusion_matrix(y_test, y_pred)
    cm_df = pd.DataFrame(cm, index=LABELS, columns=LABELS)
    print(cm_df.to_string())

    # Feature importance
    rf = pipeline.named_steps["rf"]
    print("\n  Feature importances:")
    for feat, imp in sorted(zip(FEATURES, rf.feature_importances_), key=lambda x: -x[1]):
        bar = "█" * int(imp * 40)
        print(f"    {feat:<22} {imp:.4f}  {bar}")

    # 5. Save model
    print("\n[5/5] Saving model …")
    save_dir = os.path.dirname(__file__)
    save_path = os.path.join(save_dir, "health_model.pkl")

    joblib.dump({
        "pipeline": pipeline,
        "features":  FEATURES,
        "labels":    LABELS,
        "label_map": LABEL_MAP,
        "idx_map":   IDX_MAP,
        "accuracy":  round(acc, 4),
        "cv_mean":   round(cv_scores.mean(), 4),
    }, save_path)

    print(f"  Saved → {save_path}")
    print(f"  File size: {os.path.getsize(save_path) / 1024:.1f} KB")
    print("\n  Model is ready — update routers/health.py to load it.")
    print("=" * 55)

    return pipeline


# ── Quick inference test ──────────────────────────────────────────────────────
def test_inference():
    save_path = os.path.join(os.path.dirname(__file__), "health_model.pkl")
    bundle    = joblib.load(save_path)
    pipeline  = bundle["pipeline"]
    idx_map   = bundle["idx_map"]

    print("\n  Quick inference test:")
    test_cases = [
        # [temp, hr,  rr,   milk, bcs, activity]
        [38.5,  55,   24,   14,   3.5, 7.0],   # healthy
        [39.9,  72,   37,    8,   2.5, 3.5],   # medium risk
        [41.2,  92,   50,    3,   1.7, 1.2],   # high risk
    ]
    expected = ["low", "medium", "high"]

    for case, exp in zip(test_cases, expected):
        arr   = np.array([case])
        pred  = pipeline.predict(arr)[0]
        proba = pipeline.predict_proba(arr)[0]
        label = idx_map[pred]
        conf  = proba[pred] * 100
        ok    = "✓" if label == exp else "✗"
        print(f"    {ok} Predicted: {label:<8} (confidence {conf:.1f}%)  expected: {exp}")


if __name__ == "__main__":
    train()
    test_inference()