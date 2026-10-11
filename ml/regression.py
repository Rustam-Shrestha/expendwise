import os
import numpy as np
import pickle

def linear_regression(x, y, train_ratio=0.8):
    n = len(x)
    train_size = int(n * train_ratio)  

    x = np.array(x, dtype=float)
    y = np.array(y, dtype=float)
    
    if np.std(x) > 0:
        x = (x - np.mean(x)) / np.std(x)
    else:
        return None, None, None, None, None

    x_train, x_test = x[:train_size], x[train_size:]
    y_train, y_test = y[:train_size], y[train_size:]

    n_train = len(x_train)
    x_sum = np.sum(x_train)
    y_sum = np.sum(y_train)
    xy_sum = np.sum(x_train * y_train)
    xx_sum = np.sum(x_train * x_train)

    denominator = (n_train * xx_sum - x_sum**2)
    if denominator == 0:
        return None, None, None, None, None

    m = (n_train * xy_sum - x_sum * y_sum) / denominator
    b = (y_sum - m * x_sum) / n_train

    next_month = (max(x) + 1 - np.mean(x)) / np.std(x) if np.std(x) > 0 else max(x) + 1
    prediction = m * next_month + b
    prediction = max(np.mean(y_train) * 0.5, prediction)

    y_pred_test = [max(0, m * x_i + b) for x_i in x_test]

    # Calculate MAE, MSE, RMSE, and R² Score manually
    mae = sum(abs(y_test - y_pred_test)) / len(y_test) if len(y_test) > 0 else None
    mse = sum((y_test - y_pred_test) ** 2) / len(y_test) if len(y_test) > 0 else None
    rmse = mse ** 0.5 if mse is not None else None

    ss_total = sum((y_test - np.mean(y_train)) ** 2)
    ss_residual = sum((y_test - y_pred_test) ** 2)
    r2_score = 1 - (ss_residual / ss_total) if ss_total != 0 else None

    # Print Evaluation Metrics in Terminal
    print(f"Mean Absolute Error (MAE): {mae}")
    print(f"Mean Squared Error (MSE): {mse}")
    print(f"Root Mean Squared Error (RMSE): {rmse}")
    print(f"R² Score: {r2_score}")

    model_path = "model/model.pkl"
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    with open(model_path, "wb") as f:
        pickle.dump((m, b), f)

    return prediction, mae, mse, rmse, r2_score