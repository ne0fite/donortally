import { Component, h, State } from '@stencil/core';
import { donorService, Donor } from '../../services/donor';
import { campaignService, Campaign } from '../../services/campaign';
import { donationService, Donation } from '../../services/donation';
import { navigate } from '../../services/router';
import { formatDate, formatAmount, formatNumber } from '../../services/format';

@Component({
  tag: 'app-dashboard',
  shadow: false,
})
export class AppDashboard {
  @State() donors: Donor[] = [];
  @State() campaigns: Campaign[] = [];
  @State() donations: Donation[] = [];
  @State() loading = true;
  @State() error = '';

  async componentWillLoad() {
    try {
      [this.donors, this.campaigns, this.donations] = await Promise.all([
        donorService.findAll(),
        campaignService.findAll(),
        donationService.findAll(),
      ]);
    } catch (err: any) {
      this.error = err.message ?? 'Failed to load dashboard data';
    } finally {
      this.loading = false;
    }
  }

  private get activeCampaigns() {
    return this.campaigns.filter((c) => c.isActive).length;
  }

  private get completedDonations() {
    return this.donations.filter((d) => d.status === 'completed');
  }

  private get totalRaised() {
    return this.completedDonations.reduce((sum, d) => sum + Number(d.amount), 0);
  }

  private get recentDonations() {
    return [...this.donations]
      .sort((a, b) => (a.donationDate < b.donationDate ? 1 : -1))
      .slice(0, 10);
  }

  private renderStatCard(label: string, value: string | number, sub: string, onClick?: () => void) {
    return (
      <div
        class={
          `bg-white rounded-xl border border-gray-200 p-6 ` +
          (onClick ? 'cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all' : '')
        }
        onClick={onClick}
      >
        <p class="text-sm font-medium text-gray-500">{label}</p>
        <p class="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        <p class="mt-1 text-xs text-gray-400">{sub}</p>
      </div>
    );
  }

  private statusBadge(status: string) {
    const styles: Record<string, string> = {
      completed: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      refunded: 'bg-blue-100 text-blue-700',
      failed: 'bg-red-100 text-red-700',
    };
    return (
      <span
        class={
          `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ` +
          (styles[status] ?? 'bg-gray-100 text-gray-500')
        }
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  }

  render() {
    return (
      <div class="min-h-screen bg-gray-50">
        <div class="max-w-7xl mx-auto px-6 py-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-8">Dashboard</h2>

          {this.loading ? (
            <div class="p-12 text-center text-sm text-gray-400">Loading…</div>
          ) : this.error ? (
            <div class="p-12 text-center text-sm text-red-500">{this.error}</div>
          ) : (
            <div class="space-y-8">
              {/* Stat cards */}
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {this.renderStatCard(
                  'Total donors',
                  formatNumber(this.donors.length),
                  'across all time',
                  () => navigate('/donors'),
                )}
                {this.renderStatCard(
                  'Active campaigns',
                  formatNumber(this.activeCampaigns),
                  `${formatNumber(this.campaigns.length)} total`,
                  () => navigate('/campaigns'),
                )}
                {this.renderStatCard(
                  'Total donations',
                  formatNumber(this.donations.length),
                  `${formatNumber(this.completedDonations.length)} completed`,
                )}
                {this.renderStatCard(
                  'Total raised',
                  formatAmount(this.totalRaised, 'USD'),
                  'from completed donations',
                )}
              </div>

              {/* Recent donations */}
              <div>
                <h3 class="text-base font-semibold text-gray-900 mb-3">Recent donations</h3>
                <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {this.recentDonations.length === 0 ? (
                    <div class="p-12 text-center text-sm text-gray-400">No donations yet.</div>
                  ) : (
                    <table class="w-full text-sm">
                      <thead class="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th class="col-header">Donor</th>
                          <th class="col-header">Amount</th>
                          <th class="col-header">Date</th>
                          <th class="col-header">Campaign</th>
                          <th class="col-header">Status</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-100">
                        {this.recentDonations.map((d) => (
                          <tr key={d.id} class="hover:bg-gray-50 transition-colors">
                            <td class="px-4 py-3 font-medium text-gray-900">
                              {d.donor ? (
                                <button
                                  onClick={() => navigate(`/donors/${d.donor.id}/history`)}
                                  class="text-indigo-600 hover:underline font-medium"
                                >
                                  {d.donor.firstName || d.donor.lastName
                                    ? `${d.donor.firstName ?? ''} ${d.donor.lastName ?? ''}`.trim()
                                    : (d.donor.organizationName || '—')}
                                </button>
                              ) : '—'}
                            </td>
                            <td class="px-4 py-3 text-gray-900 font-medium">
                              <button
                                onClick={() => navigate(`/donations/${d.id}/edit`)}
                                class="text-indigo-600 hover:underline font-medium"
                              >
                                {formatAmount(Number(d.amount), 'USD')}
                              </button>
                            </td>
                            <td class="px-4 py-3 text-gray-600">{formatDate(d.donationDate)}</td>
                            <td class="px-4 py-3 text-gray-600">
                              {d.campaign ? d.campaign.name : <span class="text-gray-400">—</span>}
                            </td>
                            <td class="px-4 py-3">{this.statusBadge(d.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}
