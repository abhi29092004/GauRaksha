from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import os

from database import get_db
from models import MilkTest, FinanceRecord

import joblib
import numpy as np

_MILK_MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "ml", "milk_model.pkl")
_milk_bundle = None

def _load_milk_model():
    global _milk_bundle
    if os.path.exists(_MILK_MODEL_PATH):
        _milk_bundle = joblib.load(_MILK_MODEL_PATH)
        print(f"[Milk] Loaded ML classifier (accuracy={_milk_bundle['accuracy']})")
    else:
        print("[Milk] milk_model.pkl not found — using rule-based fallback.")

_load_milk_model()
router = APIRouter()

CERT_DIR = "certificates"
os.makedirs(CERT_DIR, exist_ok=True)


# ── Pydantic schemas ──────────────────────────────────────────────────────────
class MilkTestInput(BaseModel):
    cattle_id:     Optional[int] = None
    fat_percent:   float   # standard: 3.5–6.0 %
    snf_percent:   float   # standard: 8.0–9.0 %
    ph_level:      float   # standard: 6.6–6.8
    temperature:   float   # collection temp °C, ideal ≤ 10
    adulteration:  float   # 0–1 sensor score (0 = clean)
    bacteria_count: float  # CFU/ml × 10³ (safe: < 100)


# ── ML purity classifier (rule-based, replace with trained model) ─────────────
def classify_milk(data: MilkTestInput):
    features = np.array([[
        data.fat_percent, data.snf_percent, data.ph_level,
        data.temperature, data.adulteration, data.bacteria_count,
    ]])

    if _milk_bundle is not None:
        pipeline = _milk_bundle["pipeline"]
        pred     = pipeline.predict(features)[0]
        proba    = pipeline.predict_proba(features)[0]
        label    = _milk_bundle["idx_map"][pred]   # "pass" or "fail"
        score    = round(float(max(proba)) * 100, 1)
        return label, score, []

    # rule-based fallback (existing code stays here)
    ...

# ── PDF certificate generator ─────────────────────────────────────────────────
def generate_certificate(test: MilkTest, reasons: list) -> str:
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.units import cm
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

        filename = f"{CERT_DIR}/milk_cert_{test.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
        doc = SimpleDocTemplate(filename, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []

        # Header
        title_style = ParagraphStyle("title", parent=styles["Title"], fontSize=18, spaceAfter=6)
        story.append(Paragraph("Milk Purity Certificate", title_style))
        story.append(Paragraph("AI-Based Smart Cattle Farm Management System", styles["Normal"]))
        story.append(Spacer(1, 0.5 * cm))

        # Verdict banner
        verdict_color = colors.green if test.verdict == "pass" else colors.red
        verdict_style = ParagraphStyle(
            "verdict", parent=styles["Heading1"],
            textColor=verdict_color, fontSize=22
        )
        story.append(Paragraph(
            f"VERDICT: {'PASSED' if test.verdict == 'pass' else 'FAILED'} — Purity Score: {test.purity_score}/100",
            verdict_style
        ))
        story.append(Spacer(1, 0.5 * cm))

        # Test parameters table
        data = [
            ["Parameter", "Measured Value", "Standard Range", "Status"],
            ["Fat %",          f"{test.fat_percent}%",      "3.5 – 6.0 %",    "✓" if 3.5 <= test.fat_percent <= 6.0 else "✗"],
            ["SNF %",          f"{test.snf_percent}%",      "8.0 – 9.0 %",    "✓" if 8.0 <= test.snf_percent <= 9.0 else "✗"],
            ["pH Level",       f"{test.ph_level}",          "6.6 – 6.8",      "✓" if 6.6 <= test.ph_level <= 6.8 else "✗"],
            ["Temperature",    f"{test.temperature}°C",     "≤ 10°C",         "✓" if test.temperature <= 10 else "✗"],
            ["Adulteration",   f"{test.adulteration:.2f}",  "< 0.15",         "✓" if test.adulteration < 0.15 else "✗"],
            ["Bacteria Count", f"{test.bacteria_count}k CFU/ml", "< 100k",   "✓" if test.bacteria_count < 100 else "✗"],
        ]
        table = Table(data, colWidths=[5 * cm, 4 * cm, 4 * cm, 3 * cm])
        table.setStyle(TableStyle([
            ("BACKGROUND",   (0, 0), (-1, 0), colors.HexColor("#1D9E75")),
            ("TEXTCOLOR",    (0, 0), (-1, 0), colors.white),
            ("FONTNAME",     (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE",     (0, 0), (-1, 0), 11),
            ("GRID",         (0, 0), (-1, -1), 0.5, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f5f5")]),
            ("FONTSIZE",     (0, 1), (-1, -1), 10),
            ("ALIGN",        (1, 0), (-1, -1), "CENTER"),
        ]))
        story.append(table)
        story.append(Spacer(1, 0.5 * cm))

        # Issues
        if reasons:
            story.append(Paragraph("Issues Detected:", styles["Heading3"]))
            for r in reasons:
                story.append(Paragraph(f"• {r}", styles["Normal"]))
            story.append(Spacer(1, 0.3 * cm))

        # Footer
        story.append(Paragraph(
            f"Test ID: {test.id}  |  Tested: {test.tested_at.strftime('%d %b %Y %H:%M') if test.tested_at else 'N/A'}  |  Generated by AI Cattle Farm System",
            styles["Normal"]
        ))
        doc.build(story)
        return filename

    except ImportError:
        return None


# ── Routes ────────────────────────────────────────────────────────────────────
@router.post("/test", summary="Run milk purity test + generate certificate")
def run_milk_test(payload: MilkTestInput, db: Session = Depends(get_db)):
    verdict, purity_score, reasons = classify_milk(payload)

    test = MilkTest(
        cattle_id      = payload.cattle_id,
        fat_percent    = payload.fat_percent,
        snf_percent    = payload.snf_percent,
        ph_level       = payload.ph_level,
        temperature    = payload.temperature,
        adulteration   = payload.adulteration,
        bacteria_count = payload.bacteria_count,
        verdict        = verdict,
        purity_score   = purity_score,
    )
    db.add(test)
    db.commit()
    db.refresh(test)

    cert_path = generate_certificate(test, reasons)
    if cert_path:
        test.certificate_path = cert_path
        db.commit()

    return {
        "test_id":       test.id,
        "verdict":       verdict,
        "purity_score":  purity_score,
        "issues":        reasons,
        "certificate":   f"/api/milk/certificate/{test.id}" if cert_path else None,
        "message":       "Milk passed quality standards." if verdict == "pass" else "Milk failed. Do not sell this batch.",
    }


@router.get("/certificate/{test_id}", summary="Download PDF certificate")
def download_certificate(test_id: int, db: Session = Depends(get_db)):
    test = db.query(MilkTest).filter(MilkTest.id == test_id).first()
    if not test:
        raise HTTPException(404, "Test not found")
    if not test.certificate_path or not os.path.exists(test.certificate_path):
        raise HTTPException(404, "Certificate not generated yet")
    return FileResponse(
        test.certificate_path,
        media_type="application/pdf",
        filename=f"milk_certificate_{test_id}.pdf",
    )


@router.get("/tests", summary="All milk tests")
def list_tests(cattle_id: Optional[int] = None, verdict: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(MilkTest)
    if cattle_id:
        q = q.filter(MilkTest.cattle_id == cattle_id)
    if verdict:
        q = q.filter(MilkTest.verdict == verdict)
    return q.order_by(MilkTest.tested_at.desc()).all()


@router.get("/stats", summary="Milk quality summary stats")
def milk_stats(db: Session = Depends(get_db)):
    tests = db.query(MilkTest).all()
    if not tests:
        return {"total": 0, "pass_rate": 0, "avg_purity": 0}
    passed = [t for t in tests if t.verdict == "pass"]
    avg_purity = sum(t.purity_score for t in tests) / len(tests)
    return {
        "total":       len(tests),
        "passed":      len(passed),
        "failed":      len(tests) - len(passed),
        "pass_rate":   round(len(passed) / len(tests) * 100, 1),
        "avg_purity":  round(avg_purity, 1),
    }