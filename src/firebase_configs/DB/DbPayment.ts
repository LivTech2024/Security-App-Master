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
} from "firebase/firestore";
import { db } from "../config";
import { CollectionName } from "../../@types/enum";
import { InvoiceFormFields } from "../../utilities/zod/schema";
import {
  IClientsCollection,
  IInvoiceItems,
  IInvoiceTaxList,
  IInvoicesCollection,
} from "../../@types/database";
import CustomError from "../../utilities/CustomError";
import { getNewDocId } from "./utils";
import { removeTimeFromDate } from "../../utilities/misc";

class DbPayment {
  static isInvoiceNumberExist = async (cmpId: string, invoiceNo: string) => {
    const invoiceRef = collection(db, CollectionName.invoices);

    const invoiceQuery = query(
      invoiceRef,
      where("InvoiceCompanyId", "==", cmpId),
      where("InvoiceNumber", "==", invoiceNo),
      limit(1)
    );

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
      throw new CustomError("This invoice number already exist");
    }

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

  static getInvoices = ({
    cmpId,
    lastDoc,
    lmt,
    endDate,
    isLifeTime,
    startDate,
  }: {
    cmpId: string;
    lastDoc?: DocumentData | null;
    lmt?: number;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    isLifeTime?: boolean;
  }) => {
    const invoiceRef = collection(db, CollectionName.invoices);

    let queryParams: QueryConstraint[] = [
      where("InvoiceCompanyId", "==", cmpId),
      orderBy("InvoiceDate", "desc"),
    ];

    if (!isLifeTime) {
      queryParams = [
        ...queryParams,
        where("InvoiceDate", ">=", startDate),
        where("InvoiceDate", "<=", endDate),
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
}

export default DbPayment;
