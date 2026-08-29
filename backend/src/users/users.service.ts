import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { ALL_PERMISSIONS, Permission, UserRole } from '../common/enums';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
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
    await this.usersRepository.remove(user);
  }

  async updatePassword(userId: string, passwordHash: string) {
    const user = await this.findById(userId);
    user.passwordHash = passwordHash;
    await this.usersRepository.save(user);
  }

  effectivePermissions(user: User): Permission[] {
    if (user.role === UserRole.ADMIN) {
      return ALL_PERMISSIONS;
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
      permissions: this.effectivePermissions(user),
    };
  }
}
