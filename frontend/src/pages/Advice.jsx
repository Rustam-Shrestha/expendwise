import React, { useEffect, useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';

const ClusterResults = () => {
  const { authUser } = useAuthContext();
  const navigate = useNavigate();
  const [adviceData, setAdviceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAdvice = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (authUser?.token) {
        headers['Authorization'] = `Bearer ${authUser.token}`;
      }

      const response = await fetch('/api/financial-advice', {
        headers,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to fetch financial advice');
      }

      setAdviceData(data);
    } catch (err) {
      setError(err.message || 'Error generating financial advice');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvice();
  }, [authUser]);

  const currentUserAdvice = adviceData?.currentUserAdvice;
  const spendingRatioPct = currentUserAdvice
    ? Math.round(Number(currentUserAdvice.spendingRatio || 0) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
        >
          ← Back to Dashboard
        </button>

        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-600 rounded-3xl p-8 text-white shadow-xl">
          <span className="text-xs uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full font-bold">
            Unsupervised K-Means Behavioral Clustering
          </span>
          <h2 className="text-3xl font-extrabold mt-3">Personalized Financial Advice & Peer Clusters</h2>
          <p className="text-blue-100 max-w-2xl mt-2 text-sm">
            We evaluate your income-to-spending ratio against benchmark behavioral clusters to provide customized strategies for long-term financial health.
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-lg border border-gray-100">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3" />
            <p className="text-gray-600 font-medium">Analyzing spending patterns and clustering financial behavior...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-red-200">
            <div className="p-4 bg-red-50 rounded-2xl text-red-700 flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-bold">Advice Generation Notice</p>
                <p className="text-sm mt-0.5">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current User Card */}
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    Your Financial Health Profile
                  </span>
                  <h3 className="text-2xl font-bold text-gray-800 mt-2">
                    {authUser?.userName || 'User'}
                  </h3>
                </div>

                <div className="text-right">
                  <span className="text-xs text-gray-500 uppercase font-semibold block">Spending Ratio</span>
                  <span
                    className={`text-3xl font-black ${
                      spendingRatioPct > 80
                        ? 'text-red-600'
                        : spendingRatioPct > 50
                        ? 'text-amber-500'
                        : 'text-green-600'
                    }`}
                  >
                    {spendingRatioPct}%
                  </span>
                </div>
              </div>

              {/* Personalized Advice Quote */}
              <div className="mt-6 p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                <span className="text-xs uppercase font-bold text-blue-700 tracking-wider block mb-1">
                  AI Recommendation
                </span>
                <p className="text-lg font-semibold text-gray-800 leading-relaxed">
                  "{currentUserAdvice?.advice || 'Keep tracking your daily transactions to unlock deeper financial insights.'}"
                </p>
              </div>

              {/* Stats overview */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <span className="text-xs text-gray-500 block font-medium">Logged Income</span>
                  <span className="text-lg font-bold text-gray-800">
                    ${Number(currentUserAdvice?.income || 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <span className="text-xs text-gray-500 block font-medium">Logged Expenses</span>
                  <span className="text-lg font-bold text-gray-800">
                    ${Number(currentUserAdvice?.expenses || 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl col-span-2 sm:col-span-1">
                  <span className="text-xs text-gray-500 block font-medium">Peer Group Size</span>
                  <span className="text-lg font-bold text-gray-800">
                    {adviceData?.totalUsersAnalyzed || 1} users
                  </span>
                </div>
              </div>
            </div>

            {/* Peer Cluster Breakdown */}
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Behavioral Peer Clusters</h3>
              <p className="text-sm text-gray-500 mb-6">
                How spending profiles are grouped across {adviceData?.totalUsersAnalyzed || 0} analyzed accounts.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {adviceData?.advicePerCluster &&
                  Object.entries(adviceData.advicePerCluster).map(([clusterId, users]) => {
                    const avgRatio =
                      users.reduce((sum, u) => sum + (Number(u.spendingRatio) || 0), 0) /
                      Math.max(1, users.length);
                    const avgPct = Math.round(avgRatio * 100);

                    return (
                      <div
                        key={clusterId}
                        className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between space-y-4"
                      >
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold uppercase text-slate-500">
                              Cluster #{Number(clusterId) + 1}
                            </span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 font-semibold text-slate-700">
                              {users.length} {users.length === 1 ? 'user' : 'users'}
                            </span>
                          </div>

                          <h4 className="text-lg font-bold text-gray-800">
                            {avgPct > 70
                              ? 'High Outflow Group'
                              : avgPct > 40
                              ? 'Balanced Cash Flow'
                              : 'High Savings Accumulators'}
                          </h4>

                          <p className="text-xs text-gray-500 mt-2">
                            Average Spending Ratio: <strong className="text-gray-700">{avgPct}%</strong>
                          </p>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-gray-600">
                          {users[0]?.advice || 'Maintain consistent budget allocations.'}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ClusterResults;
