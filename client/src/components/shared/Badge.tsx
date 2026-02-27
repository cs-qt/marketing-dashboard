import React from 'react';
import { PostStatus, Platform } from '@expertmri/shared';
import { STATUS_CONFIG, PLATFORM_CONFIG } from '../../utils/constants';

export function StatusBadge({ status }: { status: PostStatus }) {
  const cfg = STATUS_CONFIG[status];
  return <span className={cfg.badgeClass}>{cfg.label}</span>;
}

export function PlatformBadge({ platform }: { platform: Platform }) {
  const cfg = PLATFORM_CONFIG[platform];
  return (
    <span className="badge bg-slate-700 border-slate-600 text-slate-200" style={{ borderColor: cfg.color + '40' }}>
      <span>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

export function DeltaBadge({ value, inverse = false }: { value: number; inverse?: boolean }) {
  if (value === 0) return <span className="text-xs text-slate-400">—</span>;
  const positive = inverse ? value < 0 : value > 0;
  return (
    <span className={`text-xs font-medium ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
      {positive ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%
    </span>
  );
}
