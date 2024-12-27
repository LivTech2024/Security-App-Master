import { StateCreator } from 'zustand';
import {
  ICalloutsCollection,
  IClientsCollection,
  IDocumentsCollection,
  IEmergencyProtocolsCollection,
  IEmployeesCollection,
  IEquipmentAllocations,
  IEquipmentsCollection,
  IExpensesCollection,
  IInvoicesCollection,
  IKeyAllocations,
  IKeysCollection,
  ILocationsCollection,
  IPatrolsCollection,
  IPayStubsCollection,
  IShiftsCollection,
  ITasksCollection,
  ITrainingAndCertificationsCollection,
} from '../../@types/database';
import { CompanyBranches } from './auth.slice';
import { CompanyCreateFormFields } from '../../utilities/zod/schema';

export interface Employee
  extends Omit<
    IEmployeesCollection,
    'EmployeeCreatedAt' | 'EmployeeModifiedAt'
  > {
  EmployeeCreatedAt: string;
  EmployeeModifiedAt: string;
}

export interface Shift
  extends Omit<
    IShiftsCollection,
    'ShiftDate' | 'ShiftCreatedAt' | 'ShiftModifiedAt'
  > {
  ShiftDate: string;
  ShiftCreatedAt: string;
  ShiftModifiedAt: string;
}

export interface Location
  extends Omit<
    ILocationsCollection,
    'LocationCreatedAt' | 'LocationModifiedAt'
  > {
  LocationCreatedAt: string;
  LocationModifiedAt: string;
}

export interface Client
  extends Omit<IClientsCollection, 'ClientCreatedAt' | 'ClientModifiedAt'> {
  ClientCreatedAt: string;
  ClientModifiedAt: string;
}

export interface IDocument
  extends Omit<
    IDocumentsCollection,
    'DocumentCreatedAt' | 'DocumentModifiedAt'
  > {
  DocumentCreatedAt: string;
  DocumentModifiedAt: string;
}

export interface Equipment
  extends Omit<
    IEquipmentsCollection,
    'EquipmentCreatedAt' | 'EquipmentModifiedAt'
  > {
  EquipmentCreatedAt: string;
  EquipmentModifiedAt: string;
}

export interface EquipmentAllocation
  extends Omit<
    IEquipmentAllocations,
    | 'EquipmentAllocationDate'
    | 'EquipmentAllocationStartDate'
    | 'EquipmentAllocationEndDate'
    | 'EquipmentAllocationReturnedAt'
    | 'EquipmentAllocationCreatedAt'
  > {
  EquipmentAllocationDate: string;
  EquipmentAllocationStartDate: string;
  EquipmentAllocationEndDate: string;
  EquipmentAllocationReturnedAt: string;
  EquipmentAllocationCreatedAt: string;
}

export interface Key
  extends Omit<IKeysCollection, 'KeyCreatedAt' | 'KeyModifiedAt'> {
  KeyCreatedAt: string;
  KeyModifiedAt: string;
}

export interface KeyAllocation
  extends Omit<
    IKeyAllocations,
    | 'KeyAllocationDate'
    | 'KeyAllocationStartTime'
    | 'KeyAllocationEndTime'
    | 'KeyAllocationReturnedAt'
    | 'KeyAllocationCreatedAt'
  > {
  KeyAllocationDate: string;
  KeyAllocationStartTime: string;
  KeyAllocationEndTime: string;
  KeyAllocationReturnedAt: string;
  KeyAllocationCreatedAt: string;
}

interface EditFormState {
  companyEditData: CompanyCreateFormFields | null;
  setCompanyEditData: (cmp: CompanyCreateFormFields | null) => void;

  employeeEditData: Employee | null;
  setEmployeeEditData: (emp: Employee | null) => void;

  shiftEditData: Shift | null;
  setShiftEditData: (shift: Shift | null) => void;

  patrolEditData: IPatrolsCollection | null;
  setPatrolEditData: (patrol: IPatrolsCollection | null) => void;

  locationEditData: Location | null;
  setLocationEditData: (loc: Location | null) => void;

  companyBranchEditData: CompanyBranches | null;
  setCompanyBranchEditData: (branch: CompanyBranches | null) => void;

  clientEditData: Client | null;
  setClientEditData: (client: Client | null) => void;

  documentEditData: IDocument | null;
  setDocumentEditData: (doc: IDocument | null) => void;

  equipmentEditData: Equipment | null;
  setEquipmentEditData: (equip: Equipment | null) => void;

  equipAllocationEditData: EquipmentAllocation | null;
  setEquipAllocationEditData: (equipAlloc: EquipmentAllocation | null) => void;

  keyEditData: Key | null;
  setKeyEditData: (key: Key | null) => void;

  keyAllocationEditData: KeyAllocation | null;
  setKeyAllocationEditData: (keyAlloc: KeyAllocation | null) => void;

  invoiceEditData: IInvoicesCollection | null;
  setInvoiceEditData: (inv: IInvoicesCollection | null) => void;

  expenseEditData: IExpensesCollection | null;
  setExpenseEditData: (inv: IExpensesCollection | null) => void;

  payStubEditData: IPayStubsCollection | null;
  setPayStubEditData: (payStub: IPayStubsCollection | null) => void;

  trainCertsEditData: ITrainingAndCertificationsCollection | null;
  setTrainCertsEditData: (
    trainCerts: ITrainingAndCertificationsCollection | null
  ) => void;

  taskEditData: ITasksCollection | null;
  setTaskEditData: (task: ITasksCollection | null) => void;

  emergProtocolEditData: IEmergencyProtocolsCollection | null;
  setEmergProtocolEditData: (
    task: IEmergencyProtocolsCollection | null
  ) => void;

  calloutEditData: ICalloutsCollection | null;
  setCalloutEditData: (callout: ICalloutsCollection | null) => void;
}

export const createEditFormSlice: StateCreator<EditFormState> = (set) => ({
  //Company
  companyEditData: null,
  setCompanyEditData: (cmp) =>
    set((state) => ({ ...state, companyEditData: cmp })),

  //Emp
  employeeEditData: null,
  setEmployeeEditData: (emp) =>
    set((state) => ({ ...state, employeeEditData: emp })),

  //Shift
  shiftEditData: null,
  setShiftEditData: (shift) =>
    set((state) => ({ ...state, shiftEditData: shift })),

  //Patrol
  patrolEditData: null,
  setPatrolEditData: (patrol) =>
    set((state) => ({ ...state, patrolEditData: patrol })),

  //Location
  locationEditData: null,
  setLocationEditData: (loc) =>
    set((state) => ({ ...state, locationEditData: loc })),

  //Company Branch
  companyBranchEditData: null,
  setCompanyBranchEditData: (branch) =>
    set((state) => ({ ...state, companyBranchEditData: branch })),

  //Client
  clientEditData: null,
  setClientEditData: (client) =>
    set((state) => ({ ...state, clientEditData: client })),

  //Document
  documentEditData: null,
  setDocumentEditData: (doc) =>
    set((state) => ({ ...state, documentEditData: doc })),

  //Equipment
  equipmentEditData: null,
  setEquipmentEditData: (equip) =>
    set((state) => ({ ...state, equipmentEditData: equip })),

  //EquipAllocation
  equipAllocationEditData: null,
  setEquipAllocationEditData: (equipAlloc) =>
    set((state) => ({ ...state, equipAllocationEditData: equipAlloc })),

  //Key
  keyEditData: null,
  setKeyEditData: (key) => set((state) => ({ ...state, keyEditData: key })),

  //KeyAllocation
  keyAllocationEditData: null,
  setKeyAllocationEditData: (keyAlloc) =>
    set((state) => ({ ...state, keyAllocationEditData: keyAlloc })),

  //Invoices
  invoiceEditData: null,
  setInvoiceEditData: (inv) =>
    set((state) => ({ ...state, invoiceEditData: inv })),

  //Expenses
  expenseEditData: null,
  setExpenseEditData: (expense) =>
    set((state) => ({ ...state, expenseEditData: expense })),

  //payStub
  payStubEditData: null,
  setPayStubEditData: (payStub) =>
    set((state) => ({ ...state, payStubEditData: payStub })),

  //trainCerts
  trainCertsEditData: null,
  setTrainCertsEditData: (trainCerts) =>
    set((state) => ({ ...state, trainCertsEditData: trainCerts })),

  //task
  taskEditData: null,
  setTaskEditData: (task) => set((state) => ({ ...state, taskEditData: task })),

  //task
  emergProtocolEditData: null,
  setEmergProtocolEditData: (protocol) =>
    set((state) => ({ ...state, emergProtocolEditData: protocol })),

  //callout
  calloutEditData: null,
  setCalloutEditData: (callout) =>
    set((state) => ({ ...state, calloutEditData: callout })),
});
