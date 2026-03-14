import { Component, h, State } from '@stencil/core';
import { campaignService, CreateCampaignPayload } from '../../services/campaign';
import { navigate } from '../../services/router';

@Component({
  tag: 'app-campaign-new',
  shadow: false,
})
export class AppCampaignNew {
  @State() name = '';
  @State() description = '';
  @State() startDate = '';
  @State() endDate = '';
  @State() goalAmount = '';
  @State() isActive = true;
  @State() submitting = false;
  @State() error = '';

  private async handleSubmit(e: Event) {
    e.preventDefault();
    this.error = '';
    this.submitting = true;

    const payload: CreateCampaignPayload = {
      name: this.name,
      isActive: this.isActive,
    };
    if (this.description) payload.description = this.description;
    if (this.startDate) payload.startDate = this.startDate;
    if (this.endDate) payload.endDate = this.endDate;
    if (this.goalAmount) payload.goalAmount = parseFloat(this.goalAmount);

    try {
      await campaignService.create(payload);
      navigate('/campaigns');
    } catch (err: any) {
      this.error = err.message ?? 'Failed to create campaign';
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
              onClick={() => navigate('/campaigns')}
              class="hover:text-gray-800 transition-colors"
            >
              Campaigns
            </button>
            <span>/</span>
            <span class="text-gray-900 font-medium">New campaign</span>
          </div>

          <h2 class="text-2xl font-bold text-gray-900 mb-8">New campaign</h2>

          <form onSubmit={(e) => this.handleSubmit(e)} class="space-y-8">
            <section class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">Campaign info</h3>

              {this.renderField('Name', this.name, (v) => (this.name = v), { required: true })}

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={this.description}
                  onInput={(e) => (this.description = (e.target as HTMLTextAreaElement).value)}
                  rows={3}
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                {this.renderField('Start date', this.startDate, (v) => (this.startDate = v), { type: 'date' })}
                {this.renderField('End date', this.endDate, (v) => (this.endDate = v), { type: 'date' })}
              </div>

              {this.renderField('Goal amount', this.goalAmount, (v) => (this.goalAmount = v), { type: 'number' })}

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
                onClick={() => navigate('/campaigns')}
                class="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={this.submitting}
                class="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {this.submitting ? 'Saving…' : 'Save campaign'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}
