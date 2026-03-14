import { Component, h, State } from '@stencil/core';
import { donorService, Donor } from '../../services/donor';
import { donationService, CreateDonationPayload } from '../../services/donation';
import { campaignService, Campaign } from '../../services/campaign';
import { navigate } from '../../services/router';
import * as XLSX from 'xlsx';

const PAGE_SIZE = 20;
const DONATION_STATUSES = ['completed', 'pending', 'refunded', 'failed'] as const;

@Component({
  tag: 'app-donors',
  shadow: false,
})
export class AppDonors {
  @State() donors: Donor[] = [];
  @State() search = '';
  @State() page = 1;
  @State() loading = true;
  @State() error = '';
  @State() confirmDelete: Donor | null = null;
  @State() deleting = false;
  @State() sortCol: 'name' | 'organization' | 'email' | 'phone' | 'location' = 'name';
  @State() sortDir: 'asc' | 'desc' = 'asc';
  @State() selectedIds: string[] = [];
  @State() bulkDeleteConfirm = false;
  @State() bulkDeleteInput = '';
  @State() bulkDeleting = false;

  // Merge modal
  @State() mergeDonors: Donor[] = [];
  @State() mergeDonationCounts: Record<string, number> = {};
  @State() mergeWinnerId = '';
  @State() mergeFields = { firstName: '', lastName: '', organizationName: '', address1: '', address2: '', city: '', state: '', postalCode: '' };
  @State() merging = false;
  @State() mergeError = '';

  // Add donation modal
  @State() addDonationDonor: Donor | null = null;
  @State() donCampaigns: Campaign[] = [];
  @State() donCampaignsLoaded = false;
  @State() donAmount = '';
  @State() donCurrency = 'USD';
  @State() donDate = '';
  @State() donStatus = 'completed';
  @State() donCampaignId = '';
  @State() donNotes = '';
  @State() donAcknowledgedAt = '';
  @State() donSubmitting = false;
  @State() donError = '';

  async componentWillLoad() {
    try {
      this.donors = await donorService.findAll();
    } catch (err: any) {
      this.error = err.message ?? 'Failed to load donors';
    } finally {
      this.loading = false;
    }
  }

  private get filtered() {
    const q = this.search.toLowerCase();
    if (!q) return this.donors;
    return this.donors.filter((d) => {
      const name = `${d.firstName} ${d.lastName}`.toLowerCase();
      const org = (d.organizationName ?? '').toLowerCase();
      const email = d.contacts.find((c) => c.type === 'email')?.value.toLowerCase() ?? '';
      return name.includes(q) || org.includes(q) || email.includes(q);
    });
  }

  private get sorted() {
    const dir = this.sortDir === 'asc' ? 1 : -1;
    return [...this.filtered].sort((a, b) => {
      let av = '';
      let bv = '';
      switch (this.sortCol) {
        case 'name':
          av = `${a.lastName} ${a.firstName}`.toLowerCase();
          bv = `${b.lastName} ${b.firstName}`.toLowerCase();
          break;
        case 'organization':
          av = (a.organizationName ?? '').toLowerCase();
          bv = (b.organizationName ?? '').toLowerCase();
          break;
        case 'email':
          av = (a.contacts.find((c) => c.type === 'email')?.value ?? '').toLowerCase();
          bv = (b.contacts.find((c) => c.type === 'email')?.value ?? '').toLowerCase();
          break;
        case 'phone':
          av = (a.contacts.find((c) => c.type === 'mobile' || c.type === 'phone')?.value ?? '').toLowerCase();
          bv = (b.contacts.find((c) => c.type === 'mobile' || c.type === 'phone')?.value ?? '').toLowerCase();
          break;
        case 'location':
          av = [a.city, a.state].filter(Boolean).join(' ').toLowerCase();
          bv = [b.city, b.state].filter(Boolean).join(' ').toLowerCase();
          break;
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
      this.sortDir = 'asc';
    }
    this.page = 1;
  }

  private onSearch(value: string) {
    this.search = value;
    this.page = 1;
  }

  private primaryContact(donor: Donor, type: 'email' | 'phone' | 'mobile') {
    return donor.contacts.find((c) => c.type === type)?.value ?? '—';
  }

  private exportToExcel() {
    const rows = this.donors.map((d) => ({
      'Donor ID': d.donorId ?? '',
      'Title': d.title ?? '',
      'First Name': d.firstName,
      'Last Name': d.lastName,
      'Organization': d.organizationName ?? '',
      'Email': d.contacts.find((c) => c.type === 'email')?.value ?? '',
      'Phone': d.contacts.find((c) => c.type === 'phone')?.value ?? '',
      'Mobile': d.contacts.find((c) => c.type === 'mobile')?.value ?? '',
      'Address': d.address1 ?? '',
      'Address 2': d.address2 ?? '',
      'City': d.city ?? '',
      'State': d.state ?? '',
      'Postal Code': d.postalCode ?? '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Donors');
    XLSX.writeFile(wb, 'donors.xlsx');
  }

  private async handleDelete() {
    if (!this.confirmDelete) return;
    this.deleting = true;
    try {
      await donorService.delete(this.confirmDelete.id);
      this.donors = this.donors.filter((d) => d.id !== this.confirmDelete!.id);
      this.selectedIds = this.selectedIds.filter((id) => id !== this.confirmDelete!.id);
      this.confirmDelete = null;
    } catch (err: any) {
      this.error = err.message ?? 'Failed to delete donor';
      this.confirmDelete = null;
    } finally {
      this.deleting = false;
    }
  }

  private async onBulkAction(action: string) {
    if (action === 'delete') {
      this.bulkDeleteInput = '';
      this.bulkDeleteConfirm = true;
    } else if (action === 'merge') {
      this.mergeDonors = this.donors.filter((d) => this.selectedIds.includes(d.id));
      this.mergeWinnerId = '';
      this.mergeFields = { firstName: '', lastName: '', organizationName: '', address1: '', address2: '', city: '', state: '', postalCode: '' };
      this.mergeError = '';
      this.mergeDonationCounts = {};
      try {
        const donations = await donationService.findAll();
        const counts: Record<string, number> = {};
        for (const d of donations) {
          counts[d.donorId] = (counts[d.donorId] ?? 0) + 1;
        }
        this.mergeDonationCounts = counts;
      } catch {
        // non-fatal — counts just won't show
      }
    }
  }

  private onMergeWinnerChange(donor: Donor) {
    this.mergeWinnerId = donor.id;
    this.mergeFields = {
      firstName: donor.firstName ?? '',
      lastName: donor.lastName ?? '',
      organizationName: donor.organizationName ?? '',
      address1: donor.address1 ?? '',
      address2: donor.address2 ?? '',
      city: donor.city ?? '',
      state: donor.state ?? '',
      postalCode: donor.postalCode ?? '',
    };
  }

  private async handleMerge() {
    this.merging = true;
    this.mergeError = '';
    try {
      await donorService.merge({ survivorId: this.mergeWinnerId, ids: this.selectedIds, ...this.mergeFields });
      const discardIds = this.selectedIds.filter((id) => id !== this.mergeWinnerId);
      this.donors = this.donors.filter((d) => !discardIds.includes(d.id));
      this.selectedIds = [];
      this.mergeDonors = [];
    } catch {
      this.mergeError = 'Merge failed. Please try again.';
    } finally {
      this.merging = false;
    }
  }

  private async handleBulkDelete() {
    if (this.bulkDeleteInput !== String(this.selectedIds.length)) return;
    this.bulkDeleting = true;
    try {
      await donorService.bulkDelete(this.selectedIds);
      const deletedSet = new Set(this.selectedIds);
      this.donors = this.donors.filter((d) => !deletedSet.has(d.id));
      this.selectedIds = [];
      this.bulkDeleteConfirm = false;
    } catch (err: any) {
      this.error = err.message ?? 'Failed to delete donors';
      this.bulkDeleteConfirm = false;
    } finally {
      this.bulkDeleting = false;
    }
  }

  private resetDonationForm() {
    this.donAmount = '';
    this.donCurrency = 'USD';
    this.donDate = '';
    this.donStatus = 'completed';
    this.donCampaignId = '';
    this.donNotes = '';
    this.donAcknowledgedAt = '';
    this.donError = '';
  }

  private async openAddDonation(donor: Donor) {
    this.resetDonationForm();
    this.addDonationDonor = donor;
    if (!this.donCampaignsLoaded) {
      try {
        this.donCampaigns = await campaignService.findAll();
        this.donCampaignsLoaded = true;
      } catch {
        // non-fatal — campaign dropdown will just be empty
      }
    }
  }

  private async handleSaveDonation(closeAfter: boolean) {
    if (!this.addDonationDonor) return;
    this.donError = '';
    this.donSubmitting = true;

    const payload: CreateDonationPayload = {
      donorId: this.addDonationDonor.id,
      amount: parseFloat(this.donAmount),
      currency: this.donCurrency,
      donationDate: this.donDate,
      status: this.donStatus,
    };
    if (this.donCampaignId) payload.campaignId = this.donCampaignId;
    if (this.donNotes) payload.notes = this.donNotes;
    if (this.donAcknowledgedAt) payload.acknowledgedAt = this.donAcknowledgedAt;

    try {
      await donationService.create(payload);
      if (closeAfter) {
        this.addDonationDonor = null;
      } else {
        this.resetDonationForm();
      }
    } catch (err: any) {
      this.donError = err.message ?? 'Failed to save donation';
    } finally {
      this.donSubmitting = false;
    }
  }

  render() {
    const count = this.selectedIds.length;
    const donor = this.addDonationDonor;

    return (
      <div class="min-h-screen bg-gray-50">
        <div class="max-w-7xl mx-auto px-6 py-8">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-2xl font-bold text-gray-900">Donors</h2>
              <p class="text-sm text-gray-500 mt-1">{this.donors.length} total</p>
            </div>

            <div class="flex items-center gap-3">
              <input
                type="search"
                placeholder="Search by name, org, or email…"
                value={this.search}
                onInput={(e) => this.onSearch((e.target as HTMLInputElement).value)}
                class="rounded-lg border border-gray-300 px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  {count >= 2 && <option value="merge">Merge selected ({count})</option>}
                </select>
              )}
              <button
                onClick={() => navigate('/donors/import')}
                class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                Import
              </button>
              <button
                onClick={() => this.exportToExcel()}
                disabled={this.donors.length === 0}
                class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors whitespace-nowrap"
              >
                Export
              </button>
              <button
                onClick={() => navigate('/donors/new')}
                class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors whitespace-nowrap"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Table */}
          <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {this.loading ? (
              <div class="p-12 text-center text-sm text-gray-400">Loading…</div>
            ) : this.error ? (
              <div class="p-12 text-center text-sm text-red-500">{this.error}</div>
            ) : this.filtered.length === 0 ? (
              <div class="p-12 text-center text-sm text-gray-400">No donors found.</div>
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
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Donor ID</th>
                    {(['Name', 'Organization', 'Email', 'Phone', 'Location'] as const).map((label) => {
                      const col = label.toLowerCase() as typeof this.sortCol;
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
                    })}
                    <th class="px-4 py-3" />
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  {this.paginated.map((d) => {
                    const selected = this.selectedIds.includes(d.id);
                    return (
                      <tr key={d.id} class={`hover:bg-gray-50 transition-colors${selected ? ' bg-indigo-50' : ''}`}>
                        <td class="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => this.toggleSelect(d.id)}
                            class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td class="px-4 py-3 font-mono text-gray-500 text-xs">{d.donorId ?? '—'}</td>
                        <td class="px-4 py-3 font-medium text-gray-900">
                          {d.firstName} {d.lastName}
                        </td>
                        <td class="px-4 py-3 text-gray-600">{d.organizationName ?? '—'}</td>
                        <td class="px-4 py-3 text-gray-600">{this.primaryContact(d, 'email')}</td>
                        <td class="px-4 py-3 text-gray-600">
                          {this.primaryContact(d, 'mobile') !== '—'
                            ? this.primaryContact(d, 'mobile')
                            : this.primaryContact(d, 'phone')}
                        </td>
                        <td class="px-4 py-3 text-gray-600">
                          {[d.city, d.state].filter(Boolean).join(', ') || '—'}
                        </td>
                        <td class="px-4 py-3 text-right">
                          <div class="flex items-center justify-end gap-2">
                            <button
                              onClick={() => this.openAddDonation(d)}
                              class="px-3 py-1.5 rounded-lg border border-indigo-200 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors whitespace-nowrap"
                            >
                              + Donation
                            </button>
                            <button
                              onClick={() => navigate(`/donors/${d.id}/edit`)}
                              class="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => (this.confirmDelete = d)}
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

          {/* Pagination */}
          {!this.loading && this.totalPages > 1 && (
            <app-pager
              page={this.page}
              totalPages={this.totalPages}
              totalResults={this.filtered.length}
              onPageChange={(e: CustomEvent<number>) => (this.page = e.detail)}
            />
          )}
        </div>

        {/* Add donation modal */}
        {donor && (
          <div class="fixed inset-0 z-50 flex items-center justify-center">
            <div
              class="absolute inset-0 bg-black/40"
              onClick={() => !this.donSubmitting && (this.addDonationDonor = null)}
            />
            <div class="relative bg-white rounded-xl shadow-lg w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">
              <div class="px-6 pt-6 pb-4 border-b border-gray-200 flex-shrink-0">
                <h3 class="text-base font-semibold text-gray-900">Add donation</h3>
                <p class="text-sm text-gray-500 mt-0.5">
                  {donor.firstName} {donor.lastName}
                  {donor.organizationName ? ` — ${donor.organizationName}` : ''}
                </p>
                {(donor.address1 || donor.city || donor.state) && (
                  <div class="text-xs text-gray-400 mt-1 space-y-0.5">
                    {donor.address1 && <div>{donor.address1}{donor.address2 ? `, ${donor.address2}` : ''}</div>}
                    {(donor.city || donor.state || donor.postalCode) && (
                      <div>{[donor.city, donor.state, donor.postalCode].filter(Boolean).join(', ')}</div>
                    )}
                  </div>
                )}
              </div>

              <div class="overflow-y-auto flex-1 px-6 py-5 space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Amount<span class="text-red-500 ml-0.5">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={this.donAmount}
                      onInput={(e) => (this.donAmount = (e.target as HTMLInputElement).value)}
                      placeholder="0.00"
                      class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <input
                      type="text"
                      value={this.donCurrency}
                      onInput={(e) => (this.donCurrency = (e.target as HTMLInputElement).value)}
                      class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Donation date<span class="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={this.donDate}
                    onInput={(e) => (this.donDate = (e.target as HTMLInputElement).value)}
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    onChange={(e) => (this.donStatus = (e.target as HTMLSelectElement).value)}
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {DONATION_STATUSES.map((s) => (
                      <option key={s} value={s} selected={this.donStatus === s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Campaign</label>
                  <select
                    onChange={(e) => (this.donCampaignId = (e.target as HTMLSelectElement).value)}
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="" selected={!this.donCampaignId}>None</option>
                    {this.donCampaigns.map((c) => (
                      <option key={c.id} value={c.id} selected={this.donCampaignId === c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Acknowledged date</label>
                  <input
                    type="date"
                    value={this.donAcknowledgedAt}
                    onInput={(e) => (this.donAcknowledgedAt = (e.target as HTMLInputElement).value)}
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={this.donNotes}
                    onInput={(e) => (this.donNotes = (e.target as HTMLTextAreaElement).value)}
                    rows={3}
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {this.donError && <p class="text-sm text-red-600">{this.donError}</p>}
              </div>

              <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
                <button
                  onClick={() => (this.addDonationDonor = null)}
                  disabled={this.donSubmitting}
                  class="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <div class="flex items-center gap-2">
                  <button
                    onClick={() => this.handleSaveDonation(false)}
                    disabled={this.donSubmitting || !this.donAmount || !this.donDate}
                    class="px-4 py-2 rounded-lg border border-indigo-300 text-sm font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {this.donSubmitting ? 'Saving…' : 'Save & add another'}
                  </button>
                  <button
                    onClick={() => this.handleSaveDonation(true)}
                    disabled={this.donSubmitting || !this.donAmount || !this.donDate}
                    class="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {this.donSubmitting ? 'Saving…' : 'Save & close'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Single delete confirmation modal */}
        {this.confirmDelete && (
          <div class="fixed inset-0 z-50 flex items-center justify-center">
            <div
              class="absolute inset-0 bg-black/40"
              onClick={() => !this.deleting && (this.confirmDelete = null)}
            />
            <div class="relative bg-white rounded-xl shadow-lg p-6 w-full max-w-sm mx-4">
              <h3 class="text-base font-semibold text-gray-900 mb-2">Delete donor?</h3>
              <p class="text-sm text-gray-600 mb-6">
                <span class="font-medium">{this.confirmDelete.firstName} {this.confirmDelete.lastName}</span> will be permanently deleted. This cannot be undone.
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

        {/* Merge dialog */}
        {this.mergeDonors.length > 0 && (
          <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
               onClick={() => !this.merging && (this.mergeDonors = [])}>
            <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]"
                 onClick={(e) => e.stopPropagation()}>
              <div class="px-6 py-4 border-b">
                <h2 class="text-lg font-semibold">Merge Donors ({this.mergeDonors.length} selected)</h2>
              </div>
              <div class="overflow-y-auto flex-1 px-6 py-4 space-y-6">

                {/* Step 1: Choose winner */}
                <div>
                  <p class="text-sm font-medium text-gray-700 mb-2">Choose the record to keep:</p>
                  <div class="space-y-2">
                    {this.mergeDonors.map((donor) => (
                      <label key={donor.id} class={`flex items-start gap-3 p-3 rounded border cursor-pointer ${this.mergeWinnerId === donor.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}>
                        <input type="radio" name="mergeWinner" value={donor.id}
                               checked={this.mergeWinnerId === donor.id}
                               onChange={() => this.onMergeWinnerChange(donor)}
                               class="mt-0.5" />
                        <div class="text-sm flex-1">
                          <div class="font-medium flex items-center gap-2">
                            <span>{[donor.firstName, donor.lastName].filter(Boolean).join(' ') || donor.organizationName || '(No name)'}</span>
                            {donor.donorId && <span class="text-gray-400 font-normal">{donor.donorId}</span>}
                            <span class="ml-auto text-xs font-normal text-gray-500">
                              {this.mergeDonationCounts[donor.id] ?? 0} donation{(this.mergeDonationCounts[donor.id] ?? 0) !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div class="text-gray-500 text-xs mt-0.5">
                            {[donor.address1, donor.city, donor.state, donor.postalCode].filter(Boolean).join(', ') || '(no address)'}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Step 2: Reconcile fields (shown once a winner is chosen) */}
                {this.mergeWinnerId && (
                  <div>
                    <p class="text-sm font-medium text-gray-700 mb-2">Edit the surviving record's details:</p>
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">First name</label>
                        <input class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                               value={this.mergeFields.firstName}
                               onInput={(e) => this.mergeFields = { ...this.mergeFields, firstName: (e.target as HTMLInputElement).value }} />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                        <input class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                               value={this.mergeFields.lastName}
                               onInput={(e) => this.mergeFields = { ...this.mergeFields, lastName: (e.target as HTMLInputElement).value }} />
                      </div>
                      <div class="col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Organization name</label>
                        <input class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                               value={this.mergeFields.organizationName}
                               onInput={(e) => this.mergeFields = { ...this.mergeFields, organizationName: (e.target as HTMLInputElement).value }} />
                      </div>
                      <div class="col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Address line 1</label>
                        <input class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                               value={this.mergeFields.address1}
                               onInput={(e) => this.mergeFields = { ...this.mergeFields, address1: (e.target as HTMLInputElement).value }} />
                      </div>
                      <div class="col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Address line 2</label>
                        <input class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                               value={this.mergeFields.address2}
                               onInput={(e) => this.mergeFields = { ...this.mergeFields, address2: (e.target as HTMLInputElement).value }} />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <input class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                               value={this.mergeFields.city}
                               onInput={(e) => this.mergeFields = { ...this.mergeFields, city: (e.target as HTMLInputElement).value }} />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">State</label>
                        <input class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                               value={this.mergeFields.state}
                               onInput={(e) => this.mergeFields = { ...this.mergeFields, state: (e.target as HTMLInputElement).value }} />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Postal code</label>
                        <input class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                               value={this.mergeFields.postalCode}
                               onInput={(e) => this.mergeFields = { ...this.mergeFields, postalCode: (e.target as HTMLInputElement).value }} />
                      </div>
                    </div>
                  </div>
                )}

                {this.mergeError && <p class="text-sm text-red-600">{this.mergeError}</p>}
              </div>
              <div class="px-6 py-4 border-t flex justify-end gap-3">
                <button class="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        onClick={() => (this.mergeDonors = [])} disabled={this.merging}>Cancel</button>
                <button class="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        onClick={() => this.handleMerge()}
                        disabled={!this.mergeWinnerId || this.merging}>
                  {this.merging ? 'Merging…' : 'Merge'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk delete confirmation modal */}
        {this.bulkDeleteConfirm && (
          <div class="fixed inset-0 z-50 flex items-center justify-center">
            <div
              class="absolute inset-0 bg-black/40"
              onClick={() => !this.bulkDeleting && (this.bulkDeleteConfirm = false)}
            />
            <div class="relative bg-white rounded-xl shadow-lg p-6 w-full max-w-sm mx-4">
              <h3 class="text-base font-semibold text-gray-900 mb-2">Delete {count} donors?</h3>
              <p class="text-sm text-gray-600 mb-4">
                You are about to permanently delete <span class="font-semibold">{count} donors</span> and all their contacts. This cannot be undone.
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
