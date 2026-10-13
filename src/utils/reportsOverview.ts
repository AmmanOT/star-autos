import type { Bill, Product } from '../types';
import type { ReportsOverview } from '../api';
import { billProfit } from './billEffects';

export function buildOverviewFromBills(
  bills: Bill[],
  products: Product[],
  period: 'monthly' | 'yearly',
  from: string,
): ReportsOverview {
  const revenue = bills.reduce((sum, bill) => sum + bill.total, 0);
  const profit = bills.reduce((sum, bill) => sum + billProfit(bill, products), 0);

  const categoryMap = new Map<string, number>();
  const productMap = new Map<string, { name: string; qty: number; revenue: number }>();
  const customerMap = new Map<string, { name: string; total: number; bills: number }>();

  for (const bill of bills) {
    for (const item of bill.items ?? []) {
      const product = products.find((p) => p.id === item.productId);
      const cat = product?.category ?? 'other';
      categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + item.total);
      const row = productMap.get(item.productId);
      if (row) {
        row.qty += item.quantity;
        row.revenue += item.total;
      } else {
        productMap.set(item.productId, {
          name: item.productName,
          qty: item.quantity,
          revenue: item.total,
        });
      }
    }
    if (bill.customerId && bill.customerName) {
      const row = customerMap.get(bill.customerId);
      if (row) {
        row.total += bill.total;
        row.bills += 1;
      } else {
        customerMap.set(bill.customerId, {
          name: bill.customerName,
          total: bill.total,
          bills: 1,
        });
      }
    }
  }

  const year = Number(from.slice(0, 4));
  const month = Number(from.slice(5, 7));
  const trend =
    period === 'yearly'
      ? Array.from({ length: 12 }, (_, i) => ({
          label: new Date(year, i).toLocaleString('en', { month: 'short' }),
          sales: bills
            .filter((b) => new Date(b.createdAt).getFullYear() === year && new Date(b.createdAt).getMonth() === i)
            .reduce((s, b) => s + b.total, 0),
        }))
      : Array.from({ length: new Date(year, month, 0).getDate() }, (_, i) => {
          const day = i + 1;
          return {
            label: String(day),
            sales: bills
              .filter((b) => {
                const d = new Date(b.createdAt);
                return d.getDate() === day && d.getMonth() === month - 1 && d.getFullYear() === year;
              })
              .reduce((s, b) => s + b.total, 0),
          };
        });

  return {
    revenue,
    profit,
    billCount: bills.length,
    trend,
    categories: [...categoryMap.entries()].map(([name, value]) => ({ name, value })),
    topProducts: [...productMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    topCustomers: [...customerMap.values()].sort((a, b) => b.total - a.total).slice(0, 5),
  };
}
