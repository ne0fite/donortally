import { Component, h, State } from '@stencil/core';
import { donationService, CreateDonationPayload } from '../../services/donation';
import { donorService, Donor } from '../../services/donor';
import { campaignService, Campaign } from '../../services/campaign';
import { navigate } from '../../services/router';

const STATUSES = ['completed', 'pending', 'refunded', 'failed'] as const;
const PAYMENT_TYPES = ['Check', 'Unknown', 'Square', 'PayPal', 'GiveSTL', 'Cash', 'Credit Card', 'Facebook', 'In Kind', 'Money Order'];

@Component({
  tag: 'app-donation-new',
  shadow: false,
})
export class AppDonationNew {
  @State() donors: Donor[] = [];
  @State() campaigns: Campaign[] = [];
  @State() donorId = '';
  @State() campaignId = '';
  @State() amount = '';
  @State() paymentType = 'Unknown';
  @State() donationDate = '';
  @State() status = 'completed';
  @State() notes = '';
  @State() gift = '';
  @State() acknowledgedAt = '';
  @State() loading = true;
  @State() submitting = false;
  @State() error = '';

  async componentWillLoad() {
    try {
      [this.donors, this.campaigns] = await Promise.all([
        donorService.findAll(),
        campaignService.findAll(),
      ]);
    } catch (err: any) {
      this.error = err.message ?? 'Failed to load data';
    } finally {
      this.loading = false;
    }
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();
    this.error = '';
    this.submitting = true;

    const payload: CreateDonationPayload = {
      donorId: this.donorId,
      amount: parseFloat(this.amount),
      donationDate: this.donationDate,
      status: this.status,
      paymentType: this.paymentType || undefined,
    };
    if (this.campaignId) payload.campaignId = this.campaignId;
    if (this.notes) payload.notes = this.notes;
    if (this.gift) payload.gift = this.gift;
    if (this.acknowledgedAt) payload.acknowledgedAt = this.acknowledgedAt;

    try {
      await donationService.create(payload);
      navigate('/donations');
    } catch (err: any) {
      this.error = err.message ?? 'Failed to create donation';
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
              onClick={() => navigate('/donations')}
              class="hover:text-gray-800 transition-colors"
            >
              Donations
            </button>
            <span>/</span>
            <span class="text-gray-900 font-medium">New donation</span>
          </div>

          <h2 class="text-2xl font-bold text-gray-900 mb-8">New donation</h2>

          {this.loading ? (
            <div class="p-12 text-center text-sm text-gray-400">Loading…</div>
          ) : (
            <form onSubmit={(e) => this.handleSubmit(e)} class="space-y-8">
              <section class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">Donation info</h3>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Donor<span class="text-red-500 ml-0.5">*</span>
                  </label>
                  <select
                    required
                    onChange={(e) => (this.donorId = (e.target as HTMLSelectElement).value)}
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="" disabled selected={!this.donorId}>Select a donor…</option>
                    {this.donors.map((d) => (
                      <option key={d.id} value={d.id} selected={this.donorId === d.id}>
                        {d.firstName} {d.lastName}{d.organizationName ? ` — ${d.organizationName}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  {this.renderField('Amount', this.amount, (v) => (this.amount = v), { type: 'number', required: true })}
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Payment type</label>
                    <select
                      onChange={(e) => (this.paymentType = (e.target as HTMLSelectElement).value)}
                      class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {PAYMENT_TYPES.map((t) => <option value={t} selected={this.paymentType === t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {this.renderField('Donation date', this.donationDate, (v) => (this.donationDate = v), { type: 'date', required: true })}

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    onChange={(e) => (this.status = (e.target as HTMLSelectElement).value)}
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s} selected={this.status === s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Campaign</label>
                  <select
                    onChange={(e) => (this.campaignId = (e.target as HTMLSelectElement).value)}
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="" selected={!this.campaignId}>None</option>
                    {this.campaigns.map((c) => (
                      <option key={c.id} value={c.id} selected={this.campaignId === c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {this.renderField('Acknowledged date', this.acknowledgedAt, (v) => (this.acknowledgedAt = v), { type: 'date' })}

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={this.notes}
                    onInput={(e) => (this.notes = (e.target as HTMLTextAreaElement).value)}
                    rows={3}
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Gift</label>
                  <textarea
                    value={this.gift}
                    onInput={(e) => (this.gift = (e.target as HTMLTextAreaElement).value)}
                    rows={3}
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </section>

              {this.error && <p class="text-sm text-red-600">{this.error}</p>}

              <div class="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/donations')}
                  class="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={this.submitting}
                  class="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {this.submitting ? 'Saving…' : 'Save donation'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }
}
