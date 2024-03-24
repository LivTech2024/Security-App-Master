import { z } from "zod";
import { numberString } from "./helper";
import { ConstRegex } from "../../constants/ConstRegex";

//*Employee create schema
export const addEmployeeFormSchema = z.object({
  EmployeeFirstName: z.string().min(2, { message: "First name is required" }),
  EmployeeLastName: z.string().min(2, { message: "Last name is required" }),
  EmployeePhone: z.string().min(10, { message: "Phone number is required" }),
  EmployeeEmail: z
    .string()
    .min(3, { message: "Email is required" })
    .regex(ConstRegex.EMAIL_OPTIONAL, {
      message: "Invalid email",
    }),
  EmployeePassword: z
    .string()
    .min(6, { message: "Min 6 character is required" }),
  EmployeeRole: z.string().min(1, { message: "Employee role is required" }),
  EmployeeCompanyBranchId: z.string().nullable().optional(),
});

export type AddEmployeeFormField = z.infer<typeof addEmployeeFormSchema>;

//* Patrolling create Schema
export const patrollingSchema = z.object({
  PatrolName: z.string().min(3, { message: "Patrol name is required" }),
  PatrolArea: z.string().min(3, { message: "Patrol area is required" }),
  PatrolLocation: z.object({
    latitude: z.string(),
    longitude: z.string(),
  }),
  PatrolLocationName: z
    .string()
    .min(3, { message: "Location name is required" }),
  PatrolTime: z.date(),
  PatrolAssignedGuardId: z
    .string()
    .min(3, { message: "This field is required" }),
  PatrolAssignedGuardName: z.string().min(3, { message: "Guard is required" }),
  PatrolAssignedGuardEmail: z.string().min(3, { message: "Guard is required" }),
  PatrolCheckPoints: z.array(z.string()),
  PatrolRestrictedRadius: numberString({
    message: "Restricted radius in meters is required",
  }),
  PatrolKeepGuardInRadiusOfLocation: z.boolean(),
});

export type PatrollingFormFields = z.infer<typeof patrollingSchema>;

//*Company branch create schema
export const companyBranchSchema = z.object({
  CompanyBranchName: z
    .string()
    .min(3, { message: "Branch name should be minimum 3 characters" }),
  CompanyBranchEmail: z
    .string()
    .min(3, { message: "Valid email is required" })
    .regex(ConstRegex.EMAIL_OPTIONAL),
  CompanyBranchPhone: z
    .string()
    .min(10, { message: "Branch phone with country code is required" }),
  CompanyBranchAddress: z
    .string()
    .min(3, { message: "Branch address should be minimum 3 characters" }),
});

export type CompanyBranchFormFields = z.infer<typeof companyBranchSchema>;
