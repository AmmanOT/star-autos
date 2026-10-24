import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DemoDataInterceptor } from './demo-data.interceptor';
import { DemoDataService } from './demo-data.service';

@Module({
  providers: [
    DemoDataService,
    { provide: APP_INTERCEPTOR, useClass: DemoDataInterceptor },
  ],
})
export class DemoModule {}
