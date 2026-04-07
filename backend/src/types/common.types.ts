export type ExpenseCategory =
  | "Bill - Electricity"
  | "Bill - Gas"
  | "Bill - Internet"
  | "Bill - Phone"
  | "Bill - Water Heater Rental"
  | "Car - Extra Payment"
  | "Car - Gas"
  | "Car - Insurance"
  | "Car - Maintenance"
  | "Car - Parking"
  | "Car - Payment"
  | "Clothes / Style"
  | "Commute"
  | "Fitness"
  | "Fun / Entertainment"
  | "Gifts"
  | "Giving - General"
  | "Giving - Sadaqah"
  | "Giving - Zakat"
  | "Groceries"
  | "Health / Medical"
  | "Hobbies"
  | "Home - Insurance"
  | "Home - Maintenance Fee"
  | "Home - Mortgage"
  | "Home - Property Tax"
  | "Home - Renovation / Work / Stuff"
  | "Investments"
  | "Learning / Career"
  | "Miscellaneous"
  | "Personal Care"
  | "Physio / Massage"
  | "Restaurants"
  | "Separation"
  | "Subscription / Membership Fee"
  | "Toll"
  | "Travel";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Bill - Electricity",
  "Bill - Gas",
  "Bill - Internet",
  "Bill - Phone",
  "Bill - Water Heater Rental",
  "Car - Extra Payment",
  "Car - Gas",
  "Car - Insurance",
  "Car - Maintenance",
  "Car - Parking",
  "Car - Payment",
  "Clothes / Style",
  "Commute",
  "Fitness",
  "Fun / Entertainment",
  "Gifts",
  "Giving - General",
  "Giving - Sadaqah",
  "Giving - Zakat",
  "Groceries",
  "Health / Medical",
  "Hobbies",
  "Home - Insurance",
  "Home - Maintenance Fee",
  "Home - Mortgage",
  "Home - Property Tax",
  "Home - Renovation / Work / Stuff",
  "Investments",
  "Learning / Career",
  "Miscellaneous",
  "Personal Care",
  "Physio / Massage",
  "Restaurants",
  "Separation",
  "Subscription / Membership Fee",
  "Toll",
  "Travel",
];

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
