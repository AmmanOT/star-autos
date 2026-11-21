import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';
import { RentalUnit } from './rental-unit.entity';

@Entity('rent_payments')
export class RentPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'unit_id', type: 'uuid' })
  unitId: string;

  @ManyToOne(() => RentalUnit, (unit) => unit.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'unit_id' })
  unit: RentalUnit;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount: number;

  @Column({ name: 'paid_on', type: 'date' })
  paidOn: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
