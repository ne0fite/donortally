import { Component, h, Prop, State } from '@stencil/core';
import { donorService, Donor } from '../../services/donor';
import { donationService, Donation } from '../../services/donation';
import { navigate } from '../../services/router';
import * as XLSX from 'xlsx';

const PAGE_SIZE = 20;

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completed',
  pending: 'Pending',
  refunded: 'Refunded',
  failed: 'Failed',
};

const STATUS_CLASSES: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  refunded: 'bg-blue-100 text-blue-700',
  failed: 'bg-red-100 text-red-700',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString();
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

@Component({
  tag: 'app-donor-history',
  shadow: false,
})
export class AppDonorHistory {
  @Prop() donorId!: string;

  @State() donor: Donor | null = null;
  @State() donations: Donation[] = [];
  @State() search = '';
  @State() page = 1;
  @State() loading = true;
  @State() error = '';
  @State() confirmDelete: Donation | null = null;
  @State() deleting = false;
  @State() sortCol: 'date' | 'amount' | 'status' | 'acknowledged' | 'paymentType' = 'date';
  @State() sortDir: 'asc' | 'desc' = 'desc';
  @State() selectedIds: string[] = [];
  @State() bulkDeleteConfirm = false;
  @State() bulkDeleteInput = '';
  @State() bulkDeleting = false;

  async componentWillLoad() {
    try {
      [this.donor, this.donations] = await Promise.all([
        donorService.findOne(this.donorId),
        donationService.findAll({ donorId: this.donorId }),
      ]);
    } catch (err: any) {
      this.error = err.message ?? 'Failed to load donation history';
    } finally {
      this.loading = false;
    }
  }

  private get filtered() {
    const q = this.search.toLowerCase();
    if (!q) return this.donations;
    return this.donations.filter((d) => {
      return (
        d.donationId.toLowerCase().includes(q) ||
        (d.campaign?.name ?? '').toLowerCase().includes(q) ||
        (d.paymentType ?? '').toLowerCase().includes(q) ||
        (d.notes ?? '').toLowerCase().includes(q)
      );
    });
  }

  private get sorted() {
    const dir = this.sortDir === 'asc' ? 1 : -1;
    return [...this.filtered].sort((a, b) => {
      switch (this.sortCol) {
        case 'date':
          return (a.donationDate < b.donationDate ? -1 : a.donationDate > b.donationDate ? 1 : 0) * dir;
        case 'amount':
          return (a.amount - b.amount) * dir;
        case 'status':
          return (a.status < b.status ? -1 : a.status > b.status ? 1 : 0) * dir;
        case 'acknowledged': {
          const av = a.acknowledgedAt ?? '';
          const bv = b.acknowledgedAt ?? '';
          return (av < bv ? -1 : av > bv ? 1 : 0) * dir;
        }
        case 'paymentType': {
          const av = a.paymentType ?? '';
          const bv = b.paymentType ?? '';
          return (av < bv ? -1 : av > bv ? 1 : 0) * dir;
        }
        default:
          return 0;
      }
    });
  }

  private get totalPages() {
    return Math.max(1, Math.ceil(this.filtered.length / PAGE_SIZE));
  }

  private get paginated() {
    const start = (this.page - 1) * PAGE_SIZE;
    return this.sorted.slice(start, start + PAGE_SIZE);
  }

  private get allFilteredSelected() {
    return this.filtered.length > 0 && this.filtered.every((d) => this.selectedIds.includes(d.id));
  }

  private toggleSelect(id: string) {
    if (this.selectedIds.includes(id)) {
      this.selectedIds = this.selectedIds.filter((x) => x !== id);
    } else {
      this.selectedIds = [...this.selectedIds, id];
    }
  }

  private toggleSelectAll() {
    if (this.allFilteredSelected) {
      this.selectedIds = [];
    } else {
      this.selectedIds = this.filtered.map((d) => d.id);
    }
  }

  private onSort(col: typeof this.sortCol) {
    if (this.sortCol === col) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortCol = col;
      this.sortDir = col === 'date' ? 'desc' : 'asc';
    }
    this.page = 1;
  }

  private onSearch(value: string) {
    this.search = value;
    this.page = 1;
  }

  private exportToExcel() {
    const donorName = this.donor
      ? `${this.donor.firstName} ${this.donor.lastName}`.trim()
      : 'donor';
    const rows = this.donations.map((d) => ({
      'Donation Date': d.donationDate,
      'Amount': d.amount,
      'Currency': d.currency,
      'Status': STATUS_LABELS[d.status] ?? d.status,
      'Campaign': d.campaign?.name ?? '',
      'Acknowledged Date': d.acknowledgedAt ?? '',
      'Notes': d.notes ?? '',
      'Donation ID': d.donationId,
      'Payment Type': d.paymentType ?? '',
      'Gift': d.gift ?? '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Donations');
    XLSX.writeFile(wb, `donations-${donorName.replace(/\s+/g, '-').toLowerCase()}.xlsx`);
  }

  private async handleDelete() {
    if (!this.confirmDelete) return;
    this.deleting = true;
    try {
      await donationService.delete(this.confirmDelete.id);
      this.donations = this.donations.filter((d) => d.id !== this.confirmDelete!.id);
      this.selectedIds = this.selectedIds.filter((id) => id !== this.confirmDelete!.id);
      this.confirmDelete = null;
    } catch (err: any) {
      this.error = err.message ?? 'Failed to delete donation';
      this.confirmDelete = null;
    } finally {
      this.deleting = false;
    }
  }

  private onBulkAction(action: string) {
    if (action === 'delete') {
      this.bulkDeleteInput = '';
      this.bulkDeleteConfirm = true;
    }
  }

  private async handleBulkDelete() {
    if (this.bulkDeleteInput !== String(this.selectedIds.length)) return;
    this.bulkDeleting = true;
    try {
      await donationService.bulkDelete(this.selectedIds);
      const deletedSet = new Set(this.selectedIds);
      this.donations = this.donations.filter((d) => !deletedSet.has(d.id));
      this.selectedIds = [];
      this.bulkDeleteConfirm = false;
    } catch (err: any) {
      this.error = err.message ?? 'Failed to delete donations';
      this.bulkDeleteConfirm = false;
    } finally {
      this.bulkDeleting = false;
    }
  }

  private renderSortHeader(label: string, col: typeof this.sortCol) {
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
    const count = this.selectedIds.length;
    const donorName = this.donor
      ? [this.donor.firstName, this.donor.lastName].filter(Boolean).join(' ')
      : '';

    return (
      <div class="min-h-screen bg-gray-50">
        <div class="max-w-7xl mx-auto px-6 py-8">
          <div class="mb-4">
            <button
              onClick={() => navigate('/donors')}
              class="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              ← Back to Donors
            </button>
          </div>

          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-2xl font-bold text-gray-900">
                {this.loading ? 'Donation History' : `Donation History — ${donorName}`}
              </h2>
              {!this.loading && (
                <p class="text-sm text-gray-500 mt-1">{this.donations.length} total</p>
              )}
            </div>

            <div class="flex items-center gap-3">
              <input
                type="search"
                placeholder="Search by ID, campaign, payment…"
                value={this.search}
                onInput={(e) => this.onSearch((e.target as HTMLInputElement).value)}
                class="rounded-lg border border-gray-300 px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {count > 0 && (
                <select
                  onChange={(e) => {
                    const action = (e.target as HTMLSelectElement).value;
                    (e.target as HTMLSelectElement).value = '';
                    this.onBulkAction(action);
                  }}
                  class="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" disabled selected>Bulk actions ({count})</option>
                  <option value="delete">Delete selected</option>
                </select>
              )}
              <button
                onClick={() => this.exportToExcel()}
                disabled={this.donations.length === 0}
                class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors whitespace-nowrap"
              >
                Export
              </button>
              <button
                onClick={() => navigate(`/donations/new?donorId=${this.donorId}`)}
                class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors whitespace-nowrap"
              >
                + Add
              </button>
            </div>
          </div>

          {this.error && (
            <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6">
              {this.error}
            </div>
          )}

          <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {this.loading ? (
              <div class="p-12 text-center text-sm text-gray-400">Loading…</div>
            ) : this.filtered.length === 0 ? (
              <div class="p-12 text-center text-sm text-gray-400">No donations found.</div>
            ) : (
              <table class="w-full text-sm">
                <thead class="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th class="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={this.allFilteredSelected}
                        onChange={() => this.toggleSelectAll()}
                        class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Donation ID</th>
                    {this.renderSortHeader('Date', 'date')}
                    {this.renderSortHeader('Amount', 'amount')}
                    {this.renderSortHeader('Payment Type', 'paymentType')}
                    {this.renderSortHeader('Status', 'status')}
                    {this.renderSortHeader('Acknowledged', 'acknowledged')}
                    <th class="px-4 py-3" />
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  {this.paginated.map((donation) => {
                    const selected = this.selectedIds.includes(donation.id);
                    const statusClass = STATUS_CLASSES[donation.status] ?? 'bg-gray-100 text-gray-600';
                    const statusLabel = STATUS_LABELS[donation.status] ?? donation.status;
                    return (
                      <tr key={donation.id} class={`hover:bg-gray-50 transition-colors${selected ? ' bg-indigo-50' : ''}`}>
                        <td class="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => this.toggleSelect(donation.id)}
                            class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td class="px-4 py-3 text-gray-600 whitespace-nowrap">{donation.donationId}</td>
                        <td class="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(donation.donationDate)}</td>
                        <td class="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">
                          {formatAmount(donation.amount, donation.currency)}
                        </td>
                        <td class="px-4 py-3 text-gray-600 whitespace-nowrap">{donation.paymentType ?? '—'}</td>
                        <td class="px-4 py-3">
                          <span class={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td class="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(donation.acknowledgedAt)}</td>
                        <td class="px-4 py-3 text-right">
                          <div class="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate(`/donations/${donation.id}/edit`)}
                              class="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => (this.confirmDelete = donation)}
                              class="px-3 py-1.5 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
              <h3 class="text-base font-semibold text-gray-900 mb-2">Delete donation?</h3>
              <p class="text-sm text-gray-600 mb-6">
                This donation of{' '}
                <span class="font-medium">{formatAmount(this.confirmDelete.amount, this.confirmDelete.currency)}</span>{' '}
                will be permanently deleted. This cannot be undone.
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

        {this.bulkDeleteConfirm && (
          <div class="fixed inset-0 z-50 flex items-center justify-center">
            <div
              class="absolute inset-0 bg-black/40"
              onClick={() => !this.bulkDeleting && (this.bulkDeleteConfirm = false)}
            />
            <div class="relative bg-white rounded-xl shadow-lg p-6 w-full max-w-sm mx-4">
              <h3 class="text-base font-semibold text-gray-900 mb-2">Delete {count} donations?</h3>
              <p class="text-sm text-gray-600 mb-4">
                You are about to permanently delete{' '}
                <span class="font-semibold">{count} donations</span>. This cannot be undone.
              </p>
              <p class="text-sm text-gray-600 mb-2">
                Type <span class="font-mono font-semibold">{count}</span> to confirm:
              </p>
              <input
                type="text"
                value={this.bulkDeleteInput}
                onInput={(e) => (this.bulkDeleteInput = (e.target as HTMLInputElement).value)}
                placeholder={String(count)}
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div class="flex items-center justify-end gap-3">
                <button
                  onClick={() => (this.bulkDeleteConfirm = false)}
                  disabled={this.bulkDeleting}
                  class="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => this.handleBulkDelete()}
                  disabled={this.bulkDeleteInput !== String(count) || this.bulkDeleting}
                  class="px-4 py-2 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {this.bulkDeleting ? 'Deleting…' : 'Confirm delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
