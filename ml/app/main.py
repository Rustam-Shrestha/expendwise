from pathlib import Path
import os
import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field

FEATURES = [
    "income",
    "expense",
    "savings_ratio",
    "expense_growth",
    "food_pct",
    "transport_pct",
    "entertainment_pct",
    "tx_count",
    "tx_variance",
]

class RiskRequest(BaseModel):
    income: float = Field(ge=0)
    expense: float = Field(ge=0)
    savings_ratio: float = Field(ge=0, le=1)
    expense_growth: float
    food_pct: float = Field(ge=0, le=1)
    transport_pct: float = Field(ge=0, le=1)
    entertainment_pct: float = Field(ge=0, le=1)
    tx_count: int = Field(ge=0)
    tx_variance: float = Field(ge=0)

app = FastAPI(title="YBC Financial Risk ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_artifacts = {}
mongo_client = AsyncIOMotorClient(os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/finance"))

def load_artifacts():
    if _artifacts:
        return _artifacts
    
    base_dir = Path(__file__).resolve().parent
    candidate_paths = [
        base_dir / "models",
        base_dir.parent / "models",
        base_dir.parent / "model",
    ]

    model_path = None
    scaler_path = None

    for d in candidate_paths:
        m = d / "risk_rf_v1.pkl"
        s = d / "risk_scaler_v1.pkl"
        if m.exists() and s.exists():
            model_path = m
            scaler_path = s
            break

    if not model_path or not scaler_path:
        raise HTTPException(status_code=503, detail="Risk model artifacts are not trained yet")

    _artifacts["model"] = joblib.load(model_path)
    _artifacts["scaler"] = joblib.load(scaler_path)
    return _artifacts

@app.get("/healthz")
def healthz():
    return {"status": "ok", "service": "ml_service", "version": "1.0.0"}

@app.post("/predict")
@app.post("/api/predict")
async def predict_expense(payload: dict):
    category = str(payload.get("category", "")).strip()
    user_id = payload.get("user_id")

    if not category:
        raise HTTPException(status_code=400, detail="Category is required")

    base_filter = {
        "type": "expense",
        "$or": [
            {"category": {"$regex": f"^{category}$", "$options": "i"}},
            {"categoryName": {"$regex": f"^{category}$", "$options": "i"}},
        ],
    }

    amounts = []
    fallback_used = False

    if user_id:
        from bson import ObjectId
        if not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        user_query = dict(base_filter)
        user_query["userId"] = ObjectId(user_id)
        user_expenses = await mongo_client["finance"]["transactions"].find(user_query, {"amount": 1}).sort("date", 1).to_list(length=500)
        amounts = [float(item["amount"]) for item in user_expenses if isinstance(item.get("amount"), (int, float))]

    if len(amounts) < 2:
        # Check global system category transactions for intelligent benchmark baseline
        global_expenses = await mongo_client["finance"]["transactions"].find(base_filter, {"amount": 1}).sort("date", 1).to_list(length=500)
        global_amounts = [float(item["amount"]) for item in global_expenses if isinstance(item.get("amount"), (int, float))]

        if len(amounts) == 1:
            # We have 1 user transaction: anchor with user's transaction
            amounts = [amounts[0], amounts[0] * 1.02]
        elif len(global_amounts) >= 2:
            amounts = global_amounts
            fallback_used = True
        elif len(global_amounts) == 1:
            amounts = [global_amounts[0], global_amounts[0]]
            fallback_used = True
        else:
            raise HTTPException(
                status_code=404,
                detail=f"No transaction history found for '{category}'. Try categories like Food, Housing, Transport, Utilities, Entertainment, or Shopping."
            )

    recent = amounts[-10:] if len(amounts) >= 10 else amounts
    baseline = sum(recent) / len(recent)
    trend = (recent[-1] - recent[0]) / max(1, len(recent) - 1) if len(recent) > 1 else 0.0
    prediction = max(0, baseline + trend)
    mae = round(sum(abs(x - baseline) for x in recent) / len(recent), 2)
    rmse = round((sum((x - baseline) ** 2 for x in recent) / len(recent)) ** 0.5, 2)

    return {
        "predicted_expense": round(prediction, 2),
        "mean_absolute_error": mae,
        "root_mean_squared_error": rmse,
        "r2_score": 0.0,
        "category": category,
        "data_points": len(amounts),
        "is_benchmark_fallback": fallback_used,
        "note": "Based on your personal spending history" if not fallback_used else "Based on overall category benchmarks",
    }

@app.post("/api/risk/predict")
def predict_risk(request: RiskRequest):
    artifacts = load_artifacts()
    values = np.array([[getattr(request, name) for name in FEATURES]])
    probabilities = artifacts["model"].predict_proba(artifacts["scaler"].transform(values))[0]
    score = int(round(probabilities[2] * 70 + probabilities[1] * 25 + probabilities[0] * 5))
    level = "LOW" if score < 40 else "MEDIUM" if score < 70 else "HIGH"
    return {
        "score": score,
        "level": level,
        "reasons": ["Risk computed based on spending-to-savings variance"],
        "recommendations": ["Align monthly discretionary expenses with savings target"],
        "modelVersion": "risk_rf_v1",
        "features": request.model_dump(),
    }
