/** Rent book math. It never reads shop bills, customers, or shop payments. */

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function addMonths(month: string, count: number): string {
  const [year, mon] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, mon - 1 + count, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function dueDateFor(month: string, dueDay: number): string {
  const [year, mon] = month.split('-').map(Number);
  const last = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  const day = Math.min(Math.max(1, dueDay), last);
  return `${month}-${String(day).padStart(2, '0')}`;
}

export function karachiMonth(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
  }).format(now).slice(0, 7);
}

export function karachiDate(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export interface RentPaymentLine {
  id: string;
  amount: number;
  paidOn: string;
  notes: string | null;
}

export interface RentMonthStatement {
  broughtForward: number;
  monthRent: number;
  collected: number;
  remaining: number;
  credit: number;
  dueDate: string;
  overdue: boolean;
  payments: RentPaymentLine[];
}

/**
 * One running balance, like a ledger.
 * Already-owed sits first. Each month from the start month adds the monthly rent.
 * A payment on the due date and another a few days later both reduce that same balance.
 */
export function statementFor(input: {
  openingBalance: number;
  monthlyRent: number;
  dueDay: number;
  startMonth: string;
  viewMonth: string;
  today: string;
  payments: RentPaymentLine[];
}): RentMonthStatement {
  const start = input.startMonth;
  const view = input.viewMonth;
  const paidBeforeStart = input.payments
    .filter((payment) => payment.paidOn.slice(0, 7) < start)
    .reduce((sum, payment) => sum + payment.amount, 0);

  let balance = input.openingBalance - paidBeforeStart;
  let cursor = start;
  while (cursor < view) {
    balance += input.monthlyRent;
    const paid = input.payments
      .filter((payment) => payment.paidOn.slice(0, 7) === cursor)
      .reduce((sum, payment) => sum + payment.amount, 0);
    balance -= paid;
    cursor = addMonths(cursor, 1);
  }

  const monthPayments = input.payments
    .filter((payment) => payment.paidOn.slice(0, 7) === view)
    .sort((a, b) => a.paidOn.localeCompare(b.paidOn) || a.id.localeCompare(b.id));
  const collected = monthPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const monthRent = view >= start ? input.monthlyRent : 0;
  const broughtForward = view >= start ? balance : input.openingBalance - paidBeforeStart;
  const raw = broughtForward + monthRent - collected;
  const dueDate = dueDateFor(view, input.dueDay);
  const remaining = round2(Math.max(0, raw));

  return {
    broughtForward: round2(broughtForward),
    monthRent: round2(monthRent),
    collected: round2(collected),
    remaining,
    credit: raw < 0 ? round2(-raw) : 0,
    dueDate,
    overdue: remaining > 0 && dueDate < input.today && view <= input.today.slice(0, 7),
    payments: monthPayments.map((payment) => ({
      ...payment,
      amount: round2(payment.amount),
    })),
  };
}
