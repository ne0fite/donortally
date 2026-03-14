/** Format a date-only string (YYYY-MM-DD) or ISO datetime for display */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  // Append T00:00:00 for date-only strings to prevent UTC-midnight timezone shift
  const normalized = value.length === 10 ? value + 'T00:00:00' : value;
  return new Date(normalized).toLocaleDateString();
}

/** Format an ISO datetime string for display as MM/DD/YYYY HH:mm:ss */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Format a monetary amount with the given ISO 4217 currency code */
export function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

/** Format an integer with thousand separators */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}
