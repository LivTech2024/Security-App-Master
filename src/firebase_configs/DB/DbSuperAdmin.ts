import {
  Transaction,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
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
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';

const emailId = 'sales@tpssolution.com';
const password = 'tpssolution';

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
          CompanyName: 'Tactical Protection Solutions Ltd.',
          CompanyEmail: emailId,
          CompanyPhone: '+1234567',
          CompanyAddress: 'Alberta, Canada',
          CompanyLogo: '',
          CompanyCreatedAt: serverTimestamp(),
          CompanyModifiedAt: serverTimestamp(),
        };

        transaction.set(companyRef, newCompany);

        //*create a new admin
        const adminDocRef = doc(db, CollectionName.admins, uid);
        const newAdmin: IAdminsCollection = {
          AdminId: uid,
          AdminName: 'Jhon Doe',
          AdminEmail: emailId,
          AdminPhone: '+1234567',
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
        const settingId = getNewDocId(CollectionName.settings);
        const settingRef = doc(db, CollectionName.settings, settingId);
        const newSetting: ISettingsCollection = {
          SettingId: settingId,
          SettingCompanyId: companyId,
          SettingEmpWellnessIntervalInMins: 60,
        };

        transaction.set(settingRef, newSetting);

        this.generateDefaultReportCategories(transaction, companyId);
      });
    } catch (error) {
      console.log(error);
      await deleteUser(user);
      throw error;
    }
  };
}

export default DbSuperAdmin;
