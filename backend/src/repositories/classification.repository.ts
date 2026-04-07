import { BaseHttpRepository } from "../base/BaseHttpRepository";
import { getAIProvider, isAIAvailable } from "../ai/AIProviderFactory";
import { ClassifiedTransaction, RawTransaction } from "../ai/interfaces/AITypes";

// Delegates to AIProviderFactory — the HTTP abstraction is for API-based providers
// but we unify the interface here so services don't care how classification happens
export class ClassificationRepository extends BaseHttpRepository {
  constructor() {
    super(""); // BaseHttpRepository required — not used for local AI calls
  }

  async classify(transactions: RawTransaction[]): Promise<ClassifiedTransaction[]> {
    const unclassified = (t: RawTransaction): ClassifiedTransaction => ({
      ...t,
      category: "Other",
      isRecurring: false,
      confidence: 0,
    });

    if (!isAIAvailable()) {
      // No AI configured — return unclassified so user can categorize manually
      return transactions.map(unclassified);
    }

    const provider = getAIProvider();
    // Process in batches of 50
    const batchSize = 50;
    const results: ClassifiedTransaction[] = [];
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      try {
        const classified = await provider.classify(batch);
        results.push(...classified);
      } catch {
        // AI failed mid-batch — fall back for this batch
        results.push(...batch.map(unclassified));
      }
    }
    return results;
  }

  async suggestCategory(description: string): Promise<{ category: string; confidence: number }> {
    if (!isAIAvailable()) return { category: "Other", confidence: 0 };
    try {
      const provider = getAIProvider();
      return provider.suggestCategory(description);
    } catch {
      return { category: "Uncategorized", confidence: 0 };
    }
  }
}
