export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function formatCurrency(n: number): string {
  return `$${formatNumber(n)}`;
}

export function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getDelta(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export function deltaColor(delta: number, inverse = false): string {
  if (delta === 0) return 'text-slate-400';
  const positive = inverse ? delta < 0 : delta > 0;
  return positive ? 'text-emerald-400' : 'text-red-400';
}
