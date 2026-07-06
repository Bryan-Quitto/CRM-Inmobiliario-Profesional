import { create } from 'zustand';

interface PendingOperationsState {
  pendingCount: number;
  addPendingOperation: () => void;
  removePendingOperation: () => void;
  resetPendingOperations: () => void;
}

export const usePendingOperationsStore = create<PendingOperationsState>((set) => ({
  pendingCount: 0,
  addPendingOperation: () => set((state) => ({ pendingCount: state.pendingCount + 1 })),
  removePendingOperation: () => set((state) => ({ pendingCount: Math.max(0, state.pendingCount - 1) })),
  resetPendingOperations: () => set({ pendingCount: 0 })
}));
