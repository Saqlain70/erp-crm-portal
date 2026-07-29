export function StatusBadge({ status }: { status: string }) {
  const cls = `badge badge-${status.toLowerCase()}`;
  return <span className={cls}>{status}</span>;
}

export function StockBadge({ current, min }: { current: number; min: number }) {
  const low = current <= min;
  return <span className={`badge ${low ? 'badge-low' : 'badge-ok'}`}>{low ? 'Low stock' : 'In stock'}</span>;
}
