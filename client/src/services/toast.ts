export function showToast(message: string, variant: 'success' | 'warn' | 'info' | 'error' = 'success') {
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, variant } }));
}
