import { StateCreator } from "zustand";
import { IAdminsCollection, ICompaniesCollection } from "../../@types/database";

export interface Company
  extends Omit<ICompaniesCollection, "CompanyCreatedAt" | "CompanyModifiedAt"> {
  CompanyCreatedAt: string;
  CompanyModifiedAt: string;
}

export interface Admin
  extends Omit<IAdminsCollection, "AdminCreatedAt" | "AdminModifiedAt"> {
  AdminCreatedAt: string;
  AdminModifiedAt: string;
}

interface AuthState {
  company: Company | null;
  setCompany: (cmp: Company | null) => void;
  admin: Admin | null;
  setAdmin: (admin: Admin | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const createAuthSlice: StateCreator<AuthState> = (set) => ({
  company: null,
  setCompany: (cmp) => set((state) => ({ ...state, company: cmp })),
  admin: null,
  setAdmin: (admin) => set((state) => ({ ...state, admin })),
  loading: true,
  setLoading: (loading) => set((state) => ({ ...state, loading })),
});
