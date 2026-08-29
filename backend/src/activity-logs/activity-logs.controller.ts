import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ActivityLogsService } from './activity-logs.service';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/enums';

@ApiTags('activity-logs')
@ApiBearerAuth()
@Controller('activity-logs')
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get()
  @RequirePermissions(Permission.ACTIVITY_LOGS)
  @ApiOperation({ summary: 'List activity logs' })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @Query('entityType') entityType?: string,
    @Query('limit') limit?: string,
  ) {
    return this.activityLogsService.findAll({
      entityType: entityType || undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
