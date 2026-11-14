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

export type RentalKind = 'room' | 'shop';
export type RentStatus = 'vacant' | 'paid' | 'partial' | 'unpaid';

export interface RentalUnit {
  id: string;
  propertyId: string;
  name: string;
  kind: RentalKind;
  monthlyRent: number;
  dueDay: number;
  tenantName: string | null;
  tenantPhone: string | null;
  occupied: boolean;
  openingBalance: number;
  startMonth: string;
  notes: string | null;
  createdAt: string;
}

export interface RentalProperty {
  id: string;
  name: string;
  address: string | null;
  notes: string | null;
  createdAt: string;
  units: RentalUnit[];
}

export interface RentCharge {
  id: string;
  unitId: string;
  amount: number;
  chargedOn: string;
  description: string | null;
  createdAt: string;
}

export interface RentMonthStat {
  month: string;
  collected: number;
  remaining: number;
  expected: number;
}

export interface RentCollection {
  id: string;
  unitId: string;
  period: string;
  amount: number;
  paidOn: string;
  method: 'cash' | 'bank';
  notes: string | null;
  createdAt: string;
}

export interface RentBoardRow {
  unitId: string;
  propertyId: string;
  propertyName: string;
  unitName: string;
  kind: RentalKind;
  tenantName: string | null;
  tenantPhone: string | null;
  dueDay: number;
  dueDate: string;
  monthlyRent: number;
  openingBalance: number;
  startMonth: string;
  occupied: boolean;
  broughtForward: number;
  monthRent: number;
  extras: number;
  expected: number;
  collected: number;
  remaining: number;
  extra: number;
  status: RentStatus;
  overdue: boolean;
  charges: RentCharge[];
  payments: RentCollection[];
  year: RentMonthStat[];
}

export interface RentBoard {
  month: string;
  today: string;
  totals: {
    broughtForward: number;
    monthRent: number;
    extras: number;
    expected: number;
    collected: number;
    remaining: number;
    paid: number;
    partial: number;
    unpaid: number;
    overdue: number;
    vacant: number;
  };
  rows: RentBoardRow[];
}

export interface AppState {
  products: Product[];
  customers: Customer[];
  bills: Bill[];
  payments: Payment[];
}
