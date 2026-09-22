import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { DEFAULT_CUSTOMER_PASSWORD, User } from './entities/user.entity';
import { ALL_PERMISSIONS, Permission, UserRole } from '../common/enums';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase().replace(/\s+/g, ' ');
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { username: normalizeUsername(username) },
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async listEmployees(): Promise<ReturnType<UsersService['toPublicUser']>[]> {
    const users = await this.usersRepository.find({
      where: { role: UserRole.EMPLOYEE },
      order: { createdAt: 'ASC' },
    });
    return users.map((user) => this.toPublicUser(user));
  }

  async createEmployee(dto: CreateEmployeeDto) {
    const username = normalizeUsername(dto.username);
    const existing = await this.findByUsername(username);
    if (existing) {
      throw new ConflictException('Username is already taken');
    }

    const user = this.usersRepository.create({
      name: dto.name.trim(),
      username,
      passwordHash: await bcrypt.hash(dto.password, 10),
      role: UserRole.EMPLOYEE,
      phone: dto.phone?.trim() || null,
      permissions: dto.permissions ?? [],
    });

    const saved = await this.usersRepository.save(user);
    return this.toPublicUser(saved);
  }

  async updateEmployee(id: string, dto: UpdateEmployeeDto) {
    const user = await this.findById(id);
    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException('Cannot edit the Super Admin from employee management');
    }
    if (user.role === UserRole.CUSTOMER) {
      throw new ForbiddenException('Cannot edit a customer login from employee management');
    }

    if (dto.username) {
      const username = normalizeUsername(dto.username);
      const existing = await this.findByUsername(username);
      if (existing && existing.id !== id) {
        throw new ConflictException('Username is already taken');
      }
      user.username = username;
    }

    if (dto.name !== undefined) {
      user.name = dto.name.trim();
    }
    if (dto.phone !== undefined) {
      user.phone = dto.phone.trim() || null;
    }
    if (dto.permissions !== undefined) {
      user.permissions = dto.permissions;
    }
    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const saved = await this.usersRepository.save(user);
    return this.toPublicUser(saved);
  }

  async deleteEmployee(id: string) {
    const user = await this.findById(id);
    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException('Cannot delete the Super Admin');
    }
    if (user.role === UserRole.CUSTOMER) {
      throw new ForbiddenException('Cannot delete a customer login from employee management');
    }
    await this.usersRepository.remove(user);
  }

  async updatePassword(userId: string, passwordHash: string) {
    const user = await this.findById(userId);
    user.passwordHash = passwordHash;
    await this.usersRepository.save(user);
  }

  async findByCustomerId(customerId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { customerId } });
  }

  async ensureCustomerPortalUser(customer: {
    id: string;
    name: string;
    phone?: string | null;
  }): Promise<User> {
    const existing = await this.findByCustomerId(customer.id);
    if (existing) {
      const nextUsername = await this.uniqueCustomerUsername(
        customer.name,
        customer.id,
        existing.id,
      );
      const nextName = customer.name.trim();
      const nextPhone = customer.phone?.trim() || null;
      if (
        existing.name === nextName &&
        existing.username === nextUsername &&
        existing.phone === nextPhone
      ) {
        return existing;
      }
      existing.name = nextName;
      existing.phone = nextPhone;
      existing.username = nextUsername;
      return this.usersRepository.save(existing);
    }

    const username = await this.uniqueCustomerUsername(customer.name, customer.id);
    const user = this.usersRepository.create({
      name: customer.name.trim() || username,
      username,
      passwordHash: await bcrypt.hash(DEFAULT_CUSTOMER_PASSWORD, 10),
      role: UserRole.CUSTOMER,
      phone: customer.phone?.trim() || null,
      customerId: customer.id,
      permissions: [],
    });
    return this.usersRepository.save(user);
  }

  async deleteCustomerPortalUser(customerId: string): Promise<void> {
    const existing = await this.findByCustomerId(customerId);
    if (existing) {
      await this.usersRepository.remove(existing);
    }
  }

  private async uniqueCustomerUsername(
    name: string,
    customerId: string,
    excludeUserId?: string,
  ): Promise<string> {
    const base =
      normalizeUsername(name).slice(0, 50) ||
      `c-${customerId.replace(/-/g, '').slice(0, 10)}`;
    let candidate = base.slice(0, 60);
    let n = 2;
    while (n < 1000) {
      const existing = await this.findByUsername(candidate);
      if (!existing || existing.id === excludeUserId) {
        return candidate;
      }
      const suffix = `-${n}`;
      candidate = `${base.slice(0, 60 - suffix.length)}${suffix}`;
      n += 1;
    }
    return `c-${customerId.replace(/-/g, '').slice(0, 16)}`;
  }

  effectivePermissions(user: User): Permission[] {
    if (user.role === UserRole.ADMIN) {
      return ALL_PERMISSIONS;
    }
    if (user.role === UserRole.CUSTOMER) {
      return [];
    }
    return user.permissions ?? [];
  }

  toPublicUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      phone: user.phone ?? undefined,
      customerId: user.customerId ?? undefined,
      permissions: this.effectivePermissions(user),
    };
  }
}
