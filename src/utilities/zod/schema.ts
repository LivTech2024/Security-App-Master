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
export const addEmployeeFormSchema = z
  .object({
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
    EmployeeMaxHrsPerWeek: numberString({
      message: "Employee max week hours is required",
    }),
    EmployeeSupervisorId: z.array(z.string()).nullable().optional(),
    EmployeeCompanyBranchId: z.string().nullable().optional(),
    EmployeeIsBanned: z.boolean(),
    EmployeeSinNumber: z.string().optional().nullable(),
    EmployeeAddress: z.string().optional().nullable(),
    EmployeePostalCode: z.string().optional().nullable(),
    EmployeeCity: z.string().optional().nullable(),
    EmployeeProvince: z.string().optional().nullable(),
  })
  .superRefine(({ EmployeeRole, EmployeeSupervisorId }, ctx) => {
    if (
      EmployeeRole === "GUARD" &&
      (!EmployeeSupervisorId || EmployeeSupervisorId.length < 1)
    ) {
      ctx.addIssue({
        path: ["EmployeeSupervisorId"],
        message: `Please select supervisor for this guard`,
        code: "custom",
      });
    }
  });

export type AddEmployeeFormField = z.infer<typeof addEmployeeFormSchema>;

//*Shift create schema
export const addShiftFormSchema = z
  .object({
    ShiftName: z.string().min(2, { message: "Shift name is required" }),
    ShiftPosition: z.string().min(1, { message: "Shift position is required" }),
    ShiftStartTime: z.string().min(2, { message: "Start time is required" }),
    ShiftEndTime: z.string().min(2, { message: "End time is required" }),
    ShiftDescription: z.string().nullable().optional(),
    ShiftLocation: z
      .object({ latitude: z.string(), longitude: z.string() })
      .nullable()
      .optional(),
    ShiftLocationId: z
      .string()
      .min(3, { message: "Shift address is required" })
      .min(3, { message: "Location id required" })
      .nullable()
      .optional(),
    ShiftLocationName: z.string().nullable().optional(),
    ShiftLocationAddress: z
      .string()
      .min(3, { message: "Shift address is required" })
      .nullable()
      .optional(),
    ShiftCompanyBranchId: z.string().nullable().optional(),
    ShiftRestrictedRadius: z.coerce.number().nullable().optional(),
    ShiftEnableRestrictedRadius: z.boolean(),
    ShiftClientId: z
      .string()
      .min(2, { message: "Client is required" })
      .nullable()
      .optional(),
    ShiftRequiredEmp: numberString({
      message: "Please enter the required no. of employees",
      defaultValue: 1,
    }),
    ShiftPhotoUploadIntervalInMinutes: z.coerce.number().nullable().optional(),
    ShiftAssignedUserId: z.array(z.string()).default([]).optional(),
    ShiftLinkedPatrolIds: z.array(z.string()).default([]).optional(),
    ShiftIsSpecialShift: z.boolean(),
  })
  .superRefine(
    ({ ShiftRequiredEmp, ShiftIsSpecialShift, ShiftAssignedUserId }, ctx) => {
      if (!Number(ShiftRequiredEmp)) {
        ctx.addIssue({
          path: ["ShiftRequiredEmp"],
          message: `Required no. of employees must be at least 1`,
          code: "custom",
        });
      }

      if (
        ShiftIsSpecialShift &&
        (!ShiftAssignedUserId || ShiftAssignedUserId?.length === 0)
      ) {
        ctx.addIssue({
          path: ["ShiftAssignedUserId"],
          message: `Pleas assign employee to this special shift`,
          code: "custom",
        });
      }
    }
  );

export type AddShiftFormFields = z.infer<typeof addShiftFormSchema>;

//* Patrolling create Schema
export const patrollingSchema = z.object({
  PatrolName: z.string().min(3, { message: "Patrol name is required" }),
  PatrolLocation: z.object({
    latitude: z.string(),
    longitude: z.string(),
  }),
  PatrolLocationId: z.string().min(3, { message: "Location id is required" }),
  PatrolLocationName: z.string().min(3, { message: "Location is required" }),
  PatrolCheckPoints: z.array(
    z.object({
      id: z.string().nullable(),
      name: z.string(),
      category: z.string().nullable().optional(),
      hint: z.string().optional().nullable(),
    })
  ),
  PatrolRestrictedRadius: z.coerce.number().nullable().optional(),
  PatrolKeepGuardInRadiusOfLocation: z.boolean(),
  PatrolRequiredCount: z.coerce
    .number()
    .min(1, { message: "Required count is required" })
    .max(50, { message: "Required count cannot be more than 50" }),
  PatrolReminderInMinutes: z.coerce
    .number()
    .min(1, { message: "Patrol reminder in minutes is required" })
    .max(720, {
      message: "Patrol reminder in minutes cannot be more than 720",
    }),
  PatrolClientId: z.string().min(3, { message: "Please select client" }),
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
export const invoiceSchema = z
  .object({
    InvoiceClientId: z.string().min(3, { message: "Client id is required" }),
    InvoiceClientName: z
      .string()
      .min(2, { message: "Client name should be at least 3 characters" }),
    InvoiceClientPhone: z
      .string()
      .min(8, {
        message: "Client phone number should be at least 8 characters",
      })
      .max(16, {
        message: "Client phone number should be at most 16 characters",
      }),
    InvoiceClientAddress: z.string().optional().nullable(),
    InvoiceNumber: z
      .string()
      .min(1, { message: "Invoice number should be at least 1 character" })
      .max(6, { message: "Invoice number should be at most 6 character" }),
    InvoiceDate: z.date(),
    InvoiceDueDate: z.date(),
    InvoiceSubtotal: numberString({ message: "Subtotal amount is required" }),
    InvoiceTotalAmount: numberString({ message: "Total amount is required" }),
    InvoiceReceivedAmount: numberString({
      message: "Received amount amount is required",
    }),
    InvoiceDescription: z.string().optional().nullable(),
    InvoiceTerms: z.string().optional().nullable(),
  })
  .superRefine(({ InvoiceReceivedAmount, InvoiceTotalAmount }, ctx) => {
    if (Number(InvoiceReceivedAmount) > Number(InvoiceTotalAmount)) {
      ctx.addIssue({
        path: ["InvoiceReceivedAmount"],
        message: `Received amount cannot be greater than total amount`,
        code: "custom",
      });
    }
  });

export type InvoiceFormFields = z.infer<typeof invoiceSchema>;

//*client  create schema
export const clientSchema = z.object({
  ClientName: z
    .string()
    .min(2, { message: "Client name should be at least 2 characters" }),
  ClientPhone: z
    .string()
    .min(8, { message: "Client phone should be at least 8 characters" }),
  ClientEmail: z
    .string()
    .min(3, { message: "Client email is required" })
    .regex(ConstRegex.EMAIL_OPTIONAL, {
      message: "Invalid email",
    }),
  ClientPassword: z
    .string()
    .min(6, { message: "Client password should be at least 6 characters" }),
  ClientAddress: z.string().nullable().optional(),
  ClientContractStartDate: z.date(),
  ClientContractEndDate: z.date(),
  ClientContractAmount: z.coerce
    .number()
    .min(1, { message: "Client contract should be at least 1" }),
  ClientHourlyRate: z.coerce
    .number()
    .min(1, { message: "Client hourly rate should be at least 1" }),
});

export type ClientFormFields = z.infer<typeof clientSchema>;

//*Equipment Schema
export const equipmentSchema = z.object({
  EquipmentName: z
    .string()
    .min(2, { message: "Equipment name should be at least 2 characters" }),
  EquipmentCompanyBranchId: z.string().nullable().optional(),
  EquipmentDescription: z.string().nullable(),
  EquipmentTotalQuantity: z.coerce
    .number()
    .min(1, { message: "Equipment total quantity should be at least 1" }),
});

export type EquipmentFormFields = z.infer<typeof equipmentSchema>;

//*Equipment Allocation Schema
export const equipmentAllocationSchema = z.object({
  EquipmentAllocationEquipId: z
    .string()
    .min(3, { message: "Please select equipment" }),
  EquipmentAllocationEquipQty: z.coerce.number().min(1).default(0),
  EquipmentAllocationDate: z.date(),
  EquipmentAllocationEmpId: z
    .string()
    .min(3, { message: "Please select employee" }),
  EquipmentAllocationEmpName: z
    .string()
    .min(3, { message: "Please select employee" }),
  EquipmentAllocationStartDate: z.date(),
  EquipmentAllocationEndDate: z.date(),
});

export type EquipmentAllocationFormFields = z.infer<
  typeof equipmentAllocationSchema
>;

//*Settings Schema
export const settingsSchema = z.object({
  SettingEmpWellnessIntervalInMins: z.coerce.number().min(1),
});

export type SettingsFormFields = z.infer<typeof settingsSchema>;
