import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'name_urdu', type: 'varchar', length: 255 })
  nameUrdu: string;

  @Column({ name: 'part_number', type: 'varchar', length: 100 })
  partNumber: string;

  @Column({ name: 'company_number', type: 'varchar', length: 100 })
  companyNumber: string;

  @Column({ type: 'varchar', length: 100 })
  brand: string;

  @Column({ type: 'varchar', length: 120 })
  category: string;

  @Column({ name: 'vehicle_models', type: 'text', array: true, default: '{}' })
  vehicleModels: string[];

  @Column({
    name: 'purchase_price',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  purchasePrice: number;

  @Column({
    name: 'sale_price',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  salePrice: number;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ name: 'min_stock', type: 'int', default: 0 })
  minStock: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  location: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
