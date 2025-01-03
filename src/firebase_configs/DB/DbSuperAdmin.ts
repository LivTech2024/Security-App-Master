import {
  DocumentData,
  QueryConstraint,
  Transaction,
  collection,
  doc,
  endAt,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  startAt,
  where,
} from 'firebase/firestore';
import { CollectionName } from '../../@types/enum';
import { getNewDocId } from './utils';
import { auth, db } from '../config';
import {
  IAdminsCollection,
  ICompaniesCollection,
  IEmployeeRolesCollection,
  IReportCategoriesCollection,
  ISettingsCollection,
} from '../../@types/database';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  User,
} from 'firebase/auth';
import { CompanyCreateFormFields } from '../../utilities/zod/schema';

class DbSuperAdmin {
  static getSuperAdminById = (id: string) => {
    const superAdminRef = doc(db, CollectionName.superAdmin, id);
    return getDoc(superAdminRef);
  };

  static generateDefaultReportCategories = (
    transaction: Transaction,
    cmpId: string
  ) => {
    const defaultReportCategories = [
      'Shift',
      'Patrol',
      'General concern',
      'Incident',
      'Maintenance',
      'Security safety',
      'Vagrant removal',
      'Other',
    ];

    defaultReportCategories.forEach((cat) => {
      const reportCatId = getNewDocId(CollectionName.reportCategories);
      const reportCatRef = doc(
        db,
        CollectionName.reportCategories,
        reportCatId
      );

      const newCategory: IReportCategoriesCollection = {
        ReportCategoryId: reportCatId,
        ReportCompanyId: cmpId,
        ReportCategoryName: cat,
        ReportCategoryCreatedAt: serverTimestamp(),
      };

      return transaction.set(reportCatRef, newCategory);
    });
  };

  static getCompanies = async ({
    lmt,
    lastDoc,
    searchQuery,
  }: {
    lmt?: number;
    lastDoc?: DocumentData | null;
    searchQuery?: string | null;
  }) => {
    const companyRef = collection(db, CollectionName.companies);

    let queryParams: QueryConstraint[] = [];

    if (searchQuery && searchQuery.length > 0) {
      queryParams = [
        ...queryParams,
        orderBy('CompanyName'),
        startAt(searchQuery),
        endAt(searchQuery + '\uF8FF'),
      ];
    } else {
      queryParams = [...queryParams, orderBy('CompanyCreatedAt', 'desc')];
    }

    if (lastDoc) {
      queryParams = [...queryParams, startAfter(lastDoc)];
    }

    if (lmt) {
      queryParams = [...queryParams, limit(lmt)];
    }

    const companyQuery = query(companyRef, ...queryParams);

    return getDocs(companyQuery);
  };

  static getCompanyById = (cmpId: string) => {
    const companyRef = doc(db, CollectionName.companies, cmpId);

    return getDoc(companyRef);
  };

  static getAdminByCompanyById = (cmpId: string) => {
    const adminRef = collection(db, CollectionName.admins);

    const adminQuery = query(
      adminRef,
      where('AdminCompanyId', '==', cmpId),
      orderBy('AdminCreatedAt', 'desc'),
      limit(1)
    );

    return getDocs(adminQuery);
  };

  static getCompanySettings = (cmpId: string) => {
    const settingsRef = collection(db, CollectionName.settings);

    const settingsQuery = query(
      settingsRef,
      where('SettingCompanyId', '==', cmpId),
      limit(1)
    );

    return getDocs(settingsQuery);
  };

  static createNewCompany = async (data: CompanyCreateFormFields) => {
    //*Create a new auth user

    let user: User | null = null;

    try {
      await runTransaction(db, async (transaction) => {
        const {
          CompanyName,
          CompanyEmail,
          CompanyPhone,
          CompanyAddress,
          CompanyAdminDetails,
        } = data;

        //*Create a auth user with admin credentials
        const userCred = await createUserWithEmailAndPassword(
          auth,
          CompanyAdminDetails.AdminEmail,
          CompanyAdminDetails.AdminPassword
        );

        user = userCred.user;
        const { uid } = user;

        //*Create a new company
        const companyId = getNewDocId(CollectionName.companies);
        const companyRef = doc(db, CollectionName.companies, companyId);

        const newCompany: ICompaniesCollection = {
          CompanyId: companyId,
          CompanyName,
          CompanyEmail,
          CompanyPhone: CompanyPhone,
          CompanyAddress,
          CompanyLogo: '',
          CompanyCreatedAt: serverTimestamp(),
          CompanyModifiedAt: serverTimestamp(),
        };

        transaction.set(companyRef, newCompany);

        //*create a new admin
        const adminDocRef = doc(db, CollectionName.admins, uid);
        const newAdmin: IAdminsCollection = {
          AdminId: uid,
          AdminName: CompanyAdminDetails.AdminName,
          AdminEmail: CompanyAdminDetails.AdminEmail,
          AdminPhone: CompanyAdminDetails.AdminPhone,
          AdminCompanyId: companyId,
          AdminCreatedAt: serverTimestamp(),
          AdminModifiedAt: serverTimestamp(),
        };

        transaction.set(adminDocRef, newAdmin);

        //*create default employee roles
        const defaultEmpRoles = ['GUARD', 'SUPERVISOR'];

        defaultEmpRoles.forEach((role) => {
          const empRoleId = getNewDocId(CollectionName.employeeRoles);
          const empRoleDocRef = doc(
            db,
            CollectionName.employeeRoles,
            empRoleId
          );

          const newEmpRole: IEmployeeRolesCollection = {
            EmployeeRoleId: empRoleId,
            EmployeeRoleCompanyId: companyId,
            EmployeeRoleName: role,
            EmployeeRoleIsDeletable: false,
            EmployeeRoleCreatedAt: serverTimestamp(),
          };

          transaction.set(empRoleDocRef, newEmpRole);
        });

        //*Create default settings;

        const {
          SettingIsAuditEnabled,
          SettingIsCalloutEnabled,
          SettingIsCommunicationCenterEnabled,
          SettingIsDocRepoEnabled,
          SettingIsEmergencyResponseEnabled,
          SettingIsEmpDarEnabled,
          SettingIsEquipmentManagementEnabled,
          SettingIsHRSystemEnabled,
          SettingIsKeyManagementEnabled,
          SettingIsPatrollingEnabled,
          SettingIsVisitorManagementEnabled,
          SettingIsTrainingAndCertificationsEnabled,
          SettingIsTimeAndAttendanceEnabled,
          SettingIsTaskAssignmentAndTrackingEnabled,
          SettingIsReportsEnabled,
          SettingIsPerformanceAssuranceEnabled,
          SettingIsPaymentsAndBillingEnabled,
          SettingIsPatrolCompleteOptionEnabled,
        } = data;

        const settingId = getNewDocId(CollectionName.settings);
        const settingRef = doc(db, CollectionName.settings, settingId);
        const newSetting: ISettingsCollection = {
          SettingId: settingId,
          SettingCompanyId: companyId,
          SettingEmpWellnessIntervalInMins: 60,
          SettingEmpShiftTimeMarginInMins: 10,
          SettingShowAmountDueInInvoices: true,
          SettingIsAuditEnabled,
          SettingIsCalloutEnabled,
          SettingIsCommunicationCenterEnabled,
          SettingIsDocRepoEnabled,
          SettingIsEmergencyResponseEnabled,
          SettingIsEmpDarEnabled,
          SettingIsEquipmentManagementEnabled,
          SettingIsHRSystemEnabled,
          SettingIsKeyManagementEnabled,
          SettingIsPatrollingEnabled,
          SettingIsPaymentsAndBillingEnabled,
          SettingIsPerformanceAssuranceEnabled,
          SettingIsReportsEnabled,
          SettingIsTaskAssignmentAndTrackingEnabled,
          SettingIsTimeAndAttendanceEnabled,
          SettingIsTrainingAndCertificationsEnabled,
          SettingIsVisitorManagementEnabled,
          SettingIsPatrolCompleteOptionEnabled,
        };

        transaction.set(settingRef, newSetting);

        this.generateDefaultReportCategories(transaction, companyId);
      });
    } catch (error) {
      console.log(error);
      if (user) {
        await deleteUser(user);
      }
      throw error;
    }
  };

  static updateCompany = async (
    data: CompanyCreateFormFields,
    cmpId: string
  ) => {
    if (!data.CompanyAdminDetails.AdminId || !data.SettingId || !cmpId) return;
    try {
      await runTransaction(db, async (transaction) => {
        const {
          CompanyName,
          CompanyEmail,
          CompanyPhone,
          CompanyAddress,
          CompanyAdminDetails,
        } = data;

        //*Update company
        const companyRef = doc(db, CollectionName.companies, cmpId);
        const updatedCompany: Partial<ICompaniesCollection> = {
          CompanyName,
          CompanyEmail,
          CompanyPhone: CompanyPhone,
          CompanyAddress,
          CompanyModifiedAt: serverTimestamp(),
        };

        transaction.update(companyRef, updatedCompany);

        //*update the admin
        const adminDocRef = doc(
          db,
          CollectionName.admins,
          CompanyAdminDetails.AdminId || ''
        );

        const newAdmin: Partial<IAdminsCollection> = {
          AdminName: CompanyAdminDetails.AdminName,
          AdminPhone: CompanyAdminDetails.AdminPhone,
          AdminModifiedAt: serverTimestamp(),
        };

        transaction.update(adminDocRef, newAdmin);

        //*Update settings;

        const {
          SettingIsAuditEnabled,
          SettingIsCalloutEnabled,
          SettingIsCommunicationCenterEnabled,
          SettingIsDocRepoEnabled,
          SettingIsEmergencyResponseEnabled,
          SettingIsEmpDarEnabled,
          SettingIsEquipmentManagementEnabled,
          SettingIsHRSystemEnabled,
          SettingIsKeyManagementEnabled,
          SettingIsPatrollingEnabled,
          SettingIsVisitorManagementEnabled,
          SettingIsTrainingAndCertificationsEnabled,
          SettingIsTimeAndAttendanceEnabled,
          SettingIsTaskAssignmentAndTrackingEnabled,
          SettingIsReportsEnabled,
          SettingIsPerformanceAssuranceEnabled,
          SettingIsPaymentsAndBillingEnabled,
          SettingId,
        } = data;

        const settingRef = doc(db, CollectionName.settings, SettingId || '');
        const newSetting: Partial<ISettingsCollection> = {
          SettingIsAuditEnabled,
          SettingIsCalloutEnabled,
          SettingIsCommunicationCenterEnabled,
          SettingIsDocRepoEnabled,
          SettingIsEmergencyResponseEnabled,
          SettingIsEmpDarEnabled,
          SettingIsEquipmentManagementEnabled,
          SettingIsHRSystemEnabled,
          SettingIsKeyManagementEnabled,
          SettingIsPatrollingEnabled,
          SettingIsPaymentsAndBillingEnabled,
          SettingIsPerformanceAssuranceEnabled,
          SettingIsReportsEnabled,
          SettingIsTaskAssignmentAndTrackingEnabled,
          SettingIsTimeAndAttendanceEnabled,
          SettingIsTrainingAndCertificationsEnabled,
          SettingIsVisitorManagementEnabled,
        };

        transaction.update(settingRef, newSetting);
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  };
}

export default DbSuperAdmin;
