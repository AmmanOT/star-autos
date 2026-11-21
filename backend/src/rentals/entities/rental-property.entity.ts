import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RentalUnit } from './rental-unit.entity';

@Entity('rental_properties')
export class RentalProperty {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 160 })
  name: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => RentalUnit, (unit) => unit.property)
  units: RentalUnit[];
}
