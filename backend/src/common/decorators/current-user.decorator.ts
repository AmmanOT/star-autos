import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { Permission } from '../enums';

export interface AuthUser {
  id: string;
  username: string;
  role: string;
  name: string;
  permissions: Permission[];
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return request.user;
  },
);
