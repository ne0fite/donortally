import { Component, h, State } from '@stencil/core';
import { donorService, CreateDonorPayload } from '../../services/donor';
import { navigate } from '../../services/router';

interface ContactRow {
  type: 'email' | 'phone' | 'mobile';
  label: 'home' | 'work' | 'other';
  value: string;
}

@Component({
  tag: 'app-donor-new',
  shadow: false,
})
export class AppDonorNew {
  // Basic info
  @State() title = '';
  @State() firstName = '';
  @State() lastName = '';
  @State() organizationName = '';

  // Address
  @State() address1 = '';
  @State() address2 = '';
  @State() city = '';
  @State() usState = '';
  @State() postalCode = '';

  // Contacts
  @State() contacts: ContactRow[] = [];

  // UI
  @State() submitting = false;
  @State() error = '';

  private addContact() {
    this.contacts = [...this.contacts, { type: 'email', label: 'home', value: '' }];
  }

  private removeContact(index: number) {
    this.contacts = this.contacts.filter((_, i) => i !== index);
  }

  private updateContact(index: number, field: keyof ContactRow, value: string) {
    this.contacts = this.contacts.map((c, i) =>
      i === index ? { ...c, [field]: value } : c,
    );
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();
    this.error = '';
    this.submitting = true;

    const payload: CreateDonorPayload = {
      ...(this.title && { title: this.title }),
      firstName: this.firstName,
      lastName: this.lastName,
      ...(this.organizationName && { organizationName: this.organizationName }),
      ...(this.address1 && { address1: this.address1 }),
      ...(this.address2 && { address2: this.address2 }),
      ...(this.city && { city: this.city }),
      ...(this.usState && { state: this.usState }),
      ...(this.postalCode && { postalCode: this.postalCode }),
      contacts: this.contacts.filter((c) => c.value.trim()),
    };

    try {
      await donorService.create(payload);
      navigate('/donors');
    } catch (err: any) {
      this.error = err.message ?? 'Failed to create donor';
    } finally {
      this.submitting = false;
    }
  }

  private renderField(
    label: string,
    value: string,
    onInput: (v: string) => void,
    opts: { type?: string; required?: boolean; placeholder?: string } = {},
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
          placeholder={opts.placeholder ?? ''}
          autoComplete="off"
          data-lpignore="true"
          data-1p-ignore="true"
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
          {/* Breadcrumb */}
          <div class="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <button
              onClick={() => (navigate('/donors'))}
              class="hover:text-gray-800 transition-colors"
            >
              Donors
            </button>
            <span>/</span>
            <span class="text-gray-900 font-medium">New donor</span>
          </div>

          <h2 class="text-2xl font-bold text-gray-900 mb-8">New donor</h2>

          <form onSubmit={(e) => this.handleSubmit(e)} autoComplete="off" class="space-y-8">
            {/* Basic info */}
            <section class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">Basic info</h3>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <select
                  onChange={(e) => (this.title = (e.target as HTMLSelectElement).value)}
                  class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" selected={this.title === ''}>—</option>
                  <option value="Dr." selected={this.title === 'Dr.'}>Dr.</option>
                  <option value="Dr. &amp; Mrs." selected={this.title === 'Dr. & Mrs.'}>Dr. &amp; Mrs.</option>
                  <option value="Drs." selected={this.title === 'Drs.'}>Drs.</option>
                  <option value="Miss" selected={this.title === 'Miss'}>Miss</option>
                  <option value="Mr." selected={this.title === 'Mr.'}>Mr.</option>
                  <option value="Mr. &amp; Mrs." selected={this.title === 'Mr. & Mrs.'}>Mr. &amp; Mrs.</option>
                  <option value="Mrs." selected={this.title === 'Mrs.'}>Mrs.</option>
                  <option value="Ms." selected={this.title === 'Ms.'}>Ms.</option>
                </select>
              </div>
              <div class="grid grid-cols-2 gap-4">
                {this.renderField('First name', this.firstName, (v) => (this.firstName = v))}
                {this.renderField('Last name', this.lastName, (v) => (this.lastName = v))}
              </div>
              {this.renderField('Organization name', this.organizationName, (v) => (this.organizationName = v))}
            </section>

            <app-address-section
              address1={this.address1}
              address2={this.address2}
              city={this.city}
              state={this.usState}
              postalCode={this.postalCode}
              onAddress1Change={(e: CustomEvent<string>) => (this.address1 = e.detail)}
              onAddress2Change={(e: CustomEvent<string>) => (this.address2 = e.detail)}
              onCityChange={(e: CustomEvent<string>) => (this.city = e.detail)}
              onDonorStateChange={(e: CustomEvent<string>) => (this.usState = e.detail)}
              onPostalCodeChange={(e: CustomEvent<string>) => (this.postalCode = e.detail)}
            />

            {/* Contacts */}
            <section class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">Contacts</h3>
                <button
                  type="button"
                  onClick={() => this.addContact()}
                  class="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                >
                  + Add contact
                </button>
              </div>

              {this.contacts.length === 0 && (
                <p class="text-sm text-gray-400">No contacts added.</p>
              )}

              {this.contacts.map((contact, i) => (
                <div key={i} class="flex items-center gap-3">
                  <select
                    onChange={(e) => this.updateContact(i, 'type', (e.target as HTMLSelectElement).value)}
                    class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="email" selected={contact.type === 'email'}>Email</option>
                    <option value="phone" selected={contact.type === 'phone'}>Phone</option>
                    <option value="mobile" selected={contact.type === 'mobile'}>Mobile</option>
                  </select>

                  <select
                    onChange={(e) => this.updateContact(i, 'label', (e.target as HTMLSelectElement).value)}
                    class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="home" selected={contact.label === 'home'}>Home</option>
                    <option value="work" selected={contact.label === 'work'}>Work</option>
                    <option value="other" selected={contact.label === 'other'}>Other</option>
                  </select>

                  <input
                    type={contact.type === 'email' ? 'email' : 'tel'}
                    value={contact.value}
                    placeholder={contact.type === 'email' ? 'email@example.com' : '555-000-0000'}
                    onInput={(e) => this.updateContact(i, 'value', (e.target as HTMLInputElement).value)}
                    class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                  <button
                    type="button"
                    onClick={() => this.removeContact(i)}
                    class="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none"
                    aria-label="Remove contact"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </section>

            {this.error && (
              <p class="text-sm text-red-600">{this.error}</p>
            )}

            {/* Actions */}
            <div class="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => (navigate('/donors'))}
                class="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={this.submitting}
                class="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {this.submitting ? 'Saving…' : 'Save donor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}
