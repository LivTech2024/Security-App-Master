import {
  DocumentData,
  QueryConstraint,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config";
import { CollectionName } from "../../@types/enum";
import { ClientFormFields } from "../../utilities/zod/schema";
import { IClientsCollection } from "../../@types/database";
import CustomError from "../../utilities/CustomError";
import { getNewDocId } from "./utils";
import { fullTextSearchIndex } from "../../utilities/misc";

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
      ClientBalance: Number(data.ClientBalance),
      ClientCreatedAt: serverTimestamp(),
      ClientModifiedAt: serverTimestamp(),
    };

    return setDoc(clientRefRef, newClient);
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

    const updatedClient: Partial<IClientsCollection> = {
      ClientName: data.ClientName,
      ClientNameSearchIndex,
      ClientEmail: data.ClientEmail,
      ClientPhone: data.ClientPhone,
      ClientAddress: data.ClientAddress || null,
      ClientModifiedAt: serverTimestamp(),
    };

    return updateDoc(clientRefRef, updatedClient);
  };

  static deleteClient = async (clientId: string) => {
    //* check if any invoices exist with this client
    const invoiceRef = collection(db, CollectionName.invoices);
    const invoiceQuery = query(
      invoiceRef,
      where("InvoiceClientId", "==", clientId),
      limit(1)
    );
    const snapshot = await getDocs(invoiceQuery);

    if (!snapshot.empty) {
      throw new CustomError("Invoices with this client already exist");
    }

    const clientRef = doc(db, CollectionName.clients, clientId);
    return deleteDoc(clientRef);
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
}

export default DbClient;
