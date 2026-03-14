import { api } from './api';

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  goalAmount: string | null;
  isActive: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignPayload {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  goalAmount?: number;
  isActive?: boolean;
}

export interface UpdateCampaignPayload {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  goalAmount?: number;
  isActive?: boolean;
}

export const campaignService = {
  findAll: () => api.get<Campaign[]>('/campaign'),
  findOne: (id: string) => api.get<Campaign>(`/campaign/${id}`),
  create: (payload: CreateCampaignPayload) => api.post<Campaign>('/campaign', payload),
  update: (id: string, payload: UpdateCampaignPayload) => api.post<Campaign>(`/campaign/${id}`, payload),
  delete: (id: string) => api.delete(`/campaign/${id}`),
};
