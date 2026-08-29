import { apiRequest } from './client';
import type { Permission, User } from '../types';

export interface EmployeeInput {
  name: string;
  username: string;
  password?: string;
  phone?: string;
  permissions: Permission[];
}

export const usersApi = {
  list: () => apiRequest<User[]>('/users'),
  create: (body: EmployeeInput) =>
    apiRequest<User>('/users', { method: 'POST', body }),
  update: (id: string, body: Partial<EmployeeInput>) =>
    apiRequest<User>(`/users/${id}`, { method: 'PATCH', body }),
  remove: (id: string) => apiRequest<void>(`/users/${id}`, { method: 'DELETE' }),
};
