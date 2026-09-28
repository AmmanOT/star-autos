import { SetMetadata } from '@nestjs/common';
import { Permission } from '../enums';

export const PERMISSIONS_KEY = 'permissions';
export const PERMISSIONS_ALL_KEY = 'permissions_all';

/** User must have at least one of the listed permissions (admins always pass). */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/** User must have every listed permission (admins always pass). */
export const RequireAllPermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_ALL_KEY, permissions);
