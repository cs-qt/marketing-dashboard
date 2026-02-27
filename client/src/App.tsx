import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import MagicLinkVerify from './pages/MagicLinkVerify';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoadingSpinner from './components/shared/LoadingSpinner';

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading from Quadrant Marketing Data APIs..." />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/verify" element={<MagicLinkVerify />} />
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
