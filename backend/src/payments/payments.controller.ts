import { Body, Controller, Delete, Get, Headers, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import {
  CurrentUser,
  AuthUser,
} from '../common/decorators/current-user.decorator';
import { RequireAllPermissions, RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/enums';
import { isCustomerUser } from '../common/customer-scope';
import { IdempotencyService } from '../common/idempotency/idempotency.service';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly idempotency: IdempotencyService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List payments' })
  @ApiQuery({ name: 'customerId', required: false })
  findAll(
    @Query('customerId') customerId: string | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    if (isCustomerUser(user)) {
      if (!user.customerId) return [];
      return this.paymentsService.findAll(user.customerId);
    }
    return this.paymentsService.findAll(customerId);
  }

  @Post()
  @RequirePermissions(Permission.LEDGER)
  @ApiOperation({ summary: 'Create payment and update customer balance' })
  @ApiHeader({ name: 'Idempotency-Key', required: false })
  create(
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: AuthUser,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.idempotency.run(idempotencyKey, () =>
      this.paymentsService.create(dto, user),
    );
  }

  @Delete(':id')
  @RequirePermissions(Permission.LEDGER)
  @RequireAllPermissions(Permission.DELETE)
  @ApiOperation({ summary: 'Delete payment and restore customer balance' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.paymentsService.remove(id, user);
    return { success: true };
  }
}
