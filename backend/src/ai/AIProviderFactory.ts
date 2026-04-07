import { env } from "../config/env";
import { IAIProvider } from "./interfaces/IAIProvider";
import { AnthropicProvider } from "./providers/AnthropicProvider";
import { OpenAIProvider } from "./providers/OpenAIProvider";
import { GoogleProvider } from "./providers/GoogleProvider";
import { AWSBedrockProvider } from "./providers/AWSBedrockProvider";
import { LocalProvider } from "./providers/LocalProvider";

let instance: IAIProvider | null = null;
let aiAvailable: boolean | null = null;

export function isAIAvailable(): boolean {
  if (aiAvailable !== null) return aiAvailable;
  try {
    getAIProvider();
    return true;
  } catch {
    return false;
  }
}

export function getAIProvider(): IAIProvider {
  if (instance) return instance;

  const providers: Record<string, () => IAIProvider> = {
    anthropic: () => {
      if (!env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is required");
      return new AnthropicProvider(env.ANTHROPIC_API_KEY, env.ANTHROPIC_MODEL);
    },
    openai: () => {
      if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required");
      return new OpenAIProvider(env.OPENAI_API_KEY, env.OPENAI_MODEL);
    },
    google: () => {
      if (!env.GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY is required");
      return new GoogleProvider(env.GOOGLE_API_KEY, env.GOOGLE_MODEL);
    },
    bedrock: () => new AWSBedrockProvider(env.AWS_REGION, env.AWS_BEDROCK_MODEL),
    local: () => new LocalProvider(env.LOCAL_AI_BASE_URL, env.LOCAL_AI_MODEL, env.LOCAL_AI_API_KEY),
  };

  const factory = providers[env.AI_PROVIDER];
  if (!factory) throw new Error(`Unknown AI_PROVIDER: ${env.AI_PROVIDER}`);
  instance = factory();
  aiAvailable = true;

  console.log(`AI provider initialized: ${env.AI_PROVIDER}`);
  return instance;
}
