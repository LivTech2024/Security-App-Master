import type { FieldValue, GeoPoint, Timestamp } from "firebase/firestore";

export interface ICompaniesCollection {
  CompanyId: string;
  CompanyName: string;
  CompanyEmail: string;
  CompanyPhone: string;
  CompanyAddress: string;
  CompanyLogo: string;
  CompanyCreatedAt: Timestamp | FieldValue;
  CompanyModifiedAt: Timestamp | FieldValue;
}

export interface ICompanyBranchesCollection {
  CompanyBranchId: string;
  CompanyId: string;
  CompanyBranchName: string;
  CompanyBranchEmail: string;
  CompanyBranchPhone: string;
  CompanyBranchAddress: string;
  CompanyBranchCreatedAt: Timestamp | FieldValue;
  CompanyBranchModifiedAt: Timestamp | FieldValue;
}

export interface IEmployeeRolesCollection {
  EmployeeRoleId: string;
  EmployeeRoleCompanyId: string;
  EmployeeRoleName: string;
  EmployeeRoleIsDeletable: boolean;
  EmployeeRoleCreatedAt: Timestamp | FieldValue;
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
  EmployeeRole: string;
  EmployeePayRate: number;
  EmployeeMaxHrsPerWeek: number;
  EmployeeIsBanned: boolean;
  EmployeeCompanyId: string;
  EmployeeCompanyBranchId?: string | null;
  EmployeeCreatedAt: Timestamp | FieldValue;
  EmployeeModifiedAt: Timestamp | FieldValue;
}

export interface IShiftTasksChild {
  ShiftTaskId: string;
  ShiftTask: string;
  ShiftTaskQrCodeReq: boolean;
  ShiftTaskCompleted?: boolean;
  ShiftTaskCompletionTime?: Timestamp | FieldValue;
  ShiftTaskFailureReason?: string;
}

export interface IShiftsCollection {
  ShiftId: string;
  ShiftName: string;
  ShiftPosition: string;
  ShiftDate: Timestamp | FieldValue;
  ShiftStartTime: string;
  ShiftEndTime: string;
  ShiftLocation: GeoPoint;
  ShiftLocationName: string;
  ShiftRestrictedRadius: number;
  ShiftAddress: string;
  ShiftDescription: string | null;
  ShiftAssignedUserId: string[];
  ShiftClientId: string;
  ShiftCompanyId: string;
  ShiftRequiredEmp: number; //* By default 1
  ShiftCompanyBranchId?: string | null;
  ShiftAcknowledged?: boolean;
  ShiftTask: IShiftTasksChild[];
  ShiftCurrentStatus: "pending" | "started" | "completed";
  ShiftCreatedAt: Timestamp | FieldValue;
  ShiftModifiedAt: Timestamp | FieldValue;
}

export interface IPatrolCheckPointsChild {
  CheckPointId: string;
  CheckPointName: string;
  CheckPointTime: string;
  CheckPointStatus: "checked" | "not_checked";
  CheckPointCheckedTime?: Timestamp | FieldValue;
  CheckPointFailureReason?: string;
}

export interface IPatrolsCollection {
  PatrolId: string;
  PatrolCompanyId: string;
  PatrolCompanyBranchId?: string;
  PatrolName: string;
  PatrolNameSearchIndex: string[];
  PatrolArea: string;
  PatrolLocation: GeoPoint;
  PatrolLocationName: string;
  PatrolTime: Timestamp | FieldValue;
  PatrolAssignedGuardsId: string[];
  PatrolAssignedGuardsName: string[];
  PatrolCompletedCount: number;
  PatrolRequiredCount: number;
  PatrolCheckPoints: IPatrolCheckPointsChild[];
  PatrolCurrentStatus: "pending" | "started" | "completed";
  PatrolGuardCurrentLocation?: GeoPoint;
  PatrolFailureReason?: string;
  PatrolRestrictedRadius: number;
  PatrolKeepGuardInRadiusOfLocation: boolean;
  PatrolClientId: string;
  PatrolAcknowledged?: boolean;
  PatrolCreatedAt: Timestamp | FieldValue;
  PatrolModifiedAt: Timestamp | FieldValue;
}

export interface IReportsCollection {
  ReportId: string;
  ReportCompanyId: string;
  ReportCompanyBranchId?: string;
  ReportEmployeeId: string;
  ReportEmployeeName: string;
  ReportName: string; //* combination of location and reports name
  ReportCategory:
    | "general_concern"
    | "incident"
    | "maintenance"
    | "security_safety"
    | "vagrant_removal"
    | "other";
  ReportData: string;
  ReportImage?: string;
  ReportStatus: "pending" | "started" | "completed";
  ReportCreatedAt: Timestamp | FieldValue;
}

export interface INotificationsCollection {
  NotificationId: string;
  NotificationCompanyId: string;
  NotificationBranchId?: string;
  NotificationCreatedBy: "admin" | "employee";
  NotificationCreatorId: string;
  NotificationTitle: string;
  NotificationData: string;
  NotificationCreatedAt: Timestamp | FieldValue;
}

export interface ILocationsCollection {
  LocationId: string;
  LocationCompanyId: string;
  LocationName: string;
  LocationSearchIndex: string[];
  LocationAddress: string;
  LocationCoordinates: GeoPoint;
  LocationCreatedAt: Timestamp | FieldValue;
}

export interface ILoggedInUsersCollection {
  LoggedInId: string;
  LoggedInUserId: string;
  IsLoggedIn: boolean;
  LoggedInCrypt: string;
  LoggedInUserType: string;
  LoggedInCreatedAt: Timestamp | FieldValue;
}

export interface IInvoiceItems {
  ItemDescription: string;
  ItemQuantity: number;
  ItemPrice: number;
  ItemTotal: number;
}

export interface IInvoiceTaxList {
  TaxName: string;
  TaxAmount: number;
}
export interface IInvoicesCollection {
  InvoiceId: string;
  InvoiceCompanyId: string;
  InvoiceClientId: string;
  InvoiceClientName: string;
  InvoiceClientPhone: string;
  InvoiceClientAddress: string | null;
  InvoiceNumber: string;
  InvoiceDate: Timestamp | FieldValue;
  InvoiceDueDate: Timestamp | FieldValue;
  InvoiceItems: IInvoiceItems[];
  InvoiceSubtotal: number;
  InvoiceTaxList: IInvoiceTaxList[];
  InvoiceReceivedAmount: number;
  InvoiceTotalAmount: number;
  InvoiceDescription?: string | null;
  InvoiceTerms?: string | null;
  InvoiceCreatedAt: Timestamp | FieldValue;
  InvoiceModifiedAt: Timestamp | FieldValue;
}

export interface IClientsCollection {
  ClientId: string;
  ClientCompanyId: string;
  ClientName: string;
  ClientNameSearchIndex: string[];
  ClientEmail: string;
  ClientPhone: string;
  ClientAddress: string | null;
  ClientBalance: number;
  ClientCreatedAt: Timestamp | FieldValue;
  ClientModifiedAt: Timestamp | FieldValue;
}
