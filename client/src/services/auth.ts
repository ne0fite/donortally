import { api } from './api';
import { state } from '../store/auth.store';
import { navigate } from './router';

export const authService = {
  async login(email: string, password: string): Promise<void> {
    const res = await api.post<{ accessToken: string }>('/auth/login', { email, password });
    state.token = res.accessToken;
    navigate('/dashboard');
  },

  logout(): void {
    state.token = null;
    navigate('/');
  },
};
