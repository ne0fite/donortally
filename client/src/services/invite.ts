import { api } from './api';

export interface InviteInfo {
  email: string;
  firstName: string;
  lastName: string;
}

export const inviteService = {
  validate: (token: string) =>
    api.get<InviteInfo>(`/auth/invite/validate?token=${encodeURIComponent(token)}`),
  activate: (token: string, password: string) =>
    api.post<{ accessToken: string }>('/auth/invite/activate', { token, password }),
  resendInvite: (userId: string) => api.post<void>(`/user/${userId}/resend-invite`, {}),
};
