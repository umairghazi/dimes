import Anthropic from "@anthropic-ai/sdk";
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

export class AnthropicProvider implements IAIProvider {
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  private async complete(prompt: string): Promise<string> {
    const msg = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });
    const block = msg.content[0];
    if (block.type !== "text") throw new Error("Unexpected response type from Anthropic");
    return block.text;
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
}
