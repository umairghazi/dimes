import { SupabaseClient } from "@supabase/supabase-js";
import { RepositoryError } from "../errors/RepositoryError";
import { getSupabaseAdminClient } from "../integrations/supabase/supabaseAdmin.client";

export abstract class BaseRepository {
  protected readonly db: SupabaseClient;

  protected constructor(protected readonly tableName: string) {
    this.db = getSupabaseAdminClient();
  }

  protected table() {
    return this.db.from(this.tableName);
  }

  protected async execute<T>(operation: string, query: PromiseLike<{ data: unknown; error: unknown }>): Promise<T> {
    const { data, error } = await query;
    if (error) throw new RepositoryError(`Failed to ${operation}`, operation, error);
    return data as T;
  }

  protected async executeEmpty(operation: string, query: PromiseLike<{ error: unknown }>): Promise<void> {
    const { error } = await query;
    if (error) throw new RepositoryError(`Failed to ${operation}`, operation, error);
  }
}
