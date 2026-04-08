import { BaseHttpRepository } from "../base/BaseHttpRepository";
import { getAIProvider, isAIAvailable } from "../ai/AIProviderFactory";
import { ClassifiedTransaction, RawTransaction } from "../ai/interfaces/AITypes";
import { logger } from "../config/logger";

export class ClassificationRepository extends BaseHttpRepository {
  constructor() {
    super("");
  }

  async classify(transactions: RawTransaction[], categories?: string[]): Promise<ClassifiedTransaction[]> {
    const unclassified = (t: RawTransaction): ClassifiedTransaction => ({
      ...t,
      category: "Miscellaneous",
      isRecurring: false,
      confidence: 0,
    });

    if (!isAIAvailable()) {
      return transactions.map(unclassified);
    }

    const provider = getAIProvider();
    const batchSize = 50;
    const results: ClassifiedTransaction[] = [];

    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(transactions.length / batchSize);

      const start = Date.now();
      try {
        const classified = await provider.classify(batch, categories);
        logger.info(
          { batch: `${batchNum}/${totalBatches}`, count: batch.length, durationMs: Date.now() - start },
          "ai: classify",
        );
        results.push(...classified);
      } catch (err) {
        logger.warn(
          { batch: `${batchNum}/${totalBatches}`, count: batch.length, err },
          "ai: classify failed, falling back to Miscellaneous",
        );
        results.push(...batch.map(unclassified));
      }
    }
    return results;
  }
}
