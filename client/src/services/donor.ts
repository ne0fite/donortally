import { api } from './api';

export interface DonorContact {
  id: string;
  type: string;
  label: string;
  value: string;
}

export interface Donor {
  id: string;
  donorId: string | null;
  title: string | null;
  firstName: string;
  lastName: string;
  organizationName: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  contacts: DonorContact[];
}

export interface CreateDonorPayload {
  title?: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  contacts?: { type: string; label: string; value: string }[];
}

export type UpdateDonorPayload = CreateDonorPayload;

export const donorService = {
  findAll: () => api.get<Donor[]>('/donor'),
  findOne: (id: string) => api.get<Donor>(`/donor/${id}`),
  create: (payload: CreateDonorPayload) => api.post<Donor>('/donor', payload),
  update: (id: string, payload: UpdateDonorPayload) => api.post<Donor>(`/donor/${id}`, payload),
  delete: (id: string) => api.delete(`/donor/${id}`),
  bulkImport: (donors: CreateDonorPayload[]) =>
    api.post<{ created: number; updated: number }>('/donor/import', { donors }),
  bulkDelete: (ids: string[]) => api.delete('/donor', { ids }),
};
