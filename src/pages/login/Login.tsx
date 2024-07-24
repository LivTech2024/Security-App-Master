import InputWithTopHeader from '../../common/inputs/InputWithTopHeader';
import Button from '../../common/button/Button';
import { useState } from 'react';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../utilities/TsxUtils';
import CustomError, { errorHandler } from '../../utilities/CustomError';
import {
  CollectionName,
  IUserType,
  LocalStorageKey,
  LocalStorageLoggedInUserData,
} from '../../@types/enum';
import { User, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { v4 } from 'uuid';
import * as storage from '../../utilities/Storage';
import { getNewDocId } from '../../firebase_configs/DB/utils';
import {
  IAdminsCollection,
  IClientsCollection,
  ICompaniesCollection,
  ILoggedInUsersCollection,
  ISuperAdminCollection,
} from '../../@types/database';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../firebase_configs/config';
import DbCompany from '../../firebase_configs/DB/DbCompany';
import { useAuthState } from '../../store';
import { firebaseDataToObject } from '../../utilities/misc';
import { Admin, Company } from '../../store/slice/auth.slice';
import DbSuperAdmin from '../../firebase_configs/DB/DbSuperAdmin';
import { FirebaseError } from 'firebase/app';
import DbClient from '../../firebase_configs/DB/DbClient';
import { Client } from '../../store/slice/editForm.slice';
import ForgotPasswordModal from '../../component/login/modal/ForgotPasswordModal';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const auth = getAuth();

  const { setAdmin, setCompany, setSuperAdmin, setClient } = useAuthState();

  const signInSuccess = async (dbUser: User) => {
    try {
      const uId = dbUser.uid;
      const randNum = Date.now();
      const randomChar = v4();
      const loggedInCrypt = randNum + randomChar + uId;

      const idTokenResult = await dbUser.getIdTokenResult();
      const claims = idTokenResult.claims;

      let userType = IUserType.ADMIN;

      if (claims.role === 'client') {
        userType = IUserType.CLIENT;
      } else if (claims.role === 'employee') {
        throw new CustomError('Invalid credentials');
      }

      //* Fetch auth user and store in zustand

      if (userType === IUserType.ADMIN) {
        const adminSnapshot = await DbCompany.getAdminById(uId);
        const superAdminSnapshot = await DbSuperAdmin.getSuperAdminById(uId);

        if (adminSnapshot.exists()) {
          const admin = adminSnapshot.data() as IAdminsCollection;
          const _admin = firebaseDataToObject(
            admin as unknown as Record<string, unknown>
          ) as unknown as Admin;
          setAdmin(_admin);

          //*Fetch company and store in zustand;
          const cmpSnapshot = await DbCompany.getCompanyById(
            admin.AdminCompanyId
          );
          const company = cmpSnapshot.data() as ICompaniesCollection;
          const _company = firebaseDataToObject(
            company as unknown as Record<string, unknown>
          ) as unknown as Company;
          setCompany(_company);
        } else if (superAdminSnapshot.exists()) {
          const superAdmin = superAdminSnapshot.data() as ISuperAdminCollection;
          setSuperAdmin(superAdmin);
          userType = IUserType.SUPER_ADMIN;
        }
      } else if (userType === IUserType.CLIENT) {
        const clientSnapshot = await DbClient.getClientById(uId);
        const client = clientSnapshot.data() as IClientsCollection;
        setClient(client as unknown as Client);
      }

      //* Create a new loggedInUser doc
      const loggedInId = getNewDocId(CollectionName.loggedInUsers);

      const newLoggedInDoc: ILoggedInUsersCollection = {
        LoggedInId: loggedInId,
        LoggedInUserId: uId,
        IsLoggedIn: true,
        LoggedInCreatedAt: serverTimestamp(),
        LoggedInCrypt: loggedInCrypt,
        LoggedInUserType: userType,
        LoggedInPlatform: 'web',
      };
      const loggedInDocRef = doc(db, CollectionName.loggedInUsers, loggedInId);

      await setDoc(loggedInDocRef, newLoggedInDoc);

      const lsLoggedInUser: LocalStorageLoggedInUserData = {
        LoggedInId: loggedInId,
        LoggedInCrypt: loggedInCrypt,
        LoggedInUserId: uId,
        LoggedInAuthUserType: userType as IUserType,
      };

      storage.setJson(LocalStorageKey.LOGGEDIN_USER, lsLoggedInUser);
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  const onLogin = async () => {
    const emailRegex = new RegExp(
      /^(^[\w%+.-]+@[\d.A-Za-z-]+\.[A-Za-z]{2,}$)?$/
    );
    if (!emailRegex.test(email)) {
      showSnackbar({ message: 'Please enter valid email', type: 'error' });
      return;
    }

    try {
      showModalLoader({});

      const dbUser = await signInWithEmailAndPassword(auth, email, password);

      await signInSuccess(dbUser.user);

      window.location.reload();
    } catch (error) {
      closeModalLoader();
      console.log(error);
      if (error instanceof FirebaseError) {
        showSnackbar({ message: 'Invalid credential', type: 'error' });
        return;
      }
      errorHandler(error);
    }
  };

  const [forgotPasswordModal, setForgotPasswordModal] = useState(false);

  return (
    <div className="flex flex-col justify-center items-center min-h-[100vh]">
      <div className="bg-surface rounded shadow border border-gray-300 flex flex-col p-6  w-full sm:max-w-[30%]">
        <div className="font-semibold text-lg">Login</div>
        <InputWithTopHeader
          className="mx-0 mt-6"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <InputWithTopHeader
          className="mx-0 mt-6"
          label="Password"
          inputType="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button
          label="Login"
          onClick={onLogin}
          disabled={!email || !password}
          type="blue"
          className="py-2 mt-6"
        />

        <div
          onClick={() => setForgotPasswordModal(true)}
          className="text-sm text-textPrimaryBlue mt-[4px] cursor-pointer font-medium"
        >
          Forgot password?
        </div>

        <ForgotPasswordModal
          opened={forgotPasswordModal}
          setOpened={setForgotPasswordModal}
        />
      </div>
    </div>
  );
};

export default Login;
