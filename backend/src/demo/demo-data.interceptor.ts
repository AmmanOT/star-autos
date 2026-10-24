import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums';
import { DEMO_DATA_SKIP, DemoDataService } from './demo-data.service';

@Injectable()
export class DemoDataInterceptor implements NestInterceptor {
  constructor(private readonly demoData: DemoDataService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      method?: string;
      path?: string;
      url?: string;
      query?: Record<string, unknown>;
      user?: AuthUser;
    }>();
    if (request.user?.role !== UserRole.DEMO) {
      return next.handle();
    }

    const query = flattenQuery(request.query);
    const result = this.demoData.resolve(
      (request.method || 'GET').toUpperCase(),
      request.path || request.url || '',
      query,
    );
    if (result === DEMO_DATA_SKIP) {
      return next.handle();
    }
    return of(result);
  }
}

function flattenQuery(
  query: Record<string, unknown> | undefined,
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  if (!query) return out;
  for (const [key, value] of Object.entries(query)) {
    const raw = Array.isArray(value) ? value[0] : value;
    out[key] = raw == null || raw === '' ? undefined : String(raw);
  }
  return out;
}
