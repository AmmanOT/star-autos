import { apiRequest, setToken } from './client';
import type { User } from '../types';

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export const authApi = {
  login(username: string, password: string) {
    return apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { username, password },
    });
  },

  me() {
    return apiRequest<User>('/auth/me');
  },

  changePassword(currentPassword: string, newPassword: string) {
    return apiRequest<{ success: boolean }>('/auth/password', {
      method: 'PATCH',
      body: { currentPassword, newPassword },
    });
  },

  logout() {
    setToken(null);
  },
};
