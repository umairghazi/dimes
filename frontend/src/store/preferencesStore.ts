import { create } from "zustand";
import { persist } from "zustand/middleware";

const CURRENCIES = ["USD", "CAD", "EUR", "GBP", "AUD"] as const;
export type Currency = (typeof CURRENCIES)[number];
export { CURRENCIES };

interface PreferencesState {
  currency: Currency;
  setCurrency: (c: Currency) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      currency: "USD",
      setCurrency: (currency) => set({ currency }),
    }),
    { name: "preferences-storage" },
  ),
);
