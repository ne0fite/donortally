import { Component, h, State } from '@stencil/core';
import { inviteService, InviteInfo } from '../../services/invite';
import { state } from '../../store/auth.store';
import { navigate } from '../../services/router';

type Status = 'loading' | 'invalid' | 'ready' | 'submitting' | 'error';

@Component({
  tag: 'app-activate',
  shadow: false,
})
export class AppActivate {
  @State() status: Status = 'loading';
  @State() inviteInfo: InviteInfo | null = null;
  @State() password = '';
  @State() confirmPassword = '';
  @State() error = '';
  private token = '';

  async componentWillLoad() {
    const params = new URLSearchParams(window.location.search);
    this.token = params.get('token') ?? '';
    if (!this.token) {
      this.status = 'invalid';
      return;
    }
    try {
      this.inviteInfo = await inviteService.validate(this.token);
      this.status = 'ready';
    } catch {
      this.status = 'invalid';
    }
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();
    this.error = '';

    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    this.status = 'submitting';
    try {
      const result = await inviteService.activate(this.token, this.password);
      state.token = result.accessToken;
      navigate('/dashboard');
    } catch (err: any) {
      this.error = err.message ?? 'Activation failed';
      this.status = 'error';
    }
  }

  render() {
    return (
      <main class="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        {this.status === 'loading' && (
          <div class="text-sm text-gray-500">Loading…</div>
        )}

        {this.status === 'invalid' && (
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 w-full max-w-sm text-center">
            <h1 class="text-2xl font-bold text-gray-900 mb-2">Link expired</h1>
            <p class="text-sm text-gray-500">This invite link is invalid or has expired. Please contact your administrator.</p>
          </div>
        )}

        {(this.status === 'ready' || this.status === 'submitting' || this.status === 'error') && (
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 w-full max-w-sm">
            <h1 class="text-2xl font-bold text-gray-900 mb-1">Welcome, {this.inviteInfo?.firstName}!</h1>
            <p class="text-sm text-gray-500 mb-8">Set a password to activate your DonorTally account.</p>

            <form onSubmit={(e) => this.handleSubmit(e)} class="space-y-5">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={this.password}
                  onInput={(e) => (this.password = (e.target as HTMLInputElement).value)}
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
                <input
                  type="password"
                  required
                  value={this.confirmPassword}
                  onInput={(e) => (this.confirmPassword = (e.target as HTMLInputElement).value)}
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
              </div>

              {this.error && (
                <p class="text-sm text-red-600">{this.error}</p>
              )}

              <button
                type="submit"
                disabled={this.status === 'submitting'}
                class="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {this.status === 'submitting' ? 'Activating…' : 'Activate account'}
              </button>
            </form>
          </div>
        )}

        <p class="mt-6 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} PhoenixBright, LLC
        </p>
      </main>
    );
  }
}
