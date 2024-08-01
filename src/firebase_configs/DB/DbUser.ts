import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { CollectionName } from '../../@types/enum';
import { db } from '../config';
import { getNewDocId } from './utils';
import { IUserDataDeletionRequestsCollection } from '../../@types/database';
import CustomError from '../../utilities/CustomError';

class DbUser {
  static updateLoggedInUserNotificationToken = async (
    loggedInId: string,
    token: string,
    cmpId: string
  ) => {
    const loggedInRef = doc(db, CollectionName.loggedInUsers, loggedInId);
    return updateDoc(loggedInRef, {
      LoggedInNotifyFcmToken: token,
      LoggedInCompanyId: cmpId,
    });
  };

  static createDataDeletionRequest = async (
    email: string,
    password: string
  ) => {
    //*First check if any request exist with this email id
    const requestRef = collection(db, CollectionName.userDataDeletionRequests);
    const requestQuery = query(
      requestRef,
      where('RequestUserEmail', '==', email),
      limit(1)
    );
    const requestSnapshot = await getDocs(requestQuery);

    if (!requestSnapshot.empty) {
      throw new CustomError('A request already exist with this email id');
    }

    const docId = getNewDocId(CollectionName.userDataDeletionRequests);
    const docRef = doc(db, CollectionName.userDataDeletionRequests, docId);

    const newRequest: IUserDataDeletionRequestsCollection = {
      RequestId: docId,
      RequestUserEmail: email,
      RequestUserPassword: password,
      RequestStatus: 'pending',
      RequestCreatedAt: serverTimestamp(),
    };

    return setDoc(docRef, newRequest);
  };
}

export default DbUser;
