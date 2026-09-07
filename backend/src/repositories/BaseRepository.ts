import { pool } from "../db/pool";
import { RepositoryError } from "../errors/RepositoryError";

export abstract class BaseRepository {
  protected async query<T>(
    operation: string,
    sql: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    try {
      const result = await pool.query(sql, params);
      return result.rows as T[];
    } catch (err) {
      throw new RepositoryError(`Failed to ${operation}`, operation, err);
    }
  }

  protected async queryOne<T>(
    operation: string,
    sql: string,
    params: unknown[] = [],
  ): Promise<T | null> {
    const rows = await this.query<T>(operation, sql, params);
    return rows[0] ?? null;
  }
}
