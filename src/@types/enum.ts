export enum CollectionName {
  companies = "Companies",
  companyBranch = "CompanyBranch",
  admins = "Admins",
  employeeRoles = "EmployeeRoles",
  employees = "Employees",
  shifts = "Shifts",
  patrols = "Patrols",
  notifications = "Notifications",
  loggedInUsers = "LoggedInUsers",
  locations = "Locations",
  reportCategories = "ReportCategories",
  reports = "Reports",
  invoices = "Invoices",
  clients = "Clients",
  documentCategories = "DocumentCategories",
  documents = "Documents",
  settings = "Settings",
  superAdmin = "SuperAdmin",
  equipments = "Equipments",
  equipmentAllocations = "EquipmentAllocations",
}

export const DisplayCount = {
  EMPLOYEE_LIST: 20,
  SHIFT_LIST: 20,
  PATROL_LIST: 20,
  LOCATION_LIST: 20,
  REPORT_LIST: 20,
  INVOICE_LIST: 20,
  CLIENT_LIST: 20,
  DOCUMENT_LIST: 20,
  EQUIPMENT_LIST: 20,
} as const;

export const REACT_QUERY_KEYS = {
  EMPLOYEE_LIST: "employee-list",
  SHIFT_LIST: "shift-list",
  SCHEDULES: "schedules",
  PATROL_LIST: "patrolling-list",
  LOCATION_LIST: "location-list",
  REPORT_LIST: "report-list",
  REPORT_CATEGORIES: "report-categories",
  INVOICE_LIST: "invoice-list",
  CLIENT_LIST: "client-list",
  DOCUMENT_LIST: "document-list",
  DOCUMENT_CATEGORIES: "document-categories",
  EQUIPMENT_LIST: "equipment-list",
} as const;

export const MinimumQueryCharacter = {
  EMPLOYEE: 1,
  PATROL: 1,
  LOCATION: 1,
  CLIENT: 1,
  DOCUMENT: 1,
  EQUIPMENT: 1,
} as const;

export const CloudStoragePaths = {
  EMPLOYEES_IMAGES: "employees/images/",
  EMPLOYEES_DOCUMENTS: "employees/documents",
  COMPANIES_LOGOS: "companies/logos",
  DOCUMENTS: "documents",
};

export const ImageResolution = {
  EMP_IMAGE_WIDTH: 720,
  EMP_IMAGE_HEIGHT: 720,
  EMP_LICENSE_WIDTH: 480,
  EMP_LICENSE_HEIGHT: 480,
  EMP_VOID_CHECK_WIDTH: 720,
  EMP_VOID_CHECK_HEIGHT: 480,
  COMPANY_LOGO_WIDTH: 1200,
  COMPANY_LOGO_HEIGHT: 1200,
};

export const PageRoutes = {
  HOME: "/",
  SHIFT_LIST: "/shift_list",
  SHIFT_VIEW: "/shift_view",
  SHIFT_CREATE_OR_EDIT: "/shift_create_or_edit",
  EMPLOYEE_LIST: "/employee_list",
  EMPLOYEE_CREATE_OR_EDIT: "/employee_create_or_edit",
  SCHEDULES: "/schedules",
  PATROLLING_LIST: "/patrolling_list",
  PATROLLING_CREATE_OR_EDIT: "/patrolling_create_or_edit",
  PATROLLING_VIEW: "/patrolling_view",
  LOCATIONS: "/locations",
  COMPANY_BRANCHES: "/company_branches",
  REPORTS: "/reports",
  SETTINGS: "/settings",
  PAYMENTS_AND_BILLING: "/payments_and_billing",
  INVOICE_LIST: "/invoice_list",
  INVOICE_GENERATE: "/invoice_generate",
  CLIENTS: "/clients",
  CLIENT_VIEW: "/client_view",
  CLIENT_CREATE_OR_EDIT: "/client_create_or_edit",
  SUPER_ADMIN_CREATE_NEW_COMPANY: "/super_admin/create_new_company",
  DOCUMENT_REPOSITORY: "/document_repository",
  EQUIPMENT_LIST: "/equipment_list",
  EQUIPMENT_VIEW: "/equipment_view",
};

export const LocalStorageKey = {
  LOGGEDIN_USER: "loggedInUser",
  SELECTED_BRANCH: "selectedBranch",
};

export enum IUserType {
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
}

export interface LocalStorageLoggedInUserData {
  LoggedInId: string;
  LoggedInUserId: string;
  LoggedInCrypt: string;
  LoggedInAuthUserType: IUserType;
}

export enum ScheduleView {
  CALENDAR_VIEW = "calendar_view",
  BY_EMPLOYEE_VIEW = "by_employee_view",
  STATISTICS_VIEW = "statistics_view",
}
