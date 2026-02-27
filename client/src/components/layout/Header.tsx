import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-sm">📊</div>
          <div>
            <h1 className="text-sm font-semibold text-gray-100 leading-tight">ExpertMRI Marketing Dashboard</h1>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              Quadrant Marketing Data APIs
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </p>
          </div>
        </div>

        {/* User */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-gray-200">{user.name}</p>
              <p className="text-[10px] text-slate-400 capitalize">{user.role}</p>
            </div>
            {user.picture ? (
              <img src={user.picture} alt="" className="w-8 h-8 rounded-full border border-slate-600" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold">
                {user.name.charAt(0)}
              </div>
            )}
            <button onClick={logout} className="btn-ghost text-xs px-2 py-1">
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
