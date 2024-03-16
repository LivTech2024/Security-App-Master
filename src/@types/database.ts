import type { FieldValue, Timestamp } from "firebase/firestore";

export enum EmployeeRoles {
  supervisor = "supervisor",
  guard = "guard",
  other = "other",
}

export interface IEmployeesCollection {
  EmployeeId: string;
  EmployeeName: string;
  EmployeeNameSearchIndex: string[];
  EmployeePhone: string;
  EmployeeEmail: string;
  EmployeeRole: EmployeeRoles;
  EmployeeIsBanned: boolean;
  EmployeeCreatedAt: Timestamp | FieldValue;
  EmployeeModifiedAt: Timestamp | FieldValue;
}

export enum ShiftPositions {
  supervisor = "supervisor",
  guard = "guard",
  other = "other",
}

export interface IShiftsCollection {
  ShiftId: string;
  ShiftName: string;
  ShiftPosition: ShiftPositions;
  ShiftDate: Timestamp | FieldValue;
  ShiftStartTime: string;
  ShiftEndTime: string;
  ShiftDescription: string | null;
  ShiftAssignedUserId: string | null;
  ShiftCreatedAt: Timestamp | FieldValue;
  ShiftModifiedAt: Timestamp | FieldValue;
}
