export function formatMonthLabel(monthYear: string): string {
  const [year, month] = monthYear.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function currency(value: number, options: Intl.NumberFormatOptions = {}): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    ...options,
  });
}

export function currencyWithCents(value: number): string {
  return currency(value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function signedCurrency(value: number): string {
  const formatted = currency(Math.abs(value));
  return value > 0 ? `+${formatted}` : value < 0 ? `-${formatted}` : formatted;
}

export function elapsedDaysInMonth(monthYear: string, now = new Date()): number {
  const [year, month] = monthYear.split("-").map(Number);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year > currentYear || (year === currentYear && month > currentMonth)) return 0;
  if (year === currentYear && month === currentMonth) return now.getDate();

  return new Date(year, month, 0).getDate();
}
