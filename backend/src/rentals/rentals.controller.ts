import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '../common/enums';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';
import {
  RequireAllPermissions,
  RequirePermissions,
} from '../common/decorators/permissions.decorator';
import {
  CreateChargeDto,
  CreateCollectionDto,
  CreatePropertyDto,
  CreateUnitDto,
  UpdatePropertyDto,
  UpdateUnitDto,
} from './dto/rental.dto';
import { RentalsService } from './rentals.service';

@ApiTags('rentals')
@ApiBearerAuth()
@RequirePermissions(Permission.RENT)
@Controller('rentals')
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  @Get('properties')
  @ApiOperation({ summary: 'List rental properties with rooms and shops' })
  listProperties() {
    return this.rentalsService.listProperties();
  }

  @Post('properties')
  @ApiOperation({ summary: 'Add a rental property' })
  createProperty(@Body() dto: CreatePropertyDto, @CurrentUser() user: AuthUser) {
    return this.rentalsService.createProperty(dto, user);
  }

  @Patch('properties/:id')
  @ApiOperation({ summary: 'Update a rental property' })
  updateProperty(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePropertyDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.rentalsService.updateProperty(id, dto, user);
  }

  @Delete('properties/:id')
  @RequireAllPermissions(Permission.DELETE)
  @ApiOperation({ summary: 'Delete a rental property and its rooms' })
  async removeProperty(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.rentalsService.removeProperty(id, user);
    return { success: true };
  }

  @Post('units')
  @ApiOperation({ summary: 'Add a room or shop' })
  createUnit(@Body() dto: CreateUnitDto, @CurrentUser() user: AuthUser) {
    return this.rentalsService.createUnit(dto, user);
  }

  @Patch('units/:id')
  @ApiOperation({ summary: 'Update a room or shop' })
  updateUnit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUnitDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.rentalsService.updateUnit(id, dto, user);
  }

  @Delete('units/:id')
  @RequireAllPermissions(Permission.DELETE)
  @ApiOperation({ summary: 'Delete a room or shop' })
  async removeUnit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.rentalsService.removeUnit(id, user);
    return { success: true };
  }

  @Get('board')
  @ApiOperation({ summary: 'Monthly rent status for every room and shop' })
  board(@Query('month') month: string) {
    return this.rentalsService.board(month);
  }

  @Post('charges')
  @ApiOperation({ summary: 'Add an extra amount owed, such as electricity or repairs' })
  addCharge(@Body() dto: CreateChargeDto, @CurrentUser() user: AuthUser) {
    return this.rentalsService.addCharge(dto, user);
  }

  @Delete('charges/:id')
  @RequireAllPermissions(Permission.DELETE)
  @ApiOperation({ summary: 'Remove an extra amount' })
  async removeCharge(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.rentalsService.removeCharge(id, user);
    return { success: true };
  }

  @Post('collections')
  @ApiOperation({ summary: 'Record rent received, in full or in part' })
  collect(@Body() dto: CreateCollectionDto, @CurrentUser() user: AuthUser) {
    return this.rentalsService.collect(dto, user);
  }

  @Delete('collections/:id')
  @RequireAllPermissions(Permission.DELETE)
  @ApiOperation({ summary: 'Remove a rent payment that was entered by mistake' })
  async removeCollection(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.rentalsService.removeCollection(id, user);
    return { success: true };
  }
}
