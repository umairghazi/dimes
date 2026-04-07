// Static seed data — written to UserCategory on first use per user.
// Not used as the runtime source of truth; fetch from DB instead.

export interface DefaultCategory {
  name: string;
  group: string | null;
  sortOrder: number;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: "Bill - Electricity",            group: "Bill",   sortOrder: 0 },
  { name: "Bill - Gas",                    group: "Bill",   sortOrder: 1 },
  { name: "Bill - Internet",               group: "Bill",   sortOrder: 2 },
  { name: "Bill - Phone",                  group: "Bill",   sortOrder: 3 },
  { name: "Bill - Water Heater Rental",    group: "Bill",   sortOrder: 4 },
  { name: "Car - Extra Payment",           group: "Car",    sortOrder: 0 },
  { name: "Car - Gas",                     group: "Car",    sortOrder: 1 },
  { name: "Car - Insurance",               group: "Car",    sortOrder: 2 },
  { name: "Car - Maintenance",             group: "Car",    sortOrder: 3 },
  { name: "Car - Parking",                 group: "Car",    sortOrder: 4 },
  { name: "Car - Payment",                 group: "Car",    sortOrder: 5 },
  { name: "Clothes / Style",               group: null,     sortOrder: 0 },
  { name: "Commute",                       group: null,     sortOrder: 0 },
  { name: "Fitness",                       group: null,     sortOrder: 0 },
  { name: "Fun / Entertainment",           group: null,     sortOrder: 0 },
  { name: "Gifts",                         group: null,     sortOrder: 0 },
  { name: "Giving - General",              group: "Giving", sortOrder: 0 },
  { name: "Giving - Sadaqah",              group: "Giving", sortOrder: 1 },
  { name: "Giving - Zakat",               group: "Giving", sortOrder: 2 },
  { name: "Groceries",                     group: null,     sortOrder: 0 },
  { name: "Health / Medical",              group: null,     sortOrder: 0 },
  { name: "Hobbies",                       group: null,     sortOrder: 0 },
  { name: "Home - Insurance",              group: "Home",   sortOrder: 0 },
  { name: "Home - Maintenance Fee",        group: "Home",   sortOrder: 1 },
  { name: "Home - Mortgage",              group: "Home",   sortOrder: 2 },
  { name: "Home - Property Tax",           group: "Home",   sortOrder: 3 },
  { name: "Home - Renovation / Work / Stuff", group: "Home", sortOrder: 4 },
  { name: "Investments",                   group: null,     sortOrder: 0 },
  { name: "Learning / Career",             group: null,     sortOrder: 0 },
  { name: "Miscellaneous",                 group: null,     sortOrder: 0 },
  { name: "Personal Care",                 group: null,     sortOrder: 0 },
  { name: "Physio / Massage",              group: null,     sortOrder: 0 },
  { name: "Restaurants",                   group: null,     sortOrder: 0 },
  { name: "Separation",                    group: null,     sortOrder: 0 },
  { name: "Subscription / Membership Fee", group: null,     sortOrder: 0 },
  { name: "Toll",                          group: null,     sortOrder: 0 },
  { name: "Travel",                        group: null,     sortOrder: 0 },
];
