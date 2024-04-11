import type { FieldValue, GeoPoint, Timestamp } from "firebase/firestore";
import { IUserType } from "./enum";

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

export interface IEmpLicenseDetails {
  LicenseType: "driving" | "security";
  LicenseNumber: string;
  LicenseExpDate: Timestamp | FieldValue;
  LicenseImg: string | null;
}
export interface IEmpBankDetails {
  BankName: string;
  BankAccName: string;
  BankAccNumber: string;
  BankIfscCode: string;
  BankVoidCheckImg: string;
}

export interface IEmpCertificatesDetails {
  CertificateName: string;
  CertificateDoc: string;
}

export interface IEmployeesCollection {
  EmployeeId: string;
  EmployeeName: string;
  EmployeeNameSearchIndex: string[];
  EmployeePhone: string;
  EmployeeEmail: string;
  EmployeePassword: string;
  EmployeeImg: string;
  EmployeeRole: string;
  EmployeePayRate: number;
  EmployeeMaxHrsPerWeek: number;
  EmployeeIsAvailable: "available" | "out_of_reach" | "on_vacation";
  EmployeeSupervisorId: string | null;
  EmployeeIsBanned: boolean;
  EmployeeCompanyId: string;
  EmployeeCompanyBranchId?: string | null;
  EmployeeLicenses: IEmpLicenseDetails[];
  EmployeeBankDetails: IEmpBankDetails;
  EmployeeCertificates: IEmpCertificatesDetails[];
  EmployeeCreatedAt: Timestamp | FieldValue;
  EmployeeModifiedAt: Timestamp | FieldValue;
}

export interface IShiftTasksChild {
  ShiftTaskId: string;
  ShiftTask: string;
  ShiftTaskQrCodeReq: boolean;
  ShiftTaskReturnReq: boolean;
  ShiftTaskStatus: {
    TaskStatus: "pending" | "completed";
    TaskCompletedById?: string;
    TaskCompletedByName?: string;
    TaskCompletionTime?: Timestamp | FieldValue;
    TaskFailureReason?: string;
  }[];
  ShiftTaskPhotos?: string[];
}

export interface IShiftsCollection {
  ShiftId: string;
  ShiftName: string;
  ShiftPosition: string;
  ShiftDate: Timestamp | FieldValue;
  ShiftStartTime: string;
  ShiftEndTime: string;
  ShiftLocation: GeoPoint | null; //* Null for mobile guard
  ShiftLocationId: string | null; //* Null for mobile guard
  ShiftLocationName: string | null; //* Null for mobile guard
  ShiftLocationAddress: string | null; //* Null for mobile guard
  ShiftRestrictedRadius: number;
  ShiftEnableRestrictedRadius: boolean;
  ShiftDescription: string | null;
  ShiftAssignedUserId: string[];
  ShiftClientId: string | null; //*Null for mobile guard
  ShiftCompanyId: string;
  ShiftRequiredEmp: number; //* By default 1
  ShiftCompanyBranchId?: string | null;
  ShiftAcknowledgedByEmpId: string[];
  ShiftTask: IShiftTasksChild[];
  ShiftGuardWellnessReport: {
    WellnessLastReported: Timestamp | FieldValue;
    WellnessReportedById: string; //*Emp id
  }[];
  ShiftPhotos?: string[];
  ShiftPhotoUploadIntervalInMinutes?: number | null;
  ShiftCurrentStatus: {
    Status: "pending" | "started" | "completed";
    StatusReportedById?: string;
    StatusReportedByName?: string;
    StatusReportedTime?: Timestamp | FieldValue;
    StatusShiftTotalHrs?: number;
  }[];
  ShiftLinkedPatrolIds: string[];
  ShiftCreatedAt: Timestamp | FieldValue;
  ShiftModifiedAt: Timestamp | FieldValue;
}

export interface IPatrolCheckPointsChild {
  CheckPointId: string;
  CheckPointName: string;
  CheckPointCategory: string | null;
  CheckPointHint: string | null;
  CheckPointStatus: {
    Status: "checked" | "not_checked";
    StatusReportedById?: string;
    StatusReportedByName?: string;
    StatusReportedTime?: Timestamp | FieldValue;
    StatusFailureReason?: string;
  }[];
}

export interface IPatrolsCollection {
  PatrolId: string;
  PatrolCompanyId: string;
  PatrolName: string;
  PatrolNameSearchIndex: string[];
  PatrolLocation: GeoPoint;
  PatrolLocationId: string;
  PatrolLocationName: string;
  PatrolRequiredCount: number;
  PatrolCheckPoints: IPatrolCheckPointsChild[];
  PatrolCurrentStatus: {
    Status: "pending" | "started" | "completed";
    StatusCompletedCount: number;
    StatusReportedById?: string;
    StatusReportedByName?: string;
    StatusReportedTime?: Timestamp | FieldValue;
  }[];
  PatrolFailureReason?: string;
  PatrolClientId?: string | null;
  PatrolRestrictedRadius: number;
  PatrolKeepGuardInRadiusOfLocation: boolean;
  PatrolReminderInMinutes: number;
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
  LoggedInUserType: IUserType;
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
  ClientPhone: string;
  ClientNameSearchIndex: string[];
  ClientEmail: string; //* This will be used for client portal login
  ClientPassword: string; //* This will be used for client portal login
  ClientAddress: string | null;
  ClientContractStartDate: Timestamp | FieldValue;
  ClientContractEndDate: Timestamp | FieldValue;
  ClientContractAmount: number;
  ClientHourlyRate: number;
  ClientBalance: number;
  ClientCreatedAt: Timestamp | FieldValue;
  ClientModifiedAt: Timestamp | FieldValue;
}

export interface ISettingsCollection {
  SettingId: string;
  SettingCompanyId: string;
  SettingEmpWellnessIntervalInMins: number;
}

//*SuperAdmin
export interface ISuperAdminCollection {
  SuperAdminId: string;
  SuperAdminEmail: string;
  SuperAdminName: string;
  SuperAdminPhone: string;
}
