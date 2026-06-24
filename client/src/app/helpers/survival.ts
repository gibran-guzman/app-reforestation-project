export function survivalRate(value: number, total: number): number {
  return total ? Math.round((value / total) * 100) : 0;
}

export function survivalColorClass(value: number, total: number): string {
  const pct = survivalRate(value, total);
  if (pct >= 70) return 'bg-success';
  if (pct >= 40) return 'bg-warning';
  return 'bg-danger';
}

export const STATUS_LABEL: Record<string, string> = {
  alive: 'Vivas',
  struggling: 'Estresadas',
  dead: 'Muertas',
};

export const STATUS_BADGE: Record<string, string> = {
  alive: 'bg-success',
  struggling: 'bg-warning text-dark',
  dead: 'bg-danger',
};

export function statusLabel(status: string): string {
  return STATUS_LABEL[status] || status;
}

export function survivalBadge(status: string): string {
  return STATUS_BADGE[status] || 'bg-secondary';
}
