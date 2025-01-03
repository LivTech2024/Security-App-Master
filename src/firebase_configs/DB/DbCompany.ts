import {
  CloudStoragePaths,
  CollectionName,
  ImageResolution,
} from '../../@types/enum';
import CloudStorageImageHandler, {
  CloudStorageFileHandler,
  getNewDocId,
} from './utils';
import { db } from '../config';
import {
  IAdminsCollection,
  ICompaniesCollection,
  ICompanyBranchesCollection,
  IDocumentCategories,
  IDocumentsCollection,
  IEmergencyProtocolsCollection,
  ILocationManagersChildCollection,
  ILocationsCollection,
  IReportCategoriesCollection,
  ITaskLogsCollection,
  ITasksCollection,
  ITrainCertsAllocationsCollection,
  ITrainingAndCertificationsCollection,
} from '../../@types/database';
import {
  doc,
  serverTimestamp,
  setDoc,
  getDoc,
  where,
  query,
  collection,
  getDocs,
  limit,
  deleteDoc,
  GeoPoint,
  updateDoc,
  orderBy,
  QueryConstraint,
  startAfter,
  DocumentData,
  runTransaction,
} from '@firebase/firestore';
import { fullTextSearchIndex } from '../../utilities/misc';
import {
  AdminUpdateFormFields,
  CompanyBranchFormFields,
  CompanyCreateFormFields,
  CompanyUpdateFormFields,
  EmergProtocolCreateFormFields,
  LocationCreateFormFields,
  SettingsFormFields,
  TaskFormFields,
  TrainCertsAllocFormFields,
  TrainCertsCreateFormFields,
} from '../../utilities/zod/schema';
import CustomError from '../../utilities/CustomError';
import dayjs from 'dayjs';
import { Timestamp, endAt, startAt } from 'firebase/firestore';

class DbCompany {
  static createCompany = async (
    data: CompanyCreateFormFields,
    logoBase64: string
  ) => {
    const companyId = getNewDocId(CollectionName.companies);
    const companyRef = doc(db, CollectionName.companies, companyId);

    const logoImg = [
      {
        base64: logoBase64,
        path:
          CloudStoragePaths.COMPANIES_LOGOS +
          '/' +
          CloudStorageImageHandler.generateImageName(companyId, 'logo'),
      },
    ];

    const logoImgUrl = await CloudStorageImageHandler.getImageDownloadUrls(
      logoImg,
      ImageResolution.COMPANY_LOGO_HEIGHT,
      ImageResolution.COMPANY_LOGO_WIDTH
    );

    const newCompany: ICompaniesCollection = {
      CompanyId: companyId,
      CompanyName: data.CompanyName,
      CompanyLogo: logoImgUrl[0],
      CompanyAddress: data.CompanyAddress,
      CompanyPhone: data.CompanyPhone,
      CompanyEmail: data.CompanyEmail,
      CompanyCreatedAt: serverTimestamp(),
      CompanyModifiedAt: serverTimestamp(),
    };

    return setDoc(companyRef, newCompany);
  };

  static updateCompany = async ({
    cmpId,
    data,
    logoBase64,
  }: {
    data: CompanyUpdateFormFields;
    cmpId: string;
    logoBase64: string;
  }) => {
    await runTransaction(db, async (transaction) => {
      const companyRef = doc(db, CollectionName.companies, cmpId);

      let logoImageUrl = logoBase64;

      if (!logoImageUrl.startsWith('https')) {
        const imageEmployee = [
          {
            base64: logoBase64,
            path:
              CloudStoragePaths.COMPANIES_LOGOS +
              '/' +
              CloudStorageImageHandler.generateImageName(cmpId, 'logo'),
          },
        ];

        const imageUrl = await CloudStorageImageHandler.getImageDownloadUrls(
          imageEmployee,
          ImageResolution.EMP_IMAGE_HEIGHT,
          ImageResolution.EMP_IMAGE_WIDTH
        );

        logoImageUrl = imageUrl[0];
      }

      const updatedCompany: Partial<ICompaniesCollection> = {
        CompanyName: data.CompanyName,
        CompanyLogo: logoImageUrl,
        CompanyAddress: data.CompanyAddress,
        CompanyPhone: data.CompanyPhone,
        CompanyEmail: data.CompanyEmail,
        CompanyModifiedAt: serverTimestamp(),
      };

      transaction.update(companyRef, updatedCompany);
    });
  };

  static getCompanyBranches = (cmpId: string) => {
    const cmpBranchRef = collection(db, CollectionName.companyBranch);
    const cmpBranchQuery = query(cmpBranchRef, where('CompanyId', '==', cmpId));
    return getDocs(cmpBranchQuery);
  };

  static createCompanyBranch = async (
    cmpId: string,
    data: CompanyBranchFormFields
  ) => {
    const cpmBranchId = getNewDocId(CollectionName.companyBranch);
    const cmpBranchRef = doc(db, CollectionName.companyBranch, cpmBranchId);

    const {
      CompanyBranchAddress,
      CompanyBranchEmail,
      CompanyBranchName,
      CompanyBranchPhone,
    } = data;

    const newCmpBranch: ICompanyBranchesCollection = {
      CompanyBranchId: cpmBranchId,
      CompanyId: cmpId,
      CompanyBranchName,
      CompanyBranchEmail,
      CompanyBranchPhone,
      CompanyBranchAddress,
      CompanyBranchCreatedAt: serverTimestamp(),
      CompanyBranchModifiedAt: serverTimestamp(),
    };

    await setDoc(cmpBranchRef, newCmpBranch);

    return newCmpBranch;
  };

  static updateCompanyBranch = async ({
    cmpId,
    cmpBranchId,
    data,
  }: {
    cmpId: string;
    cmpBranchId: string;
    data: CompanyBranchFormFields;
  }) => {
    const cmpBranchRef = doc(db, CollectionName.companyBranch, cmpBranchId);

    const {
      CompanyBranchAddress,
      CompanyBranchEmail,
      CompanyBranchName,
      CompanyBranchPhone,
    } = data;

    const updatedCmpBranch: Partial<ICompanyBranchesCollection> = {
      CompanyBranchId: cmpBranchId,
      CompanyId: cmpId,
      CompanyBranchName,
      CompanyBranchEmail,
      CompanyBranchPhone,
      CompanyBranchAddress,
      CompanyBranchModifiedAt: serverTimestamp(),
    };

    await updateDoc(cmpBranchRef, updatedCmpBranch);

    return updatedCmpBranch;
  };

  static deleteCompanyBranch = async (cmpBranchId: string) => {
    //*Check if branch is used somewhere before deleting

    //Check if employee exist in this branch
    const empDocRef = collection(db, CollectionName.employees);
    const empQuery = query(
      empDocRef,
      where('EmployeeCompanyBranchId', '==', cmpBranchId)
    );
    const empTask = getDocs(empQuery);

    //Check if shifts exist in this branch
    const shiftDocRef = collection(db, CollectionName.shifts);
    const shiftQuery = query(
      shiftDocRef,
      where('ShiftCompanyBranchId', '==', cmpBranchId)
    );
    const shiftTask = getDocs(shiftQuery);

    const querySnapshots = await Promise.all([empTask, shiftTask]);

    const branchAlreadyUsed = querySnapshots.some(
      (snapshot) => snapshot.size > 0
    );

    if (branchAlreadyUsed) {
      throw new CustomError('This branch is already in use');
    }

    const docRef = doc(db, CollectionName.companyBranch, cmpBranchId);

    return deleteDoc(docRef);
  };

  static createAdmin = (companyId: string) => {
    const adminId = getNewDocId(CollectionName.admins);
    const adminRef = doc(db, CollectionName.admins, adminId);

    const newAdmin: IAdminsCollection = {
      AdminId: adminId,
      AdminName: 'Jhon Doe',
      AdminEmail: 'sapp69750@gmail.com',
      AdminPhone: '+918624016814',
      AdminCompanyId: companyId,
      AdminCreatedAt: serverTimestamp(),
      AdminModifiedAt: serverTimestamp(),
    };

    return setDoc(adminRef, newAdmin);
  };

  static updateAdmin = (adminId: string, data: AdminUpdateFormFields) => {
    const adminRef = doc(db, CollectionName.admins, adminId);

    const newAdmin: Partial<IAdminsCollection> = {
      AdminName: data.AdminName,
      AdminPhone: data.AdminPhone,
      AdminModifiedAt: serverTimestamp(),
    };

    return updateDoc(adminRef, newAdmin);
  };

  static updateAdminEmail = (adminId: string, email: string) => {
    const adminRef = doc(db, CollectionName.admins, adminId);

    const newAdmin: Partial<IAdminsCollection> = {
      AdminEmail: email,
      AdminModifiedAt: serverTimestamp(),
    };

    return updateDoc(adminRef, newAdmin);
  };

  static getAdminById = (adminId: string) => {
    const adminRef = doc(db, CollectionName.admins, adminId);
    return getDoc(adminRef);
  };

  static getCompanyById = (cmpId: string) => {
    const cmpRef = doc(db, CollectionName.companies, cmpId);
    return getDoc(cmpRef);
  };

  static getSettingsByCmpId = (cmpId: string) => {
    const settingRef = collection(db, CollectionName.settings);
    const settingQuery = query(
      settingRef,
      where('SettingCompanyId', '==', cmpId),
      limit(1)
    );
    return getDocs(settingQuery);
  };

  static updateSetting = (settingId: string, data: SettingsFormFields) => {
    const settingRef = doc(db, CollectionName.settings, settingId);
    return updateDoc(settingRef, data);
  };

  static getUserLoggedInData = async (
    uId: string,
    loggedInId: string,
    loggedInCrypt: string,
    isLoggedIn: boolean
  ) => {
    const loggedInRef = collection(db, CollectionName.loggedInUsers);

    const loggedInQuery = query(
      loggedInRef,
      where('LoggedInId', '==', loggedInId),
      where('LoggedInCrypt', '==', loggedInCrypt),
      where('LoggedInUserId', '==', uId),
      where('IsLoggedIn', '==', isLoggedIn),
      limit(1)
    );

    return getDocs(loggedInQuery);
  };

  static getLoggedInUserOfCompany = ({
    cmpId,
    lastDoc,
    lmt,
  }: {
    lmt?: number;
    lastDoc?: DocumentData | null;
    cmpId: string;
  }) => {
    const loggedInUsersRef = collection(db, CollectionName.loggedInUsers);
    let queryParams: QueryConstraint[] = [
      where('LoggedInCompanyId', '==', cmpId),
      orderBy('LoggedInCreatedAt', 'desc'),
    ];

    if (lastDoc) {
      queryParams = [...queryParams, startAfter(lastDoc)];
    }

    if (lmt) {
      queryParams = [...queryParams, limit(lmt)];
    }

    const loggedInUsersQuery = query(loggedInUsersRef, ...queryParams);

    return getDocs(loggedInUsersQuery);
  };

  static deleteUserLoggedInDoc = async (loggedInId: string) => {
    const loggedInRef = doc(db, CollectionName.loggedInUsers, loggedInId);
    return deleteDoc(loggedInRef);
  };

  static addLocation = async (
    cmpId: string,
    data: LocationCreateFormFields,
    postOrderData: {
      PostOrderPdf: string | File;
      PostOrderTitle: string;
    } | null,
    locationManagers: ILocationManagersChildCollection[]
  ) => {
    let postOrderFileUrl: string | null = null;

    try {
      const locationId = getNewDocId(CollectionName.locations);
      const locationRef = doc(db, CollectionName.locations, locationId);

      const {
        LocationAddress,
        LocationContractAmount,
        LocationContractEndDate,
        LocationContractStartDate,
        LocationCoordinates,
        LocationPatrolPerHitRate,
        LocationName,
        LocationClientId,
        LocationShiftHourlyRate,
        LocationSendEmailForEachPatrol,
        LocationSendEmailForEachShift,
        LocationSendEmailToClient,
        LocationCalloutDetails,
        LocationCompanyBranchId,
      } = data;

      const nameSearchIndex = fullTextSearchIndex(
        LocationName.trim().toLowerCase()
      );

      if (postOrderData?.PostOrderPdf) {
        const fileName = CloudStorageFileHandler.generateFileName(
          locationId,
          'post_order'
        );

        postOrderFileUrl = await CloudStorageFileHandler.uploadFile(
          postOrderData?.PostOrderPdf as File,
          CloudStoragePaths.COMPANIES_LOCATIONS_DOCUMENTS + '/' + fileName
        );
      }

      let newLocation: ILocationsCollection = {
        LocationId: locationId,
        LocationCompanyId: cmpId,
        LocationClientId,
        LocationName,
        LocationSearchIndex: nameSearchIndex,
        LocationAddress,
        LocationCoordinates: new GeoPoint(
          Number(LocationCoordinates.lat || 0),
          Number(LocationCoordinates.lng || 0)
        ),
        LocationContractAmount,
        LocationContractEndDate:
          LocationContractEndDate as unknown as Timestamp,
        LocationContractStartDate:
          LocationContractStartDate as unknown as Timestamp,
        LocationPatrolPerHitRate,
        LocationPostOrder: null,
        LocationShiftHourlyRate,
        LocationManagers: locationManagers,
        LocationSendEmailForEachPatrol,
        LocationSendEmailForEachShift,
        LocationSendEmailToClient,
        LocationCalloutDetails,
        LocationCompanyBranchId: LocationCompanyBranchId || null,
        LocationModifiedAt: serverTimestamp(),
        LocationCreatedAt: serverTimestamp(),
      };

      if (postOrderData && postOrderFileUrl) {
        newLocation = {
          ...newLocation,
          LocationPostOrder: {
            PostOrderPdf: postOrderFileUrl,
            PostOrderTitle: postOrderData?.PostOrderTitle,
          },
        };
      }

      await setDoc(locationRef, newLocation);
    } catch (error) {
      if (postOrderFileUrl) {
        await CloudStorageFileHandler.deleteFileByUrl(postOrderFileUrl);
      }
      console.log(error);
      throw error;
    }
  };

  static updateLocation = async (
    locationId: string,
    data: LocationCreateFormFields,
    postOrderData: {
      PostOrderPdf: string | File;
      PostOrderTitle: string;
    } | null,
    locationManagers: ILocationManagersChildCollection[]
  ) => {
    const {
      LocationAddress,
      LocationContractAmount,
      LocationContractEndDate,
      LocationContractStartDate,
      LocationCoordinates,
      LocationPatrolPerHitRate,
      LocationName,
      LocationClientId,
      LocationShiftHourlyRate,
      LocationSendEmailForEachPatrol,
      LocationSendEmailForEachShift,
      LocationSendEmailToClient,
      LocationCalloutDetails,
      LocationCompanyBranchId,
    } = data;

    const nameSearchIndex = fullTextSearchIndex(
      LocationName.trim().toLowerCase()
    );

    let postOrderFileUrl: string | null =
      typeof postOrderData?.PostOrderPdf === 'string' &&
      postOrderData?.PostOrderPdf.startsWith('https')
        ? postOrderData?.PostOrderPdf
        : null;

    await runTransaction(db, async (transaction) => {
      const locationRef = doc(db, CollectionName.locations, locationId);
      const locationSnapshot = await transaction.get(locationRef);
      const oldLocationData = locationSnapshot.data() as ILocationsCollection;

      if (
        postOrderData?.PostOrderPdf &&
        typeof postOrderData?.PostOrderPdf !== 'string'
      ) {
        const fileName = CloudStorageFileHandler.generateFileName(
          locationId,
          'post_order'
        );

        postOrderFileUrl = await CloudStorageFileHandler.uploadFile(
          postOrderData?.PostOrderPdf as File,
          CloudStoragePaths.COMPANIES_LOCATIONS_DOCUMENTS + '/' + fileName
        );
      }

      let updatedLocation: Partial<ILocationsCollection> = {
        LocationName,
        LocationSearchIndex: nameSearchIndex,
        LocationAddress,
        LocationClientId,
        LocationCoordinates: new GeoPoint(
          Number(LocationCoordinates.lat || 0),
          Number(LocationCoordinates.lng || 0)
        ),
        LocationContractAmount,
        LocationContractEndDate:
          LocationContractEndDate as unknown as Timestamp,
        LocationContractStartDate:
          LocationContractStartDate as unknown as Timestamp,
        LocationPatrolPerHitRate,
        LocationShiftHourlyRate,
        LocationManagers: locationManagers,
        LocationSendEmailForEachPatrol,
        LocationSendEmailForEachShift,
        LocationSendEmailToClient,
        LocationCalloutDetails,
        LocationCompanyBranchId: LocationCompanyBranchId || null,
        LocationModifiedAt: serverTimestamp(),
      };

      if (postOrderData && postOrderFileUrl) {
        updatedLocation = {
          ...updatedLocation,
          LocationPostOrder: {
            ...oldLocationData?.LocationPostOrder,
            PostOrderPdf: postOrderFileUrl,
            PostOrderTitle: postOrderData.PostOrderTitle,
          },
        };
      }

      transaction.update(locationRef, updatedLocation);
    });
  };

  static deleteLocation = async (locationId: string) => {
    //*Check if shift exist with this location
    const shiftDocRef = collection(db, CollectionName.shifts);
    const shiftQuery = query(
      shiftDocRef,
      where('ShiftLocationId', '==', locationId),
      limit(1)
    );
    const shiftTask = getDocs(shiftQuery);

    //*Check if patrol exist with this location
    const patrolDocRef = collection(db, CollectionName.patrols);
    const patrolQuery = query(
      patrolDocRef,
      where('ShiftLocationPatrolLocationIdId', '==', locationId),
      limit(1)
    );
    const patrolTask = getDocs(patrolQuery);

    const querySnapshots = await Promise.all([shiftTask, patrolTask]);

    const isLocationUsed = querySnapshots.some((snapshot) => snapshot.size > 0);

    if (isLocationUsed) {
      throw new CustomError('This location is already used');
    }

    await runTransaction(db, async (transaction) => {
      const locationRef = doc(db, CollectionName.locations, locationId);
      const snapshot = await transaction.get(locationRef);
      const locationData = snapshot.data() as ILocationsCollection;

      if (locationData?.LocationPostOrder?.PostOrderPdf) {
        await CloudStorageFileHandler.deleteFileByUrl(
          locationData?.LocationPostOrder?.PostOrderPdf
        );
      }

      if (
        locationData?.LocationPostOrder?.PostOrderOtherData &&
        locationData?.LocationPostOrder?.PostOrderOtherData.length > 0
      ) {
        const otherDataDeletePromise =
          locationData?.LocationPostOrder?.PostOrderOtherData.map((url) => {
            return CloudStorageFileHandler.deleteFileByUrl(url);
          });
        await Promise.all(otherDataDeletePromise);
      }

      transaction.delete(locationRef);
    });
  };

  static getLocations = ({
    lmt,
    lastDoc,
    searchQuery,
    cmpId,
    clientId,
    branchId,
  }: {
    lmt?: number;
    lastDoc?: DocumentData | null;
    searchQuery?: string;
    cmpId?: string | null;
    clientId?: string | null;
    branchId?: string | null;
  }) => {
    const locationRef = collection(db, CollectionName.locations);

    let queryParams: QueryConstraint[] = [orderBy('LocationCreatedAt', 'desc')];

    if (cmpId) {
      queryParams = [...queryParams, where('LocationCompanyId', '==', cmpId)];
    }

    if (clientId) {
      queryParams = [...queryParams, where('LocationClientId', '==', clientId)];
    }

    if (branchId) {
      queryParams = [
        ...queryParams,
        where('LocationCompanyBranchId', '==', branchId),
      ];
    }

    if (searchQuery && searchQuery.length > 0) {
      queryParams = [
        ...queryParams,
        where(
          'LocationSearchIndex',
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

    const locationQuery = query(locationRef, ...queryParams);

    return getDocs(locationQuery);
  };

  static getReports = ({
    cmpId,
    branchId,
    lastDoc,
    lmt,
    endDate,
    isLifeTime,
    startDate,
    categoryId,
  }: {
    cmpId: string;
    branchId?: string;
    lastDoc?: DocumentData | null;
    lmt?: number;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    isLifeTime?: boolean;
    categoryId?: string | null;
  }) => {
    const reportRef = collection(db, CollectionName.reports);

    let queryParams: QueryConstraint[] = [
      where('ReportCompanyId', '==', cmpId),
      orderBy('ReportCreatedAt', 'desc'),
    ];

    if (branchId) {
      queryParams = [
        ...queryParams,
        where('ReportCompanyBranchId', '==', branchId),
      ];
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

  static getReportById = (reportId: string) => {
    const reportDocRef = doc(db, CollectionName.reports, reportId);
    return getDoc(reportDocRef);
  };

  static addReportCategory = (catName: string, cmpId: string) => {
    const catId = getNewDocId(CollectionName.reportCategories);
    const catRef = doc(db, CollectionName.reportCategories, catId);

    const newCat: IReportCategoriesCollection = {
      ReportCategoryId: catId,
      ReportCompanyId: cmpId,
      ReportCategoryName: catName,
      ReportCategoryCreatedAt: serverTimestamp(),
    };

    return setDoc(catRef, newCat);
  };

  static deleteReportCategory = (catId: string) => {
    const catRef = doc(db, CollectionName.reportCategories, catId);
    return deleteDoc(catRef);
  };

  static getReportCategories = (cmpId: string) => {
    const catRef = collection(db, CollectionName.reportCategories);
    const catQuery = query(catRef, where('ReportCompanyId', '==', cmpId));
    return getDocs(catQuery);
  };

  //*For document categories
  static addDocumentCategory = (catName: string, cmpId: string) => {
    const catId = getNewDocId(CollectionName.documentCategories);
    const catRef = doc(db, CollectionName.documentCategories, catId);

    const newCat: IDocumentCategories = {
      DocumentCategoryId: catId,
      DocumentCategoryCompanyId: cmpId,
      DocumentCategoryName: catName,
      DocumentCategoryCreatedAt: serverTimestamp(),
    };

    return setDoc(catRef, newCat);
  };

  static deleteDocumentCategory = (catId: string) => {
    const catRef = doc(db, CollectionName.documentCategories, catId);
    return deleteDoc(catRef);
  };

  static getDocumentCategories = (cmpId: string) => {
    const catRef = collection(db, CollectionName.documentCategories);
    const catQuery = query(
      catRef,
      where('DocumentCategoryCompanyId', '==', cmpId)
    );
    return getDocs(catQuery);
  };

  //*For document repository

  static addDocument = async ({
    cmpId,
    data,
  }: {
    cmpId: string;
    data: {
      documentName: string;
      categoryName: string;
      categoryId: string;
      document: File;
    };
  }) => {
    const { categoryId, categoryName, document, documentName } = data;

    const documentId = getNewDocId(CollectionName.documents);
    const documentRef = doc(db, CollectionName.documents, documentId);

    const fileName = CloudStorageFileHandler.generateFileNameWithRandom(
      documentId,
      0
    );

    const fileUrl = await CloudStorageFileHandler.uploadFile(
      document,
      CloudStoragePaths.DOCUMENTS + `/${categoryName}` + '/' + fileName
    );

    try {
      const newDocument: IDocumentsCollection = {
        DocumentId: documentId,
        DocumentName: documentName,
        DocumentNameSearchIndex: fullTextSearchIndex(
          documentName.trim().toLowerCase()
        ),
        DocumentCompanyId: cmpId,
        DocumentCategoryId: categoryId,
        DocumentCategoryName: categoryName,
        DocumentUrl: fileUrl,
        DocumentCreatedAt: serverTimestamp(),
        DocumentModifiedAt: serverTimestamp(),
      };

      await setDoc(documentRef, newDocument);
    } catch (error) {
      console.log(error);
      await CloudStorageFileHandler.deleteFileByUrl(fileUrl);
      throw error;
    }
  };

  static updateDocument = async ({
    data,
    documentId,
  }: {
    documentId: string;
    data: {
      documentName: string;
      categoryName: string;
      categoryId: string;
      document: File | string;
    };
  }) => {
    const { categoryId, categoryName, document, documentName } = data;

    try {
      await runTransaction(db, async (transaction) => {
        const documentRef = doc(db, CollectionName.documents, documentId);
        const docSnap = await transaction.get(documentRef);
        const oldDocData = docSnap.data() as IDocumentsCollection;

        let fileUrl = oldDocData.DocumentUrl;
        let fileToBeDeleted: string | null = null;

        if (typeof document !== 'string') {
          const fileName = CloudStorageFileHandler.generateFileNameWithRandom(
            documentId,
            0
          );

          fileUrl = await CloudStorageFileHandler.uploadFile(
            document,
            CloudStoragePaths.DOCUMENTS + `/${categoryName}` + '/' + fileName
          );

          fileToBeDeleted = oldDocData.DocumentUrl;
        }

        const newDocument: Partial<IDocumentsCollection> = {
          DocumentName: documentName,
          DocumentNameSearchIndex: fullTextSearchIndex(
            documentName.trim().toLowerCase()
          ),
          DocumentCategoryId: categoryId,
          DocumentCategoryName: categoryName,
          DocumentUrl: fileUrl,
          DocumentModifiedAt: serverTimestamp(),
        };

        transaction.update(documentRef, newDocument);

        if (fileToBeDeleted) {
          await CloudStorageFileHandler.deleteFileByUrl(fileToBeDeleted);
        }
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  static deleteDocument = async (documentId: string) => {
    try {
      await runTransaction(db, async (transaction) => {
        const documentRef = doc(db, CollectionName.documents, documentId);
        const docSnap = await transaction.get(documentRef);
        const docData = docSnap.data() as IDocumentsCollection;

        transaction.delete(documentRef);

        await CloudStorageFileHandler.deleteFileByUrl(docData.DocumentUrl);
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  static getDocuments = ({
    lmt,
    lastDoc,
    searchQuery,
    cmpId,
    categoryId,
  }: {
    lmt?: number;
    lastDoc?: DocumentData | null;
    searchQuery?: string;
    cmpId: string;
    categoryId?: string | null;
  }) => {
    const docRef = collection(db, CollectionName.documents);

    let queryParams: QueryConstraint[] = [
      where('DocumentCompanyId', '==', cmpId),
      orderBy('DocumentCreatedAt', 'desc'),
    ];

    if (searchQuery && searchQuery.length > 0) {
      queryParams = [
        ...queryParams,
        where(
          'DocumentNameSearchIndex',
          'array-contains',
          searchQuery.toLocaleLowerCase()
        ),
      ];
    }

    if (categoryId) {
      queryParams = [
        ...queryParams,
        where('DocumentCategoryId', '==', categoryId),
      ];
    }

    if (lastDoc) {
      queryParams = [...queryParams, startAfter(lastDoc)];
    }

    if (lmt) {
      queryParams = [...queryParams, limit(lmt)];
    }

    const docQuery = query(docRef, ...queryParams);

    return getDocs(docQuery);
  };

  //*Visitors
  static getVisitors = ({
    cmpId,
    branchId,
    lastDoc,
    lmt,
    endDate,
    isLifeTime,
    startDate,
  }: {
    cmpId: string;
    branchId?: string;
    lastDoc?: DocumentData | null;
    lmt?: number;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    isLifeTime?: boolean;
  }) => {
    const reportRef = collection(db, CollectionName.visitors);

    let queryParams: QueryConstraint[] = [
      where('VisitorCompanyId', '==', cmpId),
      orderBy('VisitorCreatedAt', 'desc'),
    ];

    if (branchId) {
      queryParams = [
        ...queryParams,
        where('VisitorCompanyBranchId', '==', branchId),
      ];
    }

    if (!isLifeTime) {
      queryParams = [
        ...queryParams,
        where(
          'VisitorCreatedAt',
          '>=',
          dayjs(startDate).startOf('day').toDate()
        ),
        where('VisitorCreatedAt', '<=', dayjs(endDate).endOf('day').toDate()),
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

  static getVisitorById = (visitorId: string) => {
    const visitorDocRef = doc(db, CollectionName.visitors, visitorId);
    return getDoc(visitorDocRef);
  };

  static createNewTask = (cmpId: string, data: TaskFormFields) => {
    const taskId = getNewDocId(CollectionName.tasks);
    const taskRef = doc(db, CollectionName.tasks, taskId);

    let newTask: ITasksCollection = {
      TaskId: taskId,
      TaskCompanyId: cmpId,
      TaskCompanyBranchId: data.TaskCompanyBranchId || null,
      TaskDescription: data.TaskDescription,
      TaskStartDate: data.TaskStartDate as unknown as Timestamp,
      TaskStartTime: data.TaskStartTime,
      TaskForDays: data.TaskForDays,
      TaskCreatedAt: serverTimestamp(),
    };

    if (data.TaskAllotedLocationId && data.TaskAllotedLocationId.length > 0) {
      newTask = {
        ...newTask,
        TaskAllotedLocationId: data.TaskAllotedLocationId,
        TaskAllotedLocationName: data.TaskAllotedLocationName,
      };
    } else {
      if (data.TaskAllotedToEmpIds && data.TaskAllotedToEmpIds.length > 0) {
        newTask = {
          ...newTask,
          TaskAllotedToEmpIds: data.TaskAllotedToEmpIds,
          TaskAllotedToEmps: data.TaskAllotedToEmps,
        };
      } else {
        newTask = {
          ...newTask,
          TaskIsAllotedToAllEmps: true,
        };
      }
    }

    return setDoc(taskRef, newTask);
  };

  static updateTask = (taskId: string, data: TaskFormFields) => {
    const taskRef = doc(db, CollectionName.tasks, taskId);

    const updatedTask: Partial<ITasksCollection> = {
      TaskId: taskId,
      TaskCompanyBranchId: data.TaskCompanyBranchId || null,
      TaskDescription: data.TaskDescription,
      TaskStartDate: data.TaskStartDate as unknown as Timestamp,
      TaskStartTime: data.TaskStartTime,
      TaskForDays: data.TaskForDays,
      TaskAllotedLocationId: data.TaskAllotedLocationId || null,
      TaskAllotedLocationName: data.TaskAllotedLocationName || null,
      TaskAllotedToEmpIds:
        data.TaskAllotedToEmpIds.length > 0 ? data.TaskAllotedToEmpIds : null,
      TaskAllotedToEmps:
        data.TaskAllotedToEmps?.length > 0 ? data.TaskAllotedToEmps : null,
      TaskIsAllotedToAllEmps: data.TaskIsAllotedToAllEmps,
    };

    return updateDoc(taskRef, updatedTask);
  };

  static deleteTask = async (taskId: string) => {
    await runTransaction(db, async (transaction) => {
      const taskRef = doc(db, CollectionName.tasks, taskId);

      //* Fetch all the task logs and delete it before deleting task
      const taskLogRef = collection(db, CollectionName.taskLogs);
      const taskLogQuery = query(taskLogRef, where('TaskId', '==', taskId));
      const taskLogSnapshot = await getDocs(taskLogQuery);

      taskLogSnapshot.forEach((docs) => {
        const { TaskLogId } = docs.data() as ITaskLogsCollection;
        const taskLogRef = doc(db, CollectionName.taskLogs, TaskLogId);
        transaction.delete(taskLogRef);
      });

      transaction.delete(taskRef);
    });
  };

  static getTasks = async ({
    lmt,
    lastDoc,
    cmpId,
    cmpBranchId,
    searchQuery,
  }: {
    lmt?: number;
    lastDoc?: DocumentData | null;
    cmpId: string;
    cmpBranchId?: string | null;
    searchQuery?: string | null;
  }) => {
    const taskRef = collection(db, CollectionName.tasks);

    let queryParams: QueryConstraint[] = [where('TaskCompanyId', '==', cmpId)];

    if (searchQuery && searchQuery.length > 0) {
      queryParams = [
        ...queryParams,
        orderBy('TaskDescription'),
        startAt(searchQuery),
        endAt(searchQuery + '\uF8FF'),
      ];
    } else {
      queryParams = [...queryParams, orderBy('TaskCreatedAt', 'desc')];
    }

    if (cmpBranchId && cmpBranchId.length > 3) {
      queryParams = [
        ...queryParams,
        where('TaskCompanyBranchId', '==', cmpBranchId),
      ];
    }

    if (lastDoc) {
      queryParams = [...queryParams, startAfter(lastDoc)];
    }

    if (lmt) {
      queryParams = [...queryParams, limit(lmt)];
    }

    const taskQuery = query(taskRef, ...queryParams);

    return getDocs(taskQuery);
  };

  static getTaskById = async (taskId: string) => {
    const taskRef = doc(db, CollectionName.tasks, taskId);
    return getDoc(taskRef);
  };

  static getTaskLogs = ({
    taskId,
    lastDoc,
    lmt,
    endDate,
    isLifeTime,
    startDate,
    empId,
  }: {
    taskId: string;
    lastDoc?: DocumentData | null;
    lmt?: number;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    isLifeTime?: boolean;
    empId?: string;
  }) => {
    const taskLogsRef = collection(db, CollectionName.taskLogs);

    let queryParams: QueryConstraint[] = [
      where('TaskId', '==', taskId),
      orderBy('TaskLogCompletionTime', 'desc'),
    ];

    if (!isLifeTime) {
      queryParams = [
        ...queryParams,
        where('TaskLogCompletionTime', '>=', startDate),
        where('TaskLogCompletionTime', '<=', endDate),
      ];
    }

    if (empId) {
      queryParams = [...queryParams, where('TaskLogEmpId', '==', empId)];
    }

    if (lastDoc) {
      queryParams = [...queryParams, startAfter(lastDoc)];
    }

    if (lmt) {
      queryParams = [...queryParams, limit(lmt)];
    }

    const taskLogsQuery = query(taskLogsRef, ...queryParams);

    return getDocs(taskLogsQuery);
  };

  //*For TrainingAndCerts
  static createTrainCerts = (
    data: TrainCertsCreateFormFields,
    cmpId: string
  ) => {
    const trainCertsId = getNewDocId(CollectionName.trainingAndCertifications);
    const trainCertsRef = doc(
      db,
      CollectionName.trainingAndCertifications,
      trainCertsId
    );

    const {
      TrainCertsCategory,
      TrainCertsDuration,
      TrainCertsEndDate,
      TrainCertsStartDate,
      TrainCertsTitle,
      TrainCertsCost,
      TrainCertsDescription,
    } = data;

    const newTrainCerts: ITrainingAndCertificationsCollection = {
      TrainCertsId: trainCertsId,
      TrainCertsCompanyId: cmpId,
      TrainCertsTitle,
      TrainCertsCategory,
      TrainCertsDuration,
      TrainCertsCost,
      TrainCertsDescription,
      TrainCertsTotalTrainee: 0,
      TrainCertsTotalTraineeCompletedTraining: 0,
      TrainCertsStartDate: TrainCertsStartDate as unknown as Timestamp,
      TrainCertsEndDate: TrainCertsEndDate as unknown as Timestamp,
      TrainCertsCreatedAt: serverTimestamp(),
      TrainCertsModifiedAt: serverTimestamp(),
    };

    return setDoc(trainCertsRef, newTrainCerts);
  };

  static updateTrainCerts = (
    data: TrainCertsCreateFormFields,
    trainCertsId: string
  ) => {
    const trainCertsRef = doc(
      db,
      CollectionName.trainingAndCertifications,
      trainCertsId
    );

    const {
      TrainCertsCategory,
      TrainCertsDuration,
      TrainCertsEndDate,
      TrainCertsStartDate,
      TrainCertsTitle,
      TrainCertsCost,
      TrainCertsDescription,
    } = data;

    const newTrainCerts: Partial<ITrainingAndCertificationsCollection> = {
      TrainCertsTitle,
      TrainCertsCategory,
      TrainCertsDuration,
      TrainCertsCost,
      TrainCertsDescription,
      TrainCertsStartDate: TrainCertsStartDate as unknown as Timestamp,
      TrainCertsEndDate: TrainCertsEndDate as unknown as Timestamp,
      TrainCertsModifiedAt: serverTimestamp(),
    };

    return updateDoc(trainCertsRef, newTrainCerts);
  };

  static deleteTrainCerts = async (trainCertsId: string) => {
    const trainCertsRef = doc(
      db,
      CollectionName.trainingAndCertifications,
      trainCertsId
    );

    const trainCertsAllocRef = collection(
      db,
      CollectionName.trainCertsAllocation
    );
    const trainCertsAllocQuery = query(
      trainCertsAllocRef,
      where('TrainCertsId', '==', trainCertsId)
    );
    const trainCertsAllocSnapshot = await getDocs(trainCertsAllocQuery);
    const trainCertsAllocData = trainCertsAllocSnapshot.docs.map(
      (doc) => doc.data() as ITrainCertsAllocationsCollection
    );

    await runTransaction(db, async (transaction) => {
      trainCertsAllocData.forEach((data) => {
        const trainCertsAllocDocRef = doc(
          db,
          CollectionName.trainCertsAllocation,
          data.TrainCertsAllocId
        );
        transaction.delete(trainCertsAllocDocRef);
      });

      transaction.delete(trainCertsRef);
    });
  };

  static getTrainCerts = async ({
    lmt,
    lastDoc,
    searchQuery,
  }: {
    lmt?: number;
    lastDoc?: DocumentData | null;
    searchQuery?: string | null;
  }) => {
    const trainCertsRef = collection(
      db,
      CollectionName.trainingAndCertifications
    );

    let queryParams: QueryConstraint[] = [];

    if (searchQuery && searchQuery.length > 0) {
      queryParams = [
        ...queryParams,
        orderBy('TrainCertsTitle'),
        startAt(searchQuery),
        endAt(searchQuery + '\uF8FF'),
      ];
    } else {
      queryParams = [...queryParams, orderBy('TrainCertsCreatedAt', 'desc')];
    }

    if (lastDoc) {
      queryParams = [...queryParams, startAfter(lastDoc)];
    }

    if (lmt) {
      queryParams = [...queryParams, limit(lmt)];
    }

    const trainCertsQuery = query(trainCertsRef, ...queryParams);

    return getDocs(trainCertsQuery);
  };

  static getTrainCertsById = (id: string) => {
    const trainCertsRef = doc(db, CollectionName.trainingAndCertifications, id);

    return getDoc(trainCertsRef);
  };

  //For allocation

  static createTrainCertsAlloc = async (data: TrainCertsAllocFormFields) => {
    const trainCertsAllocId = getNewDocId(CollectionName.trainCertsAllocation);
    const trainCertsAllocRef = doc(
      db,
      CollectionName.trainCertsAllocation,
      trainCertsAllocId
    );

    const {
      TrainCertsAllocDate,
      TrainCertsAllocEmpId,
      TrainCertsAllocEmpName,
      TrainCertsId,
    } = data;

    const trainCertsRef = doc(
      db,
      CollectionName.trainingAndCertifications,
      TrainCertsId
    );

    await runTransaction(db, async (transaction) => {
      const trainCertsSnapshot = await transaction.get(trainCertsRef);
      const trainCertsData =
        trainCertsSnapshot.data() as ITrainingAndCertificationsCollection;

      const newTrainCertsAlloc: ITrainCertsAllocationsCollection = {
        TrainCertsAllocId: trainCertsAllocId,
        TrainCertsId,
        TrainCertsAllocEmpId,
        TrainCertsAllocEmpName,
        TrainCertsAllocStatus: 'pending',
        TrainCertsAllocDate: TrainCertsAllocDate as unknown as Timestamp,
        TrainCertsAllocCreatedAt: serverTimestamp(),
      };

      transaction.set(trainCertsAllocRef, newTrainCertsAlloc);

      const updatedTrainCerts: Partial<ITrainingAndCertificationsCollection> = {
        TrainCertsTotalTrainee: trainCertsData.TrainCertsTotalTrainee + 1,
      };

      transaction.update(trainCertsRef, updatedTrainCerts);
    });
  };

  static updateTrainCertsAllocStatus = async ({
    status,
    trainCertsAllocId,
    date,
  }: {
    trainCertsAllocId: string;
    status: 'started' | 'completed';
    date: Date;
  }) => {
    const trainCertsAllocRef = doc(
      db,
      CollectionName.trainCertsAllocation,
      trainCertsAllocId
    );

    await runTransaction(db, async (transaction) => {
      const trainCertsAllocSnapshot = await transaction.get(trainCertsAllocRef);
      const trainCertsAllocData =
        trainCertsAllocSnapshot.data() as ITrainCertsAllocationsCollection;
      const { TrainCertsId } = trainCertsAllocData;

      if (status === 'started') {
        const updatedTrainCertsAlloc: Partial<ITrainCertsAllocationsCollection> =
          {
            TrainCertsAllocStatus: status,
            TrainCertsAllocStartDate: date as unknown as Timestamp,
          };
        transaction.update(trainCertsAllocRef, updatedTrainCertsAlloc);
      } else if (status === 'completed') {
        const updatedTrainCertsAlloc: Partial<ITrainCertsAllocationsCollection> =
          {
            TrainCertsAllocStatus: status,
            TrainCertsAllocCompletionDate: date as unknown as Timestamp,
          };

        //*Update the number of trainee completed training in TrainingAndCertifications
        const trainCertsRef = doc(
          db,
          CollectionName.trainingAndCertifications,
          TrainCertsId
        );
        const trainCertsSnapshot = await transaction.get(trainCertsRef);
        const trainCertsData =
          trainCertsSnapshot.data() as ITrainingAndCertificationsCollection;

        const updatedTrainCerts: Partial<ITrainingAndCertificationsCollection> =
          {
            TrainCertsTotalTraineeCompletedTraining:
              trainCertsData.TrainCertsTotalTraineeCompletedTraining + 1,
          };

        //*Update documents after all read completed
        transaction.update(trainCertsAllocRef, updatedTrainCertsAlloc);
        transaction.update(trainCertsRef, updatedTrainCerts);
      }
    });
  };

  static deleteTrainCertsAlloc = async (trainCertsAllocId: string) => {
    const trainCertsAllocRef = doc(
      db,
      CollectionName.trainCertsAllocation,
      trainCertsAllocId
    );
    await runTransaction(db, async (transaction) => {
      const trainCertsAllocSnapshot = await transaction.get(trainCertsAllocRef);
      const trainCertsAllocData =
        trainCertsAllocSnapshot.data() as ITrainCertsAllocationsCollection;
      const { TrainCertsId, TrainCertsAllocStatus } = trainCertsAllocData;

      const trainCertsRef = doc(
        db,
        CollectionName.trainingAndCertifications,
        TrainCertsId
      );
      const trainCertsSnapshot = await transaction.get(trainCertsRef);
      const trainCertsData =
        trainCertsSnapshot.data() as ITrainingAndCertificationsCollection;

      transaction.delete(trainCertsAllocRef);

      const updatedTrainCerts: Partial<ITrainingAndCertificationsCollection> = {
        TrainCertsTotalTrainee: trainCertsData.TrainCertsTotalTrainee - 1,
        TrainCertsTotalTraineeCompletedTraining:
          TrainCertsAllocStatus === 'completed'
            ? trainCertsData.TrainCertsTotalTraineeCompletedTraining - 1
            : trainCertsData.TrainCertsTotalTraineeCompletedTraining,
      };

      transaction.update(trainCertsRef, updatedTrainCerts);
    });
  };

  static getTrainCertsAlloc = ({
    trainCertsId,
    lastDoc,
    lmt,
    endDate,
    isLifeTime,
    startDate,
    empId,
  }: {
    trainCertsId: string;
    lastDoc?: DocumentData | null;
    lmt?: number;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    isLifeTime?: boolean;
    empId?: string;
  }) => {
    const trainCertsAllocRef = collection(
      db,
      CollectionName.trainCertsAllocation
    );

    let queryParams: QueryConstraint[] = [
      where('TrainCertsId', '==', trainCertsId),
      orderBy('TrainCertsAllocDate', 'desc'),
    ];

    if (!isLifeTime) {
      queryParams = [
        ...queryParams,
        where('TrainCertsAllocDate', '>=', startDate),
        where('TrainCertsAllocDate', '<=', endDate),
      ];
    }

    if (empId) {
      queryParams = [
        ...queryParams,
        where('TrainCertsAllocEmpId', '==', empId),
      ];
    }

    if (lastDoc) {
      queryParams = [...queryParams, startAfter(lastDoc)];
    }

    if (lmt) {
      queryParams = [...queryParams, limit(lmt)];
    }

    const trainCertsAllocQuery = query(trainCertsAllocRef, ...queryParams);

    return getDocs(trainCertsAllocQuery);
  };

  //*Emergency Protocols
  static createEmergProtocol = async ({
    cmpId,
    data,
    video,
  }: {
    cmpId: string;
    data: EmergProtocolCreateFormFields;
    video: File | null;
  }) => {
    const { EmergProtocolDescription, EmergProtocolTitle } = data;

    const emergProtocolId = getNewDocId(CollectionName.emergencyProtocols);
    const emergProtocolRef = doc(
      db,
      CollectionName.emergencyProtocols,
      emergProtocolId
    );
    let videoFileUrl: string | null = null;
    if (video) {
      const videoFileName = CloudStorageFileHandler.generateFileNameWithRandom(
        emergProtocolId,
        0,
        '.mp4'
      );

      videoFileUrl = await CloudStorageFileHandler.uploadFile(
        video,
        CloudStoragePaths.COMPANIES_EMERGENCY_PROTOCOLS + '/' + videoFileName
      );
    }

    const EmergProtocolTitleSearchIndex = fullTextSearchIndex(
      EmergProtocolTitle.toLocaleLowerCase().trim()
    );

    try {
      const newEmergProtocol: IEmergencyProtocolsCollection = {
        EmergProtocolId: emergProtocolId,
        EmergProtocolTitle,
        EmergProtocolDescription,
        EmergProtocolCompanyId: cmpId,
        EmergProtocolTitleSearchIndex,
        EmergProtocolVideo: videoFileUrl ?? null,
        EmergProtocolCreatedAt: serverTimestamp(),
        EmergProtocolModifiedAt: serverTimestamp(),
      };

      await setDoc(emergProtocolRef, newEmergProtocol);
    } catch (error) {
      console.log(error);
      if (videoFileUrl) {
        await CloudStorageFileHandler.deleteFileByUrl(videoFileUrl);
      }
      throw error;
    }
  };

  static updateEmergProtocol = async ({
    emergProtocolId,
    data,
    video,
  }: {
    emergProtocolId: string;
    data: EmergProtocolCreateFormFields;
    video: File | null | string;
  }) => {
    const { EmergProtocolDescription, EmergProtocolTitle } = data;

    try {
      await runTransaction(db, async (transaction) => {
        const protocolRef = doc(
          db,
          CollectionName.emergencyProtocols,
          emergProtocolId
        );
        const protocolSnap = await transaction.get(protocolRef);
        const oldProtocolData =
          protocolSnap.data() as IEmergencyProtocolsCollection;

        let videoFileUrl = oldProtocolData.EmergProtocolVideo;
        let fileToBeDeleted: string | null = null;

        if (video && typeof video !== 'string') {
          const videoFileName =
            CloudStorageFileHandler.generateFileNameWithRandom(
              emergProtocolId,
              0,
              '.mp4'
            );

          videoFileUrl = await CloudStorageFileHandler.uploadFile(
            video,
            CloudStoragePaths.COMPANIES_EMERGENCY_PROTOCOLS +
              '/' +
              videoFileName
          );

          fileToBeDeleted = oldProtocolData.EmergProtocolVideo;
        }

        const newDocument: Partial<IEmergencyProtocolsCollection> = {
          EmergProtocolTitle,
          EmergProtocolDescription,
          EmergProtocolTitleSearchIndex: fullTextSearchIndex(
            EmergProtocolTitle.trim().toLowerCase()
          ),
          EmergProtocolVideo: videoFileUrl,
          EmergProtocolModifiedAt: serverTimestamp(),
        };

        transaction.update(protocolRef, newDocument);

        if (fileToBeDeleted) {
          await CloudStorageFileHandler.deleteFileByUrl(fileToBeDeleted);
        }
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  static deleteEmergProtocol = async (emergProtocolId: string) => {
    try {
      await runTransaction(db, async (transaction) => {
        const documentRef = doc(
          db,
          CollectionName.emergencyProtocols,
          emergProtocolId
        );
        const docSnap = await transaction.get(documentRef);
        const docData = docSnap.data() as IEmergencyProtocolsCollection;

        transaction.delete(documentRef);

        if (docData.EmergProtocolVideo) {
          await CloudStorageFileHandler.deleteFileByUrl(
            docData.EmergProtocolVideo
          );
        }
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  static getEmergProtocols = ({
    lmt,
    lastDoc,
    searchQuery,
    cmpId,
  }: {
    lmt?: number;
    lastDoc?: DocumentData | null;
    searchQuery?: string;
    cmpId: string;
  }) => {
    const emergProtocolsRef = collection(db, CollectionName.emergencyProtocols);

    let queryParams: QueryConstraint[] = [
      where('EmergProtocolCompanyId', '==', cmpId),
      orderBy('EmergProtocolCreatedAt', 'desc'),
    ];

    if (searchQuery && searchQuery.length > 0) {
      queryParams = [
        ...queryParams,
        where(
          'EmergProtocolTitleSearchIndex',
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

    const emergProtocolsQuery = query(emergProtocolsRef, ...queryParams);

    return getDocs(emergProtocolsQuery);
  };
}

export default DbCompany;
