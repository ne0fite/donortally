import { api } from './api';

export interface Organization {
  id: string;
  name: string;
  slug: string;
}

export const organizationService = {
  me: () => api.get<Organization>('/organization/me'),
  update: (payload: { name: string }) => api.post<Organization>('/organization/me', payload),
};
