import {
  DocumentData,
  QueryConstraint,
  collection,
  doc,
  endAt,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  startAt,
  where,
} from 'firebase/firestore';
import { db } from '../config';
import {
  CloudStoragePaths,
  CollectionName,
  ImageResolution,
} from '../../@types/enum';
import { ClientFormFields } from '../../utilities/zod/schema';
import {
  IClientsCollection,
  IEmployeesCollection,
  IShiftsCollection,
} from '../../@types/database';
import CustomError from '../../utilities/CustomError';
import CloudStorageImageHandler, { getNewDocId } from './utils';
import { fullTextSearchIndex } from '../../utilities/misc';
import {
  createAuthUser,
  deleteAuthUser,
  updateAuthUser,
} from '../../API/AuthUser';
import dayjs from 'dayjs';
import DbEmployee from './DbEmployee';

class DbClient {
  static isClientExist = async (
    cmpId: string,
    clientName: string,
    clientId?: string
  ) => {
    const clientRef = collection(db, CollectionName.clients);

    let queryParams: QueryConstraint[] = [
      where('ClientCompanyId', '==', cmpId),
      where('ClientName', '==', clientName),
    ];

    if (clientId) {
      queryParams = [...queryParams, where('ClientId', '!=', clientId)];
    }

    queryParams = [...queryParams, limit(1)];

    const clientQuery = query(clientRef, ...queryParams);

    const snapshot = await getDocs(clientQuery);

    return !snapshot.empty;
  };

  static createClient = async ({
    cmpId,
    data,
    clientHomeBgImage,
  }: {
    cmpId: string;
    data: ClientFormFields;
    clientHomeBgImage: string | null;
  }) => {
    let clientHomeBgImageUrl: string | null = null;

    try {
      const clientExist = await this.isClientExist(cmpId, data.ClientName);

      if (clientExist) {
        throw new CustomError('This client already exist');
      }

      const clientId = getNewDocId(CollectionName.clients);

      const clientRefRef = doc(db, CollectionName.clients, clientId);

      const ClientNameSearchIndex = fullTextSearchIndex(
        data.ClientName.trim().toLowerCase()
      );

      if (clientHomeBgImage) {
        const imageEmployee = [
          {
            base64: clientHomeBgImage,
            path:
              CloudStoragePaths.CLIENT_IMAGES +
              '/' +
              CloudStorageImageHandler.generateImageName(
                clientId,
                'home_page_bg'
              ),
          },
        ];

        const clientHomeBgImageUrlTemp =
          await CloudStorageImageHandler.getImageDownloadUrls(
            imageEmployee,
            ImageResolution.CLIENT_HOME_PAGE_BG_IMG_HEIGHT,
            ImageResolution.CLIENT_HOME_PAGE_BG_IMG_WIDTH
          );

        clientHomeBgImageUrl = clientHomeBgImageUrlTemp[0];
      }
      const newClient: IClientsCollection = {
        ClientId: clientId,
        ClientCompanyId: cmpId,
        ClientName: data.ClientName,
        ClientNameSearchIndex,
        ClientEmail: data.ClientEmail,
        ClientPhone: data.ClientPhone,
        ClientAddress: data.ClientAddress || null,
        ClientBalance: 0,
        ClientPassword: data.ClientPassword,
        ClientHomePageBgImg: clientHomeBgImageUrl,
        ClientCreatedAt: serverTimestamp(),
        ClientModifiedAt: serverTimestamp(),
      };

      await runTransaction(db, async (transaction) => {
        transaction.set(clientRefRef, newClient);

        await createAuthUser({
          email: data.ClientEmail,
          password: data.ClientPassword,
          role: 'client',
          userId: clientId,
        }).catch(() => {
          throw new CustomError('This email id is already registered');
        });
      });
    } catch (error) {
      console.log(error);
      if (clientHomeBgImageUrl) {
        await CloudStorageImageHandler.deleteImageByUrl(clientHomeBgImageUrl);
      }
      throw error;
    }
  };

  static updateClient = async ({
    cmpId,
    data,
    clientId,
    clientHomeBgImage,
  }: {
    cmpId: string;
    clientId: string;
    data: ClientFormFields;
    clientHomeBgImage: string | null;
  }) => {
    try {
      const clientExist = await this.isClientExist(
        cmpId,
        data.ClientName,
        clientId
      );

      if (clientExist) {
        throw new CustomError('This client already exist');
      }

      const clientRefRef = doc(db, CollectionName.clients, clientId);

      const ClientNameSearchIndex = fullTextSearchIndex(
        data.ClientName.trim().toLowerCase()
      );

      let clientHomeBgImageUrl = clientHomeBgImage;

      if (clientHomeBgImage && !clientHomeBgImage.startsWith('https')) {
        const imageEmployee = [
          {
            base64: clientHomeBgImage,
            path:
              CloudStoragePaths.CLIENT_IMAGES +
              '/' +
              CloudStorageImageHandler.generateImageName(
                clientId,
                'home_page_bg'
              ),
          },
        ];

        const clientHomeBgImageUrlTemp =
          await CloudStorageImageHandler.getImageDownloadUrls(
            imageEmployee,
            ImageResolution.CLIENT_HOME_PAGE_BG_IMG_HEIGHT,
            ImageResolution.CLIENT_HOME_PAGE_BG_IMG_WIDTH
          );

        clientHomeBgImageUrl = clientHomeBgImageUrlTemp[0];
      }

      await runTransaction(db, async (transaction) => {
        const clientSnapshot = await transaction.get(clientRefRef);
        const oldClientData = clientSnapshot.data() as IClientsCollection;

        const updatedClient: Partial<IClientsCollection> = {
          ClientName: data.ClientName,
          ClientNameSearchIndex,
          ClientEmail: data.ClientEmail,
          ClientPhone: data.ClientPhone,
          ClientAddress: data.ClientAddress || null,
          ClientModifiedAt: serverTimestamp(),
          ClientHomePageBgImg: clientHomeBgImageUrl,
        };

        transaction.update(clientRefRef, updatedClient);

        if (oldClientData.ClientEmail !== data.ClientEmail) {
          await updateAuthUser({
            email: data.ClientEmail,
            userId: clientId,
          }).catch(() => {
            throw new CustomError('This email id is already registered');
          });
        }
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  static deleteClient = async (clientId: string) => {
    //* check if this client is used anywhere
    const invoiceRef = collection(db, CollectionName.invoices);
    const invoiceQuery = query(
      invoiceRef,
      where('InvoiceClientId', '==', clientId),
      limit(1)
    );
    const invoiceTask = getDocs(invoiceQuery);

    const shiftRef = collection(db, CollectionName.shifts);
    const shiftQuery = query(
      shiftRef,
      where('ShiftClientId', '==', clientId),
      limit(1)
    );
    const shiftTask = getDocs(shiftQuery);

    const querySnapshots = await Promise.all([invoiceTask, shiftTask]);

    const isClientUsed = querySnapshots.some((snapshot) => snapshot.size > 0);

    if (isClientUsed) {
      throw new CustomError('This client is already in use');
    }

    await runTransaction(db, async (transaction) => {
      const clientRef = doc(db, CollectionName.clients, clientId);
      const snapshot = await transaction.get(clientRef);
      const clientData = snapshot.data() as IClientsCollection;

      transaction.delete(clientRef);

      await deleteAuthUser(clientId);

      if (clientData.ClientHomePageBgImg) {
        await CloudStorageImageHandler.deleteImageByUrl(
          clientData.ClientHomePageBgImg
        );
      }
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
      where('ClientCompanyId', '==', cmpId),
      orderBy('ClientCreatedAt', 'desc'),
    ];

    if (searchQuery && searchQuery.length > 0) {
      queryParams = [
        ...queryParams,
        where(
          'ClientNameSearchIndex',
          'array-contains',
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
      where('ShiftClientId', '==', clientId),
      where('ShiftDate', '>=', startDate),
      where('ShiftDate', '<=', endDate)
    );

    return getDocs(shiftQuery);
  };

  static getClientLocations = (clientId: string) => {
    const locationRef = collection(db, CollectionName.locations);
    const clientQuery = query(
      locationRef,
      where('LocationClientId', '==', clientId)
    );

    return getDocs(clientQuery);
  };

  static getAllShiftsOfLocation = (
    locationId: string,
    startDate: Date,
    endDate: Date
  ) => {
    const shiftRef = collection(db, CollectionName.shifts);
    const shiftQuery = query(
      shiftRef,
      where('ShiftLocationId', '==', locationId),
      where('ShiftDate', '>=', startDate),
      where('ShiftDate', '<=', endDate)
    );

    return getDocs(shiftQuery);
  };

  static getAllPatrolsOfLocation = (locationId: string) => {
    const patrolRef = collection(db, CollectionName.patrols);
    const patrolQuery = query(
      patrolRef,
      where('PatrolLocationId', '==', locationId)
    );

    return getDocs(patrolQuery);
  };

  static getAllCalloutsOfLocation = (
    locationId: string,
    startDate: Date,
    endDate: Date
  ) => {
    const calloutRef = collection(db, CollectionName.callouts);
    const calloutQuery = query(
      calloutRef,
      where('CalloutLocationId', '==', locationId),
      where('CalloutDateTime', '>=', startDate),
      where('CalloutDateTime', '<=', endDate)
    );

    return getDocs(calloutQuery);
  };

  //*For client portal
  static getClientPatrols = async ({
    lmt,
    lastDoc,
    searchQuery,
    clientId,
    locationId,
  }: {
    lmt?: number;
    lastDoc?: DocumentData | null;
    searchQuery?: string;
    clientId: string;
    locationId?: string;
  }) => {
    const patrolRef = collection(db, CollectionName.patrols);

    let queryParams: QueryConstraint[] = [
      where('PatrolClientId', '==', clientId),
      orderBy('PatrolCreatedAt', 'desc'),
    ];

    if (locationId && locationId.length > 3) {
      queryParams = [
        ...queryParams,
        where('PatrolLocationId', '==', locationId),
      ];
    }

    if (searchQuery && searchQuery.length > 0) {
      queryParams = [
        ...queryParams,
        where(
          'PatrolNameSearchIndex',
          'array-contains',
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

  static getClientReports = ({
    clientId,
    lastDoc,
    lmt,
    endDate,
    isLifeTime,
    startDate,
    categoryId,
    searchQuery,
    locationId,
  }: {
    clientId: string;
    lastDoc?: DocumentData | null;
    lmt?: number;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    isLifeTime?: boolean;
    categoryId?: string | null;
    searchQuery?: string | null;
    locationId?: string | null;
  }) => {
    const reportRef = collection(db, CollectionName.reports);

    let queryParams: QueryConstraint[] = [
      where('ReportClientId', '==', clientId),
    ];

    if (locationId && locationId.length > 3) {
      queryParams = [
        ...queryParams,
        where('ReportLocationId', '==', locationId),
      ];
    }
    if (searchQuery && searchQuery.length > 0) {
      queryParams = [
        ...queryParams,
        orderBy('ReportName'),
        startAt(searchQuery),
        endAt(searchQuery + '\uF8FF'),
      ];
    } else {
      queryParams = [...queryParams, orderBy('ReportCreatedAt', 'desc')];
    }

    if (categoryId) {
      queryParams = [
        ...queryParams,
        where('ReportCategoryId', '==', categoryId),
      ];
    }

    if (!isLifeTime) {
      queryParams = [
        ...queryParams,
        where('ReportCreatedAt', '>=', startDate),
        where('ReportCreatedAt', '<=', endDate),
      ];
    }

    if (lastDoc) {
      queryParams = [...queryParams, startAfter(lastDoc)];
    }

    if (lmt) {
      queryParams = [...queryParams, limit(lmt)];
    }

    const empQuery = query(reportRef, ...queryParams);

    return getDocs(empQuery);
  };

  static getClientShifts = ({
    lmt,
    lastDoc,
    clientId,
    locationId,
    endDate,
    isLifeTime,
    startDate,
  }: {
    lmt: number;
    lastDoc?: DocumentData | null;
    clientId: string;
    locationId?: string | null;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    isLifeTime?: boolean;
  }) => {
    const shiftRef = collection(db, CollectionName.shifts);

    let queryParams: QueryConstraint[] = [
      where('ShiftClientId', '==', clientId),
      where(
        'ShiftDate',
        '<=',
        dayjs(new Date()).add(1, 'day').endOf('day').toDate()
      ),
      orderBy('ShiftDate', 'desc'),
    ];

    if (!isLifeTime) {
      queryParams = [
        ...queryParams,
        where('ShiftDate', '>=', startDate),
        where('ShiftDate', '<=', endDate),
      ];
    }

    if (locationId && locationId.length > 3) {
      queryParams = [
        ...queryParams,
        where('ShiftLocationId', '==', locationId),
      ];
    }

    if (lmt) {
      queryParams = [...queryParams, limit(lmt)];
    }

    if (lastDoc) {
      queryParams = [...queryParams, startAfter(lastDoc)];
    }

    const shiftQuery = query(shiftRef, ...queryParams);

    return getDocs(shiftQuery);
  };

  static getClientEmployees = async (clientId: string) => {
    const shiftRef = collection(db, CollectionName.shifts);
    const shiftQuery = query(
      shiftRef,
      where('ShiftClientId', '==', clientId),
      where(
        'ShiftDate',
        '>=',
        dayjs(new Date()).subtract(1, 'day').startOf('day').toDate()
      ),
      where(
        'ShiftDate',
        '<=',
        dayjs(new Date()).add(1, 'day').endOf('day').toDate()
      )
    );

    const shiftSnapshot = await getDocs(shiftQuery);

    const employees: IEmployeesCollection[] = [];

    const shiftData = shiftSnapshot.docs.map(
      (doc) => doc.data() as IShiftsCollection
    );

    await Promise.all(
      shiftData.map(async (shift) => {
        const { ShiftAssignedUserId } = shift;
        await Promise.all(
          ShiftAssignedUserId.map(async (id) => {
            const empData = await DbEmployee.getEmpById(id);

            if (
              !employees.find((emp) => emp.EmployeeId === empData.EmployeeId)
            ) {
              employees.push(empData);
            }
          })
        );
      })
    );

    return employees;
  };

  static getClientEmpDar = ({
    clientId,
    lastDoc,
    lmt,
    endDate,
    isLifeTime,
    startDate,
    searchQuery,
    empId,
    locationId,
  }: {
    clientId: string;
    lastDoc?: DocumentData | null;
    lmt?: number;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    isLifeTime?: boolean;
    searchQuery?: string | null;
    empId?: string | null;
    locationId?: string | null;
  }) => {
    const reportRef = collection(db, CollectionName.employeesDAR);

    let queryParams: QueryConstraint[] = [
      where('EmpDarClientId', '==', clientId),
      orderBy('EmpDarDate', 'desc'),
    ];

    if (locationId && locationId.length > 3) {
      queryParams = [
        ...queryParams,
        where('EmpDarLocationId', '==', locationId),
      ];
    }

    if (searchQuery && searchQuery.length > 0) {
      queryParams = [
        ...queryParams,
        orderBy('EmpDarTitle', 'asc'),
        startAt(searchQuery),
        endAt(searchQuery + '\uF8FF'),
      ];
    }

    if (!isLifeTime) {
      queryParams = [
        ...queryParams,
        where('EmpDarDate', '>=', startDate),
        where('EmpDarDate', '<=', endDate),
      ];
    }

    if (empId) {
      queryParams = [...queryParams, where('EmpDarEmpId', '==', empId)];
    }

    if (lastDoc) {
      queryParams = [...queryParams, startAfter(lastDoc)];
    }

    if (lmt) {
      queryParams = [...queryParams, limit(lmt)];
    }

    const empQuery = query(reportRef, ...queryParams);

    return getDocs(empQuery);
  };
}

export default DbClient;
