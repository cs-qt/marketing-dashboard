import React from 'react';

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="text-3xl">⚠️</div>
      <p className="text-sm text-red-400">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-xs">Try Again</button>
      )}
    </div>
  );
}
