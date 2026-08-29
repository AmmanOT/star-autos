import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async findAll(filters: {
    search?: string;
    category?: string;
    vehicle?: string;
  }): Promise<Product[]> {
    const qb = this.productsRepository.createQueryBuilder('product');

    if (filters.search) {
      const search = `%${filters.search.toLowerCase()}%`;
      qb.andWhere(
        `(LOWER(product.name) LIKE :search
          OR LOWER(product.name_urdu) LIKE :search
          OR LOWER(product.part_number) LIKE :search
          OR LOWER(product.company_number) LIKE :search
          OR LOWER(product.brand) LIKE :search)`,
        { search },
      );
    }

    if (filters.category) {
      qb.andWhere('product.category = :category', { category: filters.category });
    }

    if (filters.vehicle) {
      qb.andWhere(':vehicle = ANY(product.vehicle_models)', {
        vehicle: filters.vehicle,
      });
    }

    qb.orderBy('product.created_at', 'DESC');
    return qb.getMany();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const product = this.productsRepository.create({
      ...dto,
      location: dto.location ?? null,
    });
    return this.productsRepository.save(product);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, {
      ...dto,
      location: dto.location === undefined ? product.location : dto.location ?? null,
    });
    return this.productsRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productsRepository.remove(product);
  }
}
