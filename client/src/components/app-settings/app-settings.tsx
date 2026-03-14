import { Component, Element, h, State } from '@stencil/core';
import { organizationService } from '../../services/organization';
import { state } from '../../store/auth.store';

@Component({
  tag: 'app-settings',
  shadow: false,
})
export class AppSettings {
  @Element() el!: HTMLElement;

  @State() orgName = '';
  @State() loading = true;
  @State() submitting = false;
  @State() error = '';

  async componentWillLoad() {
    try {
      const org = await organizationService.me();
      this.orgName = org.name;
    } catch (err: any) {
      this.error = err.message ?? 'Failed to load settings';
    } finally {
      this.loading = false;
    }
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();
    this.error = '';
    this.submitting = true;

    try {
      const updated = await organizationService.update({ name: this.orgName });
      state.orgName = updated.name;
      (this.el.querySelector('app-toast') as any)?.show('Settings saved');
    } catch (err: any) {
      this.error = err.message ?? 'Failed to save settings';
    } finally {
      this.submitting = false;
    }
  }

  render() {
    return (
      <div class="min-h-screen bg-gray-50">
        <div class="max-w-2xl mx-auto px-6 py-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-8">Settings</h2>

          {this.loading ? (
            <div class="p-12 text-center text-sm text-gray-400">Loading…</div>
          ) : (
            <form onSubmit={(e) => this.handleSubmit(e)} class="space-y-8">
              <section class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">Organization</h3>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Organization name<span class="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={this.orgName}
                    onInput={(e) => (this.orgName = (e.target as HTMLInputElement).value)}
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </section>

              {this.error && <p class="text-sm text-red-600">{this.error}</p>}

              <div class="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={this.submitting}
                  class="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {this.submitting ? 'Saving…' : 'Save settings'}
                </button>
              </div>
            </form>
          )}
        </div>

        <app-toast />
      </div>
    );
  }
}
