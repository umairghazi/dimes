import { GoogleGenerativeAI } from "@google/generative-ai";
import { IAIProvider } from "../interfaces/IAIProvider";
import {
  AnalyticsData,
  ClassifiedTransaction,
  ParsedNLTransaction,
  RawTransaction,
  StructuredQuery,
  UserContext,
} from "../interfaces/AITypes";
import { buildClassificationPrompt } from "../prompts/classification.prompt";
import { buildIntentParsingPrompt, buildNLTransactionPrompt } from "../prompts/intentParsing.prompt";
import { buildInsightPrompt } from "../prompts/insights.prompt";
import { buildParseTransactionsPrompt } from "../prompts/parseTransactions.prompt";

export class GoogleProvider implements IAIProvider {
  private readonly client: GoogleGenerativeAI;
  private readonly model: string;

  constructor(apiKey: string, model: string) {
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  private async complete(prompt: string): Promise<string> {
    const genModel = this.client.getGenerativeModel({ model: this.model });
    const result = await genModel.generateContent(prompt);
    return result.response.text();
  }

  async classify(transactions: RawTransaction[], categories?: string[]): Promise<ClassifiedTransaction[]> {
    const prompt = buildClassificationPrompt(transactions, categories);
    const raw = await this.complete(prompt);
    const results = JSON.parse(raw) as Array<Omit<ClassifiedTransaction, keyof RawTransaction>>;
    return transactions.map((t, i) => ({ ...t, ...results[i] }));
  }

  async parseIntent(query: string, context: UserContext): Promise<StructuredQuery> {
    const prompt = buildIntentParsingPrompt(query, context);
    const raw = await this.complete(prompt);
    return JSON.parse(raw) as StructuredQuery;
  }

  async parseNLTransaction(input: string, context: UserContext): Promise<ParsedNLTransaction> {
    const prompt = buildNLTransactionPrompt(input, context);
    const raw = await this.complete(prompt);
    return JSON.parse(raw) as ParsedNLTransaction;
  }

  async generateInsight(data: AnalyticsData): Promise<string> {
    return this.complete(buildInsightPrompt(data));
  }

  async parseTransactions(rawText: string): Promise<Array<{ date: string; description: string; amount: number }>> {
    const raw = await this.complete(buildParseTransactionsPrompt(rawText));
    const cleaned = raw.replace(/```(?:json)?/g, "").trim();
    return JSON.parse(cleaned) as Array<{ date: string; description: string; amount: number }>;
  }
}
