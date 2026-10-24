/** In-memory sample shop for the demo login only. Never written to Postgres. */

export const demoId = (n: number) =>
  `d0000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

export function isoDaysAgo(daysAgo: number, hour: number, minute: number): string {
  const ymd = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
  const [year, month, day] = ymd.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day - daysAgo, hour - 5, minute, 0)).toISOString();
}

type ProductSeed = {
  n: number;
  name: string;
  nameUrdu: string;
  partNumber: string;
  brand: string;
  category: string;
  vehicleModels: string[];
  purchasePrice: number;
  salePrice: number;
  retailPrice: number;
  quantity: number;
  minStock: number;
};

const PRODUCT_SEEDS: ProductSeed[] = [
  { n: 1, name: 'Clutch Plate Mehran Exedy', nameUrdu: 'کلچ پلیٹ مهران', partNumber: 'EX-CP-001', brand: 'Exedy', category: 'Clutch', vehicleModels: ['Mehran'], purchasePrice: 1400, salePrice: 1850, retailPrice: 2200, quantity: 8, minStock: 2 },
  { n: 2, name: 'Clutch Disc Mehran Osaka', nameUrdu: 'کلچ ڈسک مهران', partNumber: 'OS-CD-014', brand: 'Osaka', category: 'Clutch', vehicleModels: ['Mehran'], purchasePrice: 700, salePrice: 950, retailPrice: 1200, quantity: 1, minStock: 2 },
  { n: 3, name: 'Piston Ring NPR 0.50', nameUrdu: 'پسٹن رنگ 0.50', partNumber: 'NPR-050', brand: 'NPR', category: 'Piston Ring', vehicleModels: ['Mehran', 'Cultus'], purchasePrice: 1100, salePrice: 1450, retailPrice: 1750, quantity: 12, minStock: 3 },
  { n: 4, name: 'Piston Ring NPR STD', nameUrdu: 'پسٹن رنگ ایس ٹی ڈی', partNumber: 'NPR-STD', brand: 'NPR', category: 'Piston Ring', vehicleModels: ['Cultus'], purchasePrice: 1050, salePrice: 1380, retailPrice: 1650, quantity: 0, minStock: 2 },
  { n: 5, name: 'Engine Oil ZIC 4L', nameUrdu: 'انجن آئل 4 لٹر', partNumber: 'ZIC-4L', brand: 'ZIC', category: 'Engine Oil', vehicleModels: ['Mehran', 'Cultus', 'Alto'], purchasePrice: 2400, salePrice: 2850, retailPrice: 3200, quantity: 18, minStock: 4 },
  { n: 6, name: 'Oil Filter Honda', nameUrdu: 'آئل فلٹر', partNumber: 'HF-101', brand: 'Honda Oil', category: 'Oil Filter', vehicleModels: ['Mehran'], purchasePrice: 180, salePrice: 280, retailPrice: 350, quantity: 24, minStock: 6 },
  { n: 7, name: 'Air Filter Bosch', nameUrdu: 'ایئر فلٹر', partNumber: 'BOS-AF-09', brand: 'Bosch', category: 'Air Filter', vehicleModels: ['Cultus'], purchasePrice: 300, salePrice: 450, retailPrice: 550, quantity: 2, minStock: 3 },
  { n: 8, name: 'Spark Plug NGK', nameUrdu: 'سپارک پلگ', partNumber: 'NGK-BPR6', brand: 'NGK', category: 'Spark Plug', vehicleModels: ['Mehran', 'Alto'], purchasePrice: 140, salePrice: 220, retailPrice: 280, quantity: 40, minStock: 10 },
  { n: 9, name: 'Brake Shoe Mehran', nameUrdu: 'بریک شو مهران', partNumber: 'BR-MS-22', brand: 'NBK', category: 'Brake', vehicleModels: ['Mehran'], purchasePrice: 520, salePrice: 780, retailPrice: 950, quantity: 6, minStock: 2 },
  { n: 10, name: 'Disc Pad Cultus NBK', nameUrdu: 'ڈسک پیڈ کلٹس', partNumber: 'NBK-9015', brand: 'NBK', category: 'Brake', vehicleModels: ['Cultus'], purchasePrice: 1200, salePrice: 1650, retailPrice: 1980, quantity: 3, minStock: 2 },
  { n: 11, name: 'Timing Chain Kit', nameUrdu: 'ٹائمنگ چین کٹ', partNumber: 'TC-MR-7', brand: 'Genuine Suzuki', category: 'Timing Chain', vehicleModels: ['Mehran'], purchasePrice: 3300, salePrice: 4200, retailPrice: 4900, quantity: 4, minStock: 1 },
  { n: 12, name: 'Water Pump GMB', nameUrdu: 'واٹر پمپ', partNumber: 'GMB-WP-3', brand: 'GMB', category: 'Water Pump', vehicleModels: ['Mehran'], purchasePrice: 1600, salePrice: 2100, retailPrice: 2500, quantity: 5, minStock: 2 },
  { n: 13, name: 'Shock Absorber KYB', nameUrdu: 'شاک ایبزوربر', partNumber: 'KYB-F-12', brand: 'KYB', category: 'Shock Absorber', vehicleModels: ['Cultus'], purchasePrice: 2900, salePrice: 3800, retailPrice: 4500, quantity: 2, minStock: 2 },
  { n: 14, name: 'Gasket Set Taiho', nameUrdu: 'گیسکٹ سیٹ', partNumber: 'TH-GS-4', brand: 'Taiho', category: 'Gasket', vehicleModels: ['Alto'], purchasePrice: 680, salePrice: 950, retailPrice: 1150, quantity: 7, minStock: 2 },
  { n: 15, name: 'Fuel Filter Denso', nameUrdu: 'فیول فلٹر', partNumber: 'DN-FF-8', brand: 'Denso', category: 'Fuel Filter', vehicleModels: ['WagonR'], purchasePrice: 250, salePrice: 390, retailPrice: 480, quantity: 11, minStock: 3 },
  { n: 16, name: 'Fan Belt Osaka', nameUrdu: 'فین بیلٹ', partNumber: 'OS-FB-2', brand: 'Osaka', category: 'Belt', vehicleModels: ['Mehran'], purchasePrice: 210, salePrice: 320, retailPrice: 400, quantity: 9, minStock: 3 },
];

export type DemoProduct = {
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
  retailPrice: number;
  quantity: number;
  minStock: number;
  location: string | null;
  createdAt: string;
};

export const DEMO_PRODUCTS: DemoProduct[] = PRODUCT_SEEDS.map((p, i) => ({
  id: demoId(p.n),
  name: p.name,
  nameUrdu: p.nameUrdu,
  partNumber: p.partNumber,
  companyNumber: '',
  brand: p.brand,
  category: p.category,
  vehicleModels: p.vehicleModels,
  purchasePrice: p.purchasePrice,
  salePrice: p.salePrice,
  retailPrice: p.retailPrice,
  quantity: p.quantity,
  minStock: p.minStock,
  location: i % 2 === 0 ? 'Rack A' : 'Rack B',
  createdAt: isoDaysAgo(20 - i, 10, 0),
}));

export const DEMO_CUSTOMERS = [
  { id: demoId(21), name: 'Star Motors Workshop', nameUrdu: 'اسٹار موٹرز', type: 'workshop' as const, phone: '03001112233', address: 'Shop 12, Sample Auto Market', city: 'Lahore', balance: 18600, creditLimit: 50000, createdAt: isoDaysAgo(40, 9, 0) },
  { id: demoId(22), name: 'Punjab Auto Center', nameUrdu: 'پنجاب آٹو سینٹر', type: 'wholesaler' as const, phone: '03012223344', address: 'Main GT Road, Sample Block', city: 'Faisalabad', balance: 9200, creditLimit: 30000, createdAt: isoDaysAgo(32, 9, 0) },
  { id: demoId(23), name: 'Khalid Engineering', nameUrdu: 'خالد انجینئرنگ', type: 'workshop' as const, phone: '03213334455', address: 'Canal Road, Demo Town', city: 'Gujranwala', balance: 0, creditLimit: 20000, createdAt: isoDaysAgo(25, 9, 0) },
  { id: demoId(24), name: 'New City Spare House', nameUrdu: 'نیو سٹی اسپیئر ہاؤس', type: 'retail' as const, phone: '03414445566', address: 'Clock Tower, Sample Bazaar', city: 'Sialkot', balance: 4500, creditLimit: 15000, createdAt: isoDaysAgo(18, 9, 0) },
];

type Line = { product: number; qty: number };

function line(product: number, qty: number): Line {
  return { product, qty };
}

type BillSeed = {
  n: number;
  daysAgo: number;
  hour: number;
  minute: number;
  customer?: number;
  method: 'cash' | 'bank' | 'credit' | 'mixed';
  paid?: number;
  discount?: number;
  notes?: string;
  items: Line[];
};

const BILL_SEEDS: BillSeed[] = [
  { n: 31, daysAgo: 0, hour: 10, minute: 15, customer: 21, method: 'cash', items: [line(1, 2), line(6, 4)] },
  { n: 32, daysAgo: 0, hour: 12, minute: 40, method: 'cash', items: [line(5, 2), line(8, 4)] },
  { n: 33, daysAgo: 0, hour: 16, minute: 5, customer: 22, method: 'credit', paid: 0, items: [line(3, 3), line(10, 1)] },
  { n: 34, daysAgo: 1, hour: 11, minute: 20, customer: 23, method: 'cash', items: [line(11, 1), line(16, 2)] },
  { n: 35, daysAgo: 2, hour: 15, minute: 10, customer: 24, method: 'credit', paid: 0, items: [line(9, 2), line(7, 1)] },
  { n: 36, daysAgo: 3, hour: 13, minute: 45, customer: 21, method: 'credit', paid: 0, items: [line(2, 1), line(12, 1), line(6, 6)] },
  { n: 37, daysAgo: 5, hour: 10, minute: 5, method: 'cash', items: [line(8, 10), line(6, 5)] },
  { n: 38, daysAgo: 6, hour: 17, minute: 30, customer: 22, method: 'bank', items: [line(5, 4), line(15, 3)] },
  { n: 39, daysAgo: 8, hour: 11, minute: 50, customer: 23, method: 'cash', items: [line(13, 1), line(14, 2)] },
  { n: 40, daysAgo: 11, hour: 14, minute: 12, customer: 21, method: 'mixed', paid: 5000, items: [line(1, 3), line(9, 2)] },
  { n: 41, daysAgo: 14, hour: 9, minute: 40, customer: 24, method: 'credit', paid: 0, items: [line(4, 2)] },
  { n: 42, daysAgo: 18, hour: 16, minute: 18, method: 'cash', items: [line(5, 1), line(6, 2), line(8, 4)] },
];

export type DemoBillItem = {
  productId: string;
  productName: string;
  partNumber: string;
  brand?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  purchasePrice?: number;
};

export type DemoBill = {
  id: string;
  billNumber: string;
  customerId: string | null;
  customerName: string | null;
  items: DemoBillItem[];
  subtotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  paymentMethod: 'cash' | 'bank' | 'credit' | 'mixed';
  notes: string | null;
  createdBy: string;
  createdAt: string;
  deletedAt: null;
};

function buildItems(lines: Line[]): DemoBillItem[] {
  return lines.map(({ product, qty }) => {
    const p = DEMO_PRODUCTS.find((row) => row.id === demoId(product))!;
    return {
      productId: p.id,
      productName: p.name,
      partNumber: p.partNumber,
      brand: p.brand,
      quantity: qty,
      unitPrice: p.salePrice,
      total: p.salePrice * qty,
      purchasePrice: p.purchasePrice,
    };
  });
}

export function demoBills(): DemoBill[] {
  return BILL_SEEDS.map((seed, index) => {
    const items = buildItems(seed.items);
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discount = seed.discount ?? 0;
    const total = subtotal - discount;
    const customer = seed.customer
      ? DEMO_CUSTOMERS.find((c) => c.id === demoId(seed.customer!))
      : undefined;
    const paidAmount =
      seed.method === 'credit' ? seed.paid ?? 0 : seed.paid ?? total;
    return {
      id: demoId(seed.n),
      billNumber: `INV-2026-${String(index + 1).padStart(4, '0')}`,
      customerId: customer?.id ?? null,
      customerName: customer?.name ?? null,
      items,
      subtotal,
      discount,
      total,
      paidAmount,
      paymentMethod: seed.method,
      notes: seed.notes ?? null,
      createdBy: 'demo',
      createdAt: isoDaysAgo(seed.daysAgo, seed.hour, seed.minute),
      deletedAt: null,
    };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const DEMO_PAYMENTS: Array<{
  id: string;
  customerId: string;
  amount: number;
  type: 'received' | 'paid';
  method: 'cash' | 'bank';
  reference: string | null;
  notes: string | null;
  createdAt: string;
}> = [
  { id: demoId(51), customerId: demoId(21), amount: 6400, type: 'received', method: 'cash', reference: 'CASH-D-014', notes: 'Partial recovery', createdAt: isoDaysAgo(4, 15, 10) },
  { id: demoId(52), customerId: demoId(22), amount: 3000, type: 'received', method: 'bank', reference: 'HBL-9921', notes: null, createdAt: isoDaysAgo(7, 12, 0) },
  { id: demoId(53), customerId: demoId(24), amount: 1500, type: 'received', method: 'cash', reference: null, notes: 'Counter payment', createdAt: isoDaysAgo(9, 18, 20) },
];

export const DEMO_BRANDS = ['Exedy', 'Osaka', 'NPR', 'ZIC', 'Honda Oil', 'Bosch', 'NGK', 'NBK', 'Genuine Suzuki', 'GMB', 'KYB', 'Taiho', 'Denso'].map((name, i) => ({
  id: demoId(61 + i),
  name,
  createdAt: isoDaysAgo(60, 8, 0),
}));

export const DEMO_CATEGORIES = [
  ['Clutch', 'کلچ'],
  ['Piston Ring', 'پسٹن رنگ'],
  ['Engine Oil', 'انجن آئل'],
  ['Oil Filter', 'آئل فلٹر'],
  ['Air Filter', 'ایئر فلٹر'],
  ['Spark Plug', 'سپارک پلگ'],
  ['Brake', 'بریک'],
  ['Timing Chain', 'ٹائمنگ چین'],
  ['Water Pump', 'واٹر پمپ'],
  ['Shock Absorber', 'شاک ایبزوربر'],
  ['Gasket', 'گیسکٹ'],
  ['Fuel Filter', 'فیول فلٹر'],
  ['Belt', 'بیلٹ'],
].map(([name, nameUrdu], i) => ({
  id: demoId(81 + i),
  name,
  nameUrdu,
  createdAt: isoDaysAgo(60, 8, 0),
}));

export const DEMO_VEHICLES = ['Mehran', 'Cultus', 'Alto', 'WagonR'].map((name, i) => ({
  id: demoId(101 + i),
  name,
  createdAt: isoDaysAgo(60, 8, 0),
}));

export function demoLogs() {
  const bills = demoBills();
  const newest = bills.slice(0, 8);
  return newest.map((bill, i) => ({
    id: demoId(121 + i),
    action: 'bill.created',
    entityType: 'bill',
    entityId: bill.id,
    userId: demoId(200),
    userName: 'Demo Viewer',
    userUsername: 'demo',
    summary: `Completed ${bill.billNumber}${bill.customerName ? ` for ${bill.customerName}` : ''}`,
    meta: { billNumber: bill.billNumber, total: bill.total },
    createdAt: bill.createdAt,
  }));
}
