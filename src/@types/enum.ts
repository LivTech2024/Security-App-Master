export enum CollectionName {
  companies = "Companies",
  admins = "Admins",
  employees = "Employees",
  shifts = "Shifts",
}

export enum ShiftPositions {
  supervisor = "supervisor",
  guard = "guard",
  other = "other",
}

export enum EmployeeRoles {
  supervisor = "supervisor",
  guard = "guard",
  other = "other",
}

export const DisplayCount = {
  EMPLOYEE_LIST: 20,
  SHIFT_LIST: 20,
} as const;

export const REACT_QUERY_KEYS = {
  EMPLOYEE_LIST: "employee-list",
  SHIFT_LIST: "shift-list",
  SCHEDULES: "schedules",
} as const;

export const MinimumQueryCharacter = {
  EMPLOYEE: 1,
} as const;

export const CloudStoragePaths = {
  EMPLOYEES_IMAGES: "employees/images/",
};

export const ImageResolution = {
  EMP_IMAGE_WIDTH: 1200,
  EMP_IMAGE_HEIGHT: 1200,
};

export const PageRoutes = {
  HOME: "/",
  SHIFTS: "/shifts",
  EMPLOYEES: "/employees",
  SCHEDULES: "/schedules",
  PATROLLING: "/patrolling",
};
