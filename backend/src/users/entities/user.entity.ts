import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Permission, UserRole } from '../../common/enums';

export const DEFAULT_CUSTOMER_PASSWORD = '123456789';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 60, unique: true })
  username: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 20, default: UserRole.EMPLOYEE })
  role: UserRole;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true, unique: true })
  customerId: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  permissions: Permission[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
