import { Component, h, Prop, State } from '@stencil/core';
import { donationService, UpdateDonationPayload } from '../../services/donation';
import { campaignService, Campaign } from '../../services/campaign';
import { navigate } from '../../services/router';

const STATUSES = ['completed', 'pending', 'refunded', 'failed'] as const;
const PAYMENT_TYPES = ['Check', 'Unknown', 'Square', 'PayPal', 'GiveSTL', 'Cash', 'Credit Card', 'Facebook', 'In Kind', 'Money Order'];

@Component({
  tag: 'app-donation-edit',
  shadow: false,
})
export class AppDonationEdit {
  @Prop() donationId!: string;

  @State() campaigns: Campaign[] = [];
  @State() donorName = '';
  @State() donationDisplayId = '';
  @State() campaignId = '';
  @State() amount = '';
  @State() paymentType = '';
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
      const [donation, campaigns] = await Promise.all([
        donationService.findOne(this.donationId),
        campaignService.findAll(),
      ]);
      this.campaigns = campaigns;
      this.donorName = `${donation.donor.firstName} ${donation.donor.lastName}`;
      this.donationDisplayId = donation.donationId;
      this.campaignId = donation.campaignId ?? '';
      this.amount = String(donation.amount);
      this.paymentType = donation.paymentType ?? '';
      this.donationDate = donation.donationDate;
      this.status = donation.status;
      this.notes = donation.notes ?? '';
      this.gift = donation.gift ?? '';
      this.acknowledgedAt = donation.acknowledgedAt
        ? donation.acknowledgedAt.slice(0, 10)
        : '';
    } catch (err: any) {
      this.error = err.message ?? 'Failed to load donation';
    } finally {
      this.loading = false;
    }
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();
    this.error = '';
    this.submitting = true;

    const payload: UpdateDonationPayload = {
      amount: parseFloat(this.amount),
      donationDate: this.donationDate,
      status: this.status,
      campaignId: this.campaignId || undefined,
      notes: this.notes || undefined,
      acknowledgedAt: this.acknowledgedAt || null,
      paymentType: this.paymentType || undefined,
      gift: this.gift || undefined,
    };

    try {
      await donationService.update(this.donationId, payload);
      navigate('/donations');
    } catch (err: any) {
      this.error = err.message ?? 'Failed to update donation';
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
            <span class="text-gray-900 font-medium">Edit donation</span>
          </div>

          <h2 class="text-2xl font-bold text-gray-900 mb-8">Edit donation</h2>

          {this.loading ? (
            <div class="p-12 text-center text-sm text-gray-400">Loading…</div>
          ) : (
            <form onSubmit={(e) => this.handleSubmit(e)} class="space-y-8">
              <section class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">Donation info</h3>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Donor</label>
                  <p class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    {this.donorName}
                  </p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Donation ID</label>
                  <p class="text-sm text-gray-900">{this.donationDisplayId}</p>
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
