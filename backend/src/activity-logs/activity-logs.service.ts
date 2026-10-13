import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ActivityLog } from './entities/activity-log.entity';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { paginated, parsePage, type Paginated } from '../common/pagination';

export interface WriteActivityLogInput {
  action: string;
  entityType: string;
  entityId?: string | null;
  user: AuthUser;
  summary: string;
  meta?: Record<string, unknown> | null;
}

@Injectable()
export class ActivityLogsService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly logsRepository: Repository<ActivityLog>,
  ) {}

  async findAll(options?: {
    entityType?: string;
    limit?: number;
    page?: string;
  }): Promise<ActivityLog[] | Paginated<ActivityLog>> {
    const qb = this.logsRepository
      .createQueryBuilder('log')
      .orderBy('log.createdAt', 'DESC');

    if (options?.entityType) {
      qb.andWhere('log.entityType = :entityType', {
        entityType: options.entityType,
      });
    }

    if (options?.page != null) {
      const { page, limit, skip } = parsePage(options.page, String(options.limit ?? 50));
      const [items, total] = await qb.skip(skip).take(limit).getManyAndCount();
      return paginated(items, total, page, limit);
    }

    return qb.take(Math.min(options?.limit ?? 200, 500)).getMany();
  }

  async write(
    input: WriteActivityLogInput,
    manager?: EntityManager,
  ): Promise<ActivityLog> {
    const repo = manager
      ? manager.getRepository(ActivityLog)
      : this.logsRepository;

    const row = repo.create({
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      userId: input.user.id,
      userName: input.user.name,
      userUsername: input.user.username,
      summary: input.summary,
      meta: input.meta ?? null,
    });

    return repo.save(row);
  }
}
