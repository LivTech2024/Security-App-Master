import { useEffect } from "react";
import * as storage from "../utilities/Storage";
import {
  LocalStorageKey,
  LocalStorageLoggedInUserData,
  PageRoutes,
} from "../@types/enum";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase_configs/config";
import DbCompany from "../firebase_configs/DB/DbCompany";
import { firebaseDataToObject } from "../utilities/misc";
import {
  IAdminsCollection,
  ICompaniesCollection,
  ICompanyBranchesCollection,
  IEmployeeRolesCollection,
  ILoggedInUsersCollection,
} from "../@types/database";
import { useAuthState } from "../store";
import {
  Admin,
  Company,
  CompanyBranches,
  EmployeeRoles,
} from "../store/slice/auth.slice";
import { useNavigate } from "react-router-dom";
import DbEmployee from "../firebase_configs/DB/DbEmployee";

const useOnAuthStateChanged = () => {
  const { setAdmin, setCompany, setLoading, setEmpRoles, setCompanyBranches } =
    useAuthState();

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (userAuth) => {
      try {
        setLoading(true);
        if (!userAuth) {
          console.log("userAuth not found -> signing out");
          setLoading(false);
          return;
        }
        const loggedInUser = storage.getJson<LocalStorageLoggedInUserData>(
          LocalStorageKey.LOGGEDIN_USER
        );
        if (!loggedInUser) {
          setLoading(false);
          return;
        }

        const { LoggedInId, LoggedInCrypt } = loggedInUser;

        if (!LoggedInId || !LoggedInCrypt) {
          console.log("LoggedInId, LoggedInCrypt not found -> signing out");
          setLoading(false);
          return;
        }

        // query loggedin user
        const loggedInUserDoc = await DbCompany.getUserLoggedInData(
          userAuth.uid,
          LoggedInId,
          LoggedInCrypt,
          true
        );

        if (!loggedInUserDoc || loggedInUserDoc.docs.length === 0) {
          console.log("loggedInUserDoc not found -> signing out");
          setLoading(false);
          return;
        }

        const loggedInUserData = loggedInUserDoc.docs[0].data();

        const _loggedInUser = firebaseDataToObject(
          loggedInUserData
        ) as unknown as ILoggedInUsersCollection;

        //* Fetch admin and store in zustand
        const adminSnapshot = await DbCompany.getAdminById(
          _loggedInUser.LoggedInUserId
        );
        const admin = adminSnapshot.data() as IAdminsCollection;
        const _admin = firebaseDataToObject(
          admin as unknown as Record<string, unknown>
        ) as unknown as Admin;
        setAdmin(_admin);

        if (_admin.AdminCompanyId) {
          //*Fetch company and store in zustand;
          const cmpSnapshot = await DbCompany.getCompanyById(
            _admin.AdminCompanyId
          );
          const company = cmpSnapshot.data() as ICompaniesCollection;
          const _company = firebaseDataToObject(
            company as unknown as Record<string, unknown>
          ) as unknown as Company;
          setCompany(_company);

          //*Fetch employee roles
          const empRolesSnapshot = await DbEmployee.getEmpRoles({
            cmpId: _admin.AdminCompanyId,
          });
          const empRoles = empRolesSnapshot.docs.map(
            (doc) => doc.data() as IEmployeeRolesCollection
          );

          setEmpRoles(empRoles as unknown as EmployeeRoles[]);

          //*Fetch company branches
          const cmpBranchSnapshot = await DbCompany.getCompanyBranches(
            admin.AdminCompanyId
          );
          const cmpBranches = cmpBranchSnapshot.docs.map(
            (doc) => doc.data() as ICompanyBranchesCollection
          );

          setCompanyBranches(cmpBranches as unknown as CompanyBranches[]);
        }

        setLoading(false);
        navigate(PageRoutes.HOME);
      } catch (error) {
        setLoading(false);
        console.log(error);
      }
    });

    return () => unsubscribe();
  }, []);
};

export default useOnAuthStateChanged;
