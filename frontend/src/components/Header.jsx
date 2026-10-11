import React from 'react';
import { useAuthContext } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Header() {
  const { authUser, logout } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const isCurrent = (path) => location.pathname === path;

  return (
    <header className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-600 text-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap justify-between items-center gap-4">
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center font-black text-xl border border-white/20">
            $
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">FinancePulse</h1>
            <p className="text-xs text-blue-200">Smart Financial Management</p>
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-4">
          <button
            onClick={() => navigate('/')}
            className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition ${
              isCurrent('/')
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-white/90 hover:bg-white/10'
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => navigate('/regression')}
            className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition ${
              isCurrent('/regression')
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-white/90 hover:bg-white/10'
            }`}
          >
            Predict Expense
          </button>

          <button
            onClick={() => navigate('/clusters')}
            className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition ${
              isCurrent('/clusters')
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-white/90 hover:bg-white/10'
            }`}
          >
            AI Financial Advice
          </button>

          {/* User info and Logout */}
          <div className="flex items-center pl-2 sm:pl-4 border-l border-white/20 gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs text-blue-200 block">Welcome,</span>
              <span className="text-sm font-semibold block">{authUser?.userName || 'User'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-white/10 hover:bg-red-500/80 text-white rounded-lg text-xs font-semibold transition border border-white/10"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
