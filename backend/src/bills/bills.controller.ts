import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BillsService } from './bills.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import {
  CurrentUser,
  AuthUser,
} from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/enums';
import { assertCustomerCanAccess, isCustomerUser } from '../common/customer-scope';

@ApiTags('bills')
@ApiBearerAuth()
@Controller('bills')
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Get()
  @ApiOperation({ summary: 'List bills' })
  findAll(@CurrentUser() user: AuthUser) {
    if (isCustomerUser(user)) {
      if (!user.customerId) return [];
      return this.billsService.findAllByCustomer(user.customerId);
    }
    return this.billsService.findAll();
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
  create(@Body() dto: CreateBillDto, @CurrentUser() user: AuthUser) {
    return this.billsService.create(dto, user);
  }

  @Patch(':id')
  @RequirePermissions(Permission.BILLING)
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
  @ApiOperation({ summary: 'Delete bill (reverses stock/balance)' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.billsService.remove(id, user);
    return { success: true };
  }
}
