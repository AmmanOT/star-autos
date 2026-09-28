import type { Permission, User } from '../types';

export const PERMISSIONS: Permission[] = [
  'dashboard',
  'inventory',
  'customers',
  'billing',
  'ledger',
  'reports',
  'activityLogs',
  'edit',
  'delete',
];

export const ADMIN_ONLY_PERMISSIONS: Permission[] = [
  'dashboard',
  'reports',
  'activityLogs',
];

export const EMPLOYEE_SECTION_PERMISSIONS: Permission[] = [
  'inventory',
  'customers',
  'billing',
  'ledger',
];

export const EMPLOYEE_ACTION_PERMISSIONS: Permission[] = ['edit', 'delete'];

export const EMPLOYEE_PERMISSIONS: Permission[] = [
  ...EMPLOYEE_SECTION_PERMISSIONS,
  ...EMPLOYEE_ACTION_PERMISSIONS,
];

export const PERMISSION_ROUTE: Record<Exclude<Permission, 'edit' | 'delete'>, string> = {
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
  if (user.role === 'customer') return permission === 'ledger';
  if (ADMIN_ONLY_PERMISSIONS.includes(permission)) return false;
  return user.permissions?.includes(permission) ?? false;
}

export function homePath(user: User | null | undefined): string {
  if (!user) return '/login';
  if (user.role === 'customer') return '/admin/ledger';
  if (user.role === 'admin' || hasPermission(user, 'dashboard')) return '/admin';
  const first = EMPLOYEE_SECTION_PERMISSIONS.find((permission) => hasPermission(user, permission));
  return first ? PERMISSION_ROUTE[first] : '/admin/settings';
}
