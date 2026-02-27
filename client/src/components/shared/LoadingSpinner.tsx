import React from 'react';

export default function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="w-8 h-8 border-2 border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  );
}
