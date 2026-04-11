import { BaseHttpRepository } from "../base/BaseHttpRepository";
import { getAIProvider, isAIAvailable } from "../ai/AIProviderFactory";
import { ClassifiedTransaction, RawTransaction } from "../ai/interfaces/AITypes";
import { ExpenseRepository } from "./expense.repository";
import { logger } from "../config/logger";

export interface HistoryContext {
  /** normalizedDesc → { categoryId, count } */
  entries: Map<string, { categoryId: string | null; count: number }>;
  /** categoryId → category name */
  idToName: Map<string, string>;
}

export class ClassificationRepository extends BaseHttpRepository {
  constructor() {
    super("");
  }

  async classify(
    transactions: RawTransaction[],
    categories?: string[],
    history?: HistoryContext,
  ): Promise<ClassifiedTransaction[]> {
    const unclassified = (t: RawTransaction): ClassifiedTransaction => ({
      ...t,
      category: "Miscellaneous",
      isRecurring: false,
      confidence: 0,
      classificationSource: "ai",
    });

    const historyMatched: ClassifiedTransaction[] = [];
    const needsAI: RawTransaction[] = [];

    if (history && history.entries.size > 0) {
      for (const t of transactions) {
        const key = ExpenseRepository.normalizeDescription(t.description);
        const match = history.entries.get(key);
        if (match && match.categoryId) {
          const name = history.idToName.get(match.categoryId);
          if (name) {
            const confidence = match.count >= 3 ? 0.95 : 0.80;
            historyMatched.push({
              ...t,
              category: name,
              isRecurring: false,
              confidence,
              classificationSource: "history",
            });
            continue;
          }
        }
        needsAI.push(t);
      }
    } else {
      needsAI.push(...transactions);
    }

    if (needsAI.length === 0) {
      logger.info({ historyHits: historyMatched.length }, "classify: all transactions resolved from history");
      return historyMatched;
    }

    if (!isAIAvailable()) {
      return [...historyMatched, ...needsAI.map(unclassified)];
    }

    const provider = getAIProvider();
    const batchSize = 50;
    const aiResults: ClassifiedTransaction[] = [];

    for (let i = 0; i < needsAI.length; i += batchSize) {
      const batch = needsAI.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(needsAI.length / batchSize);

      const start = Date.now();
      try {
        const classified = await provider.classify(batch, categories);
        logger.info(
          {
            batch: `${batchNum}/${totalBatches}`,
            count: batch.length,
            durationMs: Date.now() - start,
            historyHits: historyMatched.length,
            aiSent: needsAI.length,
          },
          "ai: classify",
        );
        aiResults.push(...classified.map((r) => ({ ...r, classificationSource: "ai" as const })));
      } catch (err) {
        logger.warn(
          { batch: `${batchNum}/${totalBatches}`, count: batch.length, err },
          "ai: classify failed, falling back to Miscellaneous",
        );
        aiResults.push(...batch.map(unclassified));
      }
    }

    return [...historyMatched, ...aiResults];
  }
}
