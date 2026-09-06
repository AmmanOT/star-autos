export type UserRole = 'admin' | 'employee';

export type Permission =
  | 'dashboard'
  | 'inventory'
  | 'customers'
  | 'billing'
  | 'ledger'
  | 'reports'
  | 'activityLogs';

export type CustomerType = 'workshop' | 'retail' | 'wholesaler';

export interface Product {
  id: string;
  name: string;
  nameUrdu: string;
  partNumber: string;
  companyNumber: string;
  brand: string;
  category: string;
  vehicleModels: string[];
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  minStock: number;
  location?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  nameUrdu: string;
  type: CustomerType;
  phone: string;
  address: string;
  city: string;
  balance: number; // positive = they owe us, negative = we owe them
  creditLimit: number;
  createdAt: string;
}

export interface BillItem {
  productId: string;
  productName: string;
  partNumber: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Bill {
  id: string;
  billNumber: string;
  customerId?: string;
  customerName?: string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  paymentMethod: 'cash' | 'bank' | 'credit' | 'mixed';
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  customerId: string;
  amount: number;
  type: 'received' | 'paid'; // received from customer, paid to customer
  method: 'cash' | 'bank';
  reference?: string;
  notes?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  userId: string | null;
  userName: string;
  userUsername: string;
  summary: string;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  phone?: string;
  permissions: Permission[];
}

export interface AppState {
  products: Product[];
  customers: Customer[];
  bills: Bill[];
  payments: Payment[];
}
