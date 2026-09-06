import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Bill, BillItemData } from './entities/bill.entity';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { Product } from '../products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import type { AuthUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class BillsService {
  constructor(
    @InjectRepository(Bill)
    private readonly billsRepository: Repository<Bill>,
    private readonly dataSource: DataSource,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  findAll(): Promise<Bill[]> {
    return this.billsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Bill> {
    const bill = await this.billsRepository.findOne({ where: { id } });
    if (!bill) {
      throw new NotFoundException(`Bill ${id} not found`);
    }
    return bill;
  }

  async create(dto: CreateBillDto, user: AuthUser): Promise<Bill> {
    return this.dataSource.transaction(async (manager) => {
      const items = this.normalizeItems(dto.items);
      this.assertTotals(dto, items);

      await this.applyStockDelta(manager, items, 'deduct');
      await this.applyCustomerBalanceDelta(
        manager,
        dto.customerId,
        dto.total - dto.paidAmount,
      );

      let customerName = dto.customerName ?? null;
      if (dto.customerId) {
        const customer = await manager.findOne(Customer, {
          where: { id: dto.customerId },
        });
        if (!customer) {
          throw new NotFoundException(`Customer ${dto.customerId} not found`);
        }
        customerName = customerName || customer.name;
      }

      const billNumber = await this.generateBillNumber(manager);
      const bill = manager.create(Bill, {
        billNumber,
        customerId: dto.customerId ?? null,
        customerName,
        items,
        subtotal: dto.subtotal,
        discount: dto.discount,
        total: dto.total,
        paidAmount: dto.paidAmount,
        paymentMethod: dto.paymentMethod,
        notes: dto.notes ?? null,
        createdBy: user.username,
      });

      const saved = await manager.save(bill);

      await this.activityLogs.write(
        {
          action: 'bill.created',
          entityType: 'bill',
          entityId: saved.id,
          user,
          summary: `${user.name} created bill ${billNumber} — Rs. ${dto.total.toLocaleString('en-PK')} (paid Rs. ${dto.paidAmount.toLocaleString('en-PK')})${customerName ? ` · ${customerName}` : ''}`,
          meta: {
            billNumber,
            customerId: dto.customerId ?? null,
            customerName,
            total: dto.total,
            paidAmount: dto.paidAmount,
            itemCount: items.length,
            paymentMethod: dto.paymentMethod,
          },
        },
        manager,
      );

      return saved;
    });
  }

  async update(id: string, dto: UpdateBillDto, user: AuthUser): Promise<Bill> {
    return this.dataSource.transaction(async (manager) => {
      const bill = await manager.findOne(Bill, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!bill) {
        throw new NotFoundException(`Bill ${id} not found`);
      }

      const before = {
        total: bill.total,
        paidAmount: bill.paidAmount,
        customerName: bill.customerName,
        itemCount: bill.items.length,
      };

      await this.applyStockDelta(manager, bill.items, 'restore');
      await this.applyCustomerBalanceDelta(
        manager,
        bill.customerId ?? undefined,
        -(bill.total - bill.paidAmount),
      );

      const nextItems = this.normalizeItems(dto.items ?? bill.items);
      const nextSubtotal = dto.subtotal ?? bill.subtotal;
      const nextDiscount = dto.discount ?? bill.discount;
      const nextTotal = dto.total ?? bill.total;
      const nextPaid = dto.paidAmount ?? bill.paidAmount;
      const nextCustomerId =
        dto.customerId !== undefined ? dto.customerId : bill.customerId;

      this.assertTotals(
        {
          subtotal: nextSubtotal,
          discount: nextDiscount,
          total: nextTotal,
          paidAmount: nextPaid,
          items: nextItems,
        },
        nextItems,
      );

      await this.applyStockDelta(manager, nextItems, 'deduct');
      await this.applyCustomerBalanceDelta(
        manager,
        nextCustomerId ?? undefined,
        nextTotal - nextPaid,
      );

      let customerName: string | null =
        dto.customerName !== undefined
          ? (dto.customerName ?? null)
          : bill.customerName;

      if (nextCustomerId) {
        const customer = await manager.findOne(Customer, {
          where: { id: nextCustomerId },
        });
        if (!customer) {
          throw new NotFoundException(`Customer ${nextCustomerId} not found`);
        }
        if (dto.customerName === undefined) {
          customerName = customer.name;
        }
      } else {
        customerName =
          dto.customerName !== undefined
            ? (dto.customerName ?? null)
            : null;
      }

      bill.customerId = nextCustomerId ?? null;
      bill.customerName = customerName;
      bill.items = nextItems;
      bill.subtotal = nextSubtotal;
      bill.discount = nextDiscount;
      bill.total = nextTotal;
      bill.paidAmount = nextPaid;
      bill.paymentMethod = dto.paymentMethod ?? bill.paymentMethod;
      bill.notes =
        dto.notes === undefined ? bill.notes : dto.notes ?? null;

      const saved = await manager.save(bill);

      await this.activityLogs.write(
        {
          action: 'bill.updated',
          entityType: 'bill',
          entityId: saved.id,
          user,
          summary: `${user.name} updated bill ${bill.billNumber} — total Rs. ${nextTotal.toLocaleString('en-PK')} (was Rs. ${before.total.toLocaleString('en-PK')})`,
          meta: {
            billNumber: bill.billNumber,
            before,
            after: {
              total: nextTotal,
              paidAmount: nextPaid,
              customerName,
              itemCount: nextItems.length,
            },
          },
        },
        manager,
      );

      return saved;
    });
  }

  async remove(id: string, user: AuthUser): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const bill = await manager.findOne(Bill, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!bill) {
        throw new NotFoundException(`Bill ${id} not found`);
      }

      const snapshot = {
        billNumber: bill.billNumber,
        customerId: bill.customerId,
        customerName: bill.customerName,
        total: bill.total,
        paidAmount: bill.paidAmount,
        itemCount: bill.items.length,
      };

      await this.applyStockDelta(manager, bill.items, 'restore');
      await this.applyCustomerBalanceDelta(
        manager,
        bill.customerId ?? undefined,
        -(bill.total - bill.paidAmount),
      );

      await manager.remove(bill);

      await this.activityLogs.write(
        {
          action: 'bill.deleted',
          entityType: 'bill',
          entityId: id,
          user,
          summary: `${user.name} deleted bill ${snapshot.billNumber} — Rs. ${snapshot.total.toLocaleString('en-PK')}${snapshot.customerName ? ` · ${snapshot.customerName}` : ''}`,
          meta: snapshot,
        },
        manager,
      );
    });
  }

  private normalizeItems(
    items: Array<{
      productId: string;
      productName: string;
      partNumber: string;
      brand?: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>,
  ): BillItemData[] {
    return items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      partNumber: item.partNumber,
      brand: item.brand,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
    }));
  }

  private assertTotals(
    dto: {
      subtotal: number;
      discount: number;
      total: number;
      paidAmount: number;
      items: BillItemData[];
    },
    items: BillItemData[],
  ) {
    const itemsSum = items.reduce((sum, item) => sum + item.total, 0);
    if (Math.abs(itemsSum - dto.subtotal) > 0.01) {
      throw new BadRequestException('Subtotal does not match item totals');
    }
    if (Math.abs(dto.subtotal - dto.discount - dto.total) > 0.01) {
      throw new BadRequestException('Total must equal subtotal minus discount');
    }
    if (dto.paidAmount > dto.total + 0.01) {
      throw new BadRequestException('Paid amount cannot exceed total');
    }
    for (const item of items) {
      if (Math.abs(item.quantity * item.unitPrice - item.total) > 0.01) {
        throw new BadRequestException(
          `Item total mismatch for product ${item.productId}`,
        );
      }
    }
  }

  private async applyStockDelta(
    manager: EntityManager,
    items: BillItemData[],
    mode: 'deduct' | 'restore',
  ) {
    for (const item of items) {
      const product = await manager.findOne(Product, {
        where: { id: item.productId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }

      if (mode === 'deduct') {
        if (product.quantity < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${product.name}. Available: ${product.quantity}, requested: ${item.quantity}`,
          );
        }
        product.quantity -= item.quantity;
      } else {
        product.quantity += item.quantity;
      }

      await manager.save(product);
    }
  }

  private async applyCustomerBalanceDelta(
    manager: EntityManager,
    customerId: string | undefined,
    delta: number,
  ) {
    if (!customerId || Math.abs(delta) < 0.0001) {
      return;
    }

    const customer = await manager.findOne(Customer, {
      where: { id: customerId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!customer) {
      throw new NotFoundException(`Customer ${customerId} not found`);
    }

    customer.balance = Number(customer.balance) + delta;
    await manager.save(customer);
  }

  private async generateBillNumber(manager: EntityManager): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    const latest = await manager
      .createQueryBuilder(Bill, 'bill')
      .setLock('pessimistic_write')
      .where('bill.billNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('bill.billNumber', 'DESC')
      .getOne();

    let next = 1;
    if (latest?.billNumber) {
      const parts = latest.billNumber.split('-');
      const seq = parseInt(parts[parts.length - 1], 10);
      if (!Number.isNaN(seq)) {
        next = seq + 1;
      }
    }

    return `${prefix}${String(next).padStart(4, '0')}`;
  }
}
