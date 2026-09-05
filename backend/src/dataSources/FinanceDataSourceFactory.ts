import { env } from "../config/env";
import { DbFinanceDataSource } from "./DbFinanceDataSource";
import { FinanceDataSource } from "./FinanceDataSource";
import { GoogleSheetsFinanceDataSource } from "./GoogleSheetsFinanceDataSource";

let instance: FinanceDataSource | null = null;

export function getFinanceDataSource(): FinanceDataSource {
  if (instance) return instance;

  switch (env.DATA_SOURCE_PROVIDER) {
    case "google-sheets":
      instance = new GoogleSheetsFinanceDataSource();
      break;
    case "db":
    default:
      instance = new DbFinanceDataSource();
      break;
  }

  return instance;
}
