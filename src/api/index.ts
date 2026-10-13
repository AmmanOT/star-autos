import { apiRequest } from './client';
import { asList, queryString, type Paginated } from './list';
import type { ActivityLog, Bill, Customer, Payment, Product } from '../types';
export { usersApi } from './users';
export type { EmployeeInput } from './users';
export { asList, newIdempotencyKey, type Paginated } from './list';

export type ProductInput = Omit<Product, 'id' | 'createdAt'>;
export type CustomerInput = Omit<Customer, 'id' | 'createdAt' | 'balance'> & { balance?: number };
export type BillInput = Omit<Bill, 'id' | 'billNumber' | 'createdAt' | 'createdBy'> & {
  billNumber?: string;
  createdBy?: string;
};
export type PaymentInput = Omit<Payment, 'id' | 'createdAt'>;

export type BillListParams = {
  page?: number;
  limit?: number;
  search?: string;
  customerId?: string;
  paymentMethod?: string;
  from?: string;
  to?: string;
};

export type DashboardSummary = {
  todaySales: number;
  todayBillCount: number;
  productCount: number;
  customerCount: number;
  pendingDues: number;
  inventoryValue: number;
  billsThisMonth: number;
  lowStockCount: number;
  recentBills: Array<Pick<Bill, 'id' | 'billNumber' | 'customerName' | 'total' | 'createdAt'>>;
  lowStock: Array<Pick<Product, 'id' | 'name' | 'nameUrdu' | 'partNumber' | 'quantity' | 'minStock'>>;
};

export type ReportsOverview = {
  revenue: number;
  profit: number;
  billCount: number;
  trend: Array<{ label: string; sales: number }>;
  categories: Array<{ name: string; value: number }>;
  topProducts: Array<{ name: string; qty: number; revenue: number }>;
  topCustomers: Array<{ name: string; total: number; bills: number }>;
};

export const productsApi = {
  list: () => apiRequest<Product[]>('/products'),
  create: (body: ProductInput) => apiRequest<Product>('/products', { method: 'POST', body }),
  update: (id: string, body: Partial<ProductInput>) =>
    apiRequest<Product>(`/products/${id}`, { method: 'PATCH', body }),
  remove: (id: string) => apiRequest<void>(`/products/${id}`, { method: 'DELETE' }),
};

export const customersApi = {
  list: () => apiRequest<Customer[]>('/customers'),
  get: (id: string) => apiRequest<Customer>(`/customers/${id}`),
  ledger: (id: string) =>
    apiRequest<{
      customerId: string;
      entries: Array<{
        kind: 'bill' | 'payment';
        id: string;
        date: string;
        data: Bill | Payment;
      }>;
    }>(`/customers/${id}/ledger`),
  create: (body: CustomerInput) => apiRequest<Customer>('/customers', { method: 'POST', body }),
  update: (id: string, body: Partial<CustomerInput>) =>
    apiRequest<Customer>(`/customers/${id}`, { method: 'PATCH', body }),
  remove: (id: string) => apiRequest<void>(`/customers/${id}`, { method: 'DELETE' }),
};

export const billsApi = {
  list: async (params: BillListParams = {}): Promise<Paginated<Bill>> => {
    const data = await apiRequest<Bill[] | Paginated<Bill>>(`/bills${queryString(params)}`);
    return asList(data);
  },
  get: (id: string) => apiRequest<Bill>(`/bills/${id}`),
  create: (body: BillInput, idempotencyKey?: string) =>
    apiRequest<Bill>('/bills', {
      method: 'POST',
      body,
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
    }),
  update: (id: string, body: Partial<BillInput>) =>
    apiRequest<Bill>(`/bills/${id}`, { method: 'PATCH', body }),
  remove: (id: string) => apiRequest<void>(`/bills/${id}`, { method: 'DELETE' }),
};

export const paymentsApi = {
  list: (customerId?: string) =>
    apiRequest<Payment[]>(customerId ? `/payments?customerId=${customerId}` : '/payments'),
  create: (body: PaymentInput, idempotencyKey?: string) =>
    apiRequest<Payment>('/payments', {
      method: 'POST',
      body,
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
    }),
  remove: (id: string) => apiRequest<void>(`/payments/${id}`, { method: 'DELETE' }),
};

export const reportsApi = {
  dashboard: () => apiRequest<DashboardSummary>('/reports/dashboard'),
  overview: (from: string, to: string, period: 'monthly' | 'yearly') =>
    apiRequest<ReportsOverview>(
      `/reports/overview${queryString({ from, to, period })}`,
    ),
};

export const activityLogsApi = {
  list: (entityType?: string) =>
    apiRequest<ActivityLog[]>(
      entityType ? `/activity-logs?entityType=${entityType}&limit=200` : '/activity-logs?limit=200',
    ),
};
