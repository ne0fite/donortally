import { Component, h, State } from '@stencil/core';
import { authService } from '../../services/auth';

@Component({
  tag: 'app-login',
  shadow: false,
})
export class AppLogin {
  @State() email = '';
  @State() password = '';
  @State() error = '';
  @State() loading = false;

  private async handleSubmit(e: Event) {
    e.preventDefault();
    this.error = '';
    this.loading = true;
    try {
      await authService.login(this.email, this.password);
    } catch (err: any) {
      this.error = err.message ?? 'Login failed';
    } finally {
      this.loading = false;
    }
  }

  render() {
    return (
      <main class="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 w-full max-w-sm">
          <h1 class="text-2xl font-bold text-gray-900 mb-1">DonorTally</h1>
          <p class="text-sm text-gray-500 mb-8">Sign in to your account</p>

          <form onSubmit={(e) => this.handleSubmit(e)} class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={this.email}
                onInput={(e) => (this.email = (e.target as HTMLInputElement).value)}
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="you@example.com"
              />
            </div>

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

            {this.error && (
              <p class="text-sm text-red-600">{this.error}</p>
            )}

            <button
              type="submit"
              disabled={this.loading}
              class="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {this.loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
        <p class="mt-6 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} PhoenixBright, LLC
        </p>
      </main>
    );
  }
}
