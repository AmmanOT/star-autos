import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Bill } from '../bills/entities/bill.entity';
import { Payment } from '../payments/entities/payment.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
    @InjectRepository(Bill)
    private readonly billsRepository: Repository<Bill>,
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
  ) {}

  findAll(): Promise<Customer[]> {
    return this.customersRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customersRepository.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found`);
    }
    return customer;
  }

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const customer = this.customersRepository.create({
      ...dto,
      balance: dto.balance ?? 0,
      creditLimit: dto.creditLimit ?? 0,
    });
    return this.customersRepository.save(customer);
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);
    Object.assign(customer, dto);
    return this.customersRepository.save(customer);
  }

  async remove(id: string): Promise<void> {
    const customer = await this.findOne(id);
    await this.customersRepository.remove(customer);
  }

  async getLedger(id: string) {
    await this.findOne(id);

    const [bills, payments] = await Promise.all([
      this.billsRepository.find({
        where: { customerId: id },
        order: { createdAt: 'DESC' },
      }),
      this.paymentsRepository.find({
        where: { customerId: id },
        order: { createdAt: 'DESC' },
      }),
    ]);

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
        description:
          payment.type === 'received'
            ? 'Payment received'
            : 'Payment paid to customer',
        debit: payment.type === 'paid' ? payment.amount : 0,
        credit: payment.type === 'received' ? payment.amount : 0,
        balanceImpact:
          payment.type === 'received' ? -payment.amount : payment.amount,
        data: payment,
      })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    return { customerId: id, entries };
  }
}
