import { BaseHttpRepository } from "../base/BaseHttpRepository";
import { getAIProvider } from "../ai/AIProviderFactory";
import { ParsedNLTransaction, StructuredQuery, UserContext } from "../ai/interfaces/AITypes";
import { logger } from "../config/logger";

export class NLQueryRepository extends BaseHttpRepository {
  constructor() {
    super("");
  }

  async parseIntent(query: string, context: UserContext): Promise<StructuredQuery> {
    const provider = getAIProvider();
    const start = Date.now();
    const result = await provider.parseIntent(query, context);
    logger.info({ durationMs: Date.now() - start }, "ai: parseIntent");
    return result;
  }

  async parseNLTransaction(input: string, context: UserContext): Promise<ParsedNLTransaction> {
    const provider = getAIProvider();
    const start = Date.now();
    const result = await provider.parseNLTransaction(input, context);
    logger.info({ durationMs: Date.now() - start }, "ai: parseNLTransaction");
    return result;
  }
}
