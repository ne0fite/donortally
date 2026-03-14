import { Component, h, Method, State } from '@stencil/core';

type ToastVariant = 'success' | 'warn' | 'info' | 'error';

interface ToastConfig {
  message: string;
  variant: ToastVariant;
}

const VARIANTS: Record<ToastVariant, { bg: string; icon: string }> = {
  success: {
    bg: 'bg-green-600',
    icon: 'M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z',
  },
  error: {
    bg: 'bg-red-600',
    icon: 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z',
  },
  warn: {
    bg: 'bg-yellow-500',
    icon: 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z',
  },
  info: {
    bg: 'bg-blue-600',
    icon: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z',
  },
};

@Component({
  tag: 'app-toast',
  shadow: false,
})
export class AppToast {
  @State() private visible = false;
  @State() private fading = false;
  @State() private config: ToastConfig = { message: '', variant: 'success' };

  private timer: any;

  disconnectedCallback() {
    clearTimeout(this.timer);
  }

  @Method()
  async show(message: string, variant: ToastVariant = 'success') {
    clearTimeout(this.timer);
    this.config = { message, variant };
    this.fading = false;
    this.visible = true;
    this.timer = setTimeout(() => {
      this.fading = true;
      this.timer = setTimeout(() => {
        this.visible = false;
        this.fading = false;
      }, 500);
    }, 2500);
  }

  render() {
    if (!this.visible) return null;

    const { bg, icon } = VARIANTS[this.config.variant];

    return (
      <div
        style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', transition: 'opacity 0.5s ease', opacity: this.fading ? '0' : '1' }}
        class={`flex items-center gap-2 ${bg} text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d={icon} clip-rule="evenodd" />
        </svg>
        {this.config.message}
      </div>
    );
  }
}
