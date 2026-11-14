export interface LedgerUnit {
  id: string;
  occupied: boolean;
  monthlyRent: number;
  openingBalance: number;
  /** First month that monthly rent is added, YYYY-MM. */
  startMonth: string;
}

export interface LedgerPayment {
  id: string;
  unitId: string;
  period: string;
  amount: number;
  paidOn: string;
  method: 'cash' | 'bank';
  notes: string | null;
  createdAt: string | Date;
}

export interface LedgerCharge {
  id: string;
  unitId: string;
  amount: number;
  chargedOn: string;
  description: string | null;
  createdAt: string | Date;
}

export interface RentStatement {
  broughtForward: number;
  monthRent: number;
  extras: number;
  expected: number;
  collected: number;
  remaining: number;
  credit: number;
  charges: LedgerCharge[];
  payments: LedgerPayment[];
}

export function round2(value: number): number {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function addMonths(period: string, delta: number): string {
  const [year, month] = period.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function monthsOfYear(year: number): string[] {
  return Array.from({ length: 12 }, (_, index) => `${year}-${String(index + 1).padStart(2, '0')}`);
}

/** Vacant rooms stop new rent from the current month onward. Earlier months stay on the bill. */
function rentAccrues(unit: LedgerUnit, month: string, todayMonth: string): boolean {
  if (month < unit.startMonth) return false;
  if (unit.occupied) return true;
  return month < todayMonth;
}

export function statementFor(
  unit: LedgerUnit,
  period: string,
  payments: LedgerPayment[],
  charges: LedgerCharge[],
  todayMonth: string,
): RentStatement {
  const monthCharges = charges.filter((charge) => charge.chargedOn.slice(0, 7) === period);
  const monthPayments = payments.filter((payment) => payment.period === period);
  const monthRent = rentAccrues(unit, period, todayMonth) ? round2(unit.monthlyRent) : 0;
  const extras = round2(monthCharges.reduce((sum, charge) => sum + Number(charge.amount), 0));
  const collected = round2(monthPayments.reduce((sum, payment) => sum + Number(payment.amount), 0));

  let brought = round2(unit.openingBalance);
  for (const charge of charges) {
    if (charge.chargedOn.slice(0, 7) < period) brought += Number(charge.amount);
  }
  for (const payment of payments) {
    if (payment.period < period) brought -= Number(payment.amount);
  }
  let cursor = unit.startMonth;
  let guard = 0;
  while (cursor < period && guard < 360) {
    if (rentAccrues(unit, cursor, todayMonth)) brought += Number(unit.monthlyRent);
    cursor = addMonths(cursor, 1);
    guard += 1;
  }
  brought = round2(brought);

  const expected = round2(brought + monthRent + extras);
  return {
    broughtForward: brought,
    monthRent,
    extras,
    expected,
    collected,
    remaining: round2(Math.max(0, expected - collected)),
    credit: round2(Math.max(0, collected - expected)),
    charges: monthCharges,
    payments: monthPayments,
  };
}
