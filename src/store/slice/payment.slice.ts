import { StateCreator } from 'zustand';

interface PaymentState {
  recentInvoiceNumber: number;
  setRecentInvoiceNumber: (invNumber: number) => void;
}

export const createPaymentSlice: StateCreator<PaymentState> = (set) => ({
  recentInvoiceNumber: 1000,
  setRecentInvoiceNumber: (invNumber) =>
    set((state) => ({ ...state, recentInvoiceNumber: invNumber })),
});
