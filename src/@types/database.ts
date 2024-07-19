import type { FieldValue, GeoPoint, Timestamp } from 'firebase/firestore';
import { IUserType } from './enum';

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
  LicenseType: 'driving' | 'security';
  LicenseNumber: string;
  LicenseExpDate: Timestamp | FieldValue;
  LicenseImg: string | null;
}
export interface IEmpBankDetails {
  BankAccNumber: string;
  BankTransitNumber: string;
  BankInstitutionNumber: string;
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
  EmployeeImg: string | null;
  EmployeeRole: string;
  EmployeePayRate: number;
  EmployeeMaxHrsPerWeek: number;
  EmployeeIsAvailable: 'available' | 'out_of_reach' | 'on_vacation';
  EmployeeSupervisorId: string[] | null;
  EmployeeBannedLocationsId: string[] | null;
  EmployeeCompanyId: string;
  EmployeeCompanyBranchId?: string | null;
  EmployeeLicenses: IEmpLicenseDetails[];
  EmployeeBankDetails: IEmpBankDetails | null;
  EmployeeSinNumber: string | null;
  EmployeeCertificates: IEmpCertificatesDetails[];
  EmployeeAddress?: string | null;
  EmployeePostalCode?: string | null;
  EmployeeCity?: string | null;
  EmployeeProvince?: string | null;
  EmployeeCurrentLocation?: GeoPoint;
  EmployeeCreatedAt: Timestamp | FieldValue;
  EmployeeModifiedAt: Timestamp | FieldValue;
}

export interface IEmployeeRouteCollection {
  EmpRouteId: string;
  EmpRouteDate: Timestamp | FieldValue; //*Same as Shift Date
  EmpRouteLocations: {
    LocationCoordinates: GeoPoint;
    LocationReportedAt: Timestamp | FieldValue;
  }[];
  EmpRouteEmpId: string;
  EmpRouteShiftId: string;
  EmpRouteCreatedAt: Timestamp;
}

export interface IShiftTasksChild {
  ShiftTaskId: string;
  ShiftTask: string;
  ShiftTaskQrCodeReq: boolean;
  ShiftTaskReturnReq: boolean;
  ShiftReturnTaskStatus: {
    TaskStatus: 'pending' | 'completed';
    TaskCompletedById?: string;
    TaskCompletedByName?: string;
    TaskCompletionTime?: Timestamp | FieldValue;
    TaskFailureReason?: string;
    TaskPhotos?: string[];
  }[];
  ShiftTaskStatus: {
    TaskStatus: 'pending' | 'completed';
    TaskCompletedById?: string;
    TaskCompletedByName?: string;
    TaskCompletionTime?: Timestamp | FieldValue;
    TaskFailureReason?: string;
    TaskPhotos?: string[];
  }[];
}

export interface IShiftLinkedPatrolsChildCollection {
  LinkedPatrolName: string;
  LinkedPatrolId: string;
  LinkedPatrolReqHitCount: number;
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
  ShiftRestrictedRadius: number | null;
  ShiftEnableRestrictedRadius: boolean;
  ShiftDescription: string | null;
  ShiftAssignedUserId: string[];
  ShiftClientId: string | null; //*Null for mobile guard
  ShiftCompanyId: string;
  ShiftRequiredEmp: number; //* By default 1
  ShiftCompanyBranchId: string;
  ShiftAcknowledgedByEmpId: string[];
  ShiftTask: IShiftTasksChild[];
  ShiftGuardWellnessReport: {
    WellnessEmpId: string;
    WellnessEmpName: string;
    WellnessReportedAt: Timestamp | FieldValue;
    WellnessComment?: string | null;
    WellnessImg?: string | null;
  }[];
  ShiftPhotoUploadIntervalInMinutes?: number | null;
  ShiftCurrentStatus: {
    Status: 'pending' | 'started' | 'completed';
    StatusReportedById?: string;
    StatusReportedByName?: string;
    StatusStartedTime?: Timestamp | FieldValue;
    StatusReportedTime?: Timestamp | FieldValue;
    StatusShiftTotalHrs?: number;
    StatusEndReason?: string;
  }[];
  ShiftLinkedPatrols: IShiftLinkedPatrolsChildCollection[];
  ShiftIsSpecialShift: boolean;
  ShiftCreatedAt: Timestamp | FieldValue;
  ShiftModifiedAt: Timestamp | FieldValue;
}

export interface IPatrolCheckPointsChild {
  CheckPointId: string;
  CheckPointName: string;
  CheckPointCategory: string | null;
  CheckPointHint: string | null;
  CheckPointStatus: {
    Status: 'checked' | 'not_checked';
    StatusReportedById?: string;
    StatusReportedByName?: string;
    StatusReportedTime?: Timestamp | FieldValue;
    StatusFailureReason?: string;
    StatusComment?: string | null;
    StatusImage?: string[];
  }[];
}

export interface IPatrolsCollection {
  PatrolId: string;
  PatrolCompanyId: string;
  PatrolCompanyBranchId?: string | null;
  PatrolName: string;
  PatrolNameSearchIndex: string[];
  PatrolLocation: GeoPoint;
  PatrolLocationId: string;
  PatrolLocationName: string;
  PatrolCheckPoints: IPatrolCheckPointsChild[];
  PatrolCurrentStatus: {
    Status: 'pending' | 'started' | 'completed';
    StatusCompletedCount: number;
    StatusReportedById?: string;
    StatusReportedByName?: string;
    StatusReportedTime?: Timestamp | FieldValue;
    StatusShiftId?: string;
  }[];
  PatrolFailureReason?: string;
  PatrolClientId: string;
  PatrolRestrictedRadius: number | null;
  PatrolKeepGuardInRadiusOfLocation: boolean;
  PatrolReminderInMinutes: number;
  PatrolCreatedAt: Timestamp | FieldValue;
  PatrolModifiedAt: Timestamp | FieldValue;
}

export interface IPatrolLogsCollection {
  PatrolLogId: string;
  PatrolId: string;
  PatrolLogShiftId: string;
  PatrolDate: Timestamp | FieldValue; //*Same as ShiftDate
  PatrolLogGuardId: string;
  PatrolLogGuardName: string;
  PatrolLogStartedAt: Timestamp | FieldValue;
  PatrolLogPatrolCount: number;
  PatrolLogCheckPoints: {
    CheckPointName: string;
    CheckPointStatus: 'checked' | 'not_checked';
    CheckPointReportedAt: Timestamp | FieldValue;
    CheckPointFailureReason?: string;
    CheckPointComment?: string | null;
    CheckPointImage?: string[];
  }[];
  PatrolLogFeedbackComment?: string | null;
  PatrolLogStatus: 'started' | 'completed';
  PatrolLogEndedAt: Timestamp | FieldValue;
  PatrolLogCreatedAt: Timestamp;
}

export interface IReportCategoriesCollection {
  ReportCategoryId: string;
  ReportCompanyId: string;
  ReportCategoryName: string;
  ReportCategoryCreatedAt: Timestamp | FieldValue;
}

export interface IReportsCollection {
  ReportId: string;
  ReportLocationId: string;
  ReportLocationName: string;
  ReportIsFollowUpRequired: boolean;
  ReportFollowedUpId?: string | null; //*Id of report which followed up this report
  ReportCompanyId: string;
  ReportCompanyBranchId?: string;
  ReportEmployeeId: string;
  ReportEmployeeName: string;
  ReportName: string;
  ReportCategoryName: string;
  ReportCategoryId: string;
  ReportData: string;
  ReportShiftId?: string | null;
  ReportCalloutId?: string | null;
  ReportPatrolId?: string | null;
  ReportImage?: string[];
  ReportVideo?: string[];
  ReportStatus: 'pending' | 'started' | 'completed';
  ReportClientId: string;
  ReportCreatedAt: Timestamp | FieldValue;
}

export interface IDocumentCategories {
  DocumentCategoryId: string;
  DocumentCategoryCompanyId: string;
  DocumentCategoryName: string;
  DocumentCategoryCreatedAt: Timestamp | FieldValue;
}

export interface IDocumentsCollection {
  DocumentId: string;
  DocumentName: string;
  DocumentNameSearchIndex: string[];
  DocumentCompanyId: string;
  DocumentCategoryName: string;
  DocumentCategoryId: string;
  DocumentUrl: string;
  DocumentCreatedAt: Timestamp | FieldValue;
  DocumentModifiedAt: Timestamp | FieldValue;
}

export interface IMessagesCollection {
  MessageId: string;
  MessageCompanyId: string;
  MessageType: 'message' | 'panic';
  MessageData: string;
  MessageCreatedById: string;
  MessageCreatedByName: string;
  MessageReceiversId: string[];
  MessageCreatedAt: Timestamp | FieldValue;
}

export interface ILocationPostOrderChildCollection {
  PostOrderPdf: string;
  PostOrderTitle: string;
  PostOrderOtherData?: string[];
  PostOrderComment?: string | null;
}

export interface ILocationsCollection {
  LocationId: string;
  LocationCompanyId: string;
  LocationClientId: string;
  LocationName: string;
  LocationSearchIndex: string[];
  LocationAddress: string;
  LocationCoordinates: GeoPoint;
  LocationContractStartDate: Timestamp | FieldValue;
  LocationContractEndDate: Timestamp | FieldValue;
  LocationContractAmount: number;
  LocationPatrolPerHitRate: number;
  LocationShiftHourlyRate: number;
  LocationPostOrder?: ILocationPostOrderChildCollection | null;
  LocationCalloutDetails: {
    CalloutCostInitialMinutes: number;
    CalloutCostInitialCost: number;
    CalloutCostPerHour: number;
  };
  LocationManagerName: string;
  LocationManagerEmail: string; //*All the email report will be sent to this email id
  LocationSendEmailToClient: boolean; //*by default true
  LocationSendEmailForEachPatrol: boolean; //*by default true
  LocationSendEmailForEachShift: boolean; //*by default true
  LocationModifiedAt: Timestamp | FieldValue;
  LocationCreatedAt: Timestamp | FieldValue;
}

export interface ILoggedInUsersCollection {
  LoggedInId: string;
  LoggedInUserId: string;
  IsLoggedIn: boolean;
  LoggedInCrypt: string;
  LoggedInUserType: IUserType;
  LoggedInCreatedAt: Timestamp | FieldValue;
  LoggedInNotifyFcmToken?: string;
  LoggedInPlatform: 'web' | 'android' | 'ios';
}

export interface IInvoiceItems {
  ItemDescription: string;
  ItemQuantity: number;
  ItemPrice: number;
  ItemTotal: number;
}

export interface IInvoiceTaxList {
  TaxName: string;
  TaxPercentage: number;
  TaxAmount: number;
}
export interface IInvoicesCollection {
  InvoiceId: string;
  InvoiceCompanyId: string;
  InvoiceCompanyBranchId?: string | null;
  InvoiceClientId: string;
  InvoiceClientName: string;
  InvoiceClientPhone: string;
  InvoiceClientAddress: string | null;
  InvoiceCompanyPhone: string;
  InvoiceCompanyEmail: string;
  InvoiceLocationId: string | null;
  InvoiceLocationName: string | null;
  InvoiceNumber: string;
  InvoicePONumber: string | null;
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
  ClientCompanyBranchId?: string | null;
  ClientHomePageBgImg?: string | null;
  ClientName: string;
  ClientPhone: string;
  ClientNameSearchIndex: string[];
  ClientEmail: string; //* This will be used for client portal login
  ClientPassword: string; //* This will be used for client portal login
  ClientAddress: string | null;
  ClientBalance: number;
  ClientCreatedAt: Timestamp | FieldValue;
  ClientModifiedAt: Timestamp | FieldValue;
}

export interface ISettingsCollection {
  SettingId: string;
  SettingCompanyId: string;
  SettingEmpWellnessIntervalInMins: number;
  SettingEmpShiftTimeMarginInMins: number;

  //*Only Super Admin accessible settings
  SettingIsPatrollingEnabled: boolean;
  SettingIsEmpDarEnabled: boolean;
  SettingIsCalloutEnabled: boolean;
  SettingIsEquipmentManagementEnabled: boolean;
  SettingIsKeyManagementEnabled: boolean;
  SettingIsPaymentsAndBillingEnabled: boolean;
  SettingIsTrainingAndCertificationsEnabled: boolean;
  SettingIsVisitorManagementEnabled: boolean;
  SettingIsReportsEnabled: boolean;
  SettingIsCommunicationCenterEnabled: boolean;
  SettingIsDocRepoEnabled: boolean;
  SettingIsEmergencyResponseEnabled: boolean;
  SettingIsTimeAndAttendanceEnabled: boolean;
  SettingIsAuditEnabled: boolean;
  SettingIsPerformanceAssuranceEnabled: boolean;
  SettingIsTaskAssignmentAndTrackingEnabled: boolean;
  SettingIsHRSystemEnabled: boolean;
}

export interface IEquipmentsCollection {
  EquipmentId: string;
  EquipmentCompanyId: string;
  EquipmentCompanyBranchId: string | null;
  EquipmentName: string;
  EquipmentNameSearchIndex: string[];
  EquipmentDescription: string | null;
  EquipmentAllotedQuantity: number;
  EquipmentTotalQuantity: number;
  EquipmentCreatedAt: Timestamp | FieldValue;
  EquipmentModifiedAt: Timestamp | FieldValue;
}

export interface IEquipmentAllocations {
  EquipmentAllocationId: string;
  EquipmentAllocationEquipId: string;
  EquipmentAllocationEquipQty: number;
  EquipmentAllocationDate: Timestamp | FieldValue;
  EquipmentAllocationEmpId: string;
  EquipmentAllocationStartDate: Timestamp | FieldValue;
  EquipmentAllocationEndDate: Timestamp | FieldValue;
  EquipmentAllocationIsReturned: boolean;
  EquipmentAllocationReturnedAt?: Timestamp | FieldValue;
  EquipmentAllocationCreatedAt: Timestamp | FieldValue;
}

//*SuperAdmin
export interface ISuperAdminCollection {
  SuperAdminId: string;
  SuperAdminEmail: string;
  SuperAdminName: string;
  SuperAdminPhone: string;
}

export interface IEmployeeDARCollection {
  EmpDarId: string;
  EmpDarEmpId: string;
  EmpDarEmpName: string;
  EmpDarClientId: string;
  EmpDarClientName: string;
  EmpDarLocationId: string;
  EmpDarLocationName: string;
  EmpDarShiftId?: string | null;
  EmpDarCalloutId?: string | null;
  EmpDarCompanyId: string;
  EmpDarCompanyBranchId: string | null;
  EmpDarMedias: string[];
  EmpDarDate: Timestamp | FieldValue; //* Same as Shift Date
  EmpDarTile: {
    TileContent: string;
    TileTime: string;
    TileImages: string[];
    TileLocation: string;
    TileReport: {
      TileReportId: string;
      TileReportName: string;
      TileReportSearchId: string;
    }[];
    TilePatrol: {
      TilePatrolData: string; //include start and end time
      TilePatrolId: string; // PatrolLog id for link it in pdf
      TilePatrolImage: [];
      TilePatrolName: string;
    }[];
  }[];
  EmpDarCreatedAt: Timestamp | FieldValue;
}

export interface ILogBookCollection {
  LogBookId: string;
  LogBookCompanyId: string;
  LogBookCompanyBranchId: string | null;
  LogBookClientId: string;
  LogBookClientName: string;
  LogBookLocationId: string;
  LogBookLocationName: string;
  LogBookDate: Timestamp | FieldValue;
  LogBookEmpId: string;
  LogBookEmpName: string;
  LogBookData: {
    LogContent: string;
    LogType:
      | 'shift_start'
      | 'shift_break'
      | 'shift_end'
      | 'patrol_start'
      | 'patrol_end'
      | 'check_point';
    LogReportedAt: Timestamp | FieldValue;
  }[];
  LogBookCreatedAt: Timestamp | FieldValue;
}

export interface IVisitorsCollection {
  VisitorId: string; //* Doc Id
  VisitorCompanyId: string;
  VisitorCompanyBranchId: string;
  VisitorAssetHandover: string;
  VisitorAssetDurationInMinute: number;
  VisitorLocationId: string;
  VisitorLocationName: string;
  VisitorComment: string | null;
  VisitorContactNumber: string;
  VisitorEmail: string;
  VisitorInTime: Timestamp | FieldValue;
  VisitorOutTime: Timestamp | FieldValue;
  VisitorName: string;
  VisitorNoOfPerson: number;
  VisitorCreatedAt: Timestamp | FieldValue;
}

export interface IKeysCollection {
  KeyId: string;
  KeyCompanyId: string;
  KeyCompanyBranchId: string | null;
  KeyName: string;
  KeyNameSearchIndex: string[];
  KeyDescription: string | null;
  KeyAllotedQuantity: number;
  KeyTotalQuantity: number;
  KeyCreatedAt: Timestamp | FieldValue;
  KeyModifiedAt: Timestamp | FieldValue;
}

export interface IKeyAllocations {
  KeyAllocationId: string;
  KeyAllocationKeyId: string;
  KeyAllocationKeyQty: number;
  KeyAllocationDate: Timestamp | FieldValue;
  KeyAllocationRecipientName: string;
  KeyAllocationRecipientContact: string;
  KeyAllocationRecipientCompany?: string | null;
  KeyAllocationPurpose: string;
  KeyAllocationStartTime: Timestamp | FieldValue;
  KeyAllocationEndTime: Timestamp | FieldValue;
  KeyAllocationIsReturned: boolean;
  KeyAllocationReturnedAt?: Timestamp | FieldValue;
  KeyAllocationCreatedAt: Timestamp | FieldValue;
}

export interface ITasksCollection {
  TaskId: string;
  TaskCompanyId: string;
  TaskCompanyBranchId?: string | null;
  TaskDescription: string;
  TaskStartDate: Timestamp | FieldValue;
  TaskForDays: number;
  TaskStartTime: string; //*Task should start at this time all the day
  TaskAllotedLocationId?: string | null; //* Either task will be alloted to location
  TaskAllotedLocationName?: string | null; //* Either task will be alloted to location
  TaskAllotedToEmpIds?: string[] | null; //* Or it will be alloted directly to emp
  TaskAllotedToEmps?: { EmpName: string; EmpId: string }[] | null; //* Or it will be alloted directly to emp
  TaskIsAllotedToAllEmps?: boolean; //*Or it will be alloted to all employees
  TaskCreatedAt: Timestamp | FieldValue;
}

//* A log will be generated for each employee when he start/completes the task
export interface ITaskLogsCollection {
  TaskLogId: string;
  TaskId: string;
  TaskLogEmpId: string;
  TaskLogEmpName: string;
  TaskLogComment?: string | null;
  TaskLogStatus: 'pending' | 'completed';
  TaskLogCompletionTime: Timestamp | FieldValue;
  TaskLogCreatedAt: Timestamp | FieldValue;
}

//*Callout structure
export interface ICalloutsCollection {
  CalloutId: string;
  CalloutCompanyId: string;
  CalloutLocation: GeoPoint;
  CalloutLocationId: string;
  CalloutLocationName: string;
  CalloutLocationAddress: string;
  CalloutDateTime: Timestamp | FieldValue;
  CalloutAssignedEmpsId: string[]; //* Assigned Emp Ids
  CalloutStatus: {
    Status: 'pending' | 'started' | 'completed';
    StatusEmpId: string;
    StatusEmpName: string;
    StatusStartedTime: Timestamp | FieldValue;
    StatusEndedTime: Timestamp | FieldValue;
  }[];
  CalloutCreatedAt: Timestamp | FieldValue;
  CalloutModifiedAt: Timestamp | FieldValue;
}

export interface IShiftExchangeRequestsCollection {
  ShiftExchReqId: string;
  ShiftExchReqSenderId: string;
  ShiftExchReqReceiverId: string;
  ShiftExchReqShiftId: string;
  ShiftExchReqStatus: 'pending' | 'accepted' | 'rejected';
  ShiftExchReqCreatedAt: Timestamp | FieldValue;
  ShiftExchReqModifiedAt: Timestamp | FieldValue;
}

export interface IUserDataDeletionRequestsCollection {
  RequestId: string;
  RequestUserEmail: string;
  RequestUserPassword: string;
  RequestStatus: 'pending' | 'accepted' | 'rejected';
  RequestCreatedAt: Timestamp | FieldValue;
}

export interface IPayStubEarningsChildCollection {
  Income: 'Regular' | 'Banked' | 'Overtime' | 'Vacation' | 'Bonus' | 'Stat';
  Type: 'Fixed' | 'Hourly';
  Rate?: number | null;
  Quantity?: number | null;
  CurrentAmount: number;
  YTDAmount: number;
}

export interface IPayStubDeductionsChildCollection {
  Deduction: 'CPP' | 'EI' | 'Income Tax' | 'Other';
  OtherDeduction?: string | null; //*This req only when "Other" is selected
  Percentage: number;
  Amount: number;
  YearToDateAmt: number;
}

export interface IPayStubsCollection {
  PayStubId: string;
  PayStubCompanyId: string;
  PayStubCompanyBranchId?: string | null;
  PayStubEmpId: string;
  PayStubEmpName: string;
  PayStubEmpRole: string;
  PayStubEarnings: IPayStubEarningsChildCollection[];
  PayStubDeductions: IPayStubDeductionsChildCollection[];
  PayStubRefNumber?: string | null;
  PayStubPayPeriodStartDate: Timestamp | FieldValue;
  PayStubPayPeriodEndDate: Timestamp | FieldValue;
  PayStubPayDate: Timestamp | FieldValue;
  PayStubNetPay: { Amount: number; YearToDateAmt: number };
  PayStubCreatedAt: Timestamp | FieldValue;
  PayStubModifiedAt: Timestamp | FieldValue;
}

export enum TrainCertsCategories {
  TECHNICAL = 'Technical',
  SAFETY = 'Safety',
  COMPLIANCE = 'Compliance',
}

export interface ITrainingAndCertificationsCollection {
  TrainCertsId: string;
  TrainCertsCompanyId: string;
  TrainCertsTitle: string;
  TrainCertsDescription?: string | null;
  TrainCertsCategory: TrainCertsCategories;
  TrainCertsCost?: number | null;
  TrainCertsDuration: number;
  TrainCertsStartDate: Timestamp | FieldValue;
  TrainCertsEndDate: Timestamp | FieldValue;
  TrainCertsTotalTrainee: number;
  TrainCertsTotalTraineeCompletedTraining: number;
  TrainCertsCreatedAt: Timestamp | FieldValue;
  TrainCertsModifiedAt: Timestamp | FieldValue;
}

export interface ITrainCertsAllocationsCollection {
  TrainCertsAllocId: string;
  TrainCertsId: string;
  TrainCertsAllocEmpId: string;
  TrainCertsAllocEmpName: string;
  TrainCertsAllocStatus: 'pending' | 'started' | 'completed';
  TrainCertsAllocDate: Timestamp | FieldValue;
  TrainCertsAllocStartDate?: Timestamp | FieldValue;
  TrainCertsAllocCompletionDate?: Timestamp | FieldValue;
  TrainCertsAllocCreatedAt: Timestamp | FieldValue;
}

//*Emergency protocols
export interface IEmergencyProtocolsCollection {
  EmergProtocolId: string;
  EmergProtocolCompanyId: string;
  EmergProtocolTitle: string;
  EmergProtocolTitleSearchIndex: string[];
  EmergProtocolDescription: string;
  EmergProtocolVideo: string | null;
  EmergProtocolCreatedAt: Timestamp | FieldValue;
  EmergProtocolModifiedAt: Timestamp | FieldValue;
}
