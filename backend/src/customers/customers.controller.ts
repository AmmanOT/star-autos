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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/enums';

@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'List customers' })
  findAll() {
    return this.customersService.findAll();
  }

  @Get(':id/ledger')
  @ApiOperation({ summary: 'Customer ledger (bills + payments)' })
  getLedger(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.getLedger(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.findOne(id);
  }

  @Post()
  @RequirePermissions(Permission.CUSTOMERS)
  @ApiOperation({ summary: 'Create customer' })
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(Permission.CUSTOMERS)
  @ApiOperation({ summary: 'Update customer' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.CUSTOMERS)
  @ApiOperation({ summary: 'Delete customer' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.customersService.remove(id);
    return { success: true };
  }
}
