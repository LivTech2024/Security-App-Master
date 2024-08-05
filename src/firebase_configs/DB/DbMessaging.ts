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
  serverTimestamp,
  setDoc,
  startAfter,
  where,
} from 'firebase/firestore';
import { db } from '../config';
import { CollectionName } from '../../@types/enum';
import { getNewDocId } from './utils';
import { IAdminsCollection, IMessagesCollection } from '../../@types/database';

class DbMessaging {
  static createMessage = async ({
    cmpId,
    data,
    senderId,
    receiversId,
    senderName,
    senderType,
  }: {
    cmpId: string;
    data: string;
    senderId: string;
    senderName: string;
    receiversId: string[];
    senderType: 'client' | 'admin';
  }) => {
    const messageId = getNewDocId(CollectionName.messages);
    const messageRef = doc(db, CollectionName.messages, messageId);

    if (receiversId.includes(cmpId)) {
      const adminsRef = collection(db, CollectionName.admins);
      const adminsQuery = query(
        adminsRef,
        where('AdminCompanyId', '==', cmpId)
      );
      const adminsSnapshot = await getDocs(adminsQuery);
      const adminsId: string[] = [];
      adminsSnapshot.forEach((doc) => {
        const data = doc.data() as IAdminsCollection;
        const { AdminId } = data;
        if (!adminsId.includes(AdminId)) {
          adminsId.push(AdminId);
        }

        receiversId = receiversId.filter((id) => id !== cmpId).concat(adminsId);
      });
    }

    const newMessage: IMessagesCollection = {
      MessageId: messageId,
      MessageCompanyId: cmpId,
      MessageType: 'message',
      MessageCreatorType: senderType,
      MessageData: data,
      MessageCreatedById: senderId,
      MessageCreatedByName: senderName,
      MessageReceiversId: receiversId,
      MessageCreatedAt: serverTimestamp(),
    };

    return setDoc(messageRef, newMessage);
  };

  static deleteMessage = (messageId: string) => {
    const messageRef = doc(db, CollectionName.messages, messageId);

    return deleteDoc(messageRef);
  };

  static getReceivedMessages = ({
    receiverId,
    lastDoc,
    lmt,
    endDate,
    isLifeTime,
    startDate,
  }: {
    lmt?: number;
    lastDoc?: DocumentData | null;
    receiverId: string;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    isLifeTime?: boolean;
  }) => {
    const messageRef = collection(db, CollectionName.messages);
    let queryParams: QueryConstraint[] = [
      where('MessageReceiversId', 'array-contains', receiverId),
      orderBy('MessageCreatedAt', 'desc'),
    ];

    if (!isLifeTime) {
      queryParams = [
        ...queryParams,
        where('MessageCreatedAt', '>=', startDate),
        where('MessageCreatedAt', '<=', endDate),
      ];
    }

    if (lastDoc) {
      queryParams = [...queryParams, startAfter(lastDoc)];
    }

    if (lmt) {
      queryParams = [...queryParams, limit(lmt)];
    }

    const messageQuery = query(messageRef, ...queryParams);

    return getDocs(messageQuery);
  };

  static getSentMessages = ({
    senderId,
    lastDoc,
    lmt,
    endDate,
    isLifeTime,
    startDate,
  }: {
    lmt?: number;
    lastDoc?: DocumentData | null;
    senderId: string;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    isLifeTime?: boolean;
  }) => {
    const messageRef = collection(db, CollectionName.messages);
    let queryParams: QueryConstraint[] = [
      where('MessageCreatedById', '==', senderId),
      orderBy('MessageCreatedAt', 'desc'),
    ];

    if (!isLifeTime) {
      queryParams = [
        ...queryParams,
        where('MessageCreatedAt', '>=', startDate),
        where('MessageCreatedAt', '<=', endDate),
      ];
    }

    if (lastDoc) {
      queryParams = [...queryParams, startAfter(lastDoc)];
    }

    if (lmt) {
      queryParams = [...queryParams, limit(lmt)];
    }

    const messageQuery = query(messageRef, ...queryParams);

    return getDocs(messageQuery);
  };
}

export default DbMessaging;
