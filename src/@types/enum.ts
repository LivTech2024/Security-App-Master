export enum CollectionName {
  employees = "Employees",
  shifts = "Shifts",
}

export const DisplayCount = {
  EMPLOYEE_LIST: 20,
  SHIFT_LIST: 20,
} as const;

export const REACT_QUERY_KEYS = {
  EMPLOYEE_LIST: "employee-list",
  SHIFT_LIST: "shift-list",
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
