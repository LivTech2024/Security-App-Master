import InputWithTopHeader from "../../common/inputs/InputWithTopHeader";
import Button from "../../common/button/Button";
import { useState } from "react";
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from "../../utilities/TsxUtils";
import { errorHandler } from "../../utilities/CustomError";
import { useNavigate } from "react-router-dom";
import {
  CollectionName,
  LocalStorageKey,
  LocalStorageLoggedInUserData,
  PageRoutes,
} from "../../@types/enum";
import { User, getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { v4 } from "uuid";
import * as storage from "../../utilities/Storage";
import { getNewDocId } from "../../firebase_configs/DB/utils";
import {
  IAdminsCollection,
  ICompaniesCollection,
  ILoggedInUsersCollection,
} from "../../@types/database";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../firebase_configs/config";
import DbCompany from "../../firebase_configs/DB/DbCompany";
import { useAuthState } from "../../store";
import { firebaseDataToObject } from "../../utilities/misc";
import { Admin, Company } from "../../store/slice/auth.slice";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const auth = getAuth();

  const { setAdmin, setCompany } = useAuthState();

  const signInSuccess = async (dbUser: User) => {
    try {
      const uId = dbUser.uid;
      const randNum = Date.now();
      const randomChar = v4();
      const loggedInCrypt = randNum + randomChar + uId;

      //* Create a new loggedInUser doc
      const loggedInId = getNewDocId(CollectionName.loggedInUsers);
      const newLoggedInDoc: ILoggedInUsersCollection = {
        LoggedInId: loggedInId,
        LoggedInUserId: uId,
        IsLoggedIn: true,
        LoggedInCreatedAt: serverTimestamp(),
        LoggedInCrypt: loggedInCrypt,
        LoggedInUserType: "admin",
      };
      const loggedInDocRef = doc(db, CollectionName.loggedInUsers, loggedInId);

      await setDoc(loggedInDocRef, newLoggedInDoc);

      const lsLoggedInUser: LocalStorageLoggedInUserData = {
        LoggedInId: loggedInId,
        LoggedInCrypt: loggedInCrypt,
        LoggedInAuthUserType: "admin",
      };

      //* Fetch admin and store in zustand
      const adminSnapshot = await DbCompany.getAdminById(uId);
      const admin = adminSnapshot.data() as IAdminsCollection;
      const _admin = firebaseDataToObject(
        admin as unknown as Record<string, unknown>
      ) as unknown as Admin;
      setAdmin(_admin);

      //*Fetch company and store in zustand;
      const cmpSnapshot = await DbCompany.getCompanyById(admin.AdminCompanyId);
      const company = cmpSnapshot.data() as ICompaniesCollection;
      const _company = firebaseDataToObject(
        company as unknown as Record<string, unknown>
      ) as unknown as Company;
      setCompany(_company);

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
      showSnackbar({ message: "Please enter valid email", type: "error" });
      return;
    }

    try {
      showModalLoader({});

      const dbUser = await signInWithEmailAndPassword(auth, email, password);

      await signInSuccess(dbUser.user);

      showSnackbar({ message: "Login successful", type: "success" });
      navigate(PageRoutes.HOME);
      closeModalLoader();
    } catch (error) {
      closeModalLoader();
      errorHandler(error);
      console.log(error);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-[100vh]">
      <div className="bg-surface rounded shadow border border-gray-300 flex flex-col p-6 min-w-[30%]">
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

        <div className="text-sm text-textPrimaryBlue mt-[4px] cursor-pointer font-medium">
          Forgot password?
        </div>
      </div>
    </div>
  );
};

export default Login;
