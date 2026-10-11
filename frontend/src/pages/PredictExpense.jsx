import React, { useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';

const COMMON_CATEGORIES = ['Food', 'Housing', 'Transport', 'Utilities', 'Entertainment', 'Shopping'];

const PredictExpense = () => {
  const { authUser } = useAuthContext();
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [predictionData, setPredictionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePredict = async (catToPredict) => {
    const targetCategory = (catToPredict || category).trim();
    if (!targetCategory) {
      setError('Please choose or enter an expense category.');
      return;
    }

    setLoading(true);
    setError(null);
    setPredictionData(null);

    const payload = {
      category: targetCategory,
      user_id: authUser?._id,
    };

    try {
      // Use proxied /api/predict or port 5001
      let res;
      try {
        res = await fetch('/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {
        // Fallback directly to 5001 if proxy is bypassed
        res = await fetch('http://localhost:5001/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();

      if (res.ok) {
        setPredictionData(data);
        setError(null);
      } else {
        const errorMsg = data.detail || data.error || 'Unable to predict expense for this category';
        setError(errorMsg);
      }
    } catch (err) {
      setError('Could not connect to the ML prediction service. Please ensure the service is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        <button
          onClick={() => navigate('/')}
          className="mb-6 inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
        >
          ← Back to Dashboard
        </button>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white text-center">
            <span className="text-xs uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full font-bold">
              Linear Regression & Trend Analysis
            </span>
            <h2 className="text-3xl font-extrabold mt-3">Predict Future Expenses</h2>
            <p className="text-blue-100 max-w-xl mx-auto mt-2 text-sm">
              Our ML model analyzes historical transaction patterns to forecast your upcoming month's expenses for any category.
            </p>
          </div>

          <div className="p-8 space-y-6">
            {/* Quick Category Chips */}
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                Quick Select Category
              </label>
              <div className="flex flex-wrap gap-2">
                {COMMON_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setCategory(cat);
                      handlePredict(cat);
                    }}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                      category.toLowerCase() === cat.toLowerCase()
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Or type custom category (e.g., Healthcare, Rent)..."
                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              />
              <button
                disabled={loading}
                onClick={() => handlePredict(category)}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-lg shadow-blue-200 disabled:opacity-50"
              >
                {loading ? 'Analyzing...' : 'Predict'}
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-start gap-3">
                <span className="text-lg">⚠️</span>
                <div>
                  <p className="font-semibold">Prediction Notice</p>
                  <p className="mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Prediction Result Display */}
            {predictionData && (
              <div className="p-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 border border-emerald-200 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-emerald-200/60 pb-4">
                  <div>
                    <span className="text-xs uppercase font-bold text-emerald-800 tracking-wider">
                      Forecast for {predictionData.category}
                    </span>
                    <h3 className="text-3xl font-black text-emerald-900 mt-1">
                      ${Number(predictionData.predicted_expense || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                  </div>
                  {predictionData.note && (
                    <span className="text-xs font-semibold px-3 py-1 bg-emerald-200/60 text-emerald-800 rounded-full">
                      {predictionData.note}
                    </span>
                  )}
                </div>

                {/* Additional Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                  <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
                    <span className="text-xs text-gray-500 block">Data Points</span>
                    <span className="text-sm font-bold text-gray-800">{predictionData.data_points || 'Historical'}</span>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
                    <span className="text-xs text-gray-500 block">Mean Abs. Error (MAE)</span>
                    <span className="text-sm font-bold text-gray-800">${predictionData.mean_absolute_error ?? 0}</span>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
                    <span className="text-xs text-gray-500 block">RMSE</span>
                    <span className="text-sm font-bold text-gray-800">${predictionData.root_mean_squared_error ?? 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PredictExpense;