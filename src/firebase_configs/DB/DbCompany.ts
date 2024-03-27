import {
  CloudStoragePaths,
  CollectionName,
  ImageResolution,
} from "../../@types/enum";
import CloudStorageImageHandler, { getNewDocId } from "./utils";
import { db } from "../config";
import {
  IAdminsCollection,
  ICompaniesCollection,
  ICompanyBranchesCollection,
  ILocationsCollection,
} from "../../@types/database";
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
} from "@firebase/firestore";
import { fullTextSearchIndex } from "../../utilities/misc";
import {
  CompanyBranchFormFields,
  CompanyCreateFormFields,
} from "../../utilities/zod/schema";
import CustomError from "../../utilities/CustomError";

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
          "/" +
          CloudStorageImageHandler.generateImageName(companyId),
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
      const cmpSnapshot = await transaction.get(companyRef);
      const cmpOldData = cmpSnapshot.data() as ICompaniesCollection;

      let logoImageUrl = logoBase64;
      let cmpLogoToBeDelete: string | null = null;

      if (!logoImageUrl.startsWith("https")) {
        const imageEmployee = [
          {
            base64: logoBase64,
            path:
              CloudStoragePaths.COMPANIES_LOGOS +
              "/" +
              CloudStorageImageHandler.generateImageName(cmpId),
          },
        ];

        const imageUrl = await CloudStorageImageHandler.getImageDownloadUrls(
          imageEmployee,
          ImageResolution.EMP_IMAGE_HEIGHT,
          ImageResolution.EMP_IMAGE_WIDTH
        );

        logoImageUrl = imageUrl[0];

        cmpLogoToBeDelete = cmpOldData.CompanyLogo;
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

      if (cmpLogoToBeDelete) {
        await CloudStorageImageHandler.deleteImageByUrl(cmpLogoToBeDelete);
      }
    });
  };

  static getCompanyBranches = (cmpId: string) => {
    const cmpBranchRef = collection(db, CollectionName.companyBranch);
    const cmpBranchQuery = query(cmpBranchRef, where("CompanyId", "==", cmpId));
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
      where("EmployeeCompanyBranchId", "==", cmpBranchId)
    );
    const empTask = getDocs(empQuery);

    //Check if shifts exist in this branch
    const shiftDocRef = collection(db, CollectionName.shifts);
    const shiftQuery = query(
      shiftDocRef,
      where("ShiftCompanyBranchId", "==", cmpBranchId)
    );
    const shiftTask = getDocs(shiftQuery);

    const querySnapshots = await Promise.all([empTask, shiftTask]);

    const branchAlreadyUsed = querySnapshots.some(
      (snapshot) => snapshot.size > 0
    );

    if (branchAlreadyUsed) {
      throw new CustomError("This branch is already in use");
    }

    const docRef = doc(db, CollectionName.companyBranch, cmpBranchId);

    return deleteDoc(docRef);
  };

  static createAdmin = (companyId: string) => {
    const adminId = getNewDocId(CollectionName.admins);
    const adminRef = doc(db, CollectionName.admins, adminId);

    const newAdmin: IAdminsCollection = {
      AdminId: adminId,
      AdminName: "Jhon Doe",
      AdminEmail: "sapp69750@gmail.com",
      AdminPhone: "+918624016814",
      AdminCompanyId: companyId,
      AdminCreatedAt: serverTimestamp(),
      AdminModifiedAt: serverTimestamp(),
    };

    return setDoc(adminRef, newAdmin);
  };

  static getAdminById = (adminId: string) => {
    const adminRef = doc(db, CollectionName.admins, adminId);
    return getDoc(adminRef);
  };

  static getCompanyById = (cmpId: string) => {
    const cmpRef = doc(db, CollectionName.companies, cmpId);
    return getDoc(cmpRef);
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
      where("LoggedInId", "==", loggedInId),
      where("LoggedInCrypt", "==", loggedInCrypt),
      where("LoggedInUserId", "==", uId),
      where("IsLoggedIn", "==", isLoggedIn),
      limit(1)
    );

    return getDocs(loggedInQuery);
  };

  static deleteUserLoggedInDoc = async (loggedInId: string) => {
    const loggedInRef = doc(db, CollectionName.loggedInUsers, loggedInId);
    await deleteDoc(loggedInRef);
  };

  static addLocation = (
    cmpId: string,
    locationName: string,
    locationAddress: string,
    locationCoordinates: { lat: number | null; lng: number | null }
  ) => {
    const locationId = getNewDocId(CollectionName.locations);
    const locationRef = doc(db, CollectionName.locations, locationId);

    const nameSearchIndex = fullTextSearchIndex(
      locationName.trim().toLowerCase()
    );

    const newLocation: ILocationsCollection = {
      LocationId: locationId,
      LocationCompanyId: cmpId,
      LocationName: locationName,
      LocationSearchIndex: nameSearchIndex,
      LocationAddress: locationAddress,
      LocationCoordinates: new GeoPoint(
        locationCoordinates.lat || 0,
        locationCoordinates.lng || 0
      ),
      LocationCreatedAt: serverTimestamp(),
    };

    return setDoc(locationRef, newLocation);
  };

  static updateLocation = (
    locationId: string,
    locationName: string,
    locationAddress: string,
    locationCoordinates: { lat: number | null; lng: number | null }
  ) => {
    const locationRef = doc(db, CollectionName.locations, locationId);

    const nameSearchIndex = fullTextSearchIndex(
      locationName.trim().toLowerCase()
    );

    const newLocation: Partial<ILocationsCollection> = {
      LocationName: locationName,
      LocationSearchIndex: nameSearchIndex,
      LocationAddress: locationAddress,
      LocationCoordinates: new GeoPoint(
        locationCoordinates.lat || 0,
        locationCoordinates.lng || 0
      ),
      LocationCreatedAt: serverTimestamp(),
    };

    return updateDoc(locationRef, newLocation);
  };

  static deleteLocation = (locationId: string) => {
    const locationRef = doc(db, CollectionName.locations, locationId);
    return deleteDoc(locationRef);
  };

  static getLocations = ({
    lmt,
    lastDoc,
    searchQuery,
    cmpId,
  }: {
    lmt: number;
    lastDoc?: DocumentData | null;
    searchQuery?: string;
    cmpId: string;
  }) => {
    const locationRef = collection(db, CollectionName.locations);

    let queryParams: QueryConstraint[] = [
      where("LocationCompanyId", "==", cmpId),
      orderBy("LocationCreatedAt", "desc"),
    ];

    if (searchQuery && searchQuery.length > 0) {
      queryParams = [
        ...queryParams,
        where(
          "LocationSearchIndex",
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

    const locationQuery = query(locationRef, ...queryParams);

    return getDocs(locationQuery);
  };
}

export default DbCompany;
