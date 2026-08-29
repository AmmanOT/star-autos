export enum UserRole {
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
}

export enum Permission {
  DASHBOARD = 'dashboard',
  INVENTORY = 'inventory',
  CUSTOMERS = 'customers',
  BILLING = 'billing',
  LEDGER = 'ledger',
  REPORTS = 'reports',
  ACTIVITY_LOGS = 'activityLogs',
}

export const ALL_PERMISSIONS: Permission[] = Object.values(Permission);

export enum PartCategory {
  RING = 'ring',
  PISTON = 'piston',
  BEARING = 'bearing',
  OIL = 'oil',
  FILTER = 'filter',
  GASKET = 'gasket',
  CLUTCH = 'clutch',
  BRAKE = 'brake',
  SPARK_PLUG = 'spark_plug',
  BELT = 'belt',
  SHOCK = 'shock',
  OTHER = 'other',
}

export enum CustomerType {
  WORKSHOP = 'workshop',
  RETAIL = 'retail',
  WHOLESALER = 'wholesaler',
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK = 'bank',
  CREDIT = 'credit',
  MIXED = 'mixed',
}

export enum PaymentType {
  RECEIVED = 'received',
  PAID = 'paid',
}

export enum PaymentChannel {
  CASH = 'cash',
  BANK = 'bank',
}
