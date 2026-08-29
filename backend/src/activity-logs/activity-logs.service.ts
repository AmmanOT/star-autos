import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ActivityLog } from './entities/activity-log.entity';
import type { AuthUser } from '../common/decorators/current-user.decorator';

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
  }): Promise<ActivityLog[]> {
    const qb = this.logsRepository
      .createQueryBuilder('log')
      .orderBy('log.createdAt', 'DESC')
      .take(Math.min(options?.limit ?? 200, 500));

    if (options?.entityType) {
      qb.andWhere('log.entityType = :entityType', {
        entityType: options.entityType,
      });
    }

    return qb.getMany();
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
