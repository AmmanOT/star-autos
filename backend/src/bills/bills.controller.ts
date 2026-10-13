import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BillsService } from './bills.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import {
  CurrentUser,
  AuthUser,
} from '../common/decorators/current-user.decorator';
import { RequireAllPermissions, RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/enums';
import { assertCustomerCanAccess, isCustomerUser } from '../common/customer-scope';
import { IdempotencyService } from '../common/idempotency/idempotency.service';

@ApiTags('bills')
@ApiBearerAuth()
@Controller('bills')
export class BillsController {
  constructor(
    private readonly billsService: BillsService,
    private readonly idempotency: IdempotencyService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List bills' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'paymentMethod', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('customerId') customerId?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    if (isCustomerUser(user)) {
      if (!user.customerId) return page ? { items: [], total: 0, page: 1, limit: 50 } : [];
      return this.billsService.query({
        customerId: user.customerId,
        page,
        limit,
        search,
        from,
        to,
      });
    }
    return this.billsService.query({
      customerId: customerId && customerId !== 'walkin' ? customerId : undefined,
      walkIn: customerId === 'walkin',
      paymentMethod,
      search,
      from,
      to,
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bill by id' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const bill = await this.billsService.findOne(id);
    assertCustomerCanAccess(user, bill.customerId);
    return bill;
  }

  @Post()
  @RequirePermissions(Permission.BILLING)
  @ApiOperation({ summary: 'Create bill (deducts stock, updates balance)' })
  @ApiHeader({ name: 'Idempotency-Key', required: false })
  create(
    @Body() dto: CreateBillDto,
    @CurrentUser() user: AuthUser,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.idempotency.run(idempotencyKey, () =>
      this.billsService.create(dto, user),
    );
  }

  @Patch(':id')
  @RequirePermissions(Permission.BILLING)
  @RequireAllPermissions(Permission.EDIT)
  @ApiOperation({
    summary: 'Update bill (reverses then reapplies stock/balance)',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBillDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.billsService.update(id, dto, user);
  }

  @Delete(':id')
  @RequirePermissions(Permission.BILLING)
  @RequireAllPermissions(Permission.DELETE)
  @ApiOperation({ summary: 'Delete bill (reverses stock/balance)' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.billsService.remove(id, user);
    return { success: true };
  }
}
