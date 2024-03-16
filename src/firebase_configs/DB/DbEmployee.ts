import {
  DocumentData,
  QueryConstraint,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
} from "firebase/firestore";
import { CollectionName } from "../../@types/enum";
import { db } from "../config";
import { getNewDocId } from "./utils";
import { IEmployeesCollection } from "../../@types/database";
import { AddEmployeeFormField } from "../../component/employees/modal/AddEmployeeModal";
import CustomError from "../../utilities/CustomError";
import { fullTextSearchIndex } from "../../utilities/misc";

class DbEmployee {
  static isEmpExist = async (
    empPhone: string,
    empRole: string,
    empId: string | null
  ) => {
    const empDocRef = collection(db, CollectionName.employees);

    let queryParams: QueryConstraint[] = [
      where("EmployeePhone", "==", empPhone),
      where("EmployeeRole", "==", empRole),
    ];

    if (empId) {
      queryParams = [...queryParams, where("EmployeeId", "!=", empId)];
    }

    queryParams = [...queryParams, limit(1)];

    const empQuery = query(empDocRef, ...queryParams);

    const snapshot = await getDocs(empQuery);

    return snapshot.size > 0;
  };

  static addEmployee = async (empData: AddEmployeeFormField) => {
    const isEmpExist = await this.isEmpExist(
      empData.phone_number,
      empData.role,
      null
    );

    if (isEmpExist) {
      throw new CustomError("Employee with this phone already exist");
    }

    const empId = getNewDocId(CollectionName.employees);
    const docRef = doc(db, CollectionName.employees, empId);

    const newEmployee: IEmployeesCollection = {
      EmployeeId: empId,
      EmployeeName: `${empData.first_name} ${empData.last_name}`,
      EmployeeNameSearchIndex: fullTextSearchIndex(
        `${empData.first_name.trim().toLowerCase()} ${empData.last_name
          .trim()
          .toLowerCase()}`
      ),
      EmployeePhone: empData.phone_number,
      EmployeeEmail: empData.email,
      EmployeeRole: empData.role,
      EmployeeIsBanned: false,
      EmployeeCreatedAt: serverTimestamp(),
      EmployeeModifiedAt: serverTimestamp(),
    };

    console.log(newEmployee, "creating");

    return setDoc(docRef, newEmployee);
  };

  static updateEmployee = async (
    empData: AddEmployeeFormField,
    empId: string
  ) => {
    const isEmpExist = await this.isEmpExist(
      empData.phone_number,
      empData.role,
      empId
    );

    if (isEmpExist) {
      throw new CustomError("Employee with this phone already exist");
    }

    const docRef = doc(db, CollectionName.employees, empId);

    const newEmployee: Partial<IEmployeesCollection> = {
      EmployeeName: `${empData.first_name} ${empData.last_name}`,
      EmployeeNameSearchIndex: fullTextSearchIndex(
        `${empData.first_name.trim().toLowerCase()} ${empData.last_name
          .trim()
          .toLowerCase()}`
      ),
      EmployeePhone: empData.phone_number,
      EmployeeEmail: empData.email,
      EmployeeRole: empData.role,
      EmployeeModifiedAt: serverTimestamp(),
    };

    return updateDoc(docRef, newEmployee);
  };

  static deleteEmployee = (empId: string) => {
    const empRef = doc(db, CollectionName.employees, empId);
    return deleteDoc(empRef);
  };

  static getEmployees = ({
    lmt,
    lastDoc,
    searchQuery,
  }: {
    lmt: number;
    lastDoc?: DocumentData | null;
    searchQuery?: string;
  }) => {
    const empRef = collection(db, CollectionName.employees);

    let queryParams: QueryConstraint[] = [];
    if (lmt) {
      queryParams = [...queryParams, limit(lmt)];
    }

    if (searchQuery && searchQuery.length > 0) {
      queryParams = [
        ...queryParams,
        where(
          "EmployeeNameSearchIndex",
          "array-contains",
          searchQuery.toLocaleLowerCase()
        ),
      ];
    }

    if (lastDoc) {
      queryParams = [...queryParams, startAfter(lastDoc)];
    }

    const empQuery = query(empRef, ...queryParams);

    return getDocs(empQuery);
  };
}

export default DbEmployee;
