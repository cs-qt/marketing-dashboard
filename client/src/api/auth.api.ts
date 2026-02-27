import api, { unwrap } from './client';
import type { User } from '../types/auth.types';

export const authApi = {
  getMe: () => api.get('/auth/me').then(unwrap<User>),

  requestMagicLink: (email: string) =>
    api.post('/auth/magic-link', { email }).then(unwrap),

  logout: () => api.post('/auth/logout').then(unwrap),

  /** Google OAuth starts with redirect — no API call needed */
  googleAuthUrl: '/api/auth/google',
};
