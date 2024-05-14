import { doc, updateDoc } from 'firebase/firestore';
import { CollectionName } from '../../@types/enum';
import { db } from '../config';

class DbUser {
  static updateLoggedInUserNotificationToken = async (
    loggedInId: string,
    token: string
  ) => {
    const loggedInRef = doc(db, CollectionName.loggedInUsers, loggedInId);
    return updateDoc(loggedInRef, { LoggedInNotifyFcmToken: token });
  };
}

export default DbUser;
