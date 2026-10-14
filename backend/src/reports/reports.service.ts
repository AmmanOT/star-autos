import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Bill } from '../bills/entities/bill.entity';
import { Payment } from '../payments/entities/payment.entity';
import { pkDayRange } from '../common/pagination';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
    @InjectRepository(Bill)
    private readonly billsRepository: Repository<Bill>,
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
  ) {}

  async getDashboard() {
    const todayPk = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Asia/Karachi',
    });
    const [year, month] = todayPk.split('-').map(Number);
    const monthFrom = `${year}-${String(month).padStart(2, '0')}-01`;
    const monthTo = `${year}-${String(month).padStart(2, '0')}-${String(
      new Date(year, month, 0).getDate(),
    ).padStart(2, '0')}`;
    const today = pkDayRange(todayPk, todayPk);
    const monthRange = pkDayRange(monthFrom, monthTo);

    const [
      productCount,
      customerCount,
      inventoryRow,
      duesRow,
      todayRow,
      monthRow,
      lowStockCount,
      lowStock,
      recentBills,
    ] = await Promise.all([
      this.productsRepository.count(),
      this.customersRepository.count(),
      this.productsRepository
        .createQueryBuilder('p')
        .select(
          'COALESCE(SUM(CAST(p.purchase_price AS numeric) * p.quantity), 0)',
          'value',
        )
        .getRawOne<{ value: string }>(),
      this.customersRepository
        .createQueryBuilder('c')
        .select(
          'COALESCE(SUM(CASE WHEN c.balance > 0 THEN c.balance ELSE 0 END), 0)',
          'value',
        )
        .getRawOne<{ value: string }>(),
      this.billsRepository
        .createQueryBuilder('b')
        .select('COUNT(*)', 'count')
        .addSelect('COALESCE(SUM(b.total), 0)', 'revenue')
        .where('b.deleted_at IS NULL AND b.created_at >= :start AND b.created_at <= :end', {
          start: today.start,
          end: today.end,
        })
        .getRawOne<{ count: string; revenue: string }>(),
      this.billsRepository
        .createQueryBuilder('b')
        .select('COUNT(*)', 'count')
        .addSelect('COALESCE(SUM(b.total), 0)', 'revenue')
        .addSelect('COALESCE(SUM(b.paid_amount), 0)', 'collected')
        .where('b.deleted_at IS NULL AND b.created_at >= :start AND b.created_at <= :end', {
          start: monthRange.start,
          end: monthRange.end,
        })
        .getRawOne<{ count: string; revenue: string; collected: string }>(),
      this.productsRepository
        .createQueryBuilder('p')
        .where('p.quantity <= p.min_stock')
        .getCount(),
      this.productsRepository
        .createQueryBuilder('p')
        .where('p.quantity <= p.min_stock')
        .orderBy('p.quantity', 'ASC')
        .addOrderBy('p.name', 'ASC')
        .getMany(),
      this.billsRepository.find({
        select: ['id', 'billNumber', 'customerName', 'total', 'createdAt'],
        order: { createdAt: 'DESC' },
        take: 5,
      }),
    ]);

    const inventoryValue = round2(Number(inventoryRow?.value ?? 0));
    const pendingDues = round2(Number(duesRow?.value ?? 0));

    return {
      todaySales: round2(Number(todayRow?.revenue ?? 0)),
      todayBillCount: Number(todayRow?.count ?? 0),
      productCount,
      customerCount,
      pendingDues,
      inventoryValue,
      billsThisMonth: Number(monthRow?.count ?? 0),
      lowStockCount,
      recentBills,
      lowStock: lowStock.map((p) => ({
        id: p.id,
        name: p.name,
        nameUrdu: p.nameUrdu,
        partNumber: p.partNumber,
        quantity: p.quantity,
        minStock: p.minStock,
      })),
      totals: {
        products: productCount,
        customers: customerCount,
      },
      receivables: pendingDues,
      monthlySales: {
        from: monthFrom,
        to: monthTo,
        billCount: Number(monthRow?.count ?? 0),
        revenue: round2(Number(monthRow?.revenue ?? 0)),
        collected: round2(Number(monthRow?.collected ?? 0)),
      },
    };
  }

  async getOverview(from: string, to: string, period: 'monthly' | 'yearly') {
    const { start, end } = pkDayRange(from, to);
    const range = { start: start ?? new Date(0), end: end ?? new Date() };

    const [totals, trendRows, categoryRows, productRows, customerRows] =
      await Promise.all([
        this.billsRepository.query(
          `SELECT
             COUNT(*)::int AS "billCount",
             COALESCE(SUM(total), 0)::float AS revenue,
             COALESCE((
               SELECT SUM(
                 (item->>'total')::numeric
                 - COALESCE(
                     (item->>'purchasePrice')::numeric,
                     p.purchase_price,
                     0
                   ) * COALESCE((item->>'quantity')::int, 0)
               )
               FROM bills b2
               CROSS JOIN jsonb_array_elements(b2.items) item
               LEFT JOIN products p ON p.id::text = item->>'productId'
               WHERE b2.deleted_at IS NULL
                 AND b2.created_at >= $1 AND b2.created_at <= $2
             ), 0)::float AS profit
           FROM bills
           WHERE deleted_at IS NULL AND created_at >= $1 AND created_at <= $2`,
          [range.start, range.end],
        ) as Promise<Array<{ billCount: number; revenue: number; profit: number }>>,
        this.billsRepository.query(
          period === 'yearly'
            ? `SELECT to_char(created_at AT TIME ZONE 'Asia/Karachi', 'YYYY-MM') AS label,
                     COALESCE(SUM(total), 0)::float AS sales
               FROM bills
               WHERE deleted_at IS NULL AND created_at >= $1 AND created_at <= $2
               GROUP BY 1
               ORDER BY 1`
            : `SELECT to_char(created_at AT TIME ZONE 'Asia/Karachi', 'DD') AS label,
                     COALESCE(SUM(total), 0)::float AS sales
               FROM bills
               WHERE deleted_at IS NULL AND created_at >= $1 AND created_at <= $2
               GROUP BY 1
               ORDER BY 1`,
          [range.start, range.end],
        ) as Promise<Array<{ label: string; sales: number }>>,
        this.billsRepository.query(
          `SELECT COALESCE(p.category, 'other') AS name,
                  COALESCE(SUM((item->>'total')::numeric), 0)::float AS value
           FROM bills b
           CROSS JOIN jsonb_array_elements(b.items) item
           LEFT JOIN products p ON p.id::text = item->>'productId'
           WHERE b.deleted_at IS NULL AND b.created_at >= $1 AND b.created_at <= $2
           GROUP BY 1
           ORDER BY value DESC`,
          [range.start, range.end],
        ) as Promise<Array<{ name: string; value: number }>>,
        this.billsRepository.query(
          `SELECT COALESCE(item->>'productName', 'Item') AS name,
                  COALESCE(SUM((item->>'quantity')::int), 0)::int AS qty,
                  COALESCE(SUM((item->>'total')::numeric), 0)::float AS revenue
           FROM bills b
           CROSS JOIN jsonb_array_elements(b.items) item
           WHERE b.deleted_at IS NULL AND b.created_at >= $1 AND b.created_at <= $2
           GROUP BY 1
           ORDER BY revenue DESC
           LIMIT 5`,
          [range.start, range.end],
        ) as Promise<Array<{ name: string; qty: number; revenue: number }>>,
        this.billsRepository.query(
          `SELECT COALESCE(customer_name, 'Walk-in') AS name,
                  COALESCE(SUM(total), 0)::float AS total,
                  COUNT(*)::int AS bills
           FROM bills
           WHERE deleted_at IS NULL AND created_at >= $1 AND created_at <= $2
             AND customer_id IS NOT NULL
           GROUP BY customer_id, customer_name
           ORDER BY total DESC
           LIMIT 5`,
          [range.start, range.end],
        ) as Promise<Array<{ name: string; total: number; bills: number }>>,
      ]);

    const summary = totals[0] ?? { billCount: 0, revenue: 0, profit: 0 };
    const salesByLabel = new Map(
      trendRows.map((row) => [row.label, Number(row.sales)]),
    );
    const trend =
      period === 'yearly'
        ? Array.from({ length: 12 }, (_, i) => {
            const key = `${from.slice(0, 4)}-${String(i + 1).padStart(2, '0')}`;
            return {
              label: new Date(Number(from.slice(0, 4)), i).toLocaleString('en', {
                month: 'short',
              }),
              sales: round2(salesByLabel.get(key) ?? 0),
            };
          })
        : Array.from(
            {
              length: new Date(
                Number(from.slice(0, 4)),
                Number(from.slice(5, 7)),
                0,
              ).getDate(),
            },
            (_, i) => {
              const padded = String(i + 1).padStart(2, '0');
              return {
                label: String(i + 1),
                sales: round2(salesByLabel.get(padded) ?? 0),
              };
            },
          );

    return {
      revenue: round2(Number(summary.revenue ?? 0)),
      profit: round2(Number(summary.profit ?? 0)),
      billCount: Number(summary.billCount ?? 0),
      trend,
      categories: categoryRows.map((row) => ({
        name: row.name,
        value: round2(Number(row.value)),
      })),
      topProducts: productRows.map((row) => ({
        ...row,
        revenue: round2(Number(row.revenue)),
      })),
      topCustomers: customerRows.map((row) => ({
        ...row,
        total: round2(Number(row.total)),
      })),
    };
  }

  async getSales(from?: string, to?: string) {
    const where: Record<string, unknown> = {};
    if (from && to) {
      where.createdAt = Between(new Date(from), new Date(to));
    } else if (from) {
      where.createdAt = MoreThanOrEqual(new Date(from));
    } else if (to) {
      where.createdAt = LessThanOrEqual(new Date(to));
    }

    const bills = await this.billsRepository.find({
      where,
      order: { createdAt: 'ASC' },
      select: [
        'id',
        'billNumber',
        'customerName',
        'total',
        'paidAmount',
        'createdAt',
      ],
    });

    const byDay = new Map<
      string,
      { date: string; billCount: number; revenue: number; collected: number }
    >();

    for (const bill of bills) {
      const date = bill.createdAt.toISOString().slice(0, 10);
      const row = byDay.get(date) ?? {
        date,
        billCount: 0,
        revenue: 0,
        collected: 0,
      };
      row.billCount += 1;
      row.revenue += Number(bill.total);
      row.collected += Number(bill.paidAmount);
      byDay.set(date, row);
    }

    const daily = Array.from(byDay.values()).map((row) => ({
      ...row,
      revenue: round2(row.revenue),
      collected: round2(row.collected),
    }));

    return {
      from: from ?? null,
      to: to ?? null,
      billCount: bills.length,
      revenue: round2(bills.reduce((sum, b) => sum + Number(b.total), 0)),
      collected: round2(
        bills.reduce((sum, b) => sum + Number(b.paidAmount), 0),
      ),
      daily,
    };
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
