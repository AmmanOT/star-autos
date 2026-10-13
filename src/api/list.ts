export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export function asList<T>(data: T[] | Paginated<T>): Paginated<T> {
  if (Array.isArray(data)) {
    return { items: data, total: data.length, page: 1, limit: data.length || 50 };
  }
  return {
    items: data.items ?? [],
    total: data.total ?? data.items?.length ?? 0,
    page: data.page ?? 1,
    limit: data.limit ?? 50,
  };
}

export function queryString(params: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') q.set(key, String(value));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function newIdempotencyKey() {
  return crypto.randomUUID();
}
