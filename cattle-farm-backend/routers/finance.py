from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta

from database import get_db
from models import FinanceRecord, Buyer, Cattle, MilkTest

router = APIRouter()


# ── Pydantic schemas ──────────────────────────────────────────────────────────
class MilkSaleInput(BaseModel):
    cattle_id:       Optional[int] = None
    litres:          float
    price_per_litre: float
    buyer_name:      Optional[str] = None
    milk_test_id:    Optional[int] = None

class ExpenseInput(BaseModel):
    cattle_id:   Optional[int] = None
    record_type: str    # feed / medicine / equipment / other
    description: str
    amount:      float

class BuyerCreate(BaseModel):
    name:       str
    phone:      Optional[str] = None
    location:   Optional[str] = None
    buyer_type: Optional[str] = "individual"
    avg_price:  Optional[float] = None


# ── Milk sale ─────────────────────────────────────────────────────────────────
@router.post("/milk-sale", summary="Record a milk sale — auto-attaches purity cert if available")
def record_milk_sale(payload: MilkSaleInput, db: Session = Depends(get_db)):
    total = round(payload.litres * payload.price_per_litre, 2)

    # Auto-attach latest passed milk test if not specified
    test_id = payload.milk_test_id
    if not test_id and payload.cattle_id:
        latest_test = (
            db.query(MilkTest)
            .filter(MilkTest.cattle_id == payload.cattle_id, MilkTest.verdict == "pass")
            .order_by(MilkTest.tested_at.desc())
            .first()
        )
        if latest_test:
            test_id = latest_test.id

    record = FinanceRecord(
        cattle_id       = payload.cattle_id,
        record_type     = "milk_sale",
        description     = f"Milk sale — {payload.litres}L @ ₹{payload.price_per_litre}/L",
        amount          = total,
        litres          = payload.litres,
        price_per_litre = payload.price_per_litre,
        buyer_name      = payload.buyer_name,
        milk_test_id    = test_id,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "record_id":       record.id,
        "total_amount":    total,
        "litres":          payload.litres,
        "price_per_litre": payload.price_per_litre,
        "certificate_attached": test_id is not None,
        "message":         f"Sale of ₹{total} recorded.",
    }


@router.post("/expense", summary="Record an expense (feed, medicine, etc.)")
def record_expense(payload: ExpenseInput, db: Session = Depends(get_db)):
    record = FinanceRecord(
        cattle_id   = payload.cattle_id,
        record_type = payload.record_type,
        description = payload.description,
        amount      = -abs(payload.amount),   # always negative
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return {"record_id": record.id, "amount": record.amount, "message": "Expense recorded."}


# ── Ledger ────────────────────────────────────────────────────────────────────
@router.get("/ledger", summary="Full transaction ledger")
def get_ledger(
    record_type: Optional[str] = None,
    cattle_id:   Optional[int] = None,
    limit:       int = 50,
    db: Session = Depends(get_db),
):
    q = db.query(FinanceRecord)
    if record_type:
        q = q.filter(FinanceRecord.record_type == record_type)
    if cattle_id:
        q = q.filter(FinanceRecord.cattle_id == cattle_id)
    records = q.order_by(FinanceRecord.created_at.desc()).limit(limit).all()
    return records


# ── P&L report ────────────────────────────────────────────────────────────────
@router.get("/pl-report", summary="Monthly profit-and-loss report")
def pl_report(year: int = datetime.now().year, month: int = datetime.now().month, db: Session = Depends(get_db)):
    records = (
        db.query(FinanceRecord)
        .filter(
            extract("year",  FinanceRecord.created_at) == year,
            extract("month", FinanceRecord.created_at) == month,
        )
        .all()
    )

    income   = sum(r.amount for r in records if r.amount > 0)
    expenses = sum(r.amount for r in records if r.amount < 0)
    net      = income + expenses

    breakdown = {}
    for r in records:
        t = r.record_type
        breakdown[t] = breakdown.get(t, 0) + r.amount

    return {
        "period":    f"{year}-{month:02d}",
        "income":    round(income, 2),
        "expenses":  round(abs(expenses), 2),
        "net_profit": round(net, 2),
        "profitable": net > 0,
        "breakdown": {k: round(v, 2) for k, v in breakdown.items()},
        "transaction_count": len(records),
    }


# ── Per-animal profitability ranking ─────────────────────────────────────────
@router.get("/animal-ranking", summary="Per-animal profitability ranking")
def animal_ranking(db: Session = Depends(get_db)):
    cattle_list = db.query(Cattle).all()
    ranking = []

    for cow in cattle_list:
        records = db.query(FinanceRecord).filter(FinanceRecord.cattle_id == cow.id).all()
        income  = sum(r.amount for r in records if r.amount > 0)
        expense = sum(r.amount for r in records if r.amount < 0)
        net     = income + expense

        milk_litres = sum(r.litres for r in records if r.litres is not None)

        ranking.append({
            "cattle_id":   cow.id,
            "tag_number":  cow.tag_number,
            "name":        cow.name,
            "breed":       cow.breed,
            "income":      round(income, 2),
            "expenses":    round(abs(expense), 2),
            "net_profit":  round(net, 2),
            "total_litres": round(milk_litres, 1),
        })

    ranking.sort(key=lambda x: x["net_profit"], reverse=True)
    for i, item in enumerate(ranking):
        item["rank"] = i + 1

    return {"animals": ranking, "total_cattle": len(ranking)}


# ── Price forecast using Prophet ──────────────────────────────────────────────
@router.get("/price-forecast", summary="Milk price forecast for next 30 days")
def price_forecast(db: Session = Depends(get_db)):
    try:
        from prophet import Prophet
        import pandas as pd

        records = (
            db.query(FinanceRecord)
            .filter(FinanceRecord.record_type == "milk_sale", FinanceRecord.price_per_litre.isnot(None))
            .order_by(FinanceRecord.created_at)
            .all()
        )

        if len(records) < 10:
            return _mock_forecast()

        df = pd.DataFrame([
            {"ds": r.created_at.date(), "y": r.price_per_litre}
            for r in records
        ])
        df = df.groupby("ds").mean().reset_index()
        df["ds"] = pd.to_datetime(df["ds"])

        model = Prophet(yearly_seasonality=True, weekly_seasonality=True)
        model.fit(df)

        future = model.make_future_dataframe(periods=30)
        forecast = model.predict(future)

        result = forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(30)
        return {
            "forecast": [
                {
                    "date":       row["ds"].strftime("%Y-%m-%d"),
                    "predicted":  round(row["yhat"], 2),
                    "lower":      round(row["yhat_lower"], 2),
                    "upper":      round(row["yhat_upper"], 2),
                }
                for _, row in result.iterrows()
            ],
            "source": "prophet",
        }

    except Exception as e:
        return _mock_forecast()


def _mock_forecast():
    import random
    base = 35.0
    today = datetime.now()
    return {
        "forecast": [
            {
                "date":      (today + timedelta(days=i)).strftime("%Y-%m-%d"),
                "predicted": round(base + random.uniform(-3, 5) + i * 0.05, 2),
                "lower":     round(base - 4 + i * 0.05, 2),
                "upper":     round(base + 7 + i * 0.05, 2),
            }
            for i in range(1, 31)
        ],
        "source": "mock (add more sales data for real forecast)",
    }


# ── Buyers directory ──────────────────────────────────────────────────────────
@router.post("/buyers", summary="Add a buyer to directory")
def add_buyer(payload: BuyerCreate, db: Session = Depends(get_db)):
    buyer = Buyer(**payload.dict())
    db.add(buyer)
    db.commit()
    db.refresh(buyer)
    return buyer

@router.get("/buyers", summary="List all buyers")
def list_buyers(db: Session = Depends(get_db)):
    return db.query(Buyer).all()


# ── Dashboard summary ─────────────────────────────────────────────────────────
@router.get("/dashboard", summary="Finance dashboard summary")
def finance_dashboard(db: Session = Depends(get_db)):
    today = datetime.now()
    all_records = db.query(FinanceRecord).all()
    today_records = [r for r in all_records if r.created_at and r.created_at.date() == today.date()]
    month_records = [
        r for r in all_records
        if r.created_at and r.created_at.year == today.year and r.created_at.month == today.month
    ]

    return {
        "today": {
            "income":   round(sum(r.amount for r in today_records if r.amount > 0), 2),
            "expenses": round(sum(abs(r.amount) for r in today_records if r.amount < 0), 2),
        },
        "this_month": {
            "income":   round(sum(r.amount for r in month_records if r.amount > 0), 2),
            "expenses": round(sum(abs(r.amount) for r in month_records if r.amount < 0), 2),
            "net":      round(sum(r.amount for r in month_records), 2),
        },
        "total_milk_litres": round(
            sum(r.litres for r in all_records if r.litres) or 0, 1
        ),
        "total_buyers": db.query(Buyer).count(),
    }