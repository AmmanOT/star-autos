import { Injectable, NotFoundException } from '@nestjs/common';
import { paginated, parsePage, pkDayRange } from '../common/pagination';
import {
  DEMO_BRANDS,
  DEMO_CATEGORIES,
  DEMO_CUSTOMERS,
  DEMO_PAYMENTS,
  DEMO_PRODUCTS,
  DEMO_VEHICLES,
  demoBills,
  demoLogs,
  type DemoBill,
} from './demo-dataset';

const SKIP = Symbol('skip-demo-data');

@Injectable()
export class DemoDataService {
  resolve(method: string, path: string, query: Record<string, string | undefined>) {
    if (method !== 'GET') return SKIP;
    const route = normalizePath(path);
    if (shouldPassThrough(route)) return SKIP;

    if (route === '/products') return this.products(query);
    if (route === '/customers') return DEMO_CUSTOMERS;
    if (route === '/bills') return this.bills(query);
    if (route === '/payments') return this.payments(query.customerId);
    if (route === '/reports/dashboard') return this.dashboard();
    if (route === '/reports/overview') return this.overview(query);
    if (route === '/reports/sales') return this.sales(query);
    if (route === '/activity-logs') return this.logs(query);
    if (route === '/catalog/brands') return DEMO_BRANDS;
    if (route === '/catalog/categories') return DEMO_CATEGORIES;
    if (route === '/catalog/vehicles') return DEMO_VEHICLES;
    if (route === '/users') return [];

    const product = matchId(route, '/products/');
    if (product) return must(DEMO_PRODUCTS.find((row) => row.id === product), 'Product');

    const ledger = matchSuffix(route, '/customers/', '/ledger');
    if (ledger) return this.ledger(ledger);

    const customer = matchId(route, '/customers/');
    if (customer) return must(DEMO_CUSTOMERS.find((row) => row.id === customer), 'Customer');

    const bill = matchId(route, '/bills/');
    if (bill) return must(demoBills().find((row) => row.id === bill), 'Bill');

    return SKIP;
  }

  private products(query: Record<string, string | undefined>) {
    const search = query.search?.trim().toLowerCase();
    const category = query.category?.trim();
    const vehicle = query.vehicle?.trim();
    return DEMO_PRODUCTS.filter((product) => {
      if (category && product.category !== category) return false;
      if (vehicle && !product.vehicleModels.includes(vehicle)) return false;
      if (!search) return true;
      const hay = `${product.name} ${product.nameUrdu} ${product.partNumber} ${product.brand}`.toLowerCase();
      return search.split(/\s+/).every((word) => hay.includes(word));
    });
  }

  private bills(query: Record<string, string | undefined>) {
    let items = demoBills();
    if (query.customerId === 'walkin') {
      items = items.filter((bill) => !bill.customerId);
    } else if (query.customerId) {
      items = items.filter((bill) => bill.customerId === query.customerId);
    }
    if (query.paymentMethod) {
      items = items.filter((bill) => bill.paymentMethod === query.paymentMethod);
    }
    const { start, end } = pkDayRange(query.from, query.to);
    if (start) items = items.filter((bill) => new Date(bill.createdAt) >= start);
    if (end) items = items.filter((bill) => new Date(bill.createdAt) <= end);
    const search = query.search?.trim().toLowerCase();
    if (search) {
      items = items.filter((bill) => {
        const hay = `${bill.billNumber} ${bill.customerName ?? ''} ${JSON.stringify(bill.items)}`.toLowerCase();
        return hay.includes(search);
      });
    }
    if (query.page == null && query.limit == null) return items;
    const { page, limit, skip } = parsePage(query.page, query.limit);
    return paginated(items.slice(skip, skip + limit), items.length, page, limit);
  }

  private payments(customerId?: string) {
    return customerId
      ? DEMO_PAYMENTS.filter((payment) => payment.customerId === customerId)
      : DEMO_PAYMENTS;
  }

  private ledger(customerId: string) {
    must(DEMO_CUSTOMERS.find((row) => row.id === customerId), 'Customer');
    const bills = demoBills().filter((bill) => bill.customerId === customerId);
    const payments = DEMO_PAYMENTS.filter((payment) => payment.customerId === customerId);
    const entries = [
      ...bills.map((bill) => ({
        kind: 'bill' as const,
        id: bill.id,
        date: bill.createdAt,
        reference: bill.billNumber,
        description: `Bill ${bill.billNumber}`,
        debit: bill.total,
        credit: bill.paidAmount,
        balanceImpact: bill.total - bill.paidAmount,
        data: bill,
      })),
      ...payments.map((payment) => ({
        kind: 'payment' as const,
        id: payment.id,
        date: payment.createdAt,
        reference: payment.reference ?? payment.id,
        description: payment.type === 'received' ? 'Payment received' : 'Payment paid to customer',
        debit: payment.type === 'paid' ? payment.amount : 0,
        credit: payment.type === 'received' ? payment.amount : 0,
        balanceImpact: payment.type === 'received' ? -payment.amount : payment.amount,
        data: payment,
      })),
    ].sort((a, b) => b.date.localeCompare(a.date));
    return { customerId, entries };
  }

  private dashboard() {
    const bills = demoBills();
    const todayKey = pkDateKey(new Date());
    const monthKey = todayKey.slice(0, 7);
    const todayBills = bills.filter((bill) => pkDateKey(bill.createdAt) === todayKey);
    const monthBills = bills.filter((bill) => pkDateKey(bill.createdAt).startsWith(monthKey));
    const lowStock = DEMO_PRODUCTS.filter((p) => p.quantity <= p.minStock).sort(
      (a, b) => a.quantity - b.quantity || a.name.localeCompare(b.name),
    );
    const inventoryValue = round2(
      DEMO_PRODUCTS.reduce((sum, p) => sum + p.purchasePrice * p.quantity, 0),
    );
    const pendingDues = round2(
      DEMO_CUSTOMERS.reduce((sum, c) => sum + Math.max(0, c.balance), 0),
    );
    return {
      todaySales: round2(todayBills.reduce((sum, bill) => sum + bill.total, 0)),
      todayBillCount: todayBills.length,
      productCount: DEMO_PRODUCTS.length,
      customerCount: DEMO_CUSTOMERS.length,
      pendingDues,
      inventoryValue,
      billsThisMonth: monthBills.length,
      lowStockCount: lowStock.length,
      recentBills: bills.slice(0, 5).map((bill) => ({
        id: bill.id,
        billNumber: bill.billNumber,
        customerName: bill.customerName,
        total: bill.total,
        createdAt: bill.createdAt,
      })),
      lowStock: lowStock.map((p) => ({
        id: p.id,
        name: p.name,
        nameUrdu: p.nameUrdu,
        partNumber: p.partNumber,
        quantity: p.quantity,
        minStock: p.minStock,
      })),
      totals: { products: DEMO_PRODUCTS.length, customers: DEMO_CUSTOMERS.length },
      receivables: pendingDues,
      monthlySales: {
        from: `${monthKey}-01`,
        to: todayKey,
        billCount: monthBills.length,
        revenue: round2(monthBills.reduce((sum, bill) => sum + bill.total, 0)),
        collected: round2(monthBills.reduce((sum, bill) => sum + bill.paidAmount, 0)),
      },
    };
  }

  private overview(query: Record<string, string | undefined>) {
    const from = query.from || pkDateKey(new Date()).slice(0, 7) + '-01';
    const to = query.to || pkDateKey(new Date());
    const period = query.period === 'yearly' ? 'yearly' : 'monthly';
    const { start, end } = pkDayRange(from, to);
    const bills = demoBills().filter((bill) => inRange(bill, start, end));
    const revenue = round2(bills.reduce((sum, bill) => sum + bill.total, 0));
    const profit = round2(
      bills.reduce((sum, bill) => {
        const cost = bill.items.reduce(
          (inner, item) => inner + (item.purchasePrice ?? 0) * item.quantity,
          0,
        );
        return sum + (bill.total - cost);
      }, 0),
    );
    const categoryMap = new Map<string, number>();
    const productMap = new Map<string, { qty: number; revenue: number }>();
    const customerMap = new Map<string, { total: number; bills: number }>();
    for (const bill of bills) {
      if (bill.customerName) {
        const row = customerMap.get(bill.customerName) ?? { total: 0, bills: 0 };
        row.total += bill.total;
        row.bills += 1;
        customerMap.set(bill.customerName, row);
      }
      for (const item of bill.items) {
        const product = DEMO_PRODUCTS.find((p) => p.id === item.productId);
        const cat = product?.category || 'other';
        categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + item.total);
        const prod = productMap.get(item.productName) ?? { qty: 0, revenue: 0 };
        prod.qty += item.quantity;
        prod.revenue += item.total;
        productMap.set(item.productName, prod);
      }
    }
    const salesByLabel = new Map<string, number>();
    for (const bill of bills) {
      const key =
        period === 'yearly'
          ? pkDateKey(bill.createdAt).slice(0, 7)
          : pkDateKey(bill.createdAt).slice(8, 10);
      salesByLabel.set(key, (salesByLabel.get(key) ?? 0) + bill.total);
    }
    const trend =
      period === 'yearly'
        ? Array.from({ length: 12 }, (_, i) => {
            const key = `${from.slice(0, 4)}-${String(i + 1).padStart(2, '0')}`;
            return {
              label: new Date(Number(from.slice(0, 4)), i).toLocaleString('en', { month: 'short' }),
              sales: round2(salesByLabel.get(key) ?? 0),
            };
          })
        : Array.from(
            {
              length: new Date(Number(from.slice(0, 4)), Number(from.slice(5, 7)), 0).getDate(),
            },
            (_, i) => {
              const padded = String(i + 1).padStart(2, '0');
              return { label: String(i + 1), sales: round2(salesByLabel.get(padded) ?? 0) };
            },
          );
    return {
      revenue,
      profit,
      billCount: bills.length,
      trend,
      categories: [...categoryMap.entries()]
        .map(([name, value]) => ({ name, value: round2(value) }))
        .sort((a, b) => b.value - a.value),
      topProducts: [...productMap.entries()]
        .map(([name, row]) => ({ name, qty: row.qty, revenue: round2(row.revenue) }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5),
      topCustomers: [...customerMap.entries()]
        .map(([name, row]) => ({ name, total: round2(row.total), bills: row.bills }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5),
    };
  }

  private sales(query: Record<string, string | undefined>) {
    const { start, end } = pkDayRange(query.from, query.to);
    const bills = demoBills().filter((bill) => inRange(bill, start, end));
    const byDay = new Map<string, { date: string; billCount: number; revenue: number; collected: number }>();
    for (const bill of bills) {
      const date = pkDateKey(bill.createdAt);
      const row = byDay.get(date) ?? { date, billCount: 0, revenue: 0, collected: 0 };
      row.billCount += 1;
      row.revenue += bill.total;
      row.collected += bill.paidAmount;
      byDay.set(date, row);
    }
    return {
      from: query.from ?? null,
      to: query.to ?? null,
      billCount: bills.length,
      revenue: round2(bills.reduce((sum, bill) => sum + bill.total, 0)),
      collected: round2(bills.reduce((sum, bill) => sum + bill.paidAmount, 0)),
      daily: [...byDay.values()].map((row) => ({
        ...row,
        revenue: round2(row.revenue),
        collected: round2(row.collected),
      })),
      bills,
    };
  }

  private logs(query: Record<string, string | undefined>) {
    let items = demoLogs();
    if (query.entityType) items = items.filter((log) => log.entityType === query.entityType);
    if (query.page != null) {
      const { page, limit, skip } = parsePage(query.page, query.limit ?? '50');
      return paginated(items.slice(skip, skip + limit), items.length, page, limit);
    }
    return items.slice(0, Math.min(Number(query.limit ?? 200) || 200, 500));
  }
}

export const DEMO_DATA_SKIP = SKIP;

function normalizePath(path: string): string {
  const raw = (path || '').split('?')[0];
  const stripped = raw.replace(/^\/api/, '');
  return stripped.startsWith('/') ? stripped : `/${stripped}`;
}

function shouldPassThrough(route: string): boolean {
  return (
    route.startsWith('/auth') ||
    route.startsWith('/health') ||
    route.startsWith('/docs')
  );
}

function matchId(route: string, prefix: string): string | null {
  if (!route.startsWith(prefix)) return null;
  const rest = route.slice(prefix.length);
  if (!rest || rest.includes('/')) return null;
  return rest;
}

function matchSuffix(route: string, prefix: string, suffix: string): string | null {
  if (!route.startsWith(prefix) || !route.endsWith(suffix)) return null;
  const id = route.slice(prefix.length, route.length - suffix.length);
  return id && !id.includes('/') ? id : null;
}

function must<T>(value: T | undefined, label: string): T {
  if (!value) throw new NotFoundException(`${label} not found`);
  return value;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function pkDateKey(value: Date | string): string {
  return new Date(value).toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
}

function inRange(bill: DemoBill, start?: Date, end?: Date): boolean {
  const at = new Date(bill.createdAt);
  if (start && at < start) return false;
  if (end && at > end) return false;
  return true;
}
