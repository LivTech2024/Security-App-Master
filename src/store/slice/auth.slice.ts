import { StateCreator } from "zustand";
import {
  IAdminsCollection,
  ICompaniesCollection,
  ILoggedInUsersCollection,
} from "../../@types/database";
import * as storage from "../../utilities/Storage";
import { LocalStorageKey } from "../../@types/enum";
import DbCompany from "../../firebase_configs/DB/DbCompany";

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
  userSignOut: () => void;
}

export const createAuthSlice: StateCreator<AuthState> = (set) => ({
  company: null,
  setCompany: (cmp) => set((state) => ({ ...state, company: cmp })),
  admin: null,
  setAdmin: (admin) => set((state) => ({ ...state, admin })),
  loading: true,
  setLoading: (loading) => set((state) => ({ ...state, loading })),
  // For logging out user
  userSignOut: () => {
    const loggedInUser: ILoggedInUsersCollection | null = storage.getJson(
      LocalStorageKey.LOGGEDIN_USER
    );

    if (loggedInUser) {
      set((state) => ({
        ...state,
        admin: null,
        company: null,
      }));
      DbCompany.deleteUserLoggedInDoc(loggedInUser.LoggedInId)
        .then(() => {
          storage.clear(LocalStorageKey.LOGGEDIN_USER);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  },
});
