import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { CollectionName } from "../../@types/enum";
import { db } from "../config";
import { getNewDocId } from "./utils";
import { IEmployeesCollection } from "../../@types/database";
import { AddEmployeeFormField } from "../../component/employees/modal/AddEmployeeModal";
import CustomError from "../../utilities/CustomError";

class DbEmployee {
  static isEmpNameExist = async (empName: string) => {
    const empDocRef = collection(db, CollectionName.employees);
    const empQuery = query(
      empDocRef,
      where("EmployeeName", "==", empName),
      limit(1)
    );

    const snapshot = await getDocs(empQuery);

    return snapshot.size > 0;
  };

  static addEmployee = async (empData: AddEmployeeFormField) => {
    const isEmpExist = await this.isEmpNameExist(
      `${empData.first_name} ${empData.last_name}`
    );

    if (isEmpExist) {
      throw new CustomError("Employee with this name already exist");
    }

    const empId = getNewDocId(CollectionName.employees);
    const docRef = doc(db, CollectionName.employees, empId);

    const newEmployee: IEmployeesCollection = {
      EmployeeId: empId,
      EmployeeName: `${empData.first_name} ${empData.last_name}`,
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
}

export default DbEmployee;
