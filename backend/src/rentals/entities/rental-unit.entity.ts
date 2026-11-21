import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';
import { RentalProperty } from './rental-property.entity';
import { RentPayment } from './rent-payment.entity';

export type RentalKind = 'shop' | 'room';

@Entity('rental_units')
export class RentalUnit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'property_id', type: 'uuid' })
  propertyId: string;

  @ManyToOne(() => RentalProperty, (property) => property.units, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property: RentalProperty;

  @Column({ type: 'varchar', length: 10 })
  kind: RentalKind;

  @Column({ name: 'unit_no', type: 'varchar', length: 40 })
  unitNo: string;

  @Column({
    name: 'monthly_rent',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  monthlyRent: number;

  @Column({ name: 'due_day', type: 'int', default: 1 })
  dueDay: number;

  @Column({
    name: 'opening_balance',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  openingBalance: number;

  @Column({ name: 'start_month', type: 'varchar', length: 7 })
  startMonth: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => RentPayment, (payment) => payment.unit)
  payments: RentPayment[];
}
