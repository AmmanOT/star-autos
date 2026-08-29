import type { Permission, User } from '../types';

export const PERMISSIONS: Permission[] = [
  'dashboard',
  'inventory',
  'customers',
  'billing',
  'ledger',
  'reports',
  'activityLogs',
];

export const PERMISSION_ROUTE: Record<Permission, string> = {
  dashboard: '/admin',
  inventory: '/admin/inventory',
  customers: '/admin/customers',
  billing: '/admin/billing',
  ledger: '/admin/ledger',
  reports: '/admin/reports',
  activityLogs: '/admin/activity-logs',
};

export function hasPermission(user: User | null | undefined, permission: Permission): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.permissions?.includes(permission) ?? false;
}

export function homePath(user: User | null | undefined): string {
  if (!user) return '/login';
  if (user.role === 'admin' || hasPermission(user, 'dashboard')) return '/admin';
  const first = PERMISSIONS.find((permission) => hasPermission(user, permission));
  return first ? PERMISSION_ROUTE[first] : '/admin/settings';
}
