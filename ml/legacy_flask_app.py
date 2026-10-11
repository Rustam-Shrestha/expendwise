import pickle
import numpy as np
from flask import Flask, request, jsonify
from pymongo import MongoClient
from flask_cors import CORS
from regression import linear_regression
from bson import ObjectId

app = Flask(__name__)
CORS(app)

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["finance"]
expenses_collection = db["transactions"]

def load_model():
    try:
        with open("model/model.pkl", "rb") as f:
            return pickle.load(f)
    except FileNotFoundError:
        return None

@app.route('/api/predict', methods=['POST'])
def predict_expense():
    try:
        data = request.json
        category = data.get('category')
        user_id = data.get('user_id')

        if not category:
            return jsonify({"error": "Category is required"}), 400

        # Build query with category filter
        query = {
            "category": {"$regex": f"^{category}$", "$options": "i"},
            "type": "expense"
        }

        if user_id:
            try:
                converted_user_id = ObjectId(user_id)
                query["userId"] = converted_user_id
            except Exception as e:
                return jsonify({"error": "Invalid user ID format"}), 400  

        expenses = list(expenses_collection.find(query))

        print(f"Fetched expenses count: {len(expenses)}")

        if not expenses:
            return jsonify({"error": "No transactions found for this category and user"}), 404

        # Prepare data for regression
        x = list(range(len(expenses)))
        y = [expense['amount'] for expense in expenses if "amount" in expense and isinstance(expense["amount"], (int, float))]

        if len(y) < 10:
            return jsonify({"error": "Not enough valid expense data for prediction"}), 400

        predicted_expense, mae, mse, rmse, r2_score = linear_regression(x, y)

        print(f"Predicted Expense: {predicted_expense}")
        print(f"MAE: {mae}, MSE: {mse}, RMSE: {rmse}, R² Score: {r2_score}")

        return jsonify({
            "predicted_expense": predicted_expense,
            "mean_absolute_error": mae,
            "mean_squared_error": mse,
            "root_mean_squared_error": rmse,
            "r2_score": r2_score
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5001)