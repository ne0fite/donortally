/** Format a date-only string (YYYY-MM-DD) or ISO datetime for display */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  // Append T00:00:00 for date-only strings to prevent UTC-midnight timezone shift
  const normalized = value.length === 10 ? value + 'T00:00:00' : value;
  return new Date(normalized).toLocaleDateString();
}

/** Format a monetary amount with the given ISO 4217 currency code */
export function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

/** Format an integer with thousand separators */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}
