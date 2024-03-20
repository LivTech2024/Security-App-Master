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
}

export const createAuthSlice: StateCreator<AuthState> = (set) => ({
  company: {
    CompanyAddress: "",
    CompanyCreatedAt: "",
    CompanyModifiedAt: "",
    CompanyEmail: "sapp69750@gmail.com",
    CompanyId: "aSvLtwII6Cjs7uCISBRR",
    CompanyLogo: "",
    CompanyName: "Livtech",
  },
  setCompany: (cmp) => set((state) => ({ ...state, company: cmp })),

  admin: {
    AdminCompanyId: "aSvLtwII6Cjs7uCISBRR",
    AdminEmail: "sapp69750@gmail.com",
    AdminId: "LYVivgudt3LJU7qAEIDq",
    AdminName: "Jhon Doe",
    AdminPhone: "+918624016814",
    AdminCreatedAt: "",
    AdminModifiedAt: "",
  },
  setAdmin: (admin) => set((state) => ({ ...state, admin })),
});
