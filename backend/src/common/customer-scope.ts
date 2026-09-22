import { ForbiddenException } from '@nestjs/common';
import { UserRole } from './enums';
import type { AuthUser } from './decorators/current-user.decorator';

export function isCustomerUser(user: AuthUser | undefined): boolean {
  return user?.role === UserRole.CUSTOMER;
}

export function assertCustomerCanAccess(
  user: AuthUser,
  customerId: string | null | undefined,
) {
  if (!isCustomerUser(user)) return;
  if (!user.customerId || !customerId || user.customerId !== customerId) {
    throw new ForbiddenException('You can only view your own ledger');
  }
}
