import OpenAI from "openai";
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
import { buildInsightPrompt, buildCategorySuggestionPrompt } from "../prompts/insights.prompt";

export class OpenAIProvider implements IAIProvider {
  protected readonly client: OpenAI;
  protected readonly model: string;

  constructor(apiKey: string, model: string, baseURL?: string) {
    this.client = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
    this.model = model;
  }

  protected async complete(prompt: string): Promise<string> {
    const res = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4096,
    });
    return res.choices[0]?.message.content ?? "";
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
    const prompt = buildInsightPrompt(data);
    return this.complete(prompt);
  }

  async suggestCategory(description: string): Promise<{ category: string; confidence: number }> {
    const prompt = buildCategorySuggestionPrompt(description);
    const raw = await this.complete(prompt);
    return JSON.parse(raw);
  }
}
