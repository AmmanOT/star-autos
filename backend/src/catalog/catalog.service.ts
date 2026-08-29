import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './entities/brand.entity';
import { Category } from './entities/category.entity';
import { Vehicle } from './entities/vehicle.entity';
import {
  CreateBrandDto,
  CreateCategoryDto,
  CreateVehicleDto,
  UpdateBrandDto,
  UpdateCategoryDto,
  UpdateVehicleDto,
} from './dto/catalog.dto';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Brand) private readonly brandsRepo: Repository<Brand>,
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
    @InjectRepository(Vehicle)
    private readonly vehiclesRepo: Repository<Vehicle>,
  ) {}

  // —— Brands ——
  listBrands() {
    return this.brandsRepo.find({ order: { name: 'ASC' } });
  }

  async createBrand(dto: CreateBrandDto) {
    const name = dto.name.trim();
    const exists = await this.brandsRepo.findOne({ where: { name } });
    if (exists) throw new ConflictException('Brand already exists');
    return this.brandsRepo.save(this.brandsRepo.create({ name }));
  }

  async updateBrand(id: string, dto: UpdateBrandDto) {
    const brand = await this.brandsRepo.findOne({ where: { id } });
    if (!brand) throw new NotFoundException('Brand not found');
    if (dto.name) {
      const name = dto.name.trim();
      const clash = await this.brandsRepo.findOne({ where: { name } });
      if (clash && clash.id !== id) throw new ConflictException('Brand already exists');
      brand.name = name;
    }
    return this.brandsRepo.save(brand);
  }

  async removeBrand(id: string) {
    const res = await this.brandsRepo.delete(id);
    if (!res.affected) throw new NotFoundException('Brand not found');
  }

  // —— Categories ——
  listCategories() {
    return this.categoriesRepo.find({ order: { name: 'ASC' } });
  }

  async createCategory(dto: CreateCategoryDto) {
    const name = dto.name.trim();
    const exists = await this.categoriesRepo.findOne({ where: { name } });
    if (exists) throw new ConflictException('Category already exists');
    return this.categoriesRepo.save(
      this.categoriesRepo.create({
        name,
        nameUrdu: dto.nameUrdu?.trim() || '',
      }),
    );
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const category = await this.categoriesRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    if (dto.name) {
      const name = dto.name.trim();
      const clash = await this.categoriesRepo.findOne({ where: { name } });
      if (clash && clash.id !== id) {
        throw new ConflictException('Category already exists');
      }
      category.name = name;
    }
    if (dto.nameUrdu !== undefined) category.nameUrdu = dto.nameUrdu.trim();
    return this.categoriesRepo.save(category);
  }

  async removeCategory(id: string) {
    const res = await this.categoriesRepo.delete(id);
    if (!res.affected) throw new NotFoundException('Category not found');
  }

  // —— Vehicles ——
  listVehicles() {
    return this.vehiclesRepo.find({ order: { name: 'ASC' } });
  }

  async createVehicle(dto: CreateVehicleDto) {
    const name = dto.name.trim();
    const exists = await this.vehiclesRepo.findOne({ where: { name } });
    if (exists) throw new ConflictException('Vehicle already exists');
    return this.vehiclesRepo.save(this.vehiclesRepo.create({ name }));
  }

  async updateVehicle(id: string, dto: UpdateVehicleDto) {
    const vehicle = await this.vehiclesRepo.findOne({ where: { id } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (dto.name) {
      const name = dto.name.trim();
      const clash = await this.vehiclesRepo.findOne({ where: { name } });
      if (clash && clash.id !== id) {
        throw new ConflictException('Vehicle already exists');
      }
      vehicle.name = name;
    }
    return this.vehiclesRepo.save(vehicle);
  }

  async removeVehicle(id: string) {
    const res = await this.vehiclesRepo.delete(id);
    if (!res.affected) throw new NotFoundException('Vehicle not found');
  }
}
