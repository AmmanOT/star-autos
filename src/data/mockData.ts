import type { AppState, Bill, Customer, Payment, Product } from '../types';

export const STORAGE_KEY = 'star-autos';

export const initialProducts: Product[] = [
  {
    id: 'p1',
    name: 'Piston Ring Set — Mehran 800cc',
    nameUrdu: 'پسٹن رنگ سیٹ — مہران 800',
    partNumber: '12140-78110',
    companyNumber: 'SUZ-12140',
    brand: 'Genuine Suzuki',
    category: 'ring',
    vehicleModels: ['Mehran', 'Alto'],
    purchasePrice: 850,
    salePrice: 1200,
    quantity: 45,
    minStock: 10,
    location: 'Rack A1',
    createdAt: '2025-06-01T10:00:00Z',
  },
  {
    id: 'p2',
    name: 'Crankshaft Bearing — Cultus K10B',
    nameUrdu: 'کرینک شافٹ بیرنگ — کلچس',
    partNumber: '12241-69G00',
    companyNumber: 'NDC-12241',
    brand: 'NDC Japan',
    category: 'bearing',
    vehicleModels: ['Cultus', 'Swift'],
    purchasePrice: 2200,
    salePrice: 3200,
    quantity: 18,
    minStock: 5,
    location: 'Rack B3',
    createdAt: '2025-06-02T10:00:00Z',
  },
  {
    id: 'p3',
    name: 'Engine Oil 10W-40 — 3L Pack',
    nameUrdu: 'انجن آئل 10W-40 — 3 لیٹر',
    partNumber: '990J0-21040',
    companyNumber: 'ZIC-10W40',
    brand: 'ZIC',
    category: 'oil',
    vehicleModels: ['Mehran', 'Cultus', 'Swift', 'Wagon R', 'Alto'],
    purchasePrice: 1450,
    salePrice: 1850,
    quantity: 120,
    minStock: 30,
    location: 'Shelf C2',
    createdAt: '2025-06-03T10:00:00Z',
  },
  {
    id: 'p4',
    name: 'Oil Filter — Swift / Cultus',
    nameUrdu: 'آئل فلٹر — سوئفٹ / کلچس',
    partNumber: '16510-85C00',
    companyNumber: 'FIL-16510',
    brand: 'Diamond',
    category: 'filter',
    vehicleModels: ['Swift', 'Cultus'],
    purchasePrice: 280,
    salePrice: 450,
    quantity: 8,
    minStock: 15,
    location: 'Rack A4',
    createdAt: '2025-06-04T10:00:00Z',
  },
  {
    id: 'p5',
    name: 'Clutch Plate — Bolan / Ravi',
    nameUrdu: 'کلچ پلیٹ — بولان / راوی',
    partNumber: '22400-73001',
    companyNumber: 'EXD-22400',
    brand: 'Exedy',
    category: 'clutch',
    vehicleModels: ['Bolan', 'Ravi'],
    purchasePrice: 3200,
    salePrice: 4500,
    quantity: 12,
    minStock: 4,
    location: 'Rack D1',
    createdAt: '2025-06-05T10:00:00Z',
  },
  {
    id: 'p6',
    name: 'Spark Plug — Iridium (Set of 4)',
    nameUrdu: 'سپارک پلگ — ایرڈیم (4 عدد)',
    partNumber: '09482-00412',
    companyNumber: 'NGK-00412',
    brand: 'NGK',
    category: 'spark_plug',
    vehicleModels: ['Swift', 'Cultus', 'Wagon R'],
    purchasePrice: 1800,
    salePrice: 2600,
    quantity: 25,
    minStock: 8,
    location: 'Rack A2',
    createdAt: '2025-06-06T10:00:00Z',
  },
];

export const initialCustomers: Customer[] = [
  {
    id: 'c1',
    name: 'Al-Habib Auto Workshop',
    nameUrdu: 'الحبیب آٹو ورکشاپ',
    type: 'workshop',
    phone: '03001234567',
    address: 'Block 5, Main Boulevard',
    city: 'Lahore',
    balance: 12500,
    creditLimit: 50000,
    createdAt: '2025-05-01T10:00:00Z',
  },
  {
    id: 'c2',
    name: 'Karachi Motors Spare Parts',
    nameUrdu: 'کراچی موٹرز سپیئر پارٹس',
    type: 'wholesaler',
    phone: '03211234567',
    address: 'Shershah Market, Plot 42',
    city: 'Karachi',
    balance: 45000,
    creditLimit: 200000,
    createdAt: '2025-05-15T10:00:00Z',
  },
  {
    id: 'c3',
    name: 'Ahmed Khan',
    nameUrdu: 'احمد خان',
    type: 'retail',
    phone: '03331234567',
    address: 'House 12, Street 4',
    city: 'Islamabad',
    balance: -2000,
    creditLimit: 10000,
    createdAt: '2025-06-01T10:00:00Z',
  },
  {
    id: 'c4',
    name: 'Suzuki Centre Faisalabad',
    nameUrdu: 'سوزوکی سینٹر فیصل آباد',
    type: 'workshop',
    phone: '03111234567',
    address: 'Jhang Road, Near Clock Tower',
    city: 'Faisalabad',
    balance: 8750,
    creditLimit: 75000,
    createdAt: '2025-06-10T10:00:00Z',
  },
];

export const initialBills: Bill[] = [
  {
    id: 'b1',
    billNumber: 'INV-2025-0042',
    customerId: 'c1',
    customerName: 'Al-Habib Auto Workshop',
    items: [
      { productId: 'p1', productName: 'Piston Ring Set — Mehran 800cc', partNumber: '12140-78110', quantity: 2, unitPrice: 1200, total: 2400 },
      { productId: 'p3', productName: 'Engine Oil 10W-40 — 3L Pack', partNumber: '990J0-21040', quantity: 5, unitPrice: 1850, total: 9250 },
    ],
    subtotal: 11650,
    discount: 150,
    total: 11500,
    paidAmount: 5000,
    paymentMethod: 'mixed',
    createdBy: 'admin',
    createdAt: '2025-08-18T14:30:00Z',
  },
  {
    id: 'b2',
    billNumber: 'INV-2025-0043',
    customerId: 'c2',
    customerName: 'Karachi Motors Spare Parts',
    items: [
      { productId: 'p2', productName: 'Crankshaft Bearing — Cultus K10B', partNumber: '12241-69G00', quantity: 10, unitPrice: 3000, total: 30000 },
      { productId: 'p5', productName: 'Clutch Plate — Bolan / Ravi', partNumber: '22400-73001', quantity: 4, unitPrice: 4200, total: 16800 },
    ],
    subtotal: 46800,
    discount: 800,
    total: 46000,
    paidAmount: 46000,
    paymentMethod: 'bank',
    createdBy: 'admin',
    createdAt: '2025-08-19T11:00:00Z',
  },
  {
    id: 'b3',
    billNumber: 'INV-2025-0044',
    items: [
      { productId: 'p6', productName: 'Spark Plug — Iridium (Set of 4)', partNumber: '09482-00412', quantity: 1, unitPrice: 2600, total: 2600 },
    ],
    subtotal: 2600,
    discount: 0,
    total: 2600,
    paidAmount: 2600,
    paymentMethod: 'cash',
    createdBy: 'employee',
    createdAt: '2025-08-20T16:45:00Z',
  },
];

export const initialPayments: Payment[] = [
  {
    id: 'pay1',
    customerId: 'c1',
    amount: 5000,
    type: 'received',
    method: 'cash',
    notes: 'Partial payment against INV-2025-0042',
    createdAt: '2025-08-18T14:30:00Z',
  },
  {
    id: 'pay2',
    customerId: 'c3',
    amount: 2000,
    type: 'paid',
    method: 'cash',
    notes: 'Refund for wrong part',
    createdAt: '2025-08-15T10:00:00Z',
  },
];

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppState;
  } catch {
    /* use defaults */
  }
  return {
    products: initialProducts,
    customers: initialCustomers,
    bills: initialBills,
    payments: initialPayments,
  };
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const VEHICLE_MODELS = [
  'Mehran', 'Alto', 'Cultus', 'Swift', 'Wagon R', 'Bolan', 'Ravi', 'Jimny', 'APV', 'Liana', 'Khyber',
];

export const PART_CATEGORIES = [
  'ring', 'piston', 'bearing', 'oil', 'filter', 'gasket', 'clutch', 'brake', 'spark_plug', 'belt', 'shock', 'other',
] as const;

export const BRANDS = [
  'Genuine Suzuki', 'NDC Japan', 'ZIC', 'Diamond', 'Exedy', 'NGK', 'GMB', 'KYB', 'NPR', 'Osaka', 'Other',
];

export const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala'];
