import { apiRequest } from './client';
import type { ActivityLog, Bill, Customer, Payment, Product } from '../types';
export { usersApi } from './users';
export type { EmployeeInput } from './users';

export type ProductInput = Omit<Product, 'id' | 'createdAt'>;
export type CustomerInput = Omit<Customer, 'id' | 'createdAt' | 'balance'> & { balance?: number };
export type BillInput = Omit<Bill, 'id' | 'billNumber' | 'createdAt' | 'createdBy'> & {
  billNumber?: string;
  createdBy?: string;
};
export type PaymentInput = Omit<Payment, 'id' | 'createdAt'>;

export const productsApi = {
  list: () => apiRequest<Product[]>('/products'),
  create: (body: ProductInput) => apiRequest<Product>('/products', { method: 'POST', body }),
  update: (id: string, body: Partial<ProductInput>) =>
    apiRequest<Product>(`/products/${id}`, { method: 'PATCH', body }),
  remove: (id: string) => apiRequest<void>(`/products/${id}`, { method: 'DELETE' }),
};

export const customersApi = {
  list: () => apiRequest<Customer[]>('/customers'),
  create: (body: CustomerInput) => apiRequest<Customer>('/customers', { method: 'POST', body }),
  update: (id: string, body: Partial<CustomerInput>) =>
    apiRequest<Customer>(`/customers/${id}`, { method: 'PATCH', body }),
  remove: (id: string) => apiRequest<void>(`/customers/${id}`, { method: 'DELETE' }),
};

export const billsApi = {
  list: () => apiRequest<Bill[]>('/bills'),
  create: (body: BillInput) => apiRequest<Bill>('/bills', { method: 'POST', body }),
  update: (id: string, body: Partial<BillInput>) =>
    apiRequest<Bill>(`/bills/${id}`, { method: 'PATCH', body }),
  remove: (id: string) => apiRequest<void>(`/bills/${id}`, { method: 'DELETE' }),
};

export const paymentsApi = {
  list: (customerId?: string) =>
    apiRequest<Payment[]>(customerId ? `/payments?customerId=${customerId}` : '/payments'),
  create: (body: PaymentInput) => apiRequest<Payment>('/payments', { method: 'POST', body }),
};

export const activityLogsApi = {
  list: (entityType?: string) =>
    apiRequest<ActivityLog[]>(
      entityType ? `/activity-logs?entityType=${entityType}&limit=200` : '/activity-logs?limit=200',
    ),
};
