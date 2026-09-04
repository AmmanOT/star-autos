import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Bill } from '../bills/entities/bill.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Brand } from '../catalog/entities/brand.entity';
import { Category } from '../catalog/entities/category.entity';
import { Vehicle } from '../catalog/entities/vehicle.entity';
import { Permission, UserRole } from '../common/enums';

const SA = {
  id: 'c0000001-0000-4000-8000-000000000001',
  name: 'Madina Traders Admin',
  username: 'sa',
    password: '1234',
  role: UserRole.ADMIN,
  legacyUsernames: ['sa0999@autos.com'],
} as const;

/** Common Pakistani Suzuki spare-parts market catalog */
const PK_BRANDS = [
  'Genuine Suzuki',
  'Pak Suzuki',
  'NDC Japan',
  'NPR',
  'Osaka',
  'Taiho',
  'Riken',
  'Diamond',
  'Exedy',
  'NGK',
  'Denso',
  'ZIC',
  'Honda Oil',
  'Shell Helix',
  'Total',
  'GMB',
  'KYB',
  'Tokico',
  'AISIN',
  'Bosch',
  'Federal Mogul',
  'Koito',
  'Other',
];

const PK_CATEGORIES: { name: string; nameUrdu: string }[] = [
  { name: 'Piston Ring', nameUrdu: 'پسٹن رنگ' },
  { name: 'Piston', nameUrdu: 'پسٹن' },
  { name: 'Bearing', nameUrdu: 'بیرنگ' },
  { name: 'Engine Oil', nameUrdu: 'انجن آئل' },
  { name: 'Oil Filter', nameUrdu: 'آئل فلٹر' },
  { name: 'Air Filter', nameUrdu: 'ایئر فلٹر' },
  { name: 'Fuel Filter', nameUrdu: 'فیول فلٹر' },
  { name: 'Gasket', nameUrdu: 'گیسکٹ' },
  { name: 'Clutch', nameUrdu: 'کلچ' },
  { name: 'Brake', nameUrdu: 'بریک' },
  { name: 'Spark Plug', nameUrdu: 'سپارک پلگ' },
  { name: 'Belt', nameUrdu: 'بیلٹ' },
  { name: 'Shock Absorber', nameUrdu: 'شاک ایبزوربر' },
  { name: 'Timing Chain', nameUrdu: 'ٹائمنگ چین' },
  { name: 'Water Pump', nameUrdu: 'واٹر پمپ' },
  { name: 'Fuel Pump', nameUrdu: 'فیول پمپ' },
  { name: 'Alternator', nameUrdu: 'آلٹرنیٹر' },
  { name: 'Starter', nameUrdu: 'اسٹارٹر' },
  { name: 'Carburetor', nameUrdu: 'کاربوریٹر' },
  { name: 'Sensor', nameUrdu: 'سینسر' },
  { name: 'Electrical', nameUrdu: 'الیکٹریکل' },
  { name: 'Body Part', nameUrdu: 'باڈی پارٹ' },
  { name: 'Other', nameUrdu: 'دیگر' },
];

const PK_VEHICLES = [
  'Mehran',
  'Alto',
  'Cultus',
  'Swift',
  'Wagon R',
  'Bolan',
  'Ravi',
  'Carry',
  'FX',
  'Every',
  'Jimny',
  'APV',
  'Liana',
  'Khyber',
  'Potohar',
  'Vitara',
  'Baleno',
  'Celerio',
];

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Product) private readonly productsRepo: Repository<Product>,
    @InjectRepository(Customer)
    private readonly customersRepo: Repository<Customer>,
    @InjectRepository(Bill) private readonly billsRepo: Repository<Bill>,
    @InjectRepository(Payment)
    private readonly paymentsRepo: Repository<Payment>,
    @InjectRepository(Brand) private readonly brandsRepo: Repository<Brand>,
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
    @InjectRepository(Vehicle)
    private readonly vehiclesRepo: Repository<Vehicle>,
  ) {}

  async onModuleInit() {
    if (!this.configService.get<boolean>('seedOnStart')) {
      return;
    }
    await this.seed();
  }

  async seed() {
    const reset = this.configService.get<boolean>('seedReset') === true;

    await this.migrateProductCategoryColumn();
    await this.migrateUserPermissionsColumn();

    if (reset) {
      this.logger.warn('SEED_RESET=true — clearing all business data');
      await this.paymentsRepo.clear();
      await this.billsRepo.clear();
      await this.customersRepo.clear();
      await this.productsRepo.clear();
    }

    await this.ensureStaff();
    await this.ensureCatalog();

    if (reset) {
      this.logger.log('Database reset complete — staff + PK catalog');
    } else {
      this.logger.log('Staff + Pakistani Suzuki catalog ensured');
    }
  }

  private async ensureStaff() {
    const existing =
      (await this.usersRepo.findOne({ where: { id: SA.id } })) ||
      (await this.usersRepo.findOne({ where: { username: SA.username } })) ||
      (await this.usersRepo.findOne({
        where: SA.legacyUsernames.map((username) => ({ username })),
      }));

    if (existing) {
      existing.role = SA.role;
      existing.name = SA.name;
      if (SA.legacyUsernames.includes(existing.username as (typeof SA.legacyUsernames)[number])) {
        existing.username = SA.username;
      }
      if (!existing.permissions) {
        existing.permissions = [];
      }
      const usingOldPassword = await bcrypt.compare('sajjad@123', existing.passwordHash);
      if (usingOldPassword) {
        existing.passwordHash = await bcrypt.hash(SA.password, 10);
      }
      await this.usersRepo.save(existing);
      this.logger.log(`Super Admin ensured (username: ${existing.username})`);
      await this.migrateLegacyEmployee();
      return;
    }

    const passwordHash = await bcrypt.hash(SA.password, 10);
    await this.usersRepo.save(
      this.usersRepo.create({
        id: SA.id,
        name: SA.name,
        username: SA.username,
        passwordHash,
        role: SA.role,
        permissions: [],
      }),
    );
    this.logger.log(`Super Admin created — username: ${SA.username}`);
    await this.migrateLegacyEmployee();
  }

  /** Keep the old seeded employee usable until SA edits them; do not recreate if deleted. */
  private async migrateLegacyEmployee() {
    const legacy = await this.usersRepo.findOne({
      where: { id: 'c0000001-0000-4000-8000-000000000002' },
    });
    if (!legacy || legacy.role !== UserRole.EMPLOYEE) {
      return;
    }
    if (!legacy.permissions || legacy.permissions.length === 0) {
      legacy.permissions = [Permission.BILLING];
      await this.usersRepo.save(legacy);
      this.logger.log('Legacy employee granted billing permission');
    }
  }

  private async ensureCatalog() {
    for (const name of PK_BRANDS) {
      const exists = await this.brandsRepo.findOne({ where: { name } });
      if (!exists) {
        await this.brandsRepo.save(this.brandsRepo.create({ name }));
      }
    }

    for (const cat of PK_CATEGORIES) {
      const exists = await this.categoriesRepo.findOne({ where: { name: cat.name } });
      if (!exists) {
        await this.categoriesRepo.save(this.categoriesRepo.create(cat));
      }
    }

    for (const name of PK_VEHICLES) {
      const exists = await this.vehiclesRepo.findOne({ where: { name } });
      if (!exists) {
        await this.vehiclesRepo.save(this.vehiclesRepo.create({ name }));
      }
    }

    this.logger.log(
      `Catalog: ${PK_BRANDS.length} brands, ${PK_CATEGORIES.length} categories, ${PK_VEHICLES.length} vehicles`,
    );
  }

  /** Permissions column for per-employee access (needed when TypeORM sync is off) */
  private async migrateUserPermissionsColumn() {
    try {
      await this.usersRepo.query(`
        ALTER TABLE users
          ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '[]'::jsonb;
      `);
    } catch (err) {
      this.logger.warn(`Users permissions column migrate skipped: ${String(err)}`);
    }
  }

  /** Old products.category was a Postgres enum — convert to varchar for free-form catalog names */
  private async migrateProductCategoryColumn() {
    try {
      await this.productsRepo.query(`
        DO $$ BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'products' AND column_name = 'category'
              AND udt_name = 'products_category_enum'
          ) THEN
            ALTER TABLE products
              ALTER COLUMN category TYPE varchar(120)
              USING category::text;
          END IF;
        END $$;
      `);
    } catch (err) {
      this.logger.warn(`Category column migrate skipped: ${String(err)}`);
    }
  }
}
