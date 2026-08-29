import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** e.g. payment.created, bill.created, bill.updated, bill.deleted */
  @Index()
  @Column({ type: 'varchar', length: 64 })
  action: string;

  /** payment | bill */
  @Index()
  @Column({ name: 'entity_type', type: 'varchar', length: 32 })
  entityType: string;

  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  entityId: string | null;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'user_name', type: 'varchar', length: 255 })
  userName: string;

  @Column({ name: 'user_username', type: 'varchar', length: 120 })
  userUsername: string;

  /** Short human-readable description */
  @Column({ type: 'varchar', length: 500 })
  summary: string;

  @Column({ type: 'jsonb', nullable: true })
  meta: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
