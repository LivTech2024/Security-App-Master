import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { CollectionName } from "../../@types/enum";
import { getNewDocId } from "./utils";
import { auth, db } from "../config";
import {
  IAdminsCollection,
  ICompaniesCollection,
  IEmployeeRolesCollection,
} from "../../@types/database";
import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";

const emailId = "tpssolution@gmail.com";
const password = "tps12345";

class DbSuperAdmin {
  static createNewCompany = async () => {
    //*Create a new auth user
    const userCred = await createUserWithEmailAndPassword(
      auth,
      emailId,
      password
    );
    const user = userCred.user;
    const { uid } = user;
    try {
      await runTransaction(db, async (transaction) => {
        //*Create a new company
        const companyId = getNewDocId(CollectionName.companies);
        const companyRef = doc(db, CollectionName.companies, companyId);

        const newCompany: ICompaniesCollection = {
          CompanyId: companyId,
          CompanyName: "Tactick Protection Solution Ltd.",
          CompanyEmail: emailId,
          CompanyPhone: "+1234567",
          CompanyAddress: "Alberta, Canada",
          CompanyLogo: "",
          CompanyCreatedAt: serverTimestamp(),
          CompanyModifiedAt: serverTimestamp(),
        };

        transaction.set(companyRef, newCompany);

        //*create a new admin
        const adminDocRef = doc(db, CollectionName.admins, uid);
        const newAdmin: IAdminsCollection = {
          AdminId: uid,
          AdminName: "Jhon",
          AdminEmail: "Doe",
          AdminPhone: "+1234567",
          AdminCompanyId: companyId,
          AdminCreatedAt: serverTimestamp(),
          AdminModifiedAt: serverTimestamp(),
        };

        transaction.set(adminDocRef, newAdmin);

        //*create default employee roles
        const defaultEmpRoles = ["GUARD", "SUPERVISOR"];

        defaultEmpRoles.forEach(async (role) => {
          const empRoleId = getNewDocId(CollectionName.employeeRoles);
          const empRoleDocRef = doc(db, CollectionName.employeeRoles);

          const newEmpRole: IEmployeeRolesCollection = {
            EmployeeRoleId: empRoleId,
            EmployeeRoleCompanyId: companyId,
            EmployeeRoleName: role,
            EmployeeRoleIsDeletable: false,
            EmployeeRoleCreatedAt: serverTimestamp(),
          };

          transaction.set(empRoleDocRef, newEmpRole);
        });
      });
    } catch (error) {
      console.log(error);
      await deleteUser(user);
      throw error;
    }
  };
}

export default DbSuperAdmin;
