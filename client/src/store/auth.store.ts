import { createStore } from '@stencil/store';

export interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface AuthState {
  token: string | null;
  orgName: string | null;
  currentUser: CurrentUser | null;
  googleMapsApiKey: string | null;
}

export const { state, onChange } = createStore<AuthState>({
  token: localStorage.getItem('dp_token'),
  orgName: null,
  currentUser: null,
  googleMapsApiKey: null,
});

onChange('token', (token) => {
  if (token) {
    localStorage.setItem('dp_token', token);
  } else {
    localStorage.removeItem('dp_token');
  }
});
