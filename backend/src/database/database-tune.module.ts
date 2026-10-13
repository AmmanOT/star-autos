import { Global, Module } from '@nestjs/common';
import { SchemaTuneService } from './schema-tune.service';
import { IdempotencyService } from '../common/idempotency/idempotency.service';

@Global()
@Module({
  providers: [SchemaTuneService, IdempotencyService],
  exports: [IdempotencyService],
})
export class DatabaseTuneModule {}
