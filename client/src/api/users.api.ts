import api, { unwrap } from './client';
import type { User } from '../types/auth.types';

export const usersApi = {
  listUsers: () => api.get('/users').then(unwrap<User[]>),

  updateRole: (userId: string, role: string) =>
    api.patch(`/users/${userId}/role`, { role }).then(unwrap<User>),

  inviteReviewer: (email: string) =>
    api.post('/users/invite-reviewer', { email }).then(unwrap),
};
