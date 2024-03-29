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
}

export const DisplayCount = {
  EMPLOYEE_LIST: 20,
  SHIFT_LIST: 20,
  PATROL_LIST: 20,
  LOCATION_LIST: 20,
} as const;

export const REACT_QUERY_KEYS = {
  EMPLOYEE_LIST: "employee-list",
  SHIFT_LIST: "shift-list",
  SCHEDULES: "schedules",
  PATROL_LIST: "patrolling-list",
  LOCATION_LIST: "location-list",
} as const;

export const MinimumQueryCharacter = {
  EMPLOYEE: 1,
  PATROL: 1,
  LOCATION: 1,
} as const;

export const CloudStoragePaths = {
  EMPLOYEES_IMAGES: "employees/images/",
  EMPLOYEES_DOCUMENTS: "employees/documents",
  COMPANIES_LOGOS: "companies/logos",
};

export const ImageResolution = {
  EMP_IMAGE_WIDTH: 1200,
  EMP_IMAGE_HEIGHT: 1200,
  COMPANY_LOGO_WIDTH: 1200,
  COMPANY_LOGO_HEIGHT: 1200,
};

export const PageRoutes = {
  HOME: "/",
  SHIFT_LIST: "/shift_list",
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
};

export const LocalStorageKey = {
  LOGGEDIN_USER: "loggedInUser",
};

export interface LocalStorageLoggedInUserData {
  LoggedInId: string;
  LoggedInCrypt: string;
  LoggedInAuthUserType: "admin" | "guard" | "supervisor";
}
