import { Component, h, Prop, State } from '@stencil/core';
import { userService, UpdateUserPayload } from '../../services/user';
import { navigate } from '../../services/router';

@Component({
  tag: 'app-user-edit',
  shadow: false,
})
export class AppUserEdit {
  @Prop() userId!: string;

  @State() firstName = '';
  @State() lastName = '';
  @State() email = '';
  @State() isActive = true;
  @State() loading = true;
  @State() submitting = false;
  @State() error = '';

  async componentWillLoad() {
    try {
      const user = await userService.findOne(this.userId);
      this.firstName = user.firstName;
      this.lastName = user.lastName;
      this.email = user.email;
      this.isActive = user.isActive;
    } catch (err: any) {
      this.error = err.message ?? 'Failed to load user';
    } finally {
      this.loading = false;
    }
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();
    this.error = '';
    this.submitting = true;

    const payload: UpdateUserPayload = {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      isActive: this.isActive,
    };

    try {
      await userService.update(this.userId, payload);
      navigate('/users');
    } catch (err: any) {
      this.error = err.message ?? 'Failed to update user';
    } finally {
      this.submitting = false;
    }
  }

  private renderField(
    label: string,
    value: string,
    onInput: (v: string) => void,
    opts: { type?: string; required?: boolean } = {},
  ) {
    return (
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          {label}{opts.required && <span class="text-red-500 ml-0.5">*</span>}
        </label>
        <input
          type={opts.type ?? 'text'}
          required={opts.required}
          value={value}
          onInput={(e) => onInput((e.target as HTMLInputElement).value)}
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    );
  }

  render() {
    return (
      <div class="min-h-screen bg-gray-50">
        <div class="max-w-2xl mx-auto px-6 py-8">
          <div class="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <button
              onClick={() => navigate('/users')}
              class="hover:text-gray-800 transition-colors"
            >
              Users
            </button>
            <span>/</span>
            <span class="text-gray-900 font-medium">Edit user</span>
          </div>

          <h2 class="text-2xl font-bold text-gray-900 mb-8">Edit user</h2>

          {this.loading ? (
            <div class="p-12 text-center text-sm text-gray-400">Loading…</div>
          ) : (
            <form onSubmit={(e) => this.handleSubmit(e)} class="space-y-8">
              <section class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">User info</h3>
                <div class="grid grid-cols-2 gap-4">
                  {this.renderField('First name', this.firstName, (v) => (this.firstName = v), { required: true })}
                  {this.renderField('Last name', this.lastName, (v) => (this.lastName = v), { required: true })}
                </div>
                {this.renderField('Email', this.email, (v) => (this.email = v), { type: 'email', required: true })}

                <div class="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={this.isActive}
                    onChange={(e) => (this.isActive = (e.target as HTMLInputElement).checked)}
                    class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="isActive" class="text-sm font-medium text-gray-700">Active</label>
                </div>
              </section>

              {this.error && (
                <p class="text-sm text-red-600">{this.error}</p>
              )}

              <div class="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/users')}
                  class="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={this.submitting}
                  class="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {this.submitting ? 'Saving…' : 'Save user'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }
}
