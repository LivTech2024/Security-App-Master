import { CollectionName } from "../../@types/enum";
import { getNewDocId } from "./utils";
import { db } from "../config";
import {
  IAdminsCollection,
  ICompaniesCollection,
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
} from "@firebase/firestore";
import { fullTextSearchIndex } from "../../utilities/misc";

class DbCompany {
  static createCompany = () => {
    const companyId = getNewDocId(CollectionName.companies);
    const companyRef = doc(db, CollectionName.companies, companyId);

    const newCompany: ICompaniesCollection = {
      CompanyId: companyId,
      CompanyName: "Livtech",
      CompanyLogo: "",
      CompanyAddress: "",
      CompanyPhone: "+912222222222",
      CompanyEmail: "",
      CompanyCreatedAt: serverTimestamp(),
      CompanyModifiedAt: serverTimestamp(),
    };

    return setDoc(companyRef, newCompany);
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
