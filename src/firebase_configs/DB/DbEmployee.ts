import {
  DocumentData,
  QueryConstraint,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  CloudStoragePaths,
  CollectionName,
  ImageResolution,
} from "../../@types/enum";
import { db } from "../config";
import CloudStorageImageHandler, { getNewDocId } from "./utils";
import {
  IEmployeeRolesCollection,
  IEmployeesCollection,
} from "../../@types/database";
import CustomError from "../../utilities/CustomError";
import { fullTextSearchIndex } from "../../utilities/misc";
import { AddEmployeeFormField } from "../../utilities/zod/schema";

class DbEmployee {
  static isEmpRoleExist = async (empRole: string, empRoleId: string | null) => {
    const empRoleDocRef = collection(db, CollectionName.employeeRoles);

    let queryParams: QueryConstraint[] = [
      where("EmployeeRoleName", "==", empRole),
    ];

    if (empRoleId) {
      queryParams = [...queryParams, where("EmployeeRoleId", "!=", empRoleId)];
    }

    queryParams = [...queryParams, limit(1)];

    const empRoleQuery = query(empRoleDocRef, ...queryParams);

    const snapshot = await getDocs(empRoleQuery);

    return snapshot.size > 0;
  };

  static addEmpRole = async (empRole: string, cmpId: string) => {
    if (empRole === "admin" || empRole === "Admin") {
      throw new CustomError("You cannot create admin role");
    }
    const isRoleExist = await this.isEmpRoleExist(empRole, null);

    if (isRoleExist) {
      throw new CustomError("This employee role already exist");
    }

    const empRoleId = getNewDocId(CollectionName.employeeRoles);
    const empRoleRef = doc(db, CollectionName.employeeRoles, empRoleId);

    const newEmpRole: IEmployeeRolesCollection = {
      EmployeeRoleId: empRoleId,
      EmployeeRoleCompanyId: cmpId,
      EmployeeRoleName: empRole.trim().toUpperCase(),
      EmployeeRoleCreatedAt: serverTimestamp(),
    };

    await setDoc(empRoleRef, newEmpRole);

    return newEmpRole;
  };

  static updateEmpRole = async (empRole: string, empRoleId: string) => {
    if (empRole === "admin" || empRole === "Admin") {
      throw new CustomError("You cannot create admin role");
    }
    const isRoleExist = await this.isEmpRoleExist(empRole, empRoleId);
    if (isRoleExist) {
      throw new CustomError("This employee role already exist");
    }

    const empRoleRef = doc(db, CollectionName.employeeRoles, empRoleId);

    const newEmpRole: Partial<IEmployeeRolesCollection> = {
      EmployeeRoleName: empRole.trim().toUpperCase(),
      EmployeeRoleCreatedAt: serverTimestamp(),
    };

    return updateDoc(empRoleRef, newEmpRole);
  };

  static deleteEmpRole = async (empRoleId: string, empRole: string) => {
    const empRoleRef = doc(db, CollectionName.employeeRoles, empRoleId);

    //*check if this role used in any employee
    const empRef = collection(db, CollectionName.employees);
    const empQuery = query(
      empRef,
      where("EmployeeRole", "==", empRole),
      limit(1)
    );
    const empSnapshot = await getDocs(empQuery);
    if (!empSnapshot.empty) {
      throw new CustomError(
        "This role is used for some employees, please delete that employee before deleting this role"
      );
    }

    //*check if this role used in any shift
    const shiftRef = collection(db, CollectionName.shifts);
    const shiftQuery = query(
      shiftRef,
      where("ShiftPosition", "==", empRole),
      limit(1)
    );
    const shiftSnapshot = await getDocs(shiftQuery);
    if (!shiftSnapshot.empty) {
      throw new CustomError(
        "This role is used for some shifts, please delete that shifts before deleting this role"
      );
    }

    return deleteDoc(empRoleRef);
  };

  static getEmpRoles = ({ cmpId, lmt }: { cmpId: string; lmt?: number }) => {
    const empRoleRef = collection(db, CollectionName.employeeRoles);

    let queryParams: QueryConstraint[] = [
      where("EmployeeRoleCompanyId", "==", cmpId),
      orderBy("EmployeeRoleCreatedAt", "desc"),
    ];

    if (lmt) {
      queryParams = [...queryParams, limit(lmt)];
    }

    const empRoleQuery = query(empRoleRef, ...queryParams);

    return getDocs(empRoleQuery);
  };

  static isEmpExist = async (
    empEmail: string,
    empRole: string,
    empId: string | null,
    empCmpId: string
  ) => {
    const empDocRef = collection(db, CollectionName.employees);

    let queryParams: QueryConstraint[] = [
      where("EmployeeEmail", "==", empEmail),
      where("EmployeeRole", "==", empRole),
      where("EmployeeCompanyId", "==", empCmpId),
    ];

    if (empId) {
      queryParams = [...queryParams, where("EmployeeId", "!=", empId)];
    }

    queryParams = [...queryParams, limit(1)];

    const empQuery = query(empDocRef, ...queryParams);

    const snapshot = await getDocs(empQuery);

    return snapshot.size > 0;
  };

  static addEmployee = async ({
    cmpId,
    empData,
    empImage,
  }: {
    empData: AddEmployeeFormField;
    empImage: string;
    cmpId: string;
  }) => {
    const isEmpExist = await this.isEmpExist(
      empData.EmployeeEmail,
      empData.EmployeeRole,
      null,
      cmpId
    );

    if (isEmpExist) {
      throw new CustomError("Employee with this phone already exist");
    }

    const empId = getNewDocId(CollectionName.employees);
    const docRef = doc(db, CollectionName.employees, empId);

    const imageEmployee = [
      {
        base64: empImage,
        path:
          CloudStoragePaths.EMPLOYEES_IMAGES +
          "/" +
          CloudStorageImageHandler.generateImageName(empId),
      },
    ];

    const imageEmpUrl = await CloudStorageImageHandler.getImageDownloadUrls(
      imageEmployee,
      ImageResolution.EMP_IMAGE_HEIGHT,
      ImageResolution.EMP_IMAGE_WIDTH
    );

    const newEmployee: IEmployeesCollection = {
      EmployeeId: empId,
      EmployeeName: `${empData.EmployeeFirstName} ${empData.EmployeeLastName}`,
      EmployeeNameSearchIndex: fullTextSearchIndex(
        `${empData.EmployeeFirstName.trim().toLowerCase()} ${empData.EmployeeLastName.trim().toLowerCase()}`
      ),
      EmployeeImg: imageEmpUrl[0],
      EmployeePhone: empData.EmployeePhone,
      EmployeeEmail: empData.EmployeeEmail,
      EmployeePassword: empData.EmployeePassword,
      EmployeeRole: empData.EmployeeRole,
      EmployeePayRate: Number(empData.EmployeePayRate),
      EmployeeIsBanned: false,
      EmployeeCompanyId: cmpId,
      EmployeeCompanyBranchId: empData.EmployeeCompanyBranchId || null,
      EmployeeCreatedAt: serverTimestamp(),
      EmployeeModifiedAt: serverTimestamp(),
    };

    return setDoc(docRef, newEmployee);
  };

  static updateEmployee = async (
    empData: AddEmployeeFormField,
    empImage: string,
    empId: string,
    cmpId: string
  ) => {
    try {
      const isEmpExist = await this.isEmpExist(
        empData.EmployeeEmail,
        empData.EmployeeRole,
        empId,
        cmpId
      );

      if (isEmpExist) {
        throw new CustomError("Employee with this phone already exist");
      }

      await runTransaction(db, async (transaction) => {
        const empDocRef = doc(db, CollectionName.employees, empId);
        const empSnapshot = await transaction.get(empDocRef);
        const oldEmpData = empSnapshot.data() as IEmployeesCollection;

        let empImageUrl = empImage;
        let empImageToBeDelete: string | null = null;

        if (!empImageUrl.startsWith("https")) {
          const imageEmployee = [
            {
              base64: empImage,
              path:
                CloudStoragePaths.EMPLOYEES_IMAGES +
                "/" +
                CloudStorageImageHandler.generateImageName(empId),
            },
          ];

          const imageEmpUrl =
            await CloudStorageImageHandler.getImageDownloadUrls(
              imageEmployee,
              ImageResolution.EMP_IMAGE_HEIGHT,
              ImageResolution.EMP_IMAGE_WIDTH
            );

          empImageUrl = imageEmpUrl[0];

          empImageToBeDelete = oldEmpData.EmployeeImg;
        }

        const newEmployee: Partial<IEmployeesCollection> = {
          EmployeeName: `${empData.EmployeeFirstName} ${empData.EmployeeLastName}`,
          EmployeeImg: empImageUrl,
          EmployeeNameSearchIndex: fullTextSearchIndex(
            `${empData.EmployeeFirstName.trim().toLowerCase()} ${empData.EmployeeLastName.trim().toLowerCase()}`
          ),
          EmployeePhone: empData.EmployeePhone,
          EmployeePassword: empData.EmployeePassword,
          EmployeeEmail: empData.EmployeeEmail,
          EmployeeRole: empData.EmployeeRole,
          EmployeePayRate: Number(empData.EmployeePayRate),
          EmployeeCompanyId: cmpId,
          EmployeeModifiedAt: serverTimestamp(),
        };

        transaction.update(empDocRef, newEmployee);

        if (empImageToBeDelete) {
          await CloudStorageImageHandler.deleteImageByUrl(empImageToBeDelete);
        }
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  static deleteEmployee = async (empId: string) => {
    const empRef = doc(db, CollectionName.employees, empId);
    await runTransaction(db, async (transaction) => {
      //*Check if any shift is associated with this employee, if yes then this emp cannot be deleted

      const shiftRef = collection(db, CollectionName.shifts);
      const shiftQuery = query(
        shiftRef,
        where("ShiftAssignedUserId", "==", empId),
        limit(1)
      );

      const shiftSnapshot = await getDocs(shiftQuery);

      if (!shiftSnapshot.empty) {
        throw new CustomError(
          "This employee have shifts associated, please delete shifts first to delete this employee"
        );
      }

      const snapshot = await transaction.get(empRef);

      const empData = snapshot.data() as IEmployeesCollection;

      const { EmployeeImg } = empData;

      transaction.delete(empRef);

      if (EmployeeImg) {
        await CloudStorageImageHandler.deleteImageByUrl(EmployeeImg);
      }
    });
  };

  static getEmployees = ({
    lmt,
    lastDoc,
    searchQuery,
    cmpId,
    empRole,
    branch,
  }: {
    lmt: number;
    lastDoc?: DocumentData | null;
    searchQuery?: string;
    cmpId: string;
    empRole?: string;
    branch?: string;
  }) => {
    const empRef = collection(db, CollectionName.employees);

    let queryParams: QueryConstraint[] = [
      where("EmployeeCompanyId", "==", cmpId),
      orderBy("EmployeeCreatedAt", "desc"),
    ];

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

    if (empRole) {
      queryParams = [...queryParams, where("EmployeeRole", "==", empRole)];
    }

    if (branch) {
      queryParams = [
        ...queryParams,
        where("EmployeeCompanyBranchId", "==", branch),
      ];
    }

    if (lastDoc) {
      queryParams = [...queryParams, startAfter(lastDoc)];
    }

    if (lmt) {
      queryParams = [...queryParams, limit(lmt)];
    }

    const empQuery = query(empRef, ...queryParams);

    return getDocs(empQuery);
  };
}

export default DbEmployee;
