import React, { useEffect, useState } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/shared/LoadingSpinner';

export default function MagicLinkVerify() {
  const [searchParams] = useSearchParams();
  const { user, refresh } = useAuth();
  const [error, setError] = useState(false);
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) { setError(true); return; }
    // The backend handles verification via GET redirect —
    // the browser was redirected here after the backend set the JWT cookie.
    // We just need to refresh auth state.
    refresh().catch(() => setError(true));
  }, [token, refresh]);

  if (user) return <Navigate to="/dashboard" replace />;
  if (error) return <Navigate to="/login?error=invalid_token" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner text="Verifying your sign-in link..." />
    </div>
  );
}
