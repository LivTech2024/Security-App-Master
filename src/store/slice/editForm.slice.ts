import { StateCreator } from "zustand";
import {
  IEmployeesCollection,
  ILocationsCollection,
  IShiftsCollection,
} from "../../@types/database";
import { CompanyBranches } from "./auth.slice";

export interface Employee
  extends Omit<
    IEmployeesCollection,
    "EmployeeCreatedAt" | "EmployeeModifiedAt"
  > {
  EmployeeCreatedAt: string;
  EmployeeModifiedAt: string;
}

export interface Shift
  extends Omit<
    IShiftsCollection,
    "ShiftDate" | "ShiftCreatedAt" | "ShiftModifiedAt"
  > {
  ShiftDate: string;
  ShiftCreatedAt: string;
  ShiftModifiedAt: string;
}

export interface Location
  extends Omit<ILocationsCollection, "LocationCreatedAt"> {
  LocationCreatedAt: string;
}

interface EditFormState {
  employeeEditData: Employee | null;
  setEmployeeEditData: (emp: Employee | null) => void;
  shiftEditData: Shift | null;
  setShiftEditData: (shift: Shift | null) => void;

  locationEditData: Location | null;
  setLocationEditData: (loc: Location | null) => void;

  companyBranchEditData: CompanyBranches | null;
  setCompanyBranchEditData: (branch: CompanyBranches | null) => void;
}

export const createEditFormSlice: StateCreator<EditFormState> = (set) => ({
  //Emp
  employeeEditData: null,
  setEmployeeEditData: (emp) =>
    set((state) => ({ ...state, employeeEditData: emp })),

  //Shift
  shiftEditData: null,
  setShiftEditData: (shift) =>
    set((state) => ({ ...state, shiftEditData: shift })),

  //Location
  locationEditData: null,
  setLocationEditData: (loc) =>
    set((state) => ({ ...state, locationEditData: loc })),

  //Company Branch
  //Location
  companyBranchEditData: null,
  setCompanyBranchEditData: (branch) =>
    set((state) => ({ ...state, companyBranchEditData: branch })),
});
