import {
  AnalyticsData,
  ClassifiedTransaction,
  ParsedNLTransaction,
  RawTransaction,
  StructuredQuery,
  UserContext,
} from "./AITypes";

export interface IAIProvider {
  classify(transactions: RawTransaction[]): Promise<ClassifiedTransaction[]>;
  parseIntent(query: string, context: UserContext): Promise<StructuredQuery>;
  parseNLTransaction(input: string, context: UserContext): Promise<ParsedNLTransaction>;
  generateInsight(data: AnalyticsData): Promise<string>;
  suggestCategory(description: string): Promise<{ category: string; confidence: number }>;
}
