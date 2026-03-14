import { Component, h, State } from '@stencil/core';
import * as XLSX from 'xlsx';
import { donorService, CreateDonorPayload } from '../../services/donor';
import { navigate } from '../../services/router';

// Donor field options shown in each column's mapping dropdown
const DONOR_FIELDS: { value: string; label: string }[] = [
  { value: 'ignore', label: '— Ignore —' },
  { value: 'donorId', label: 'Donor ID' },
  { value: 'title', label: 'Title' },
  { value: 'firstName', label: 'First Name' },
  { value: 'lastName', label: 'Last Name' },
  { value: 'organizationName', label: 'Organization' },
  { value: 'address1', label: 'Address Line 1' },
  { value: 'address2', label: 'Address Line 2' },
  { value: 'city', label: 'City' },
  { value: 'usState', label: 'State' },
  { value: 'postalCode', label: 'Postal Code' },
  { value: 'contact:email:home', label: 'Home Email' },
  { value: 'contact:email:work', label: 'Work Email' },
  { value: 'contact:phone:home', label: 'Home Phone' },
  { value: 'contact:phone:work', label: 'Work Phone' },
  { value: 'contact:mobile:home', label: 'Home Mobile' },
  { value: 'contact:mobile:work', label: 'Work Mobile' },
];

// Normalize a string for auto-map key matching
function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const AUTO_MAP: Record<string, string> = {
  donorid: 'donorId',
  id: 'donorId',
  title: 'title',
  salutation: 'title',
  firstname: 'firstName',
  first: 'firstName',
  lastname: 'lastName',
  last: 'lastName',
  organization: 'organizationName',
  organizationname: 'organizationName',
  org: 'organizationName',
  company: 'organizationName',
  address1: 'address1',
  address: 'address1',
  streetaddress: 'address1',
  street: 'address1',
  address2: 'address2',
  apt: 'address2',
  suite: 'address2',
  city: 'city',
  state: 'usState',
  province: 'usState',
  zip: 'postalCode',
  zipcode: 'postalCode',
  postalcode: 'postalCode',
  postal: 'postalCode',
  email: 'contact:email:home',
  homeemail: 'contact:email:home',
  emailaddress: 'contact:email:home',
  workemail: 'contact:email:work',
  businessemail: 'contact:email:work',
  phone: 'contact:phone:home',
  homephone: 'contact:phone:home',
  telephone: 'contact:phone:home',
  workphone: 'contact:phone:work',
  businessphone: 'contact:phone:work',
  officephone: 'contact:phone:work',
  mobile: 'contact:mobile:home',
  cell: 'contact:mobile:home',
  cellphone: 'contact:mobile:home',
  homemobile: 'contact:mobile:home',
  workmobile: 'contact:mobile:work',
  businessmobile: 'contact:mobile:work',
};

function autoMap(columns: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const col of columns) {
    mapping[col] = AUTO_MAP[norm(col)] ?? 'ignore';
  }
  return mapping;
}

function buildPayload(
  row: Record<string, string>,
  mapping: Record<string, string>,
): CreateDonorPayload | null {
  const donor: any = {};
  const contacts: { type: string; label: string; value: string }[] = [];

  for (const [col, field] of Object.entries(mapping)) {
    if (field === 'ignore') continue;
    const value = (row[col] ?? '').trim();
    if (!value) continue;

    if (field.startsWith('contact:')) {
      const [, type, label] = field.split(':');
      contacts.push({ type, label, value });
    } else if (field === 'usState') {
      donor.state = value;
    } else {
      donor[field] = value;
    }
  }

  // at least one of firstName, lastName, or organizationName is required
  if (!donor.firstName && !donor.lastName && !donor.organizationName) return null;

  if (contacts.length) donor.contacts = contacts;
  return donor as CreateDonorPayload;
}

@Component({
  tag: 'app-donor-import',
  shadow: false,
})
export class AppDonorImport {
  @State() step: 'upload' | 'mapping' | 'done' = 'upload';
  @State() columns: string[] = [];
  @State() rows: Record<string, string>[] = [];
  @State() mapping: Record<string, string> = {};
  @State() importing = false;
  @State() createdCount = 0;
  @State() updatedCount = 0;
  @State() skippedCount = 0;
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

    const payloads: CreateDonorPayload[] = [];
    let skipped = 0;

    for (const row of this.rows) {
      const payload = buildPayload(row, this.mapping);
      if (payload) {
        payloads.push(payload);
      } else {
        skipped++;
      }
    }

    if (!payloads.length) {
      this.error = 'No valid rows to import. Every row must have at least a First Name, Last Name, or Organization Name.';
      this.importing = false;
      return;
    }

    try {
      const { created, updated } = await donorService.bulkImport(payloads);
      this.createdCount = created;
      this.updatedCount = updated;
      this.skippedCount = skipped;
      this.step = 'done';
    } catch (err: any) {
      this.error = err.message ?? 'Import failed.';
    } finally {
      this.importing = false;
    }
  }

  // Returns up to 3 sample values from a column for preview
  private sampleValues(col: string): string {
    const samples = this.rows
      .map((r) => (r[col] ?? '').trim())
      .filter(Boolean)
      .slice(0, 3);
    return samples.join(', ') || '—';
  }

  private renderUpload() {
    return (
      <div class="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center gap-6">
        <div class="text-center">
          <p class="text-base font-medium text-gray-900 mb-1">Upload a file to import donors</p>
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
    const validRows = this.rows.filter((r) => buildPayload(r, this.mapping) !== null).length;

    return (
      <div class="space-y-6">
        <p class="text-sm text-gray-500">
          {this.rows.length} rows detected. Map each column to a donor field, or ignore it.
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
                      {DONOR_FIELDS.map((f) => {
                        // Disable a field if already mapped to another column (except 'ignore')
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
            {this.rows.length} rows will be imported
            {validRows < this.rows.length && (
              <span class="text-gray-400">
                {' '}({this.rows.length - validRows} skipped — missing name (first, last, or organization))
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
              {this.importing ? 'Importing…' : `Import ${validRows} donor${validRows !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>

        {this.error && <p class="text-sm text-red-600">{this.error}</p>}
      </div>
    );
  }

  private renderDone() {
    return (
      <div class="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center gap-6 text-center">
        <div>
          <p class="text-lg font-semibold text-gray-900 mb-1">
            {this.createdCount} created, {this.updatedCount} updated
          </p>
          {this.skippedCount > 0 && (
            <p class="text-sm text-gray-500">
              {this.skippedCount} row{this.skippedCount !== 1 ? 's' : ''} skipped (missing name (first, last, or organization))
            </p>
          )}
        </div>
        <button
          onClick={() => (navigate('/donors'))}
          class="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          Back to donors
        </button>
      </div>
    );
  }

  render() {
    return (
      <div class="min-h-screen bg-gray-50">
        <div class="max-w-4xl mx-auto px-6 py-8">
          <div class="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <button
              onClick={() => (navigate('/donors'))}
              class="hover:text-gray-800 transition-colors"
            >
              Donors
            </button>
            <span>/</span>
            <span class="text-gray-900 font-medium">Import</span>
          </div>

          <h2 class="text-2xl font-bold text-gray-900 mb-8">Import donors</h2>

          {this.step === 'upload' && this.renderUpload()}
          {this.step === 'mapping' && this.renderMapping()}
          {this.step === 'done' && this.renderDone()}
        </div>
      </div>
    );
  }
}
