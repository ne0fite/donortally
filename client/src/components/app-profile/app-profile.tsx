import { Component, Element, h, State } from '@stencil/core';
import { userService, UpdateUserPayload } from '../../services/user';
import { state } from '../../store/auth.store';

@Component({
  tag: 'app-profile',
  shadow: false,
})
export class AppProfile {
  @Element() el!: HTMLElement;

  @State() firstName = '';
  @State() lastName = '';
  @State() email = '';
  @State() password = '';
  @State() loading = true;
  @State() submitting = false;
  @State() error = '';

  private userId = '';

  async componentWillLoad() {
    try {
      const me = await userService.me();
      this.userId = me.id;
      this.firstName = me.firstName;
      this.lastName = me.lastName;
      this.email = me.email;
    } catch (err: any) {
      this.error = err.message ?? 'Failed to load profile';
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
    };
    if (this.password) payload.password = this.password;

    try {
      const updated = await userService.update(this.userId, payload);
      state.currentUser = { id: updated.id, firstName: updated.firstName, lastName: updated.lastName, email: updated.email };
      this.password = '';
      (this.el.querySelector('app-toast') as any)?.show('Profile saved');
    } catch (err: any) {
      this.error = err.message ?? 'Failed to save profile';
    } finally {
      this.submitting = false;
    }
  }

  private renderField(
    label: string,
    value: string,
    onInput: (v: string) => void,
    opts: { type?: string; required?: boolean; autocomplete?: string } = {},
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
          autocomplete={opts.autocomplete}
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
          <h2 class="text-2xl font-bold text-gray-900 mb-8">Edit profile</h2>

          {this.loading ? (
            <div class="p-12 text-center text-sm text-gray-400">Loading…</div>
          ) : (
            <form onSubmit={(e) => this.handleSubmit(e)} class="space-y-8">
              <section class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">Personal info</h3>
                <div class="grid grid-cols-2 gap-4">
                  {this.renderField('First name', this.firstName, (v) => (this.firstName = v), { required: true, autocomplete: 'given-name' })}
                  {this.renderField('Last name', this.lastName, (v) => (this.lastName = v), { required: true, autocomplete: 'family-name' })}
                </div>
                {this.renderField('Email', this.email, (v) => (this.email = v), { type: 'email', required: true, autocomplete: 'email' })}
              </section>

              <section class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">Change password</h3>
                <p class="text-sm text-gray-500">Leave blank to keep your current password.</p>
                {this.renderField('New password', this.password, (v) => (this.password = v), { type: 'password', autocomplete: 'new-password' })}
              </section>

              {this.error && <p class="text-sm text-red-600">{this.error}</p>}

              <div class="flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={this.submitting}
                  class="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {this.submitting ? 'Saving…' : 'Save profile'}
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
