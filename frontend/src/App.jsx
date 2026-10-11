import React from 'react'
import { Navigate, Route, Routes } from "react-router-dom";
import  Signup  from './pages/Signup';
import { Toaster } from "react-hot-toast";
import Login from './pages/Login';
import { useAuthContext } from './context/AuthContext'
import Dashboard from './pages/Dashboard';
import PredictExpense from './pages/PredictExpense'
import ClusterResults from './pages/Advice'; 



export default function App() {

  const {authUser} = useAuthContext();
  const requireAuth = (element) => authUser ? element : <Navigate to="/login" replace />;
  return (
    <div className=''>
        <Routes>
          <Route path = "/" element = {requireAuth(<Dashboard/>)}/>
          <Route path = "/signup" element = {authUser ? <Navigate to="/" replace /> : <Signup/>} />
          <Route path = "/login" element = {authUser ? <Navigate to="/" replace /> : <Login/>} />
          <Route path = "/regression" element = {requireAuth(<PredictExpense/>)} />
          <Route path="/clusters" element={requireAuth(<ClusterResults />)} />
          </Routes>
        <Toaster />

    </div>
  )
}
