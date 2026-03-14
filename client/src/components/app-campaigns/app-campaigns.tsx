import { Component, h, State } from '@stencil/core';
import { campaignService, Campaign } from '../../services/campaign';
import { navigate } from '../../services/router';

const PAGE_SIZE = 20;

function formatCurrency(value: string | null): string {
  if (value === null || value === '') return '—';
  const num = parseFloat(value);
  if (isNaN(num)) return '—';
  return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value + 'T00:00:00').toLocaleDateString();
}

@Component({
  tag: 'app-campaigns',
  shadow: false,
})
export class AppCampaigns {
  @State() campaigns: Campaign[] = [];
  @State() search = '';
  @State() page = 1;
  @State() loading = true;
  @State() error = '';
  @State() confirmDelete: Campaign | null = null;
  @State() deleting = false;
  @State() sortCol: 'name' | 'startDate' = 'name';
  @State() sortDir: 'asc' | 'desc' = 'asc';

  async componentWillLoad() {
    try {
      this.campaigns = await campaignService.findAll();
    } catch (err: any) {
      this.error = err.message ?? 'Failed to load campaigns';
    } finally {
      this.loading = false;
    }
  }

  private get filtered() {
    const q = this.search.toLowerCase();
    if (!q) return this.campaigns;
    return this.campaigns.filter((c) => {
      const name = c.name.toLowerCase();
      const desc = (c.description ?? '').toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }

  private get sorted() {
    const dir = this.sortDir === 'asc' ? 1 : -1;
    return [...this.filtered].sort((a, b) => {
      let av = '';
      let bv = '';
      if (this.sortCol === 'name') {
        av = a.name.toLowerCase();
        bv = b.name.toLowerCase();
      } else {
        av = a.startDate ?? '';
        bv = b.startDate ?? '';
      }
      return av < bv ? -dir : av > bv ? dir : 0;
    });
  }

  private get totalPages() {
    return Math.max(1, Math.ceil(this.filtered.length / PAGE_SIZE));
  }

  private get paginated() {
    const start = (this.page - 1) * PAGE_SIZE;
    return this.sorted.slice(start, start + PAGE_SIZE);
  }

  private onSort(col: 'name' | 'startDate') {
    if (this.sortCol === col) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortCol = col;
      this.sortDir = 'asc';
    }
    this.page = 1;
  }

  private onSearch(value: string) {
    this.search = value;
    this.page = 1;
  }

  private async handleDelete() {
    if (!this.confirmDelete) return;
    this.deleting = true;
    try {
      await campaignService.delete(this.confirmDelete.id);
      this.campaigns = this.campaigns.filter((c) => c.id !== this.confirmDelete!.id);
      this.confirmDelete = null;
    } catch (err: any) {
      this.error = err.message ?? 'Failed to delete campaign';
      this.confirmDelete = null;
    } finally {
      this.deleting = false;
    }
  }

  private sortHeader(label: string, col: 'name' | 'startDate') {
    const active = this.sortCol === col;
    return (
      <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <button
          onClick={() => this.onSort(col)}
          class="flex items-center gap-1 hover:text-gray-800 transition-colors"
        >
          {label}
          <span class={active ? 'text-indigo-600' : 'text-gray-300'}>
            {active && this.sortDir === 'desc' ? '↓' : '↑'}
          </span>
        </button>
      </th>
    );
  }

  render() {
    return (
      <div class="min-h-screen bg-gray-50">
        <div class="max-w-7xl mx-auto px-6 py-8">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-2xl font-bold text-gray-900">Campaigns</h2>
              <p class="text-sm text-gray-500 mt-1">{this.campaigns.length} total</p>
            </div>

            <div class="flex items-center gap-3">
              <input
                type="search"
                placeholder="Search by name or description…"
                value={this.search}
                onInput={(e) => this.onSearch((e.target as HTMLInputElement).value)}
                class="rounded-lg border border-gray-300 px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => navigate('/campaigns/new')}
                class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors whitespace-nowrap"
              >
                + Add campaign
              </button>
            </div>
          </div>

          <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {this.loading ? (
              <div class="p-12 text-center text-sm text-gray-400">Loading…</div>
            ) : this.error ? (
              <div class="p-12 text-center text-sm text-red-500">{this.error}</div>
            ) : this.filtered.length === 0 ? (
              <div class="p-12 text-center text-sm text-gray-400">No campaigns found.</div>
            ) : (
              <table class="w-full text-sm">
                <thead class="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {this.sortHeader('Name', 'name')}
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                    {this.sortHeader('Start date', 'startDate')}
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">End date</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Goal</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th class="px-4 py-3" />
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  {this.paginated.map((campaign) => (
                    <tr key={campaign.id} class="hover:bg-gray-50 transition-colors">
                      <td class="px-4 py-3 font-medium text-gray-900">{campaign.name}</td>
                      <td class="px-4 py-3 text-gray-600 max-w-xs truncate">
                        {campaign.description ?? '—'}
                      </td>
                      <td class="px-4 py-3 text-gray-600">{formatDate(campaign.startDate)}</td>
                      <td class="px-4 py-3 text-gray-600">{formatDate(campaign.endDate)}</td>
                      <td class="px-4 py-3 text-gray-600">{formatCurrency(campaign.goalAmount)}</td>
                      <td class="px-4 py-3">
                        <span
                          class={
                            `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ` +
                            (campaign.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500')
                          }
                        >
                          {campaign.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-right">
                        <div class="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/campaigns/${campaign.id}/edit`)}
                            class="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => (this.confirmDelete = campaign)}
                            class="px-3 py-1.5 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!this.loading && (
            <app-pager
              page={this.page}
              totalPages={this.totalPages}
              totalResults={this.filtered.length}
              onPageChange={(e: CustomEvent<number>) => (this.page = e.detail)}
            />
          )}
        </div>

        {this.confirmDelete && (
          <div class="fixed inset-0 z-50 flex items-center justify-center">
            <div
              class="absolute inset-0 bg-black/40"
              onClick={() => !this.deleting && (this.confirmDelete = null)}
            />
            <div class="relative bg-white rounded-xl shadow-lg p-6 w-full max-w-sm mx-4">
              <h3 class="text-base font-semibold text-gray-900 mb-2">Delete campaign?</h3>
              <p class="text-sm text-gray-600 mb-6">
                <span class="font-medium">{this.confirmDelete.name}</span> will be permanently deleted. This cannot be undone.
              </p>
              <div class="flex items-center justify-end gap-3">
                <button
                  onClick={() => (this.confirmDelete = null)}
                  disabled={this.deleting}
                  class="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => this.handleDelete()}
                  disabled={this.deleting}
                  class="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  {this.deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
