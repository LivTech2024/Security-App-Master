import { useEffect } from 'react';
import { messaging } from '../firebase_configs/config';
import { getToken } from 'firebase/messaging';
import * as storage from '../utilities/Storage';
import { LocalStorageKey, LocalStorageLoggedInUserData } from '../@types/enum';
import DbUser from '../firebase_configs/DB/DbUser';
import { useAuthState } from '../store';

const useFirebaseMessaging = () => {
  const loggedInUser = storage.getJson<LocalStorageLoggedInUserData>(
    LocalStorageKey.LOGGEDIN_USER
  );

  const { company } = useAuthState();

  useEffect(() => {
    if (!loggedInUser || !company) return;
    const saveTokenToDB = (token: string) => {
      console.log(`Saving token to db: ${token}`);
      if (token && typeof token === 'string') {
        storage.set(LocalStorageKey.FCM_TOKEN, token);
        console.log(`Updating logged in User: ${loggedInUser.LoggedInId},  `);
        DbUser.updateLoggedInUserNotificationToken(
          loggedInUser.LoggedInId,
          token,
          company.CompanyId
        ).catch((err) => {
          console.log(err, 'Error while updating firebase fcm token');
        });
      }
    };

    if ('Notification' in window) {
      Notification.requestPermission().then(async (permission) => {
        if (permission === 'granted') {
          getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID,
          }).then((currentToken) => {
            if (currentToken) {
              saveTokenToDB(currentToken);
            } else {
              console.log(
                'No registration token available. Request permission to generate one.'
              );
            }
          });
        } else {
          console.log('Permission not granted');
        }
      });
    }
  }, [loggedInUser]);
};

export default useFirebaseMessaging;
