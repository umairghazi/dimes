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

export interface CategoryGroup {
  parent: string;
  children: ExpenseCategory[];
}

export const CATEGORY_TREE: CategoryGroup[] = [
  {
    parent: "Bill",
    children: [
      "Bill - Electricity",
      "Bill - Gas",
      "Bill - Internet",
      "Bill - Phone",
      "Bill - Water Heater Rental",
    ],
  },
  {
    parent: "Car",
    children: [
      "Car - Extra Payment",
      "Car - Gas",
      "Car - Insurance",
      "Car - Maintenance",
      "Car - Parking",
      "Car - Payment",
    ],
  },
  { parent: "Clothes / Style", children: ["Clothes / Style"] },
  { parent: "Commute", children: ["Commute"] },
  { parent: "Fitness", children: ["Fitness"] },
  { parent: "Fun / Entertainment", children: ["Fun / Entertainment"] },
  { parent: "Gifts", children: ["Gifts"] },
  {
    parent: "Giving",
    children: ["Giving - General", "Giving - Sadaqah", "Giving - Zakat"],
  },
  { parent: "Groceries", children: ["Groceries"] },
  { parent: "Health / Medical", children: ["Health / Medical"] },
  { parent: "Hobbies", children: ["Hobbies"] },
  {
    parent: "Home",
    children: [
      "Home - Insurance",
      "Home - Maintenance Fee",
      "Home - Mortgage",
      "Home - Property Tax",
      "Home - Renovation / Work / Stuff",
    ],
  },
  { parent: "Investments", children: ["Investments"] },
  { parent: "Learning / Career", children: ["Learning / Career"] },
  { parent: "Miscellaneous", children: ["Miscellaneous"] },
  { parent: "Personal Care", children: ["Personal Care"] },
  { parent: "Physio / Massage", children: ["Physio / Massage"] },
  { parent: "Restaurants", children: ["Restaurants"] },
  { parent: "Separation", children: ["Separation"] },
  { parent: "Subscription / Membership Fee", children: ["Subscription / Membership Fee"] },
  { parent: "Toll", children: ["Toll"] },
  { parent: "Travel", children: ["Travel"] },
];

export interface Expense {
  id: string;
  userId: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  subCategory?: string;
  merchantName?: string;
  source: "manual" | "csv-upload";
  isRecurring: boolean;
  tags: string[];
  originalDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseFilters {
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  source?: string;
  isRecurring?: boolean;
}

export interface PaginatedExpenses {
  data: Expense[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
