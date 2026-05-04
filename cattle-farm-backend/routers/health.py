from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import numpy as np
import joblib
import os

from database import get_db
from models import Cattle, HealthRecord

router = APIRouter()

# ── Load trained Random Forest model at startup ───────────────────────────────
_MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "ml", "health_model.pkl")
_bundle     = None

def _load_model():
    global _bundle
    if os.path.exists(_MODEL_PATH):
        _bundle = joblib.load(_MODEL_PATH)
        print(f"[Health] Loaded Random Forest model (accuracy={_bundle['accuracy']})")
    else:
        print("[Health] health_model.pkl not found — using rule-based fallback.")
        print("         Run: python ml/train_health_model.py")

_load_model()

FEATURES = ["temperature","heart_rate","respiratory_rate","milk_yield","body_condition","activity_level"]

class CattleCreate(BaseModel):
    tag_number: str
    name:       Optional[str]   = None
    breed:      Optional[str]   = "Mixed"
    age_years:  Optional[float] = None
    weight_kg:  Optional[float] = None
    farm_node:  Optional[str]   = "node_1"

class HealthInput(BaseModel):
    cattle_id:        int
    temperature:      float
    heart_rate:       float
    respiratory_rate: float
    milk_yield:       float
    body_condition:   float
    activity_level:   float
    farm_node:        Optional[str] = "node_1"


def predict_health_risk(data: HealthInput):
    features = np.array([[
        data.temperature, data.heart_rate, data.respiratory_rate,
        data.milk_yield, data.body_condition, data.activity_level,
    ]])

    if _bundle is not None:
        pipeline  = _bundle["pipeline"]
        idx_map   = _bundle["idx_map"]
        pred_idx  = pipeline.predict(features)[0]
        proba     = pipeline.predict_proba(features)[0]
        label     = idx_map[pred_idx]
        risk_score = float(proba[2])
        confidence = float(max(proba))
        return risk_score, label, confidence, list(proba), "random_forest"

    # Rule-based fallback
    score = 0.0
    if data.temperature < 37.5 or data.temperature > 40.0: score += 0.30
    elif data.temperature > 39.5: score += 0.15
    if data.heart_rate < 40 or data.heart_rate > 80: score += 0.20
    if data.respiratory_rate > 40: score += 0.20
    if data.milk_yield < 5: score += 0.15
    if data.body_condition < 2.0: score += 0.10
    if data.activity_level < 2: score += 0.05
    score = min(score, 1.0)
    label = "low" if score < 0.3 else ("medium" if score < 0.6 else "high")
    return round(score, 3), label, None, None, "rules"


@router.post("/cattle", summary="Register a new animal")
def create_cattle(payload: CattleCreate, db: Session = Depends(get_db)):
    existing = db.query(Cattle).filter(Cattle.tag_number == payload.tag_number).first()
    if existing:
        raise HTTPException(400, f"Tag {payload.tag_number} already registered")
    cow = Cattle(**payload.dict())
    db.add(cow); db.commit(); db.refresh(cow)
    return {"id": cow.id, "tag_number": cow.tag_number, "message": "Cattle registered"}

@router.get("/cattle", summary="List all cattle")
def list_cattle(farm_node: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Cattle)
    if farm_node: q = q.filter(Cattle.farm_node == farm_node)
    return q.all()

@router.get("/cattle/{cattle_id}", summary="Get single animal")
def get_cattle(cattle_id: int, db: Session = Depends(get_db)):
    cow = db.query(Cattle).filter(Cattle.id == cattle_id).first()
    if not cow: raise HTTPException(404, "Cattle not found")
    return cow

@router.post("/predict", summary="Run health risk prediction for one animal")
def predict(payload: HealthInput, db: Session = Depends(get_db)):
    cow = db.query(Cattle).filter(Cattle.id == payload.cattle_id).first()
    if not cow: raise HTTPException(404, "Cattle not found")

    risk_score, risk_label, confidence, probabilities, model_used = predict_health_risk(payload)

    record = HealthRecord(
        cattle_id=payload.cattle_id, temperature=payload.temperature,
        heart_rate=payload.heart_rate, respiratory_rate=payload.respiratory_rate,
        milk_yield=payload.milk_yield, body_condition=payload.body_condition,
        activity_level=payload.activity_level, risk_score=risk_score,
        risk_label=risk_label, farm_node=payload.farm_node,
    )
    db.add(record); db.commit(); db.refresh(record)

    response = {
        "cattle_id": payload.cattle_id, "tag_number": cow.tag_number,
        "risk_score": round(risk_score, 3), "risk_label": risk_label,
        "record_id": record.id, "alert": risk_label == "high",
        "model_used": model_used,
        "advice": {
            "low": "Animal appears healthy. Continue routine monitoring.",
            "medium": "Monitor closely. Check feed and water intake.",
            "high": "Immediate vet attention recommended. Isolate animal.",
        }[risk_label],
    }
    if probabilities is not None:
        response["probabilities"] = {
            "low": round(probabilities[0], 3),
            "medium": round(probabilities[1], 3),
            "high": round(probabilities[2], 3),
        }
        response["confidence"] = round(confidence, 3)
    return response

@router.get("/model-info", summary="Info about the loaded ML model")
def model_info():
    if _bundle is None:
        return {"status": "rule_based", "message": "Run: python ml/train_health_model.py"}
    return {
        "status": "random_forest", "accuracy": _bundle["accuracy"],
        "cv_mean": _bundle["cv_mean"], "features": _bundle["features"],
    }

@router.get("/records/{cattle_id}", summary="Get health history for an animal")
def get_records(cattle_id: int, limit: int = 20, db: Session = Depends(get_db)):
    return (db.query(HealthRecord).filter(HealthRecord.cattle_id == cattle_id)
            .order_by(HealthRecord.recorded_at.desc()).limit(limit).all())

@router.get("/alerts", summary="All high-risk animals right now")
def get_alerts(db: Session = Depends(get_db)):
    from sqlalchemy import func
    subq = (db.query(HealthRecord.cattle_id, func.max(HealthRecord.recorded_at).label("latest"))
            .group_by(HealthRecord.cattle_id).subquery())
    high_risk = (db.query(HealthRecord)
                 .join(subq, (HealthRecord.cattle_id == subq.c.cattle_id) &
                             (HealthRecord.recorded_at == subq.c.latest))
                 .filter(HealthRecord.risk_label == "high").all())
    return {"total_alerts": len(high_risk), "animals": high_risk}

@router.get("/dashboard-stats", summary="Summary stats for the dashboard")
def dashboard_stats(db: Session = Depends(get_db)):
    from sqlalchemy import func
    total_cattle = db.query(Cattle).count()
    total_records = db.query(HealthRecord).count()
    subq = (db.query(HealthRecord.cattle_id, func.max(HealthRecord.recorded_at).label("latest"))
            .group_by(HealthRecord.cattle_id).subquery())
    latest = (db.query(HealthRecord)
              .join(subq, (HealthRecord.cattle_id == subq.c.cattle_id) &
                          (HealthRecord.recorded_at == subq.c.latest)).all())
    return {
        "total_cattle": total_cattle,
        "high_risk":    sum(1 for r in latest if r.risk_label == "high"),
        "medium_risk":  sum(1 for r in latest if r.risk_label == "medium"),
        "low_risk":     sum(1 for r in latest if r.risk_label == "low"),
        "total_records": total_records,
        "model": "random_forest" if _bundle else "rule_based",
    }