import { OpenAIProvider } from "./OpenAIProvider";

// Extends OpenAIProvider - Ollama and LM Studio expose OpenAI-compatible APIs.
// Only baseURL and apiKey differ. Zero extra logic needed.
export class LocalProvider extends OpenAIProvider {
  constructor(baseURL: string, model: string, apiKey: string) {
    super(apiKey, model, baseURL);
  }
}
