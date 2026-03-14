import { Component, h, State } from '@stencil/core';
import { userService, CreateUserPayload } from '../../services/user';
import { navigate } from '../../services/router';

@Component({
  tag: 'app-user-new',
  shadow: false,
})
export class AppUserNew {
  @State() firstName = '';
  @State() lastName = '';
  @State() email = '';
  @State() password = '';
  @State() mode: 'password' | 'invite' = 'password';
  @State() submitting = false;
  @State() error = '';

  private async handleSubmit(e: Event) {
    e.preventDefault();
    this.error = '';
    this.submitting = true;

    const payload: CreateUserPayload =
      this.mode === 'invite'
        ? { firstName: this.firstName, lastName: this.lastName, email: this.email, sendInvite: true }
        : { firstName: this.firstName, lastName: this.lastName, email: this.email, password: this.password };

    try {
      await userService.create(payload);
      if (this.mode === 'invite') {
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Invite sent to ${this.email}`, variant: 'success' } }));
      }
      navigate('/users');
    } catch (err: any) {
      this.error = err.message ?? 'Failed to create user';
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
            <span class="text-gray-900 font-medium">New user</span>
          </div>

          <h2 class="text-2xl font-bold text-gray-900 mb-8">New user</h2>

          <form onSubmit={(e) => this.handleSubmit(e)} class="space-y-8">
            <section class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">User info</h3>
              <div class="grid grid-cols-2 gap-4">
                {this.renderField('First name', this.firstName, (v) => (this.firstName = v), { required: true })}
                {this.renderField('Last name', this.lastName, (v) => (this.lastName = v), { required: true })}
              </div>
              {this.renderField('Email', this.email, (v) => (this.email = v), { type: 'email', required: true })}

              <div>
                <p class="block text-sm font-medium text-gray-700 mb-2">Password setup</p>
                <div class="flex flex-col gap-2">
                  <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="mode"
                      checked={this.mode === 'password'}
                      onChange={() => (this.mode = 'password')}
                    />
                    Set password now
                  </label>
                  <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="mode"
                      checked={this.mode === 'invite'}
                      onChange={() => (this.mode = 'invite')}
                    />
                    Send invite email
                  </label>
                </div>
              </div>

              {this.mode === 'password' && (
                this.renderField('Password', this.password, (v) => (this.password = v), { type: 'password', required: true })
              )}
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
                {this.submitting ? 'Saving…' : this.mode === 'invite' ? 'Send invite' : 'Save user'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}
