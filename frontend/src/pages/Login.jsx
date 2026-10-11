import React, { useState } from 'react';
import useLogin from '../hooks/useLogin';
import { Link } from 'react-router-dom';

export default function Login() {
  const { login, loading } = useLogin();
  const [input, setInput] = useState({
    password: '',
    email: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(input);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-purple-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md transform transition-all duration-300 hover:shadow-2xl border border-gray-100">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-2xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-blue-200">
            $
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Welcome Back</h2>
          <p className="text-sm text-gray-500 mt-1">Sign in to manage your finances</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-1.5">Email Address</label>
            <input
              type="email"
              name="email"
              value={input.email}
              onChange={(e) => setInput({ ...input, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-1.5">Password</label>
            <input
              type="password"
              name="password"
              value={input.password}
              onChange={(e) => setInput({ ...input, password: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-md shadow-blue-200 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>

          <div className="text-center pt-2">
            <Link
              to="/signup"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium transition-all"
            >
              Don't have an account? Sign Up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}