import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { Bill } from '../bills/entities/bill.entity';
import { Payment } from '../payments/entities/payment.entity';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, Bill, Payment]), UsersModule],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService, TypeOrmModule],
})
export class CustomersModule {}
