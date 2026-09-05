import { FinanceDataSource } from "./FinanceDataSource";
import { GoogleSheetsFinanceDataSource } from "./GoogleSheetsFinanceDataSource";

let instance: FinanceDataSource | null = null;

export function getFinanceDataSource(): FinanceDataSource {
  if (instance) return instance;
  instance = new GoogleSheetsFinanceDataSource();
  return instance;
}
