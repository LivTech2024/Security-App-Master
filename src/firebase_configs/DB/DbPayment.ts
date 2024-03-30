import {
  DocumentData,
  QueryConstraint,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import { db } from "../config";
import { CollectionName } from "../../@types/enum";

class DbPayment {
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
}

export default DbPayment;
