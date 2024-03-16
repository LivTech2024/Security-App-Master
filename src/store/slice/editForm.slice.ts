import { StateCreator } from "zustand";
import { IEmployeesCollection, IShiftsCollection } from "../../@types/database";

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

interface EditFormState {
  employeeEditData: Employee | null;
  setEmployeeEditData: (emp: Employee | null) => void;
  shiftEditData: Shift | null;
  setShiftEditData: (shift: Shift | null) => void;
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
});
