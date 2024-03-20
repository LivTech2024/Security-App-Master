import { doc, serverTimestamp, setDoc } from "@firebase/firestore";
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
}

export default DbCompany;
