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
  ILocationsCollection,
  IReportCategoriesCollection,
  ISettingsCollection,
  ITaskLogsCollection,
  ITasksCollection,
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
  LocationCreateFormFields,
  SettingsFormFields,
  TaskFormFields,
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
    data: CompanyCreateFormFields;
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

  static deleteUserLoggedInDoc = async (loggedInId: string) => {
    const loggedInRef = doc(db, CollectionName.loggedInUsers, loggedInId);
    await deleteDoc(loggedInRef);
  };

  static addLocation = async (
    cmpId: string,
    data: LocationCreateFormFields,
    postOrderData: {
      PostOrderPdf: string | File;
      PostOrderTitle: string;
    } | null
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
        LocationManagerEmail,
        LocationManagerName,
        LocationSendEmailForEachPatrol,
        LocationSendEmailForEachShift,
        LocationSendEmailToClient,
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
        LocationManagerEmail,
        LocationManagerName,
        LocationSendEmailForEachPatrol,
        LocationSendEmailForEachShift,
        LocationSendEmailToClient,
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
    } | null
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
      LocationManagerEmail,
      LocationManagerName,
      LocationSendEmailForEachPatrol,
      LocationSendEmailForEachShift,
      LocationSendEmailToClient,
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
        LocationManagerEmail,
        LocationManagerName,
        LocationSendEmailForEachPatrol,
        LocationSendEmailForEachShift,
        LocationSendEmailToClient,
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
  }: {
    lmt?: number;
    lastDoc?: DocumentData | null;
    searchQuery?: string;
    cmpId?: string | null;
    clientId?: string | null;
  }) => {
    const locationRef = collection(db, CollectionName.locations);

    let queryParams: QueryConstraint[] = [orderBy('LocationCreatedAt', 'desc')];

    if (cmpId) {
      queryParams = [...queryParams, where('LocationCompanyId', '==', cmpId)];
    }

    if (clientId) {
      queryParams = [...queryParams, where('LocationClientId', '==', clientId)];
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

  static createSettings = (cmpId: string) => {
    const settingId = getNewDocId(CollectionName.settings);
    const settingRef = doc(db, CollectionName.settings, settingId);

    const newSetting: ISettingsCollection = {
      SettingId: settingId,
      SettingCompanyId: cmpId,
      SettingEmpWellnessIntervalInMins: 60,
      SettingEmpShiftTimeMarginInMins: 10,
    };

    return setDoc(settingRef, newSetting);
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
      TaskCompanyBranchId: data.TaskCompanyBranchId,
      TaskDescription: data.TaskDescription,
      TaskStartDate: data.TaskStartDate as unknown as Timestamp,
      TaskForDays: data.TaskForDays,
      TaskCreatedAt: serverTimestamp(),
    };

    if (data.TaskAllotedLocationId && data.TaskAllotedLocationId.length > 0) {
      newTask = {
        ...newTask,
        TaskAllotedLocationId: data.TaskAllotedLocationId,
      };
    } else {
      if (data.TaskAllotedToEmpIds) {
        newTask = {
          ...newTask,
          TaskAllotedToEmpIds: data.TaskAllotedToEmpIds,
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

    let updatedTask: Partial<ITasksCollection> = {
      TaskId: taskId,
      TaskCompanyBranchId: data.TaskCompanyBranchId,
      TaskDescription: data.TaskDescription,
      TaskStartDate: data.TaskStartDate as unknown as Timestamp,
      TaskForDays: data.TaskForDays,
    };

    if (data.TaskAllotedLocationId && data.TaskAllotedLocationId.length > 0) {
      updatedTask = {
        ...updatedTask,
        TaskAllotedLocationId: data.TaskAllotedLocationId,
      };
    } else {
      if (data.TaskAllotedToEmpIds) {
        updatedTask = {
          ...updatedTask,
          TaskAllotedToEmpIds: data.TaskAllotedToEmpIds,
        };
      } else {
        updatedTask = {
          ...updatedTask,
          TaskIsAllotedToAllEmps: true,
        };
      }
    }

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
}

export default DbCompany;
