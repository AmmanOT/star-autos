import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireAllPermissions, RequirePermissions } from '../common/decorators/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Permission, UserRole } from '../common/enums';
import { CreatePropertyDto, CreateRentPaymentDto, CreateUnitDto, UpdatePropertyDto, UpdateUnitDto } from './dto/rental.dto';
import { RentalsService } from './rentals.service';

@ApiTags('rentals')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
@RequirePermissions(Permission.RENT)
@Controller('rentals')
export class RentalsController {
  constructor(private readonly rentals: RentalsService) {}

  @Get('properties')
  properties() {
    return this.rentals.listProperties();
  }

  @Post('properties')
  createProperty(@Body() dto: CreatePropertyDto) {
    return this.rentals.createProperty(dto);
  }

  @Patch('properties/:id')
  @RequireAllPermissions(Permission.RENT, Permission.EDIT)
  updateProperty(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePropertyDto) {
    return this.rentals.updateProperty(id, dto);
  }

  @Delete('properties/:id')
  @RequireAllPermissions(Permission.RENT, Permission.DELETE)
  removeProperty(@Param('id', ParseUUIDPipe) id: string) {
    return this.rentals.removeProperty(id);
  }

  @Post('units')
  createUnit(@Body() dto: CreateUnitDto) {
    return this.rentals.createUnit(dto);
  }

  @Patch('units/:id')
  @RequireAllPermissions(Permission.RENT, Permission.EDIT)
  updateUnit(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUnitDto) {
    return this.rentals.updateUnit(id, dto);
  }

  @Delete('units/:id')
  @RequireAllPermissions(Permission.RENT, Permission.DELETE)
  removeUnit(@Param('id', ParseUUIDPipe) id: string) {
    return this.rentals.removeUnit(id);
  }

  @Get('board')
  board(@Query('month') month?: string) {
    return this.rentals.board(month);
  }

  @Post('payments')
  addPayment(@Body() dto: CreateRentPaymentDto) {
    return this.rentals.addPayment(dto);
  }

  @Delete('payments/:id')
  @RequireAllPermissions(Permission.RENT, Permission.DELETE)
  removePayment(@Param('id', ParseUUIDPipe) id: string) {
    return this.rentals.removePayment(id);
  }
}
