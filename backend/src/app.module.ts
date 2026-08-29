import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CustomersModule } from './customers/customers.module';
import { BillsModule } from './bills/bills.module';
import { PaymentsModule } from './payments/payments.module';
import { ReportsModule } from './reports/reports.module';
import { CatalogModule } from './catalog/catalog.module';
import { SeedModule } from './database/seed.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { HealthController } from './health.controller';
import { User } from './users/entities/user.entity';
import { Product } from './products/entities/product.entity';
import { Customer } from './customers/entities/customer.entity';
import { Bill } from './bills/entities/bill.entity';
import { Payment } from './payments/entities/payment.entity';
import { Brand } from './catalog/entities/brand.entity';
import { Category } from './catalog/entities/category.entity';
import { Vehicle } from './catalog/entities/vehicle.entity';
import { ActivityLog } from './activity-logs/entities/activity-log.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const nodeEnv = config.get<string>('nodeEnv') || 'development';
        const forceSync = config.get<boolean>('typeormSync') === true;
        const databaseUrl = config.get<string>('database.url');
        const base = {
          type: 'postgres' as const,
          entities: [
            User,
            Product,
            Customer,
            Bill,
            Payment,
            Brand,
            Category,
            Vehicle,
            ActivityLog,
          ],
          synchronize: nodeEnv !== 'production' || forceSync,
          logging: nodeEnv === 'development',
          ssl:
            nodeEnv === 'production' ||
            databaseUrl?.includes('render.com') ||
            databaseUrl?.includes('neon.tech')
              ? { rejectUnauthorized: false }
              : undefined,
        };

        if (databaseUrl) {
          return { ...base, url: databaseUrl };
        }

        return {
          ...base,
          host: config.get<string>('database.host'),
          port: config.get<number>('database.port'),
          username: config.get<string>('database.username'),
          password: config.get<string>('database.password'),
          database: config.get<string>('database.name'),
        };
      },
    }),
    UsersModule,
    AuthModule,
    ProductsModule,
    CustomersModule,
    BillsModule,
    PaymentsModule,
    ReportsModule,
    CatalogModule,
    ActivityLogsModule,
    SeedModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
