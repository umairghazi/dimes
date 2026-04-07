import { BaseHttpRepository } from "../base/BaseHttpRepository";
import { getAIProvider } from "../ai/AIProviderFactory";
import { ParsedNLTransaction, StructuredQuery, UserContext } from "../ai/interfaces/AITypes";

export class NLQueryRepository extends BaseHttpRepository {
  constructor() {
    super("");
  }

  async parseIntent(query: string, context: UserContext): Promise<StructuredQuery> {
    const provider = getAIProvider();
    return provider.parseIntent(query, context);
  }

  async parseNLTransaction(input: string, context: UserContext): Promise<ParsedNLTransaction> {
    const provider = getAIProvider();
    return provider.parseNLTransaction(input, context);
  }
}
