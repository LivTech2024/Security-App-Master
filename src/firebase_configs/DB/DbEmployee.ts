import {
  DocumentData,
  QueryConstraint,
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
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
import CloudStorageImageHandler, {
  CloudStorageFileHandler,
  getNewDocId,
} from "./utils";
import {
  IEmpBankDetails,
  IEmpCertificatesDetails,
  IEmployeeRolesCollection,
  IEmployeesCollection,
} from "../../@types/database";
import CustomError from "../../utilities/CustomError";
import { fullTextSearchIndex } from "../../utilities/misc";
import { AddEmployeeFormField } from "../../utilities/zod/schema";
import { EmpLicenseDetails } from "../../component/employees/EmployeeOtherDetails";
import { EmpCertificates } from "../../component/employees/EmpCertificateDetails";

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
      EmployeeRoleIsDeletable: true,
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
    licenseDetails,
    bankDetails,
    certificates,
  }: {
    empData: AddEmployeeFormField;
    empImage: string;
    cmpId: string;
    licenseDetails: EmpLicenseDetails[];
    bankDetails: IEmpBankDetails;
    certificates: EmpCertificates[];
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
          CloudStorageImageHandler.generateImageName(empId, "profile"),
      },
    ];

    const imageEmpUrl = await CloudStorageImageHandler.getImageDownloadUrls(
      imageEmployee,
      ImageResolution.EMP_IMAGE_HEIGHT,
      ImageResolution.EMP_IMAGE_WIDTH
    );

    if (bankDetails && bankDetails.BankVoidCheckImg) {
      const imageVoidCheck = [
        {
          base64: bankDetails.BankVoidCheckImg,
          path:
            CloudStoragePaths.EMPLOYEES_IMAGES +
            "/" +
            CloudStorageImageHandler.generateImageName(empId, "void_check"),
        },
      ];

      const imageVoidCheckUrl =
        await CloudStorageImageHandler.getImageDownloadUrls(
          imageVoidCheck,
          ImageResolution.EMP_VOID_CHECK_HEIGHT,
          ImageResolution.EMP_VOID_CHECK_WIDTH
        );

      bankDetails = { ...bankDetails, BankVoidCheckImg: imageVoidCheckUrl[0] };
    }

    const EmployeeLicenses = licenseDetails
      .filter((l) => l.LicenseNumber && l.LicenseExpDate)
      .map((l) => {
        return {
          ...l,
          LicenseExpDate: l.LicenseExpDate as unknown as Timestamp,
        };
      });

    const EmployeeCertificates: IEmpCertificatesDetails[] = await Promise.all(
      certificates?.map(async (certificate, idx) => {
        const fileName = CloudStorageFileHandler.generateFileNameWithRandom(
          empId,
          idx
        );
        const fileUrl = await CloudStorageFileHandler.uploadFile(
          certificate.CertificateDoc as File,
          CloudStoragePaths.EMPLOYEES_DOCUMENTS + "/" + fileName
        );

        return {
          CertificateName: certificate.CertificateName,
          CertificateDoc: fileUrl,
        };
      })
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
      EmployeeMaxHrsPerWeek: Number(empData.EmployeeMaxHrsPerWeek),
      EmployeeIsBanned: empData.EmployeeIsBanned,
      EmployeeCompanyId: cmpId,
      EmployeeIsAvailable: true,
      EmployeeSupervisorId: empData.EmployeeSupervisorId || null,
      EmployeeCompanyBranchId: empData.EmployeeCompanyBranchId || null,
      EmployeeBankDetails: bankDetails,
      EmployeeCertificates,
      EmployeeLicenses,
      EmployeeCreatedAt: serverTimestamp(),
      EmployeeModifiedAt: serverTimestamp(),
    };

    return setDoc(docRef, newEmployee);
  };

  static updateEmployee = async ({
    cmpId,
    empData,
    empId,
    empImage,
    licenseDetails,
    bankDetails,
    certificates,
  }: {
    empData: AddEmployeeFormField;
    empImage: string;
    empId: string;
    cmpId: string;
    licenseDetails: EmpLicenseDetails[];
    bankDetails: IEmpBankDetails;
    certificates: EmpCertificates[];
  }) => {
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
        const oldCertificates = oldEmpData?.EmployeeCertificates || [];

        let empImageUrl = empImage;

        if (!empImageUrl.startsWith("https")) {
          const imageEmployee = [
            {
              base64: empImage,
              path:
                CloudStoragePaths.EMPLOYEES_IMAGES +
                "/" +
                CloudStorageImageHandler.generateImageName(empId, "profile"),
            },
          ];

          const imageEmpUrl =
            await CloudStorageImageHandler.getImageDownloadUrls(
              imageEmployee,
              ImageResolution.EMP_IMAGE_HEIGHT,
              ImageResolution.EMP_IMAGE_WIDTH
            );

          empImageUrl = imageEmpUrl[0];
        }

        if (bankDetails && !bankDetails.BankVoidCheckImg.startsWith("https")) {
          const imageVoidCheck = [
            {
              base64: bankDetails.BankVoidCheckImg,
              path:
                CloudStoragePaths.EMPLOYEES_IMAGES +
                "/" +
                CloudStorageImageHandler.generateImageName(empId, "void_check"),
            },
          ];

          const imageVoidCheckUrl =
            await CloudStorageImageHandler.getImageDownloadUrls(
              imageVoidCheck,
              ImageResolution.EMP_VOID_CHECK_HEIGHT,
              ImageResolution.EMP_VOID_CHECK_WIDTH
            );

          bankDetails = {
            ...bankDetails,
            BankVoidCheckImg: imageVoidCheckUrl[0],
          };
        }

        const EmployeeLicenses =
          licenseDetails
            ?.filter((l) => l.LicenseNumber && l.LicenseExpDate)
            ?.map((l) => {
              return {
                ...l,
                LicenseExpDate: l.LicenseExpDate as unknown as Timestamp,
              };
            }) || [];

        //*This is for emp certificates
        const EmployeeCertificates: IEmpCertificatesDetails[] =
          await Promise.all(
            certificates?.map(async (certificate, idx) => {
              if (
                typeof certificate.CertificateDoc === "string" &&
                certificate.CertificateDoc.startsWith("https:")
              ) {
                return {
                  CertificateName: certificate.CertificateName,
                  CertificateDoc: certificate.CertificateDoc,
                };
              } else {
                const fileName =
                  CloudStorageFileHandler.generateFileNameWithRandom(
                    empId,
                    idx
                  );
                const fileUrl = await CloudStorageFileHandler.uploadFile(
                  certificate.CertificateDoc as File,
                  CloudStoragePaths.EMPLOYEES_DOCUMENTS + "/" + fileName
                );

                return {
                  CertificateName: certificate.CertificateName,
                  CertificateDoc: fileUrl,
                };
              }
            })
          );

        // Identify deleted certificates
        const deletedCertificates = oldCertificates.map((oldCertificate) => {
          if (
            !EmployeeCertificates.find(
              (c) => c.CertificateDoc === oldCertificate.CertificateDoc
            )
          ) {
            return oldCertificate.CertificateDoc;
          }
        });

        const newEmployee: Partial<IEmployeesCollection> = {
          EmployeeName: `${empData.EmployeeFirstName} ${empData.EmployeeLastName}`,
          EmployeeImg: empImageUrl,
          EmployeeNameSearchIndex: fullTextSearchIndex(
            `${empData.EmployeeFirstName.trim().toLowerCase()} ${empData.EmployeeLastName.trim().toLowerCase()}`
          ),
          EmployeeMaxHrsPerWeek: Number(empData.EmployeeMaxHrsPerWeek),
          EmployeePhone: empData.EmployeePhone,
          EmployeePassword: empData.EmployeePassword,
          EmployeeEmail: empData.EmployeeEmail,
          EmployeeRole: empData.EmployeeRole,
          EmployeePayRate: Number(empData.EmployeePayRate),
          EmployeeSupervisorId: empData.EmployeeSupervisorId || null,
          EmployeeCompanyId: cmpId,
          EmployeeIsBanned: empData.EmployeeIsBanned,
          EmployeeLicenses,
          EmployeeCertificates,
          EmployeeBankDetails: bankDetails,
          EmployeeModifiedAt: serverTimestamp(),
        };

        transaction.update(empDocRef, newEmployee);

        console.log(deletedCertificates, "deletedCertificates");

        const fileDeletePromises = deletedCertificates.map((fileUrl) => {
          if (fileUrl) {
            return CloudStorageFileHandler.deleteFileByUrl(fileUrl);
          }
        });
        Promise.allSettled(fileDeletePromises).catch((error_) => {
          console.log(error_);
        });
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
        where("ShiftAssignedUserId", "array-contains", empId),
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
    lmt?: number;
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

  static getEmpById = async (empId: string) => {
    const empRef = doc(db, CollectionName.employees, empId);
    const snapshot = await getDoc(empRef);

    return snapshot.data() as IEmployeesCollection;
  };
}

export default DbEmployee;
