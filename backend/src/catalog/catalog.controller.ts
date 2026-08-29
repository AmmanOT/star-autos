import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/enums';
import { CatalogService } from './catalog.service';
import {
  CreateBrandDto,
  CreateCategoryDto,
  CreateVehicleDto,
  UpdateBrandDto,
  UpdateCategoryDto,
  UpdateVehicleDto,
} from './dto/catalog.dto';

@ApiTags('catalog')
@ApiBearerAuth()
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('brands')
  @ApiOperation({ summary: 'List brands' })
  listBrands() {
    return this.catalogService.listBrands();
  }

  @Post('brands')
  @RequirePermissions(Permission.INVENTORY)
  createBrand(@Body() dto: CreateBrandDto) {
    return this.catalogService.createBrand(dto);
  }

  @Patch('brands/:id')
  @RequirePermissions(Permission.INVENTORY)
  updateBrand(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBrandDto) {
    return this.catalogService.updateBrand(id, dto);
  }

  @Delete('brands/:id')
  @RequirePermissions(Permission.INVENTORY)
  async removeBrand(@Param('id', ParseUUIDPipe) id: string) {
    await this.catalogService.removeBrand(id);
    return { success: true };
  }

  @Get('categories')
  @ApiOperation({ summary: 'List categories' })
  listCategories() {
    return this.catalogService.listCategories();
  }

  @Post('categories')
  @RequirePermissions(Permission.INVENTORY)
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.catalogService.createCategory(dto);
  }

  @Patch('categories/:id')
  @RequirePermissions(Permission.INVENTORY)
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.catalogService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @RequirePermissions(Permission.INVENTORY)
  async removeCategory(@Param('id', ParseUUIDPipe) id: string) {
    await this.catalogService.removeCategory(id);
    return { success: true };
  }

  @Get('vehicles')
  @ApiOperation({ summary: 'List vehicles' })
  listVehicles() {
    return this.catalogService.listVehicles();
  }

  @Post('vehicles')
  @RequirePermissions(Permission.INVENTORY)
  createVehicle(@Body() dto: CreateVehicleDto) {
    return this.catalogService.createVehicle(dto);
  }

  @Patch('vehicles/:id')
  @RequirePermissions(Permission.INVENTORY)
  updateVehicle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.catalogService.updateVehicle(id, dto);
  }

  @Delete('vehicles/:id')
  @RequirePermissions(Permission.INVENTORY)
  async removeVehicle(@Param('id', ParseUUIDPipe) id: string) {
    await this.catalogService.removeVehicle(id);
    return { success: true };
  }
}
