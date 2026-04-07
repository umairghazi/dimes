import { NLQueryRepository } from "../repositories/nlQuery.repository";
import { AnalyticsService } from "./analytics.service";
import { ExpenseRepository } from "../repositories/expense.repository";
import { BudgetRepository } from "../repositories/budget.repository";
import { UserContext } from "../ai/interfaces/AITypes";
import { ParsedNLTransaction } from "../ai/interfaces/AITypes";

export interface QueryResult {
  answer: string;
  breakdown?: unknown[];
  parsedTransaction?: ParsedNLTransaction;
}

export class NLQueryService {
  private readonly analyticsService: AnalyticsService;

  constructor(private readonly nlQueryRepo: NLQueryRepository) {
    this.analyticsService = new AnalyticsService(new ExpenseRepository(), new BudgetRepository());
  }

  async query(input: string, context: UserContext, mode: "ask" | "add"): Promise<QueryResult> {
    if (mode === "add") {
      const parsed = await this.nlQueryRepo.parseNLTransaction(input, context);
      return { answer: "Transaction parsed", parsedTransaction: parsed };
    }

    const structured = await this.nlQueryRepo.parseIntent(input, context);

    const period = structured.period ?? (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    })();

    const summary = await this.analyticsService.getMonthlySummary(context.userId, period);

    const relevantCategory = structured.category
      ? summary.byCategory.find((c) => c.category === structured.category)
      : null;

    let answer = "";
    if (structured.metric === "total_spend" && relevantCategory) {
      answer = `You spent $${relevantCategory.amount.toFixed(2)} on ${structured.category} in ${period}.`;
    } else if (structured.metric === "total_spend") {
      answer = `Your total spend in ${period} was $${summary.totalSpend.toFixed(2)}.`;
    } else if (structured.metric === "count" && relevantCategory) {
      answer = `You had ${relevantCategory.count} ${structured.category} transactions in ${period}.`;
    } else {
      answer = `Total spend in ${period}: $${summary.totalSpend.toFixed(2)}`;
    }

    return {
      answer,
      breakdown: relevantCategory ? [relevantCategory] : summary.byCategory,
    };
  }
}
