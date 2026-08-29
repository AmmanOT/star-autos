import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/enums';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @RequirePermissions(Permission.DASHBOARD)
  @ApiOperation({ summary: 'Dashboard stats' })
  getDashboard() {
    return this.reportsService.getDashboard();
  }

  @Get('sales')
  @RequirePermissions(Permission.REPORTS)
  @ApiOperation({ summary: 'Sales report by date range' })
  @ApiQuery({ name: 'from', required: false, description: 'ISO date' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO date' })
  getSales(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.getSales(from, to);
  }
}
