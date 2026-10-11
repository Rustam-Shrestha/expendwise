import csv
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

FEATURES = ["income", "expense", "savings_ratio", "expense_growth", "food_pct", "transport_pct", "entertainment_pct", "tx_count", "tx_variance"]

def train():
    data_path = Path("ml/data/risk_dataset.csv")
    if not data_path.exists():
        from generate_synthetic import generate
        generate(output="ml/data/risk_dataset.csv")

    with data_path.open() as handle:
        rows = list(csv.DictReader(handle))
    x = np.array([[float(row[name]) for name in FEATURES] for row in rows])
    y = np.array([int(row["risk"]) for row in rows])
    x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=42, stratify=y)
    scaler = StandardScaler()
    x_train_scaled = scaler.fit_transform(x_train)
    x_test_scaled = scaler.transform(x_test)
    model = RandomForestClassifier(n_estimators=200, max_depth=10, random_state=42)
    model.fit(x_train_scaled, y_train)
    predictions = model.predict(x_test_scaled)
    print("accuracy:", accuracy_score(y_test, predictions))
    print("f1:", f1_score(y_test, predictions, average="weighted"))

    # Save to both target directories
    for dir_path in [Path("ml/models"), Path("ml/app/models"), Path("ml/model")]:
        dir_path.mkdir(parents=True, exist_ok=True)
        joblib.dump(model, dir_path / "risk_rf_v1.pkl")
        joblib.dump(scaler, dir_path / "risk_scaler_v1.pkl")

    print("Risk model artifacts successfully trained and saved.")

if __name__ == "__main__":
    train()
