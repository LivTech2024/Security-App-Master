import { z } from "zod";
import { numberString } from "./helper";
import { ConstRegex } from "../../constants/ConstRegex";

//*Company  create schema
export const companyCreateSchema = z.object({
  CompanyName: z
    .string()
    .min(3, { message: "Company name should be minimum 3 characters" }),
  CompanyEmail: z
    .string()
    .min(3, { message: "Valid email is required" })
    .regex(ConstRegex.EMAIL_OPTIONAL),
  CompanyPhone: z
    .string()
    .min(10, { message: "Company phone with country code is required" }),
  CompanyAddress: z
    .string()
    .min(3, { message: "Company address should be minimum 3 characters" }),
});

export type CompanyCreateFormFields = z.infer<typeof companyCreateSchema>;

//*Admin  update schema
export const adminUpdateSchema = z.object({
  AdminName: z
    .string()
    .min(3, { message: "Admin name should be minimum 3 characters" }),
  AdminPhone: z
    .string()
    .min(10, { message: "Company phone with country code is required" }),
});

export type AdminUpdateFormFields = z.infer<typeof adminUpdateSchema>;

//*Admin create schema
export const adminCreateSchema = adminUpdateSchema.extend({
  AdminEmail: z
    .string()
    .min(3, { message: "Valid email is required" })
    .regex(ConstRegex.EMAIL_OPTIONAL),
  AdminPassword: z
    .string()
    .min(6, { message: "Password must be minimum six characters" }),
});

export type AdminCreateFormFields = z.infer<typeof adminCreateSchema>;

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
  EmployeePayRate: numberString({ message: "Employee pay rate is required" }),
  EmployeeCompanyBranchId: z.string().nullable().optional(),
});

export type AddEmployeeFormField = z.infer<typeof addEmployeeFormSchema>;

//*Shift create schema
export const addShiftFormSchema = z.object({
  ShiftName: z.string().min(2, { message: "Shift name is required" }),
  ShiftPosition: z.string().min(1, { message: "Shift position is required" }),
  ShiftDate: z.date().default(new Date()),
  ShiftStartTime: z.string().min(2, { message: "Start time is required" }),
  ShiftEndTime: z.string().min(2, { message: "End time is required" }),
  ShiftDescription: z.string().nullable().optional(),
  ShiftLocation: z.object({ lat: z.number(), lng: z.number() }),
  ShiftLocationName: z.string().min(3, { message: "Location name required" }),
  ShiftAddress: z.string().min(3, { message: "Shift address is required" }),
  ShiftCompanyBranchId: z.string().nullable().optional(),
  ShiftRestrictedRadius: numberString({
    message: "Restricted radius is required",
  }),
  ShiftClientEmail: z.string().min(2, { message: "Client email is required" }),
});

export type AddShiftFormFields = z.infer<typeof addShiftFormSchema>;

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
  PatrolCheckPoints: z.array(z.object({ name: z.string(), time: z.string() })),
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

//*Invoice  create schema
export const invoiceSchema = z.object({
  InvoiceCustomerName: z
    .string()
    .min(3, { message: "Customer name should be at least 3 characters" }),
  InvoiceCustomerPhone: z
    .string()
    .min(8, {
      message: "Customer phone number should be at least 8 characters",
    })
    .max(16, {
      message: "Customer phone number should be at most 16 characters",
    }),
  InvoiceCustomerAddress: z.string().optional().nullable(),
  InvoiceNumber: numberString({ message: "Invoice number is required" }),
  InvoiceDate: z.date(),
  InvoiceDueDate: z.date(),
  InvoiceSubtotal: numberString({ message: "Subtotal amount is required" }),
  InvoiceTotalAmount: numberString({ message: "Total amount is required" }),
  InvoiceDescription: z.string().optional().nullable(),
  InvoiceTerms: z.string().optional().nullable(),
});

export type InvoiceFormFields = z.infer<typeof invoiceSchema>;
