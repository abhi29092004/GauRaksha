from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import httpx, json

from database import get_db
from models import VetConsultation, FinanceRecord

router = APIRouter()

# your routes below...
@router.get("/")
def get_vets():
    return {"message": "Vet module working"}


# ── Pydantic schemas ──────────────────────────────────────────────────────────
class SymptomInput(BaseModel):
    cattle_id:   Optional[int] = None
    farmer_name: str
    symptoms:    str

class PrescriptionInput(BaseModel):
    consultation_id: int
    vet_name:        str
    prescription:    str
    med_cost:        float = 0.0

class ConsultationUpdate(BaseModel):
    status: str   # open / closed


# ── AI first-aid via Ollama (Gemma) ──────────────────────────────────────────
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "gemma3:4b"

SYSTEM_PROMPT = """You are an expert cattle veterinarian AI assistant.
A farmer has described symptoms for one of their cattle.
Give a concise, practical first-aid response:
1. Likely condition (1-2 sentences)
2. Immediate actions the farmer can take right now
3. When to escalate to a real vet (urgent / within 24h / routine)
Keep your response under 200 words. Be specific and actionable."""

async def get_ai_response(symptoms: str) -> str:
    prompt = f"{SYSTEM_PROMPT}\n\nSymptoms reported: {symptoms}\n\nResponse:"
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(OLLAMA_URL, json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
            })
            data = resp.json()
            return data.get("response", "AI service unavailable.")
    except Exception:
        # Fallback if Ollama is not running locally
        return (
            "AI service is offline. Based on the symptoms described, "
            "please monitor the animal closely and contact a local vet if symptoms worsen. "
            "Ensure the animal has clean water and is kept comfortable."
        )


# ── Routes ────────────────────────────────────────────────────────────────────
@router.post("/first-aid", summary="Level 1 — AI first-aid response")
async def first_aid(payload: SymptomInput, db: Session = Depends(get_db)):
    ai_text = await get_ai_response(payload.symptoms)

    consultation = VetConsultation(
        cattle_id   = payload.cattle_id,
        farmer_name = payload.farmer_name,
        symptoms    = payload.symptoms,
        ai_response = ai_text,
        level       = "ai",
    )
    db.add(consultation)
    db.commit()
    db.refresh(consultation)

    return {
        "consultation_id": consultation.id,
        "level":           "ai",
        "ai_response":     ai_text,
        "escalate_to_map": True,
        "escalate_to_video": True,
        "message":         "AI first-aid given. Use /map to find nearby vets or /video to start a live call.",
    }


@router.get("/map", summary="Level 2 — nearby vets (returns static data for frontend map)")
def get_nearby_vets(lat: float = 12.3, lng: float = 76.6):
    """
    In production, call a Maps API (e.g. Google Places) with the farmer's GPS.
    Returning sample data here for frontend integration.
    """
    vets = [
        {"name": "Dr. Suresh Kumar",  "distance_km": 2.1, "phone": "9876543210", "lat": lat + 0.02, "lng": lng + 0.01, "available": True},
        {"name": "Dr. Priya Nair",    "distance_km": 4.5, "phone": "9765432109", "lat": lat - 0.03, "lng": lng + 0.02, "available": True},
        {"name": "Govt. Vet Clinic",  "distance_km": 6.2, "phone": "080-22334455","lat": lat + 0.05, "lng": lng - 0.01, "available": True},
    ]
    return {"vets": vets, "your_location": {"lat": lat, "lng": lng}}


@router.post("/prescription/{consultation_id}", summary="Vet saves prescription")
def save_prescription(consultation_id: int, payload: PrescriptionInput, db: Session = Depends(get_db)):
    c = db.query(VetConsultation).filter(VetConsultation.id == consultation_id).first()
    if not c:
        raise HTTPException(404, "Consultation not found")

    c.vet_name     = payload.vet_name
    c.prescription = payload.prescription
    c.med_cost     = payload.med_cost
    c.level        = "video"
    c.status       = "closed"
    db.commit()

    # Auto-log to finance tracker (Module 4)
    if payload.med_cost > 0:
        finance_entry = FinanceRecord(
            cattle_id   = c.cattle_id,
            record_type = "medicine",
            description = f"Vet prescription — {payload.vet_name}",
            amount      = -abs(payload.med_cost),   # expense = negative
        )
        db.add(finance_entry)
        db.commit()

    return {
        "consultation_id": consultation_id,
        "prescription":    payload.prescription,
        "med_cost":        payload.med_cost,
        "finance_logged":  payload.med_cost > 0,
        "message":         "Prescription saved and expense logged to finance tracker.",
    }


@router.get("/consultations", summary="All consultations list")
def list_consultations(status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(VetConsultation)
    if status:
        q = q.filter(VetConsultation.status == status)
    return q.order_by(VetConsultation.created_at.desc()).all()


@router.get("/consultations/{consultation_id}", summary="Single consultation detail")
def get_consultation(consultation_id: int, db: Session = Depends(get_db)):
    c = db.query(VetConsultation).filter(VetConsultation.id == consultation_id).first()
    if not c:
        raise HTTPException(404, "Consultation not found")
    return c


@router.get("/video-token/{room}", summary="Generate Jitsi room link")
def video_token(room: str):
    """
    Jitsi Meet is free and needs no server-side token for public rooms.
    For private rooms, integrate with Jitsi JWT — docs at jitsi.github.io/handbook
    """
    jitsi_domain = "meet.jit.si"
    room_url = f"https://{jitsi_domain}/cattle-farm-{room}"
    return {
        "room":     room,
        "url":      room_url,
        "provider": "Jitsi Meet (free)",
        "note":     "Open this URL in a browser — no app install needed.",
    }