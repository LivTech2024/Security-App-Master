import {
  DocumentData,
  QueryConstraint,
  Timestamp,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  where,
} from 'firebase/firestore';
import { db } from '../config';
import { CollectionName } from '../../@types/enum';
import { InvoiceFormFields } from '../../utilities/zod/schema';
import {
  IClientsCollection,
  IInvoiceItems,
  IInvoiceTaxList,
  IInvoicesCollection,
} from '../../@types/database';
import CustomError from '../../utilities/CustomError';
import { getNewDocId } from './utils';
import { removeTimeFromDate } from '../../utilities/misc';

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
        InvoiceClientId: data.InvoiceClientId,
        InvoiceClientName: data.InvoiceClientName,
        InvoiceClientPhone: data.InvoiceClientPhone,
        InvoiceClientAddress: data.InvoiceClientAddress || null,
        InvoiceNumber: data.InvoiceNumber,
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
        InvoiceClientId: data.InvoiceClientId,
        InvoiceClientName: data.InvoiceClientName,
        InvoiceClientPhone: data.InvoiceClientPhone,
        InvoiceClientAddress: data.InvoiceClientAddress || null,
        InvoiceNumber: data.InvoiceNumber,
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
  }: {
    cmpId: string;
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
}

export default DbPayment;
