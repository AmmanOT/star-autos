import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS idempotency_keys (
    key varchar(80) PRIMARY KEY,
    body jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_bills_created_at ON bills (created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_bills_customer_id ON bills (customer_id)`,
  `CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments (customer_id)`,
  `CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments (created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_products_part_number ON products (part_number)`,
  `CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers (phone)`,
  `ALTER TABLE bills ADD COLUMN IF NOT EXISTS deleted_at timestamptz`,
  `CREATE INDEX IF NOT EXISTS idx_bills_deleted_at ON bills (deleted_at)`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS retail_price numeric(12,2) NOT NULL DEFAULT 0`,
  `CREATE TABLE IF NOT EXISTS rental_properties (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(160) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS rental_units (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id uuid NOT NULL REFERENCES rental_properties(id) ON DELETE CASCADE,
    kind varchar(10) NOT NULL,
    unit_no varchar(40) NOT NULL,
    monthly_rent numeric(14,2) NOT NULL DEFAULT 0,
    due_day int NOT NULL DEFAULT 1,
    opening_balance numeric(14,2) NOT NULL DEFAULT 0,
    start_month varchar(7) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_rental_units_property_id ON rental_units (property_id)`,
  `CREATE TABLE IF NOT EXISTS rent_payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id uuid NOT NULL REFERENCES rental_units(id) ON DELETE CASCADE,
    amount numeric(14,2) NOT NULL,
    paid_on date NOT NULL,
    notes varchar(255),
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_rent_payments_unit_id ON rent_payments (unit_id, paid_on)`,
];

const BACKFILL_PURCHASE_PRICE = `UPDATE bills b
   SET items = sub.items
   FROM (
     SELECT b2.id,
       COALESCE(jsonb_agg(
         CASE
           WHEN item ? 'purchasePrice' THEN item
           ELSE item || jsonb_build_object('purchasePrice', COALESCE(p.purchase_price, 0))
         END
       ), '[]'::jsonb) AS items
     FROM bills b2
     LEFT JOIN jsonb_array_elements(COALESCE(b2.items, '[]'::jsonb)) item ON true
     LEFT JOIN products p ON p.id::text = item->>'productId'
     WHERE EXISTS (
       SELECT 1 FROM jsonb_array_elements(COALESCE(b2.items, '[]'::jsonb)) i
       WHERE NOT (i ? 'purchasePrice')
     )
     GROUP BY b2.id
   ) sub
   WHERE b.id = sub.id`;

@Injectable()
export class SchemaTuneService implements OnModuleInit {
  private readonly log = new Logger(SchemaTuneService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    for (const sql of STATEMENTS) {
      try {
        await this.dataSource.query(sql);
      } catch (err) {
        this.log.warn(`schema tune skipped: ${(err as Error).message}`);
      }
    }
    void this.backfillPurchasePrices();
  }

  private async backfillPurchasePrices() {
    try {
      await this.dataSource.query(BACKFILL_PURCHASE_PRICE);
    } catch (err) {
      this.log.warn(`purchase-price backfill skipped: ${(err as Error).message}`);
    }
  }
}
