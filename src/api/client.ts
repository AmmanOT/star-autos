const TOKEN_KEY = 'star_autos_token';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/** Production API: RackNerd Madina Traders (Neon DB unchanged). */
const PRODUCTION_API = 'https://192.236.219.79.sslip.io';

function apiBase(): string {
  let raw = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '';
  // Cut over from free Render sleep; ignore stale onrender env if still set on Vercel
  if (!raw || /onrender\.com$/i.test(raw.replace(/^https?:\/\//, '').split('/')[0] || '')) {
    raw = import.meta.env.PROD ? PRODUCTION_API : '';
  }
  if (!raw) return '/api';
  return raw.endsWith('/api') ? raw : `${raw}/api`;
}

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown };

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  const token = getToken();

  const res = await fetch(`${apiBase()}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      (typeof data?.message === 'string' && data.message) ||
      (Array.isArray(data?.message) && data.message.join(', ')) ||
      data?.error ||
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status, data);
  }

  return data as T;
}
