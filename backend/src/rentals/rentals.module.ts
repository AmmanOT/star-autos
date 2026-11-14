import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { RentCharge } from './entities/rent-charge.entity';
import { RentCollection } from './entities/rent-collection.entity';
import { RentalProperty } from './entities/rental-property.entity';
import { RentalUnit } from './entities/rental-unit.entity';
import { RentalsController } from './rentals.controller';
import { RentalsService } from './rentals.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RentalProperty, RentalUnit, RentCollection, RentCharge]),
    ActivityLogsModule,
  ],
  controllers: [RentalsController],
  providers: [RentalsService],
  exports: [RentalsService],
})
export class RentalsModule {}
