import { Component, h, Prop, State } from '@stencil/core';
import { authService } from '../../services/auth';
import { navigate } from '../../services/router';
import { CurrentUser } from '../../store/auth.store';

@Component({
  tag: 'app-header',
  shadow: false,
})
export class AppHeader {
  @Prop() orgName: string | null = null;
  @Prop() currentUser: CurrentUser | null = null;

  @State() menuOpen = false;

  private containerEl?: HTMLElement;

  private onDocumentClick = (e: MouseEvent) => {
    if (this.containerEl && !this.containerEl.contains(e.target as Node)) {
      this.menuOpen = false;
    }
  };

  connectedCallback() {
    document.addEventListener('click', this.onDocumentClick);
  }

  disconnectedCallback() {
    document.removeEventListener('click', this.onDocumentClick);
  }

  private get initials(): string {
    if (!this.currentUser) return '?';
    const f = this.currentUser.firstName?.[0] ?? '';
    const l = this.currentUser.lastName?.[0] ?? '';
    return (f + l).toUpperCase() || '?';
  }

  render() {
    return (
      <header class="h-14 bg-white border-b border-gray-200 flex items-center px-5 flex-shrink-0 z-10">
        <span class="text-lg font-bold text-gray-900 w-56 flex-shrink-0">DonorTally</span>

        <div class="flex-1 flex justify-center">
          {this.orgName && (
            <span class="text-lg font-bold">{this.orgName}</span>
          )}
        </div>

        <div class="relative" ref={(el) => (this.containerEl = el as HTMLElement)}>
          <button
            onClick={() => (this.menuOpen = !this.menuOpen)}
            class="rounded-full bg-indigo-600 text-white text-sm font-semibold flex items-center justify-center hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            style={{ width: '2.75rem', height: '2.75rem', flexShrink: '0' }}
            aria-label="Profile menu"
          >
            {this.initials}
          </button>

          {this.menuOpen && (
            <div class="absolute mt-2 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-50"
            style={{ minWidth: '12rem', right: '0', left: 'auto' }}>
              <button
                onClick={() => { this.menuOpen = false; navigate('/profile'); }}
                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Edit profile
              </button>
              <button
                onClick={() => { this.menuOpen = false; navigate('/settings'); }}
                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Settings
              </button>
              <hr class="my-1 border-gray-100" />
              <button
                onClick={() => { this.menuOpen = false; authService.logout(); }}
                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>
    );
  }
}
