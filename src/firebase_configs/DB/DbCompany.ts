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
} from "@firebase/firestore";
import { CollectionName } from "../../@types/enum";
import { getNewDocId } from "./utils";
import { db } from "../config";
import { IAdminsCollection, ICompaniesCollection } from "../../@types/database";

class DbCompany {
  static createCompany = () => {
    const companyId = getNewDocId(CollectionName.companies);
    const companyRef = doc(db, CollectionName.companies, companyId);

    const newCompany: ICompaniesCollection = {
      CompanyId: companyId,
      CompanyName: "Livtech",
      CompanyLogo: "",
      CompanyAddress: "",
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
}

export default DbCompany;
