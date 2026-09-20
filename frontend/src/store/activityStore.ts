import { create } from "zustand";

export const useActivityStore = create<{ pending: number }>(() => ({ pending: 0 }));

export function beginActivity(): () => void {
  useActivityStore.setState((state) => ({ pending: state.pending + 1 }));
  let finished = false;
  return () => {
    if (finished) return;
    finished = true;
    useActivityStore.setState((state) => ({ pending: Math.max(0, state.pending - 1) }));
  };
}
