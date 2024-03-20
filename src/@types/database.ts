import type { FieldValue, GeoPoint, Timestamp } from "firebase/firestore";
import { EmployeeRoles, ShiftPositions } from "./enum";

export interface ICompaniesCollection {
  CompanyId: string;
  CompanyName: string;
  CompanyEmail: string;
  CompanyAddress: string;
  CompanyLogo: string;
  CompanyCreatedAt: Timestamp | FieldValue;
  CompanyModifiedAt: Timestamp | FieldValue;
}

export interface IAdminsCollection {
  AdminId: string;
  AdminName: string;
  AdminEmail: string;
  AdminPhone: string;
  AdminCompanyId: string;
  AdminCreatedAt: Timestamp | FieldValue;
  AdminModifiedAt: Timestamp | FieldValue;
}

export interface IEmployeesCollection {
  EmployeeId: string;
  EmployeeName: string;
  EmployeeNameSearchIndex: string[];
  EmployeePhone: string;
  EmployeeEmail: string;
  EmployeePassword: string;
  EmployeeImg: string;
  EmployeeAdditionalDoc?: string;
  EmployeeRole: EmployeeRoles;
  EmployeeIsBanned: boolean;
  EmployeeCompanyId: string;
  EmployeeCreatedAt: Timestamp | FieldValue;
  EmployeeModifiedAt: Timestamp | FieldValue;
}

export interface IShiftsCollection {
  ShiftId: string;
  ShiftName: string;
  ShiftPosition: ShiftPositions;
  ShiftDate: Timestamp | FieldValue;
  ShiftStartTime: string;
  ShiftEndTime: string;
  ShiftLocation: GeoPoint;
  ShiftAddress: string;
  ShiftDescription: string | null;
  ShiftAssignedUserId: string | null;
  ShiftCompanyId: string;
  ShiftCreatedAt: Timestamp | FieldValue;
  ShiftModifiedAt: Timestamp | FieldValue;
}

export interface IPatrolCheckPointsChild {
  CheckPointId: string;
  CheckPointName: string;
  CheckPointStatus: "checked" | "not_checked";
  CheckPointCheckedTime?: Timestamp | FieldValue;
  CheckPointFailureReason?: string;
}

export interface IPatrolsCollection {
  PatrolId: string;
  PatrolCompanyId: string;
  PatrolName: string;
  PatrolNameSearchIndex: string[];
  PatrolArea: string;
  PatrolLocation: GeoPoint;
  PatrolTime: Timestamp | FieldValue;
  PatrolAssignedGuardId: string;
  PatrolAssignedGuardName: string;
  PatrolCheckPoints: IPatrolCheckPointsChild[];
  PatrolCurrentStatus: "pending" | "started" | "completed";
  PatrolGuardCurrentLocation?: GeoPoint;
  PatrolFailureReason?: string;
  PatrolRestrictedRadius: number;
  PatrolKeepGuardInRadiusOfLocation: boolean;
  PatrolCreatedAt: Timestamp | FieldValue;
  PatrolModifiedAt: Timestamp | FieldValue;
}

export interface IIncidentsCollection {
  IncidentId: string;
  IncidentCompanyId: string;
  IncidentEmployeeId: string;
  IncidentEmployeeName: string;
  IncidentEmployeeRole: EmployeeRoles;
  IncidentFieldId: string;
  IncidentArea: string;
  IncidentLocation: GeoPoint;
  IncidentNarrative: string;
  IncidentCreatedAt: Timestamp | FieldValue;
  IncidentUpdatedAt: Timestamp | FieldValue;
}
