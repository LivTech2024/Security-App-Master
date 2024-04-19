import { StateCreator } from 'zustand';
import {
  IAdminsCollection,
  ICompaniesCollection,
  ICompanyBranchesCollection,
  IEmployeeRolesCollection,
  ILoggedInUsersCollection,
  ISettingsCollection,
  ISuperAdminCollection,
} from '../../@types/database';
import * as storage from '../../utilities/Storage';
import { LocalStorageKey } from '../../@types/enum';
import DbCompany from '../../firebase_configs/DB/DbCompany';
import { Client } from './editForm.slice';

export interface Company
  extends Omit<ICompaniesCollection, 'CompanyCreatedAt' | 'CompanyModifiedAt'> {
  CompanyCreatedAt: string;
  CompanyModifiedAt: string;
}

export interface Admin
  extends Omit<IAdminsCollection, 'AdminCreatedAt' | 'AdminModifiedAt'> {
  AdminCreatedAt: string;
  AdminModifiedAt: string;
}

export interface EmployeeRoles
  extends Omit<IEmployeeRolesCollection, 'EmployeeRoleCreatedAt'> {
  EmployeeRoleCreatedAt: string;
}

export interface CompanyBranches
  extends Omit<
    ICompanyBranchesCollection,
    'CompanyBranchCreatedAt' | 'CompanyBranchModifiedAt'
  > {
  CompanyBranchCreatedAt: string;
  CompanyBranchModifiedAt: string;
}

interface AuthState {
  superAdmin: ISuperAdminCollection | null;
  setSuperAdmin: (superAdmin: ISuperAdminCollection | null) => void;
  company: Company | null;
  setCompany: (cmp: Company | null) => void;
  admin: Admin | null;
  setAdmin: (admin: Admin | null) => void;
  client: Client | null;
  setClient: (client: Client | null) => void;
  companyBranches: CompanyBranches[];
  setCompanyBranches: (cmpBranches: CompanyBranches[]) => void;
  empRoles: EmployeeRoles[];
  setEmpRoles: (empRoles: EmployeeRoles[]) => void;
  settings: ISettingsCollection | null;
  setSettings: (settings: ISettingsCollection | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  userSignOut: () => void;
}

export const createAuthSlice: StateCreator<AuthState> = (set) => ({
  superAdmin: null,
  setSuperAdmin: (superAdmin) => set((state) => ({ ...state, superAdmin })),
  company: null,
  setCompany: (cmp) => set((state) => ({ ...state, company: cmp })),
  admin: null,
  setAdmin: (admin) => set((state) => ({ ...state, admin })),
  client: null,
  setClient: (client) => set((state) => ({ ...state, client })),
  companyBranches: [],
  setCompanyBranches: (companyBranches) =>
    set((state) => ({ ...state, companyBranches })),
  empRoles: [],
  setEmpRoles: (empRoles) => set((state) => ({ ...state, empRoles })),
  settings: null,
  setSettings: (settings) => set((state) => ({ ...state, settings })),
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
        client: null,
        superAdmin: null,
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
