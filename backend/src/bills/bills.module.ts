import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bill } from './entities/bill.entity';
import { Product } from '../products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';
import { BillsController } from './bills.controller';
import { BillsService } from './bills.service';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bill, Product, Customer]),
    ActivityLogsModule,
  ],
  controllers: [BillsController],
  providers: [BillsService],
  exports: [BillsService, TypeOrmModule],
})
export class BillsModule {}
