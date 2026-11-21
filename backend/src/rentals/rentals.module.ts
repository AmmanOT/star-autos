import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RentalProperty } from './entities/rental-property.entity';
import { RentalUnit } from './entities/rental-unit.entity';
import { RentPayment } from './entities/rent-payment.entity';
import { RentalsController } from './rentals.controller';
import { RentalsService } from './rentals.service';

@Module({
  imports: [TypeOrmModule.forFeature([RentalProperty, RentalUnit, RentPayment])],
  controllers: [RentalsController],
  providers: [RentalsService],
})
export class RentalsModule {}
