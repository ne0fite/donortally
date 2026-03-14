import { Component, h, State } from '@stencil/core';
import * as XLSX from 'xlsx';
import { donationService, ImportDonationRowPayload } from '../../services/donation';
import { navigate } from '../../services/router';

const DONATION_FIELDS: { value: string; label: string }[] = [
  { value: 'ignore', label: '— Ignore —' },
  { value: 'donorId', label: 'Donor ID' },
  { value: 'donationId', label: 'Donation ID' },
  { value: 'amount', label: 'Amount' },
  { value: 'donationDate', label: 'Donation Date' },
  { value: 'currency', label: 'Currency' },
  { value: 'status', label: 'Status' },
  { value: 'notes', label: 'Notes' },
  { value: 'paymentType', label: 'Payment Type' },
  { value: 'gift', label: 'Gift' },
  { value: 'acknowledgedAt', label: 'Acknowledged Date' },
];

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const AUTO_MAP: Record<string, string> = {
  donorid: 'donorId',
  donor: 'donorId',
  donationid: 'donationId',
  donation: 'donationId',
  amount: 'amount',
  amt: 'amount',
  total: 'amount',
  donationdate: 'donationDate',
  date: 'donationDate',
  currency: 'currency',
  status: 'status',
  notes: 'notes',
  note: 'notes',
  memo: 'notes',
  paymenttype: 'paymentType',
  payment: 'paymentType',
  paymethod: 'paymentType',
  gift: 'gift',
  giftdescription: 'gift',
  acknowledgedat: 'acknowledgedAt',
  acknowledged: 'acknowledgedAt',
  ackdate: 'acknowledgedAt',
  thanked: 'acknowledgedAt',
};

function autoMap(columns: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const col of columns) {
    mapping[col] = AUTO_MAP[norm(col)] ?? 'ignore';
  }
  return mapping;
}

const DATE_FIELDS = new Set(['acknowledgedAt']);

function buildPayload(
  row: Record<string, string>,
  mapping: Record<string, string>,
): ImportDonationRowPayload | null {
  const result: any = {};

  for (const [col, field] of Object.entries(mapping)) {
    if (field === 'ignore') continue;
    const value = (row[col] ?? '').trim();
    if (DATE_FIELDS.has(field)) {
      result[field] = value && !isNaN(new Date(value).getTime()) ? value : null;
      continue;
    }
    if (!value) continue;
    result[field] = value;
  }

  if (!result.donorId) return null;

  if (result.amount !== undefined) {
    result.amount = parseFloat(String(result.amount).replace(/[^0-9.-]/g, '')) || 0;
  }

  return result as ImportDonationRowPayload;
}

interface FrontendRejected {
  donorId: string;
  reason: string;
}

@Component({
  tag: 'app-donation-import',
  shadow: false,
})
export class AppDonationImport {
  @State() step: 'upload' | 'mapping' | 'done' = 'upload';
  @State() columns: string[] = [];
  @State() rows: Record<string, string>[] = [];
  @State() mapping: Record<string, string> = {};
  @State() importing = false;
  @State() createdCount = 0;
  @State() updatedCount = 0;
  @State() rejected: { donorId: string; reason: string }[] = [];
  @State() error = '';

  private fileInput?: HTMLInputElement;

  private onFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.error = '';

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, {
          defval: '',
          raw: false,
        });

        if (!json.length) {
          this.error = 'The file appears to be empty.';
          return;
        }

        this.columns = Object.keys(json[0]);
        this.rows = json;
        this.mapping = autoMap(this.columns);
        this.step = 'mapping';
      } catch {
        this.error = 'Could not parse the file. Please upload a valid CSV or XLSX.';
      }
    };
    reader.readAsBinaryString(file);
  }

  private setMapping(col: string, field: string) {
    this.mapping = { ...this.mapping, [col]: field };
  }

  private async handleImport() {
    this.importing = true;
    this.error = '';

    const payloads: ImportDonationRowPayload[] = [];
    const frontendRejected: FrontendRejected[] = [];

    for (const row of this.rows) {
      const payload = buildPayload(row, this.mapping);
      if (payload) {
        payloads.push(payload);
      } else {
        const rawDonorId = Object.entries(this.mapping)
          .filter(([, f]) => f === 'donorId')
          .map(([col]) => (row[col] ?? '').trim())
          .find(Boolean) ?? '(blank)';
        frontendRejected.push({ donorId: rawDonorId, reason: 'Missing Donor ID' });
      }
    }

    if (!payloads.length) {
      this.error = 'No valid rows to import. Every row must have a Donor ID mapped.';
      this.importing = false;
      return;
    }

    try {
      const { created, updated, rejected } = await donationService.bulkImport(payloads);
      this.createdCount = created;
      this.updatedCount = updated;
      this.rejected = [...frontendRejected, ...rejected];
      this.step = 'done';
    } catch (err: any) {
      this.error = err.message ?? 'Import failed.';
    } finally {
      this.importing = false;
    }
  }

  private sampleValues(col: string): string {
    const samples = this.rows
      .map((r) => (r[col] ?? '').trim())
      .filter(Boolean)
      .slice(0, 3);
    return samples.join(', ') || '—';
  }

  private get validRowCount(): number {
    return this.rows.filter((r) => buildPayload(r, this.mapping) !== null).length;
  }

  private renderUpload() {
    return (
      <div class="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center gap-6">
        <div class="text-center">
          <p class="text-base font-medium text-gray-900 mb-1">Upload a file to import donations</p>
          <p class="text-sm text-gray-500">Supports CSV and Excel (.xlsx) files</p>
        </div>

        <input
          type="file"
          accept=".csv,.xlsx"
          ref={(el) => (this.fileInput = el as HTMLInputElement)}
          onChange={(e) => this.onFileChange(e)}
          class="hidden"
        />

        <button
          onClick={() => this.fileInput?.click()}
          class="px-6 py-3 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          Choose file…
        </button>

        {this.error && <p class="text-sm text-red-600">{this.error}</p>}
      </div>
    );
  }

  private renderMapping() {
    const usedFields = new Set(Object.values(this.mapping).filter((f) => f !== 'ignore'));
    const validRows = this.validRowCount;

    return (
      <div class="space-y-6">
        <p class="text-sm text-gray-500">
          {this.rows.length} rows detected. Map each column to a donation field, or ignore it.
        </p>

        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Import column
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Sample values
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Map to
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              {this.columns.map((col) => (
                <tr key={col} class={this.mapping[col] === 'ignore' ? 'opacity-40' : ''}>
                  <td class="px-4 py-3 font-medium text-gray-900">{col}</td>
                  <td class="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                    {this.sampleValues(col)}
                  </td>
                  <td class="px-4 py-3">
                    <select
                      onChange={(e) =>
                        this.setMapping(col, (e.target as HTMLSelectElement).value)
                      }
                      class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {DONATION_FIELDS.map((f) => {
                        const taken =
                          f.value !== 'ignore' &&
                          f.value !== this.mapping[col] &&
                          usedFields.has(f.value);
                        return (
                          <option
                            value={f.value}
                            selected={this.mapping[col] === f.value}
                            disabled={taken}
                          >
                            {f.label}
                            {taken ? ' (already mapped)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-500">
            <span class="font-medium text-gray-900">{validRows}</span> of{' '}
            {this.rows.length} rows will be submitted
            {validRows < this.rows.length && (
              <span class="text-gray-400">
                {' '}({this.rows.length - validRows} skipped — missing Donor ID)
              </span>
            )}
          </p>

          <div class="flex items-center gap-3">
            <button
              type="button"
              onClick={() => (this.step = 'upload')}
              disabled={this.importing}
              class="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => this.handleImport()}
              disabled={this.importing || validRows === 0}
              class="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {this.importing ? 'Importing…' : `Import ${validRows} donation${validRows !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>

        {this.error && <p class="text-sm text-red-600">{this.error}</p>}
      </div>
    );
  }

  private renderDone() {
    return (
      <div class="space-y-6">
        <div class="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p class="text-lg font-semibold text-gray-900 mb-1">
            {this.createdCount} created, {this.updatedCount} updated
          </p>
          {this.rejected.length > 0 && (
            <p class="text-sm text-gray-500">
              {this.rejected.length} row{this.rejected.length !== 1 ? 's' : ''} rejected
            </p>
          )}
        </div>

        {this.rejected.length > 0 && (
          <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <p class="text-sm font-semibold text-gray-700">Rejected rows</p>
            </div>
            <table class="w-full text-sm">
              <thead class="border-b border-gray-200">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Donor ID</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                {this.rejected.map((r, i) => (
                  <tr key={i}>
                    <td class="px-4 py-3 font-mono text-gray-700">{r.donorId}</td>
                    <td class="px-4 py-3 text-red-600">{r.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div class="flex justify-center">
          <button
            onClick={() => navigate('/donations')}
            class="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Back to donations
          </button>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div class="min-h-screen bg-gray-50">
        <div class="max-w-4xl mx-auto px-6 py-8">
          <div class="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <button
              onClick={() => navigate('/donations')}
              class="hover:text-gray-800 transition-colors"
            >
              Donations
            </button>
            <span>/</span>
            <span class="text-gray-900 font-medium">Import</span>
          </div>

          <h2 class="text-2xl font-bold text-gray-900 mb-8">Import donations</h2>

          {this.step === 'upload' && this.renderUpload()}
          {this.step === 'mapping' && this.renderMapping()}
          {this.step === 'done' && this.renderDone()}
        </div>
      </div>
    );
  }
}
