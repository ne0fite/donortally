import { api } from './api';

export interface DonationDonor {
  id: string;
  firstName: string;
  lastName: string;
  organizationName: string | null;
}

export interface DonationCampaign {
  id: string;
  name: string;
}

export interface Donation {
  id: string;
  amount: number;
  currency: string;
  donationDate: string;
  status: string;
  notes: string | null;
  acknowledgedAt: string | null;
  donationId: string;
  paymentType: string | null;
  gift: string | null;
  donorId: string;
  campaignId: string | null;
  donor: DonationDonor;
  campaign: DonationCampaign | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDonationPayload {
  donorId: string;
  campaignId?: string;
  amount: number;
  currency?: string;
  donationDate: string;
  status?: string;
  notes?: string;
  acknowledgedAt?: string | null;
  paymentType?: string;
  gift?: string;
}

export interface UpdateDonationPayload {
  amount?: number;
  currency?: string;
  donationDate?: string;
  status?: string;
  notes?: string;
  campaignId?: string;
  acknowledgedAt?: string | null;
  paymentType?: string;
  gift?: string;
}

export interface ImportDonationRowPayload {
  donorId: string;
  donationId?: string;
  amount?: number;
  donationDate?: string;
  currency?: string;
  status?: string;
  notes?: string;
  paymentType?: string;
  gift?: string;
  acknowledgedAt?: string | null;
}

export interface ImportDonationsResult {
  created: number;
  updated: number;
  rejected: { donorId: string; reason: string }[];
}

export const donationService = {
  findAll: () => api.get<Donation[]>('/donation'),
  findOne: (id: string) => api.get<Donation>(`/donation/${id}`),
  create: (payload: CreateDonationPayload) => api.post<Donation>('/donation', payload),
  update: (id: string, payload: UpdateDonationPayload) => api.post<Donation>(`/donation/${id}`, payload),
  delete: (id: string) => api.delete(`/donation/${id}`),
  bulkDelete: (ids: string[]) => api.delete('/donation', { ids }),
  bulkImport: (donations: ImportDonationRowPayload[]) =>
    api.post<ImportDonationsResult>('/donation/import', { donations }),
};
