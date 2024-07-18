import { z } from 'zod';
import { numberString } from './helper';
import { ConstRegex } from '../../constants/ConstRegex';
import { TrainCertsCategories } from '../../@types/database';

//*Admin  update schema
export const adminUpdateSchema = z.object({
  AdminName: z
    .string()
    .min(3, { message: 'Admin name should be minimum 3 characters' })
    .max(100),
  AdminPhone: z
    .string()
    .min(10, { message: 'Company phone with country code is required' })
    .max(16),
});

//*Admin create schema
export const adminCreateSchema = adminUpdateSchema.extend({
  AdminId: z.string().nullable().optional(), //*Required only while editing a company
  AdminEmail: z
    .string()
    .min(3, { message: 'Valid email is required' })
    .regex(ConstRegex.EMAIL_OPTIONAL),
  AdminPassword: z
    .string()
    .min(6, { message: 'Password must be minimum six characters' })
    .max(100),
});

//*Company  create schema
export const companyCreateSchema = z.object({
  CompanyName: z
    .string()
    .min(3, { message: 'Company name should be minimum 3 characters' }),
  CompanyEmail: z
    .string()
    .min(3, { message: 'Valid email is required' })
    .regex(ConstRegex.EMAIL_OPTIONAL),
  CompanyPhone: z
    .string()
    .min(10, { message: 'Company phone with country code is required' }),
  CompanyAddress: z
    .string()
    .min(3, { message: 'Company address should be minimum 3 characters' }),
  CompanyAdminDetails: adminCreateSchema,

  //*Settings only accessible by super_admin
  SettingId: z.string().nullable().optional(), //*Required only while editing a company
  SettingIsPatrollingEnabled: z.boolean(),
  SettingIsEmpDarEnabled: z.boolean(),
  SettingIsCalloutEnabled: z.boolean(),
  SettingIsEquipmentManagementEnabled: z.boolean(),
  SettingIsKeyManagementEnabled: z.boolean(),
  SettingIsPaymentsAndBillingEnabled: z.boolean(),
  SettingIsTrainingAndCertificationsEnabled: z.boolean(),
  SettingIsVisitorManagementEnabled: z.boolean(),
  SettingIsReportsEnabled: z.boolean(),
  SettingIsCommunicationCenterEnabled: z.boolean(),
  SettingIsDocRepoEnabled: z.boolean(),
  SettingIsEmergencyResponseEnabled: z.boolean(),
  SettingIsTimeAndAttendanceEnabled: z.boolean(),
  SettingIsAuditEnabled: z.boolean(),
  SettingIsPerformanceAssuranceEnabled: z.boolean(),
  SettingIsTaskAssignmentAndTrackingEnabled: z.boolean(),
  SettingIsHRSystemEnabled: z.boolean(),
});

export type CompanyCreateFormFields = z.infer<typeof companyCreateSchema>;

//*Company update schema
export const companyUpdateSchema = z.object({
  CompanyName: z
    .string()
    .min(3, { message: 'Company name should be minimum 3 characters' }),
  CompanyEmail: z
    .string()
    .min(3, { message: 'Valid email is required' })
    .regex(ConstRegex.EMAIL_OPTIONAL),
  CompanyPhone: z
    .string()
    .min(10, { message: 'Company phone with country code is required' }),
  CompanyAddress: z
    .string()
    .min(3, { message: 'Company address should be minimum 3 characters' }),
});

export type CompanyUpdateFormFields = z.infer<typeof companyUpdateSchema>;

//*Location  create schema
export const locationCreateSchema = z.object({
  LocationClientId: z.string().min(3),
  LocationName: z
    .string()
    .min(3, { message: 'Location name should be minimum 3 characters' }),
  LocationAddress: z
    .string()
    .min(3, { message: 'Address should be at least 3 characters' }),
  LocationCoordinates: z.object({ lat: z.string(), lng: z.string() }),
  LocationContractStartDate: z.date(),
  LocationContractEndDate: z.date(),
  LocationContractAmount: z.coerce.number(),
  LocationPatrolPerHitRate: z.coerce.number(),
  LocationShiftHourlyRate: z.coerce.number(),
  LocationCalloutDetails: z.object({
    CalloutCostInitialMinutes: z.coerce.number(),
    CalloutCostInitialCost: z.coerce.number(),
    CalloutCostPerHour: z.coerce.number(),
  }),
  LocationManagerName: z
    .string()
    .min(3, { message: 'Manager name should be at least 3 characters' }),
  LocationManagerEmail: z
    .string()
    .min(1, { message: 'Email id is required' })
    .regex(ConstRegex.EMAIL_OPTIONAL, {
      message: 'Please enter a valid email id',
    }),
  LocationSendEmailToClient: z.boolean(),
  LocationSendEmailForEachPatrol: z.boolean(),
  LocationSendEmailForEachShift: z.boolean(),
});

export type LocationCreateFormFields = z.infer<typeof locationCreateSchema>;

export type AdminUpdateFormFields = z.infer<typeof adminUpdateSchema>;

export type AdminCreateFormFields = z.infer<typeof adminCreateSchema>;

//*Employee create schema
export const addEmployeeFormSchema = z
  .object({
    EmployeeFirstName: z.string().min(2, { message: 'First name is required' }),
    EmployeeLastName: z.string().min(2, { message: 'Last name is required' }),
    EmployeePhone: z.string().min(10, { message: 'Phone number is required' }),
    EmployeeEmail: z
      .string()
      .min(3, { message: 'Email is required' })
      .regex(ConstRegex.EMAIL_OPTIONAL, {
        message: 'Invalid email',
      }),
    EmployeePassword: z
      .string()
      .min(6, { message: 'Min 6 character is required' }),
    EmployeeRole: z.string().min(1, { message: 'Employee role is required' }),
    EmployeePayRate: numberString({ message: 'Employee pay rate is required' }),
    EmployeeMaxHrsPerWeek: numberString({
      message: 'Employee max week hours is required',
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
      EmployeeRole === 'GUARD' &&
      (!EmployeeSupervisorId || EmployeeSupervisorId.length < 1)
    ) {
      ctx.addIssue({
        path: ['EmployeeSupervisorId'],
        message: `Please select supervisor for this guard`,
        code: 'custom',
      });
    }
  });

export type AddEmployeeFormField = z.infer<typeof addEmployeeFormSchema>;

//*Shift create schema
export const addShiftFormSchema = z
  .object({
    ShiftName: z.string().min(2, { message: 'Shift name is required' }),
    ShiftPosition: z.string().min(1, { message: 'Shift position is required' }),
    ShiftStartTime: z.string().min(2, { message: 'Start time is required' }),
    ShiftEndTime: z.string().min(2, { message: 'End time is required' }),
    ShiftDescription: z.string().nullable().optional(),
    ShiftLocation: z
      .object({ latitude: z.string(), longitude: z.string() })
      .nullable()
      .optional(),
    ShiftLocationId: z
      .string()
      .min(3, { message: 'Shift address is required' })
      .min(3, { message: 'Location id required' })
      .nullable()
      .optional(),
    ShiftLocationName: z.string().nullable().optional(),
    ShiftLocationAddress: z
      .string()
      .min(3, { message: 'Shift address is required' })
      .nullable()
      .optional(),
    ShiftCompanyBranchId: z
      .string()
      .min(3, { message: 'Please select branch' }),
    ShiftRestrictedRadius: z.coerce.number().nullable().optional(),
    ShiftEnableRestrictedRadius: z.boolean(),
    ShiftClientId: z
      .string()
      .min(2, { message: 'Client is required' })
      .nullable()
      .optional(),
    ShiftRequiredEmp: numberString({
      message: 'Please enter the required no. of employees',
      defaultValue: 1,
    }),
    ShiftPhotoUploadIntervalInMinutes: z.coerce.number().nullable().optional(),
    ShiftAssignedUserId: z.array(z.string()).default([]).optional(),
    ShiftIsSpecialShift: z.boolean(),
  })
  .superRefine(
    ({ ShiftRequiredEmp, ShiftIsSpecialShift, ShiftAssignedUserId }, ctx) => {
      if (!Number(ShiftRequiredEmp)) {
        ctx.addIssue({
          path: ['ShiftRequiredEmp'],
          message: `Required no. of employees must be at least 1`,
          code: 'custom',
        });
      }

      if (
        ShiftIsSpecialShift &&
        (!ShiftAssignedUserId || ShiftAssignedUserId?.length === 0)
      ) {
        ctx.addIssue({
          path: ['ShiftAssignedUserId'],
          message: `Pleas assign employee to this special shift`,
          code: 'custom',
        });
      }
    }
  );

export type AddShiftFormFields = z.infer<typeof addShiftFormSchema>;

//* Patrolling create Schema
export const patrollingSchema = z.object({
  PatrolName: z.string().min(3, { message: 'Patrol name is required' }),
  PatrolLocation: z.object({
    latitude: z.string(),
    longitude: z.string(),
  }),
  PatrolLocationId: z.string().min(3, { message: 'Location id is required' }),
  PatrolLocationName: z.string().min(3, { message: 'Location is required' }),
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
  PatrolReminderInMinutes: z.coerce
    .number()
    .min(1, { message: 'Patrol reminder in minutes is required' })
    .max(720, {
      message: 'Patrol reminder in minutes cannot be more than 720',
    }),
  PatrolClientId: z.string().min(3, { message: 'Please select client' }),
  PatrolCompanyBranchId: z.string().nullable().optional(),
});

export type PatrollingFormFields = z.infer<typeof patrollingSchema>;

//*Company branch create schema
export const companyBranchSchema = z.object({
  CompanyBranchName: z
    .string()
    .min(3, { message: 'Branch name should be minimum 3 characters' }),
  CompanyBranchEmail: z
    .string()
    .min(3, { message: 'Valid email is required' })
    .regex(ConstRegex.EMAIL_OPTIONAL),
  CompanyBranchPhone: z
    .string()
    .min(10, { message: 'Branch phone with country code is required' }),
  CompanyBranchAddress: z
    .string()
    .min(3, { message: 'Branch address should be minimum 3 characters' }),
});

export type CompanyBranchFormFields = z.infer<typeof companyBranchSchema>;

//*Invoice  create schema
export const invoiceSchema = z
  .object({
    InvoiceClientId: z.string().min(3, { message: 'Client is required' }),
    InvoiceCompanyBranchId: z.string().nullable().optional(),
    InvoiceClientName: z
      .string()
      .min(2, { message: 'Client name should be at least 3 characters' }),
    InvoiceClientPhone: z
      .string()
      .min(8, {
        message: 'Client phone number should be at least 8 characters',
      })
      .max(16, {
        message: 'Client phone number should be at most 16 characters',
      }),
    InvoiceClientAddress: z.string().optional().nullable(),
    InvoiceCompanyPhone: z
      .string()
      .min(8, {
        message: 'Company phone number should be at least 8 characters',
      })
      .max(16, {
        message: 'Company phone number should be at most 16 characters',
      }),
    InvoiceCompanyEmail: z
      .string()
      .min(3, { message: 'Company email is required' })
      .regex(ConstRegex.EMAIL_OPTIONAL, {
        message: 'Invalid email',
      }),
    InvoiceLocationId: z.string().nullable().optional(),
    InvoiceLocationName: z.string().nullable().optional(),
    InvoiceNumber: z
      .string()
      .min(1, { message: 'Invoice number should be at least 1 character' })
      .max(6, { message: 'Invoice number should be at most 6 character' }),
    InvoicePONumber: z.string().optional().nullable(),
    InvoiceDate: z.date(),
    InvoiceDueDate: z.date(),
    InvoiceSubtotal: z.coerce
      .number()
      .min(1, { message: 'Subtotal amount is required' }),
    InvoiceTotalAmount: z.coerce
      .number()
      .min(1, { message: 'Total amount is required' }),
    InvoiceReceivedAmount: z.coerce.number(),
    InvoiceDescription: z.string().optional().nullable(),
    InvoiceTerms: z.string().optional().nullable(),
  })
  .superRefine(({ InvoiceReceivedAmount, InvoiceTotalAmount }, ctx) => {
    if (Number(InvoiceReceivedAmount) > Number(InvoiceTotalAmount)) {
      ctx.addIssue({
        path: ['InvoiceReceivedAmount'],
        message: `Received amount cannot be greater than total amount`,
        code: 'custom',
      });
    }
  });

export type InvoiceFormFields = z.infer<typeof invoiceSchema>;

//*client  create schema
export const clientSchema = z.object({
  ClientName: z
    .string()
    .min(2, { message: 'Client name should be at least 2 characters' }),
  ClientPhone: z
    .string()
    .min(8, { message: 'Client phone should be at least 8 characters' }),
  ClientEmail: z
    .string()
    .min(3, { message: 'Client email is required' })
    .regex(ConstRegex.EMAIL_OPTIONAL, {
      message: 'Invalid email',
    }),
  ClientPassword: z
    .string()
    .min(6, { message: 'Client password should be at least 6 characters' }),
  ClientAddress: z.string().nullable().optional(),
  ClientCompanyBranchId: z.string().optional().nullable(),
});

export type ClientFormFields = z.infer<typeof clientSchema>;

//*Equipment Schema
export const equipmentSchema = z.object({
  EquipmentName: z
    .string()
    .min(2, { message: 'Equipment name should be at least 2 characters' }),
  EquipmentCompanyBranchId: z.string().nullable().optional(),
  EquipmentDescription: z.string().nullable(),
  EquipmentTotalQuantity: z.coerce
    .number()
    .min(1, { message: 'Equipment total quantity should be at least 1' }),
});

export type EquipmentFormFields = z.infer<typeof equipmentSchema>;

//*Equipment Allocation Schema
export const equipmentAllocationSchema = z.object({
  EquipmentAllocationEquipId: z
    .string()
    .min(3, { message: 'Please select equipment' }),
  EquipmentAllocationEquipQty: z.coerce.number().min(1).default(0),
  EquipmentAllocationDate: z.date(),
  EquipmentAllocationEmpId: z
    .string()
    .min(3, { message: 'Please select employee' }),
  EquipmentAllocationEmpName: z
    .string()
    .min(3, { message: 'Please select employee' }),
  EquipmentAllocationStartDate: z.date(),
  EquipmentAllocationEndDate: z.date(),
});

export type EquipmentAllocationFormFields = z.infer<
  typeof equipmentAllocationSchema
>;

//*Key Schema
export const keySchema = z.object({
  KeyName: z
    .string()
    .min(2, { message: 'Equipment name should be at least 2 characters' }),
  KeyCompanyBranchId: z.string().nullable().optional(),
  KeyDescription: z.string().nullable(),
  KeyTotalQuantity: z.coerce
    .number()
    .min(1, { message: 'Equipment total quantity should be at least 1' }),
});

export type KeyFormFields = z.infer<typeof keySchema>;

//*Equipment Allocation Schema
export const keyAllocationSchema = z.object({
  KeyAllocationKeyName: z
    .string()
    .min(3, { message: 'Please select equipment' }),
  KeyAllocationKeyQty: z.coerce.number().min(1).default(0),
  KeyAllocationDate: z.date(),
  KeyAllocationRecipientName: z
    .string()
    .min(3, { message: 'Please enter recipient name' }),
  KeyAllocationRecipientContact: z
    .string()
    .min(3, { message: 'Please enter recipient contact' }),
  KeyAllocationRecipientCompany: z.string().optional().nullable(),
  KeyAllocationPurpose: z
    .string()
    .min(3, { message: 'Please enter purpose of this key allotment' }),
  KeyAllocationStartTime: z.date(),
  KeyAllocationEndTime: z.date(),
});

export type KeyAllocationFormFields = z.infer<typeof keyAllocationSchema>;

//*Settings Schema
export const settingsSchema = z.object({
  SettingEmpWellnessIntervalInMins: z.coerce.number().min(1),
  SettingEmpShiftTimeMarginInMins: z.coerce.number().min(1),
});

export type SettingsFormFields = z.infer<typeof settingsSchema>;

//*Task Schema
export const taskSchema = z
  .object({
    TaskCompanyBranchId: z.string().nullable().optional(),
    TaskDescription: z.string().min(1),
    TaskStartDate: z.date(),
    TaskForDays: z.coerce.number().min(1),
    TaskStartTime: z.string(),

    //*Task alloted to location
    TaskAllotedLocationId: z.string().nullable().optional(),
    TaskAllotedLocationName: z.string().nullable().optional(),

    //*Task alloted to employees
    TaskAllotedToEmpIds: z.array(z.string()),
    TaskAllotedToEmps: z.array(
      z.object({ EmpName: z.string(), EmpId: z.string() })
    ),

    //*Task alloted to all employees
    TaskIsAllotedToAllEmps: z.boolean().default(false),
  })
  .superRefine(
    (
      { TaskAllotedLocationId, TaskAllotedToEmpIds, TaskIsAllotedToAllEmps },
      ctx
    ) => {
      if (
        !TaskAllotedLocationId &&
        (!TaskAllotedToEmpIds || TaskAllotedToEmpIds.length === 0) &&
        !TaskIsAllotedToAllEmps
      ) {
        ctx.addIssue({
          path: ['TaskIsAllotedToAllEmps'],
          message: `Please allot this task to location, employees or all employees`,
          code: 'custom',
        });
        ctx.addIssue({
          path: ['TaskAllotedLocationId'],
          message: `Please allot this task to location, employees or all employees`,
          code: 'custom',
        });
        ctx.addIssue({
          path: ['TaskAllotedToEmpIds'],
          message: `Please allot this task to location, employees or all employees`,
          code: 'custom',
        });
      }
    }
  );

export type TaskFormFields = z.infer<typeof taskSchema>;

//*PayStub Schema
export const payStubCreateSchema = z.object({
  PayStubCompanyBranchId: z.string().optional().nullable(),
  PayStubEmpId: z.string().min(3, { message: 'Please select employee' }),
  PayStubEmpName: z.string().min(3, { message: 'Please select employee' }),
  PayStubEmpRole: z.string().min(3, { message: 'Please select employee' }),
  PayStubRefNumber: z.string().nullable().optional(),
  PayStubPayPeriodStartDate: z.date(),
  PayStubPayPeriodEndDate: z.date(),
  PayStubPayDate: z.date(),
  PayStubNetPay: z.object({
    Amount: z.coerce.number(),
    YearToDateAmt: z.coerce.number(),
  }),
});

export type PayStubCreateFormFields = z.infer<typeof payStubCreateSchema>;

//*Training & Certification Create Schema
export const trainCertsCreateSchema = z.object({
  TrainCertsTitle: z.string().min(3).max(100),
  TrainCertsDescription: z.string().optional().nullable(),
  TrainCertsCategory: z.enum([
    TrainCertsCategories.TECHNICAL,
    TrainCertsCategories.SAFETY,
    TrainCertsCategories.COMPLIANCE,
  ]),
  TrainCertsCost: z.coerce.number().nullable().optional(),
  TrainCertsDuration: z.coerce.number().min(1),
  TrainCertsStartDate: z.date(),
  TrainCertsEndDate: z.date(),
});

export type TrainCertsCreateFormFields = z.infer<typeof trainCertsCreateSchema>;

//*Training & Certification Allocation Schema
export const trainCertsAllocSchema = z.object({
  TrainCertsId: z.string().min(3),
  TrainCertsAllocEmpId: z.string().min(3),
  TrainCertsAllocEmpName: z.string().min(3),
  TrainCertsAllocDate: z.date(),
});

export type TrainCertsAllocFormFields = z.infer<typeof trainCertsAllocSchema>;

//*Emergency Protocol create schema
export const emergProtocolCreateSchema = z.object({
  EmergProtocolTitle: z.string().min(3),
  EmergProtocolDescription: z.string().min(1),
});

export type EmergProtocolCreateFormFields = z.infer<
  typeof emergProtocolCreateSchema
>;
