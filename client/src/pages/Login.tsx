import React, { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, login, loginWithMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();

  if (user) return <Navigate to="/dashboard" replace />;

  const authError = searchParams.get('error');

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError('');
    try {
      await loginWithMagicLink(email.trim());
      setMagicLinkSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-2xl mx-auto mb-4">📊</div>
          <h1 className="text-2xl font-bold text-gray-100">ExpertMRI Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Quadrant Marketing Data APIs</p>
        </div>

        <div className="card">
          {authError && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-800 text-sm text-red-400">
              Authentication failed. Please try again.
            </div>
          )}

          {magicLinkSent ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-4">📧</div>
              <h2 className="text-lg font-semibold text-gray-100 mb-2">Check your email</h2>
              <p className="text-sm text-slate-400 mb-4">
                We sent a sign-in link to <strong className="text-gray-200">{email}</strong>
              </p>
              <p className="text-xs text-slate-500">Link expires in 15 minutes</p>
              <button
                onClick={() => { setMagicLinkSent(false); setEmail(''); }}
                className="btn-ghost text-xs mt-4"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              {/* Google OAuth */}
              <button onClick={login} className="w-full btn bg-white text-gray-800 hover:bg-gray-100 font-medium py-3 mb-4">
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-slate-700" />
                <span className="text-xs text-slate-500">or sign in with email</span>
                <div className="flex-1 h-px bg-slate-700" />
              </div>

              {/* Magic Link */}
              <form onSubmit={handleMagicLink}>
                <input
                  type="email"
                  placeholder="reviewer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input mb-3"
                  required
                />
                {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
                <button type="submit" disabled={sending} className="w-full btn-primary py-2.5">
                  {sending ? 'Sending...' : 'Send Magic Link'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-[11px] text-slate-600 mt-6">
          ExpertMRI Marketing Engagement Dashboard | © Quadrant Technology
        </p>
      </div>
    </div>
  );
}
