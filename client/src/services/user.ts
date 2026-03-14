import { api } from './api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isSuperAdmin: boolean;
  isActive: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UpdateUserPayload {
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  password?: string;
}

export const userService = {
  findAll: () => api.get<User[]>('/user'),
  findOne: (id: string) => api.get<User>(`/user/${id}`),
  me: () => api.get<User & { organization: { name: string } }>('/user/me'),
  create: (payload: CreateUserPayload) => api.post<User>('/user', payload),
  update: (id: string, payload: UpdateUserPayload) => api.post<User>(`/user/${id}`, payload),
  delete: (id: string) => api.delete(`/user/${id}`),
};
