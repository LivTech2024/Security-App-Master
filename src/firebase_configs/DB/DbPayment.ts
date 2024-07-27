import {
  DocumentData,
  QueryConstraint,
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config';
import { CollectionName } from '../../@types/enum';
import {
  InvoiceFormFields,
  PayStubCreateFormFields,
} from '../../utilities/zod/schema';
import {
  IClientsCollection,
  IInvoiceItems,
  IInvoiceTaxList,
  IInvoicesCollection,
  IPayStubDeductionsChildCollection,
  IPayStubEarningsChildCollection,
  IPayStubsCollection,
  IShiftsCollection,
} from '../../@types/database';
import CustomError from '../../utilities/CustomError';
import { getNewDocId } from './utils';
import {
  formatDate,
  getHoursDiffInTwoTimeString,
  removeTimeFromDate,
} from '../../utilities/misc';
import DbEmployee from './DbEmployee';
import {
  IDeductionList,
  IEarningList,
} from '../../pages/payments_and_billing/paystub/PayStubGenerate';

class DbPayment {
  static isInvoiceNumberExist = async (
    cmpId: string,
    invoiceNo: string,
    invoiceId?: string
  ) => {
    const invoiceRef = collection(db, CollectionName.invoices);

    let queryParams: QueryConstraint[] = [
      where('InvoiceCompanyId', '==', cmpId),
      where('InvoiceNumber', '==', invoiceNo),
    ];

    if (invoiceId) {
      queryParams = [...queryParams, where('InvoiceId', '!=', invoiceId)];
    }
    queryParams = [...queryParams, limit(1)];

    const invoiceQuery = query(invoiceRef, ...queryParams);

    const snapshot = await getDocs(invoiceQuery);

    return !snapshot.empty;
  };

  static createInvoice = async ({
    cmpId,
    data,
    items,
    taxes,
  }: {
    cmpId: string;
    data: InvoiceFormFields;
    items: IInvoiceItems[];
    taxes: IInvoiceTaxList[];
  }) => {
    const invoiceNoExist = await this.isInvoiceNumberExist(
      cmpId,
      data.InvoiceNumber
    );

    if (invoiceNoExist) {
      throw new CustomError('This invoice number already exist');
    }

    items = items.map((item) => {
      return {
        ...item,
        ItemPrice: Number(item.ItemPrice),
        ItemQuantity: Number(item.ItemQuantity),
        ItemTotal: Number(item.ItemTotal),
      };
    });

    taxes = taxes.map((tax) => {
      return {
        ...tax,
        TaxAmount: Number(tax.TaxAmount),
        TaxPercentage: Number(tax.TaxPercentage),
      };
    });

    await runTransaction(db, async (transaction) => {
      const invoiceId = getNewDocId(CollectionName.invoices);

      const invoiceRef = doc(db, CollectionName.invoices, invoiceId);

      const newInvoice: IInvoicesCollection = {
        InvoiceId: invoiceId,
        InvoiceCompanyId: cmpId,
        InvoiceCompanyBranchId: data.InvoiceCompanyBranchId || null,
        InvoiceClientId: data.InvoiceClientId,
        InvoiceClientName: data.InvoiceClientName,
        InvoiceClientPhone: data.InvoiceClientPhone,
        InvoiceClientAddress: data.InvoiceClientAddress || null,
        InvoiceCompanyEmail: data.InvoiceCompanyEmail,
        InvoiceCompanyPhone: data.InvoiceClientPhone,
        InvoiceLocationId: data.InvoiceLocationId || null,
        InvoiceLocationName: data.InvoiceLocationName || null,
        InvoiceNumber: data.InvoiceNumber,
        InvoicePONumber: data.InvoicePONumber || null,
        InvoiceDate: removeTimeFromDate(
          data.InvoiceDate
        ) as unknown as Timestamp,
        InvoiceDueDate: removeTimeFromDate(
          data.InvoiceDueDate
        ) as unknown as Timestamp,
        InvoiceItems: items,
        InvoiceSubtotal: data.InvoiceSubtotal ?? 0,
        InvoiceTaxList: taxes,
        InvoiceTotalAmount: data.InvoiceTotalAmount ?? 0,
        InvoiceDescription: data.InvoiceDescription || null,
        InvoiceReceivedAmount: data.InvoiceReceivedAmount ?? 0,
        InvoiceTerms: data.InvoiceTerms || null,
        InvoiceCreatedAt: serverTimestamp(),
        InvoiceModifiedAt: serverTimestamp(),
      };

      const balanceAmount =
        (data.InvoiceTotalAmount || 0) - (data.InvoiceReceivedAmount || 0);

      const clientRef = doc(db, CollectionName.clients, data.InvoiceClientId);
      const snapshot = await transaction.get(clientRef);
      const client = snapshot.data() as IClientsCollection;

      transaction.update(clientRef, {
        ClientBalance: client.ClientBalance + balanceAmount,
      });
      transaction.set(invoiceRef, newInvoice);
    });
  };

  static updateInvoice = async ({
    invoiceId,
    cmpId,
    data,
    items,
    taxes,
  }: {
    invoiceId: string;
    cmpId: string;
    data: InvoiceFormFields;
    items: IInvoiceItems[];
    taxes: IInvoiceTaxList[];
  }) => {
    const invoiceNoExist = await this.isInvoiceNumberExist(
      cmpId,
      data.InvoiceNumber,
      invoiceId
    );

    if (invoiceNoExist) {
      throw new CustomError('This invoice number already exist');
    }

    items = items.map((item) => {
      return {
        ...item,
        ItemPrice: Number(item.ItemPrice),
        ItemQuantity: Number(item.ItemQuantity),
        ItemTotal: Number(item.ItemTotal),
      };
    });

    taxes = taxes.map((tax) => {
      return {
        ...tax,
        TaxAmount: Number(tax.TaxAmount),
        TaxPercentage: Number(tax.TaxPercentage),
      };
    });

    await runTransaction(db, async (transaction) => {
      const invoiceRef = doc(db, CollectionName.invoices, invoiceId);

      const invoiceSnapshot = await transaction.get(invoiceRef);
      const oldInvoiceData = invoiceSnapshot.data() as IInvoicesCollection;

      const updatedInvoice: Partial<IInvoicesCollection> = {
        InvoiceCompanyBranchId: data.InvoiceCompanyBranchId || null,
        InvoiceClientId: data.InvoiceClientId,
        InvoiceClientName: data.InvoiceClientName,
        InvoiceClientPhone: data.InvoiceClientPhone,
        InvoiceClientAddress: data.InvoiceClientAddress || null,
        InvoiceCompanyEmail: data.InvoiceCompanyEmail,
        InvoiceCompanyPhone: data.InvoiceCompanyPhone,
        InvoiceLocationId: data.InvoiceLocationId || null,
        InvoiceLocationName: data.InvoiceLocationName || null,
        InvoiceNumber: data.InvoiceNumber,
        InvoicePONumber: data.InvoicePONumber || null,
        InvoiceDate: removeTimeFromDate(
          data.InvoiceDate
        ) as unknown as Timestamp,
        InvoiceDueDate: removeTimeFromDate(
          data.InvoiceDueDate
        ) as unknown as Timestamp,
        InvoiceItems: items,
        InvoiceSubtotal: data.InvoiceSubtotal ?? 0,
        InvoiceTaxList: taxes,
        InvoiceTotalAmount: data.InvoiceTotalAmount ?? 0,
        InvoiceDescription: data.InvoiceDescription || null,
        InvoiceReceivedAmount: data.InvoiceReceivedAmount ?? 0,
        InvoiceTerms: data.InvoiceTerms || null,
        InvoiceModifiedAt: serverTimestamp(),
      };

      if (oldInvoiceData.InvoiceClientId !== updatedInvoice.InvoiceClientId) {
        //*Update the balance of old client
        const oldBalanceAmount =
          (oldInvoiceData.InvoiceTotalAmount || 0) -
          (oldInvoiceData.InvoiceReceivedAmount || 0);
        const oldClientRef = doc(
          db,
          CollectionName.clients,
          oldInvoiceData.InvoiceClientId
        );
        const oldClientSnapshot = await transaction.get(oldClientRef);
        const oldClientData = oldClientSnapshot.data() as IClientsCollection;

        transaction.update(oldClientRef, {
          ClientBalance: oldClientData.ClientBalance - oldBalanceAmount,
        });

        //*Update the balance of new client
        const newBalanceAmount =
          (data.InvoiceTotalAmount || 0) - (data.InvoiceReceivedAmount || 0);

        const clientRef = doc(db, CollectionName.clients, data.InvoiceClientId);
        const snapshot = await transaction.get(clientRef);
        const client = snapshot.data() as IClientsCollection;

        transaction.update(clientRef, {
          ClientBalance: client.ClientBalance + newBalanceAmount,
        });
      } else {
        const newBalanceAmount =
          (data.InvoiceTotalAmount || 0) - (data.InvoiceReceivedAmount || 0);

        const oldBalanceAmount =
          (oldInvoiceData.InvoiceTotalAmount || 0) -
          (oldInvoiceData.InvoiceReceivedAmount || 0);

        const clientRef = doc(db, CollectionName.clients, data.InvoiceClientId);
        const snapshot = await transaction.get(clientRef);
        const client = snapshot.data() as IClientsCollection;

        transaction.update(clientRef, {
          ClientBalance:
            client.ClientBalance - oldBalanceAmount + newBalanceAmount,
        });
      }

      //* Update the invoice
      transaction.update(invoiceRef, updatedInvoice);
    });
  };

  static getInvoices = ({
    cmpId,
    lastDoc,
    lmt,
    endDate,
    isLifeTime,
    startDate,
    clientId,
    branchId,
  }: {
    cmpId: string;
    branchId?: string;
    lastDoc?: DocumentData | null;
    lmt?: number;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    isLifeTime?: boolean;
    clientId?: string;
  }) => {
    const invoiceRef = collection(db, CollectionName.invoices);

    let queryParams: QueryConstraint[] = [
      where('InvoiceCompanyId', '==', cmpId),
      orderBy('InvoiceDate', 'desc'),
    ];

    if (!isLifeTime) {
      queryParams = [
        ...queryParams,
        where('InvoiceDate', '>=', startDate),
        where('InvoiceDate', '<=', endDate),
      ];
    }

    if (clientId) {
      queryParams = [...queryParams, where('InvoiceClientId', '==', clientId)];
    }
    if (branchId) {
      queryParams = [
        ...queryParams,
        where('InvoiceCompanyBranchId', '==', branchId),
      ];
    }

    if (lastDoc) {
      queryParams = [...queryParams, startAfter(lastDoc)];
    }

    if (lmt) {
      queryParams = [...queryParams, limit(lmt)];
    }

    const invoiceQuery = query(invoiceRef, ...queryParams);

    return getDocs(invoiceQuery);
  };

  static deleteInvoice = async (invoiceId: string) => {
    await runTransaction(db, async (transaction) => {
      const invoiceRef = doc(db, CollectionName.invoices, invoiceId);
      const invoiceSnapshot = await transaction.get(invoiceRef);
      const invoiceData = invoiceSnapshot.data() as IInvoicesCollection;

      const { InvoiceTotalAmount, InvoiceReceivedAmount, InvoiceClientId } =
        invoiceData;

      const clientRef = doc(db, CollectionName.clients, InvoiceClientId);
      const clientSnapshot = await transaction.get(clientRef);
      const clientData = clientSnapshot.data() as IClientsCollection;

      const balanceAmount = InvoiceTotalAmount - InvoiceReceivedAmount;

      transaction.delete(invoiceRef);

      transaction.update(clientRef, {
        ClientBalance: clientData.ClientBalance - balanceAmount,
      });
    });
  };

  static getRecentInvNumber = async (cmpId: string) => {
    const invoiceRef = collection(db, CollectionName.invoices);
    const invoiceQuery = query(
      invoiceRef,
      where('InvoiceCompanyId', '==', cmpId),
      orderBy('InvoiceNumber', 'desc'),
      limit(1)
    );

    const invoiceSnapshot = await getDocs(invoiceQuery);
    const invoiceData = invoiceSnapshot.docs[0]?.data() as IInvoicesCollection;

    return invoiceData;
  };

  //*For PayStub

  static isPayStubExistForPayPeriod = async (
    empId: string,
    startDate: Date,
    endDate: Date
  ) => {
    const payStubRef = collection(db, CollectionName.payStubs);
    const payStubQuery = query(
      payStubRef,
      where('PayStubEmpId', '==', empId),
      where('PayStubPayPeriodStartDate', '<=', endDate),
      where('PayStubPayPeriodEndDate', '>=', startDate),
      limit(1)
    );

    const snapshot = await getDocs(payStubQuery);

    return snapshot.size > 0;
  };

  static getEmpEarning = async ({
    empId,
    endDate,
    startDate,
  }: {
    empId: string;
    startDate: Date;
    endDate: Date;
  }) => {
    let empEarningDetails = {
      Name: 'Regular Hours',
      Rate: 0,
      Quantity: 0,
    };

    try {
      const empDetails = await DbEmployee.getEmpById(empId);

      const shiftRef = collection(db, CollectionName.shifts);
      const shiftQuery = query(
        shiftRef,
        where('ShiftAssignedUserId', 'array-contains', empId),
        where('ShiftDate', '>=', startDate),
        where('ShiftDate', '<=', endDate)
      );

      const shiftSnapshot = await getDocs(shiftQuery);
      const shiftData = shiftSnapshot.docs.map(
        (doc) => doc.data() as IShiftsCollection
      );

      const { EmployeePayRate } = empDetails;

      let empTotalHrs = 0;

      shiftData.forEach((data) => {
        const shiftStatusForEmp = data.ShiftCurrentStatus.find(
          (status) => status.StatusReportedById === empId
        );
        if (shiftStatusForEmp && shiftStatusForEmp.Status === 'completed') {
          const hrs = getHoursDiffInTwoTimeString(
            formatDate(shiftStatusForEmp.StatusStartedTime, 'HH:mm'),
            formatDate(shiftStatusForEmp.StatusReportedTime, 'HH:mm')
          );

          empTotalHrs += hrs;
        }
      });

      empEarningDetails = {
        ...empEarningDetails,
        Rate: EmployeePayRate,
        Quantity: empTotalHrs,
      };

      return empEarningDetails;
    } catch (error) {
      console.log(error);
      throw error;
      return empEarningDetails;
    }
  };

  static getPrevPayStub = async (empId: string, startDate: Date) => {
    const payStubRef = collection(db, CollectionName.payStubs);
    const payStubQuery = query(
      payStubRef,
      where('PayStubEmpId', '==', empId),
      where('PayStubPayPeriodStartDate', '<=', startDate),
      limit(1)
    );

    const snapshot = await getDocs(payStubQuery);

    return snapshot?.docs[0]?.data() as IPayStubsCollection;
  };

  static createPayStub = ({
    cmpId,
    data,
    deductionsList,
    earningsList,
  }: {
    cmpId: string;
    data: PayStubCreateFormFields;
    earningsList: IEarningList[];
    deductionsList: IDeductionList[];
  }) => {
    const payStubId = getNewDocId(CollectionName.payStubs);
    const payStubRef = doc(db, CollectionName.payStubs, payStubId);

    const {
      PayStubEmpId,
      PayStubEmpName,
      PayStubEmpRole,
      PayStubNetPay,
      PayStubPayDate,
      PayStubPayPeriodEndDate,
      PayStubPayPeriodStartDate,
      PayStubRefNumber,
    } = data;

    const PayStubEarnings: IPayStubEarningsChildCollection[] = earningsList.map(
      (res) => {
        return {
          ...res,
          CurrentAmount: res.CurrentAmount
            ? Number(res.CurrentAmount)
            : Number(res.Quantity) * Number(res.Rate),
          Quantity: Number(res.Quantity) || null,
          Rate: Number(res.Rate) || null,
          YTDAmount: Number(res.YTDAmount || 0),
        };
      }
    );

    const PayStubDeductions: IPayStubDeductionsChildCollection[] =
      deductionsList
        .filter((res) => res.Amount && res.Percentage)
        .map((res) => {
          return {
            Amount: Number(res.Amount),
            Deduction: res.Deduction,
            OtherDeduction: res.OtherDeduction,
            Percentage: Number(res.Percentage),
            YearToDateAmt: Number(res.YearToDateAmt || 0),
          };
        });

    const newPayStub: IPayStubsCollection = {
      PayStubId: payStubId,
      PayStubCompanyId: cmpId,
      PayStubCompanyBranchId: data.PayStubCompanyBranchId,
      PayStubEmpId,
      PayStubEmpName,
      PayStubEmpRole,
      PayStubEarnings,
      PayStubDeductions,
      PayStubIsPublished: false,
      PayStubPayPeriodStartDate: removeTimeFromDate(
        PayStubPayPeriodStartDate
      ) as unknown as Timestamp,
      PayStubPayPeriodEndDate: removeTimeFromDate(
        PayStubPayPeriodEndDate
      ) as unknown as Timestamp,
      PayStubPayDate: removeTimeFromDate(
        PayStubPayDate
      ) as unknown as Timestamp,
      PayStubNetPay,
      PayStubRefNumber,
      PayStubCreatedAt: serverTimestamp(),
      PayStubModifiedAt: serverTimestamp(),
    };

    return setDoc(payStubRef, newPayStub);
  };

  static updatePayStub = ({
    payStubId,
    data,
    deductionsList,
    earningsList,
  }: {
    payStubId: string;
    data: PayStubCreateFormFields;
    earningsList: IEarningList[];
    deductionsList: IDeductionList[];
  }) => {
    const payStubRef = doc(db, CollectionName.payStubs, payStubId);

    const {
      PayStubEmpId,
      PayStubEmpName,
      PayStubEmpRole,
      PayStubNetPay,
      PayStubPayDate,
      PayStubPayPeriodEndDate,
      PayStubPayPeriodStartDate,
      PayStubRefNumber,
    } = data;

    const PayStubEarnings: IPayStubEarningsChildCollection[] = earningsList.map(
      (res) => {
        return {
          ...res,
          CurrentAmount: res.CurrentAmount
            ? Number(res.CurrentAmount)
            : Number(res.Quantity) * Number(res.Rate),
          Quantity: Number(res.Quantity) || null,
          Rate: Number(res.Rate) || null,
          YTDAmount: Number(res.YTDAmount || 0),
        };
      }
    );

    const PayStubDeductions: IPayStubDeductionsChildCollection[] =
      deductionsList
        .filter((res) => res.Amount && res.Percentage)
        .map((res) => {
          return {
            Amount: Number(res.Amount),
            Deduction: res.Deduction,
            OtherDeduction: res.OtherDeduction,
            Percentage: Number(res.Percentage),
            YearToDateAmt: Number(res.YearToDateAmt || 0),
          };
        });

    const updatedPayStub: Partial<IPayStubsCollection> = {
      PayStubCompanyBranchId: data.PayStubCompanyBranchId,
      PayStubEmpId,
      PayStubEmpName,
      PayStubEmpRole,
      PayStubEarnings,
      PayStubDeductions,
      PayStubPayPeriodStartDate: removeTimeFromDate(
        PayStubPayPeriodStartDate
      ) as unknown as Timestamp,
      PayStubPayPeriodEndDate: removeTimeFromDate(
        PayStubPayPeriodEndDate
      ) as unknown as Timestamp,
      PayStubPayDate: removeTimeFromDate(
        PayStubPayDate
      ) as unknown as Timestamp,
      PayStubNetPay,
      PayStubRefNumber,
      PayStubModifiedAt: serverTimestamp(),
    };

    return updateDoc(payStubRef, updatedPayStub);
  };

  static deletePayStub = (payStubId: string) => {
    const payStubRef = doc(db, CollectionName.payStubs, payStubId);

    return deleteDoc(payStubRef);
  };

  static publishPayStub = (payStubId: string) => {
    const payStubRef = doc(db, CollectionName.payStubs, payStubId);
    return updateDoc(payStubRef, { PayStubIsPublished: true });
  };

  static getPayStubs = ({
    cmpId,
    lastDoc,
    lmt,
    endDate,
    isLifeTime,
    startDate,
    branchId,
  }: {
    cmpId: string;
    branchId?: string | null;
    lastDoc?: DocumentData | null;
    lmt?: number;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    isLifeTime?: boolean;
  }) => {
    const payStubRef = collection(db, CollectionName.payStubs);

    let queryParams: QueryConstraint[] = [
      where('PayStubCompanyId', '==', cmpId),
      orderBy('PayStubPayDate', 'desc'),
    ];

    if (!isLifeTime) {
      queryParams = [
        ...queryParams,
        where('PayStubPayDate', '>=', startDate),
        where('PayStubPayDate', '<=', endDate),
      ];
    }

    if (branchId && branchId.length > 0) {
      queryParams = [
        ...queryParams,
        where('PayStubCompanyBranchId', '==', branchId),
      ];
    }

    if (lastDoc) {
      queryParams = [...queryParams, startAfter(lastDoc)];
    }

    if (lmt) {
      queryParams = [...queryParams, limit(lmt)];
    }

    const invoiceQuery = query(payStubRef, ...queryParams);

    return getDocs(invoiceQuery);
  };
}

export default DbPayment;
