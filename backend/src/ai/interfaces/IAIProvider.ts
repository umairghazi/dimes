import {
  AnalyticsData,
  ClassifiedTransaction,
  ParsedNLTransaction,
  RawTransaction,
  StructuredQuery,
  UserContext,
} from "./AITypes";

export interface IAIProvider {
  classify(transactions: RawTransaction[], categories?: string[]): Promise<ClassifiedTransaction[]>;
  parseIntent(query: string, context: UserContext): Promise<StructuredQuery>;
  parseNLTransaction(input: string, context: UserContext): Promise<ParsedNLTransaction>;
  generateInsight(data: AnalyticsData): Promise<string>;
  parseTransactions(rawText: string): Promise<Array<{ date: string; description: string; amount: number }>>;
}
