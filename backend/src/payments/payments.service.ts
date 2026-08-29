import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Customer } from '../customers/entities/customer.entity';
import { PaymentType } from '../common/enums';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import type { AuthUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    private readonly dataSource: DataSource,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async findAll(customerId?: string): Promise<Payment[]> {
    const where = customerId ? { customerId } : {};
    return this.paymentsRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: CreatePaymentDto, user: AuthUser): Promise<Payment> {
    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    return this.dataSource.transaction(async (manager) => {
      const customer = await manager.findOne(Customer, {
        where: { id: dto.customerId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!customer) {
        throw new NotFoundException(`Customer ${dto.customerId} not found`);
      }

      const balanceBefore = Number(customer.balance);

      if (dto.type === PaymentType.RECEIVED) {
        customer.balance = balanceBefore - dto.amount;
      } else {
        customer.balance = balanceBefore + dto.amount;
      }
      await manager.save(customer);

      const payment = manager.create(Payment, {
        customerId: dto.customerId,
        amount: dto.amount,
        type: dto.type,
        method: dto.method,
        reference: dto.reference ?? null,
        notes: dto.notes ?? null,
      });

      const saved = await manager.save(payment);

      const typeLabel =
        dto.type === PaymentType.RECEIVED ? 'received from' : 'paid to';
      await this.activityLogs.write(
        {
          action: 'payment.created',
          entityType: 'payment',
          entityId: saved.id,
          user,
          summary: `${user.name} ${typeLabel} ${customer.name}: Rs. ${dto.amount.toLocaleString('en-PK')} (${dto.method})`,
          meta: {
            customerId: customer.id,
            customerName: customer.name,
            amount: dto.amount,
            type: dto.type,
            method: dto.method,
            reference: dto.reference ?? null,
            notes: dto.notes ?? null,
            balanceBefore,
            balanceAfter: Number(customer.balance),
          },
        },
        manager,
      );

      return saved;
    });
  }
}
