import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';
import { RentalProperty } from './rental-property.entity';
import { RentCollection } from './rent-collection.entity';
import { RentCharge } from './rent-charge.entity';

export type RentalUnitKind = 'room' | 'shop';

@Entity('rental_units')
export class RentalUnit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'property_id', type: 'uuid' })
  propertyId: string;

  @ManyToOne(() => RentalProperty, (property) => property.units, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'property_id' })
  property: RentalProperty;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 20, default: 'room' })
  kind: RentalUnitKind;

  @Column({
    name: 'monthly_rent',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  monthlyRent: number;

  @Column({ name: 'due_day', type: 'smallint', default: 5 })
  dueDay: number;

  /** Money already owed before monthly rent starts. */
  @Column({
    name: 'opening_balance',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  openingBalance: number;

  /** First month monthly rent is charged, YYYY-MM. */
  @Column({ name: 'start_month', type: 'varchar', length: 7, nullable: true })
  startMonth: string | null;

  @Column({ name: 'tenant_name', type: 'varchar', length: 160, nullable: true })
  tenantName: string | null;

  @Column({ name: 'tenant_phone', type: 'varchar', length: 30, nullable: true })
  tenantPhone: string | null;

  @Column({ type: 'boolean', default: true })
  occupied: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => RentCollection, (collection) => collection.unit)
  collections: RentCollection[];

  @OneToMany(() => RentCharge, (charge) => charge.unit)
  charges: RentCharge[];
}
