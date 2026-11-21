export type UserRole = 'admin' | 'employee' | 'customer' | 'demo';

export type Permission =
  | 'dashboard'
  | 'inventory'
  | 'customers'
  | 'billing'
  | 'ledger'
  | 'rent'
  | 'reports'
  | 'activityLogs'
  | 'edit'
  | 'delete';

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
  retailPrice?: number;
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
  brand?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  purchasePrice?: number;
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
  customerId?: string;
  permissions: Permission[];
}

export interface RentPaymentLine {
  id: string;
  amount: number;
  paidOn: string;
  notes: string | null;
}

export interface RentUnitRow {
  id: string;
  propertyId: string;
  propertyName: string;
  kind: 'shop' | 'room';
  unitNo: string;
  monthlyRent: number;
  dueDay: number;
  openingBalance: number;
  startMonth: string;
  broughtForward: number;
  monthRent: number;
  collected: number;
  remaining: number;
  credit: number;
  dueDate: string;
  overdue: boolean;
  payments: RentPaymentLine[];
}

export interface RentBoard {
  month: string;
  totals: {
    collected: number;
    remaining: number;
    monthRent: number;
    broughtForward: number;
  };
  properties: { id: string; name: string }[];
  units: RentUnitRow[];
}

export interface AppState {
  products: Product[];
  customers: Customer[];
  bills: Bill[];
  payments: Payment[];
}
