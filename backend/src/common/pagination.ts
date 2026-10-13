export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export function parsePage(page?: string, limit?: string): {
  page: number;
  limit: number;
  skip: number;
} {
  const p = Math.max(1, Number.parseInt(page ?? '1', 10) || 1);
  const l = Math.min(100, Math.max(1, Number.parseInt(limit ?? '50', 10) || 50));
  return { page: p, limit: l, skip: (p - 1) * l };
}

export function paginated<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): Paginated<T> {
  return { items, total, page, limit };
}

/** Pakistan shop calendar day in timestamptz. */
export function pkDayRange(from?: string, to?: string): {
  start?: Date;
  end?: Date;
} {
  const start = from ? new Date(`${from}T00:00:00+05:00`) : undefined;
  const end = to ? new Date(`${to}T23:59:59.999+05:00`) : undefined;
  return {
    start: start && !Number.isNaN(start.getTime()) ? start : undefined,
    end: end && !Number.isNaN(end.getTime()) ? end : undefined,
  };
}
