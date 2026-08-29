import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Bill } from '../bills/entities/bill.entity';
import { Payment } from '../payments/entities/payment.entity';

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
    const [products, customers, bills, payments] = await Promise.all([
      this.productsRepository.find(),
      this.customersRepository.find(),
      this.billsRepository.find(),
      this.paymentsRepository.find(),
    ]);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const monthlyBills = bills.filter(
      (b) => b.createdAt >= startOfMonth && b.createdAt <= endOfMonth,
    );

    const lowStock = products.filter((p) => p.quantity <= p.minStock);
    const inventoryValue = products.reduce(
      (sum, p) => sum + Number(p.purchasePrice) * p.quantity,
      0,
    );
    const receivables = customers.reduce(
      (sum, c) => sum + Math.max(0, Number(c.balance)),
      0,
    );
    const payables = customers.reduce(
      (sum, c) => sum + Math.max(0, -Number(c.balance)),
      0,
    );

    return {
      totals: {
        products: products.length,
        customers: customers.length,
        bills: bills.length,
        payments: payments.length,
      },
      inventoryValue: round2(inventoryValue),
      receivables: round2(receivables),
      payables: round2(payables),
      lowStockCount: lowStock.length,
      lowStock: lowStock.map((p) => ({
        id: p.id,
        name: p.name,
        partNumber: p.partNumber,
        quantity: p.quantity,
        minStock: p.minStock,
      })),
      monthlySales: {
        from: startOfMonth.toISOString(),
        to: endOfMonth.toISOString(),
        billCount: monthlyBills.length,
        revenue: round2(
          monthlyBills.reduce((sum, b) => sum + Number(b.total), 0),
        ),
        collected: round2(
          monthlyBills.reduce((sum, b) => sum + Number(b.paidAmount), 0),
        ),
      },
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
      bills,
    };
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
