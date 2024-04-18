import {
  DocumentData,
  QueryConstraint,
  Timestamp,
  collection,
  doc,
  getDoc,
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
import { ClientFormFields } from "../../utilities/zod/schema";
import { IClientsCollection } from "../../@types/database";
import CustomError from "../../utilities/CustomError";
import { getNewDocId } from "./utils";
import { fullTextSearchIndex, removeTimeFromDate } from "../../utilities/misc";
import {
  createAuthUser,
  deleteAuthUser,
  updateAuthUser,
} from "../../API/AuthUser";

class DbClient {
  static isClientExist = async (
    cmpId: string,
    clientName: string,
    clientId?: string
  ) => {
    const clientRef = collection(db, CollectionName.clients);

    let queryParams: QueryConstraint[] = [
      where("ClientCompanyId", "==", cmpId),
      where("ClientName", "==", clientName),
    ];

    if (clientId) {
      queryParams = [...queryParams, where("ClientId", "!=", clientId)];
    }

    queryParams = [...queryParams, limit(1)];

    const clientQuery = query(clientRef, ...queryParams);

    const snapshot = await getDocs(clientQuery);

    return !snapshot.empty;
  };

  static createClient = async ({
    cmpId,
    data,
  }: {
    cmpId: string;
    data: ClientFormFields;
  }) => {
    const clientExist = await this.isClientExist(cmpId, data.ClientName);

    if (clientExist) {
      throw new CustomError("This client already exist");
    }

    const clientId = getNewDocId(CollectionName.clients);

    const clientRefRef = doc(db, CollectionName.clients, clientId);

    const ClientNameSearchIndex = fullTextSearchIndex(
      data.ClientName.trim().toLowerCase()
    );

    const newClient: IClientsCollection = {
      ClientId: clientId,
      ClientCompanyId: cmpId,
      ClientName: data.ClientName,
      ClientNameSearchIndex,
      ClientEmail: data.ClientEmail,
      ClientPhone: data.ClientPhone,
      ClientAddress: data.ClientAddress || null,
      ClientBalance: 0,
      ClientCreatedAt: serverTimestamp(),
      ClientModifiedAt: serverTimestamp(),
      ClientPassword: data.ClientPassword,
      ClientContractStartDate: removeTimeFromDate(
        data.ClientContractStartDate
      ) as unknown as Timestamp,
      ClientContractEndDate: removeTimeFromDate(
        data.ClientContractEndDate
      ) as unknown as Timestamp,
      ClientContractAmount: data.ClientContractAmount,
      ClientHourlyRate: data.ClientHourlyRate,
    };

    await runTransaction(db, async (transaction) => {
      transaction.set(clientRefRef, newClient);

      await createAuthUser({
        email: data.ClientEmail,
        password: data.ClientPassword,
        role: "client",
        userId: clientId,
      }).catch(() => {
        throw new CustomError("This email id is already registered");
      });
    });
  };

  static updateClient = async ({
    cmpId,
    data,
    clientId,
  }: {
    cmpId: string;
    clientId: string;
    data: ClientFormFields;
  }) => {
    const clientExist = await this.isClientExist(
      cmpId,
      data.ClientName,
      clientId
    );

    if (clientExist) {
      throw new CustomError("This client already exist");
    }

    const clientRefRef = doc(db, CollectionName.clients, clientId);

    const ClientNameSearchIndex = fullTextSearchIndex(
      data.ClientName.trim().toLowerCase()
    );

    await runTransaction(db, async (transaction) => {
      const clientSnapshot = await transaction.get(clientRefRef);
      const oldClientData = clientSnapshot.data() as IClientsCollection;

      const updatedClient: Partial<IClientsCollection> = {
        ClientName: data.ClientName,
        ClientNameSearchIndex,
        ClientEmail: data.ClientEmail,
        ClientPhone: data.ClientPhone,
        ClientAddress: data.ClientAddress || null,
        ClientContractStartDate: removeTimeFromDate(
          data.ClientContractStartDate
        ) as unknown as Timestamp,
        ClientContractEndDate: removeTimeFromDate(
          data.ClientContractEndDate
        ) as unknown as Timestamp,
        ClientContractAmount: data.ClientContractAmount,
        ClientHourlyRate: data.ClientHourlyRate,
        ClientModifiedAt: serverTimestamp(),
      };

      transaction.update(clientRefRef, updatedClient);

      if (oldClientData.ClientEmail !== data.ClientEmail) {
        await updateAuthUser({
          email: data.ClientEmail,
          userId: clientId,
        }).catch(() => {
          throw new CustomError("This email id is already registered");
        });
      }
    });
  };

  static deleteClient = async (clientId: string) => {
    //* check if this client is used anywhere
    const invoiceRef = collection(db, CollectionName.invoices);
    const invoiceQuery = query(
      invoiceRef,
      where("InvoiceClientId", "==", clientId),
      limit(1)
    );
    const invoiceTask = getDocs(invoiceQuery);

    const shiftRef = collection(db, CollectionName.shifts);
    const shiftQuery = query(
      shiftRef,
      where("ShiftClientId", "==", clientId),
      limit(1)
    );
    const shiftTask = getDocs(shiftQuery);

    const querySnapshots = await Promise.all([invoiceTask, shiftTask]);

    const isClientUsed = querySnapshots.some((snapshot) => snapshot.size > 0);

    if (isClientUsed) {
      throw new CustomError("This client is already in use");
    }

    await runTransaction(db, async (transaction) => {
      const clientRef = doc(db, CollectionName.clients, clientId);
      transaction.delete(clientRef);
      await deleteAuthUser(clientId);
    });
  };

  static getClients = ({
    cmpId,
    lastDoc,
    lmt,
    searchQuery,
  }: {
    cmpId: string;
    lastDoc?: DocumentData | null;
    lmt?: number;
    searchQuery?: string;
  }) => {
    const clientRef = collection(db, CollectionName.clients);

    let queryParams: QueryConstraint[] = [
      where("ClientCompanyId", "==", cmpId),
      orderBy("ClientCreatedAt", "desc"),
    ];

    if (searchQuery && searchQuery.length > 0) {
      queryParams = [
        ...queryParams,
        where(
          "ClientNameSearchIndex",
          "array-contains",
          searchQuery.toLocaleLowerCase()
        ),
      ];
    }

    if (lastDoc) {
      queryParams = [...queryParams, startAfter(lastDoc)];
    }

    if (lmt) {
      queryParams = [...queryParams, limit(lmt)];
    }

    const clientQuery = query(clientRef, ...queryParams);

    return getDocs(clientQuery);
  };

  static getClientById = (clientId: string) => {
    const clientRef = doc(db, CollectionName.clients, clientId);
    return getDoc(clientRef);
  };

  static getAllShiftsOfClient = (
    clientId: string,
    startDate: Date,
    endDate: Date
  ) => {
    const shiftRef = collection(db, CollectionName.shifts);
    const shiftQuery = query(
      shiftRef,
      where("ShiftClientId", "==", clientId),
      where("ShiftDate", ">=", startDate),
      where("ShiftDate", "<=", endDate)
    );

    return getDocs(shiftQuery);
  };

  //*For client portal
  static getClientPatrols = async ({
    lmt,
    lastDoc,
    searchQuery,
    clientId
  }: {
    lmt?: number;
    lastDoc?: DocumentData | null;
    searchQuery?: string;
    clientId:string
  }) => {
    const patrolRef = collection(db, CollectionName.patrols);

    let queryParams: QueryConstraint[] = [
      where("PatrolClientId", "==", clientId),
      orderBy("PatrolCreatedAt", "desc"),
    ];

    

    if (searchQuery && searchQuery.length > 0) {
      queryParams = [
        ...queryParams,
        where(
          "PatrolNameSearchIndex",
          "array-contains",
          searchQuery.toLocaleLowerCase()
        ),
      ];
    }

    if (lastDoc) {
      queryParams = [...queryParams, startAfter(lastDoc)];
    }

    if (lmt) {
      queryParams = [...queryParams, limit(lmt)];
    }

    const patrolQuery = query(patrolRef, ...queryParams);

    const snap = await getDocs(patrolQuery);

    return snap;
  };
}

export default DbClient;
