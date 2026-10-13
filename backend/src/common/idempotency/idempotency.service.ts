import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class IdempotencyService {
  private readonly log = new Logger(IdempotencyService.name);

  constructor(private readonly dataSource: DataSource) {}

  normalize(raw?: string | string[]): string | undefined {
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value) return undefined;
    const key = value.trim();
    if (key.length < 8 || key.length > 80) return undefined;
    if (!/^[\w.:-]+$/.test(key)) return undefined;
    return key;
  }

  async run<T>(rawKey: string | string[] | undefined, fn: () => Promise<T>): Promise<T> {
    const key = this.normalize(rawKey);
    if (!key) return fn();

    const claimed = await this.claim(key);
    if (!claimed) {
      const stored = await this.waitForBody<T>(key);
      if (stored !== undefined) return stored;
      throw new ConflictException('This request is already being processed. Please wait.');
    }

    try {
      const result = await fn();
      await this.saveBody(key, result);
      return result;
    } catch (err) {
      await this.release(key);
      throw err;
    }
  }

  private async claim(key: string): Promise<boolean> {
    try {
      const rows = (await this.dataSource.query(
        `INSERT INTO idempotency_keys (key, body) VALUES ($1, NULL)
         ON CONFLICT (key) DO NOTHING
         RETURNING key`,
        [key],
      )) as Array<{ key: string }>;
      return rows.length > 0;
    } catch (err) {
      this.log.warn(`idempotency claim failed: ${(err as Error).message}`);
      return true;
    }
  }

  private async saveBody(key: string, body: unknown) {
    await this.dataSource.query(
      `UPDATE idempotency_keys SET body = $2::jsonb WHERE key = $1`,
      [key, JSON.stringify(body)],
    );
  }

  private async release(key: string) {
    await this.dataSource.query(`DELETE FROM idempotency_keys WHERE key = $1 AND body IS NULL`, [
      key,
    ]);
  }

  private async waitForBody<T>(key: string): Promise<T | undefined> {
    for (let i = 0; i < 20; i += 1) {
      const rows = (await this.dataSource.query(
        `SELECT body FROM idempotency_keys WHERE key = $1`,
        [key],
      )) as Array<{ body: T | null }>;
      const body = rows[0]?.body;
      if (body != null) return body;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return undefined;
  }
}
