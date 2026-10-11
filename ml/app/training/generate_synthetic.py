import csv
import random
from pathlib import Path

FIELDS = ["income", "expense", "savings_ratio", "expense_growth", "food_pct", "transport_pct", "entertainment_pct", "tx_count", "tx_variance", "risk"]

def generate(output="ml/data/risk_dataset.csv", rows=5000, seed=42):
    rng = random.Random(seed)
    output_path = Path(output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        for _ in range(rows):
            savings = rng.uniform(0, 0.45)
            risk = 0 if savings > 0.30 else 1 if savings > 0.10 else 2
            income = rng.randint(30000, 180000)
            expense = round(income * rng.uniform(0.45, 0.95), 2)
            writer.writerow({
                "income": income,
                "expense": expense,
                "savings_ratio": round(savings, 4),
                "expense_growth": round(rng.uniform(-0.1, 0.3), 4),
                "food_pct": round(rng.uniform(0.08, 0.45), 4),
                "transport_pct": round(rng.uniform(0.02, 0.25), 4),
                "entertainment_pct": round(rng.uniform(0.01, 0.2), 4),
                "tx_count": rng.randint(8, 100),
                "tx_variance": round(rng.uniform(0.01, 0.5), 4),
                "risk": risk,
            })

if __name__ == "__main__":
    generate()
    print("Generated ml/data/risk_dataset.csv")
