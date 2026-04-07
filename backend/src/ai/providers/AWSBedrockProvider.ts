import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
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

export class AWSBedrockProvider implements IAIProvider {
  private readonly client: BedrockRuntimeClient;
  private readonly modelId: string;

  constructor(region: string, modelId: string) {
    this.client = new BedrockRuntimeClient({ region });
    this.modelId = modelId;
  }

  private async complete(prompt: string): Promise<string> {
    const body = JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const cmd = new InvokeModelCommand({
      modelId: this.modelId,
      contentType: "application/json",
      accept: "application/json",
      body: Buffer.from(body),
    });

    const response = await this.client.send(cmd);
    const parsed = JSON.parse(Buffer.from(response.body).toString()) as {
      content: Array<{ type: string; text: string }>;
    };
    return parsed.content[0]?.text ?? "";
  }

  async classify(transactions: RawTransaction[], categories?: string[]): Promise<ClassifiedTransaction[]> {
    const prompt = buildClassificationPrompt(transactions, categories);
    const raw = await this.complete(prompt);
    const results = JSON.parse(raw) as Array<Omit<ClassifiedTransaction, keyof RawTransaction>>;
    return transactions.map((t, i) => ({ ...t, ...results[i] }));
  }

  async parseIntent(query: string, context: UserContext): Promise<StructuredQuery> {
    const raw = await this.complete(buildIntentParsingPrompt(query, context));
    return JSON.parse(raw) as StructuredQuery;
  }

  async parseNLTransaction(input: string, context: UserContext): Promise<ParsedNLTransaction> {
    const raw = await this.complete(buildNLTransactionPrompt(input, context));
    return JSON.parse(raw) as ParsedNLTransaction;
  }

  async generateInsight(data: AnalyticsData): Promise<string> {
    return this.complete(buildInsightPrompt(data));
  }

  async suggestCategory(description: string): Promise<{ category: string; confidence: number }> {
    const raw = await this.complete(buildCategorySuggestionPrompt(description));
    return JSON.parse(raw);
  }
}
