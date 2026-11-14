import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';
import { RentalUnit } from './rental-unit.entity';

export type RentPayMethod = 'cash' | 'bank';

@Entity('rent_collections')
@Index(['unitId', 'period'])
export class RentCollection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'unit_id', type: 'uuid' })
  unitId: string;

  @ManyToOne(() => RentalUnit, (unit) => unit.collections, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'unit_id' })
  unit: RentalUnit;

  /** Rent month this money belongs to, YYYY-MM. The cash can arrive on a later day. */
  @Column({ type: 'varchar', length: 7 })
  period: string;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount: number;

  @Column({ name: 'paid_on', type: 'date' })
  paidOn: string;

  @Column({ type: 'varchar', length: 20, default: 'cash' })
  method: RentPayMethod;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
