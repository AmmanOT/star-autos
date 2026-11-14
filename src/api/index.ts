import { apiRequest } from './client';
export { ApiError } from './client';
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

type DashboardRaw = DashboardSummary & {
  totals?: { products?: number; customers?: number };
  receivables?: number;
  monthlySales?: { billCount?: number };
};

export function normalizeDashboard(raw: DashboardRaw | null | undefined): DashboardSummary | null {
  if (!raw) return null;
  return {
    todaySales: Number(raw.todaySales ?? 0),
    todayBillCount: Number(raw.todayBillCount ?? 0),
    productCount: Number(raw.productCount ?? raw.totals?.products ?? 0),
    customerCount: Number(raw.customerCount ?? raw.totals?.customers ?? 0),
    pendingDues: Number(raw.pendingDues ?? raw.receivables ?? 0),
    inventoryValue: Number(raw.inventoryValue ?? 0),
    billsThisMonth: Number(raw.billsThisMonth ?? raw.monthlySales?.billCount ?? 0),
    lowStockCount: Number(raw.lowStockCount ?? raw.lowStock?.length ?? 0),
    recentBills: raw.recentBills ?? [],
    lowStock: raw.lowStock ?? [],
  };
}

export type SalesReport = {
  billCount: number;
  revenue: number;
  collected?: number;
  daily?: Array<{ date: string; billCount: number; revenue: number }>;
  bills?: Bill[];
};

export const reportsApi = {
  dashboard: async () =>
    normalizeDashboard(await apiRequest<DashboardRaw>('/reports/dashboard')),
  overview: (from: string, to: string, period: 'monthly' | 'yearly') =>
    apiRequest<ReportsOverview>(
      `/reports/overview${queryString({ from, to, period })}`,
    ),
  sales: (from: string, to: string) =>
    apiRequest<SalesReport>(`/reports/sales${queryString({ from, to })}`),
};

export const activityLogsApi = {
  list: async (params: { entityType?: string; page?: number; limit?: number } = {}) => {
    const data = await apiRequest<ActivityLog[] | Paginated<ActivityLog>>(
      `/activity-logs${queryString({
        entityType: params.entityType,
        page: params.page,
        limit: params.limit ?? 50,
      })}`,
    );
    return asList(data);
  },
};
