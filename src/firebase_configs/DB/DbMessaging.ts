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
import { IMessagesCollection } from '../../@types/database';

class DbMessaging {
  static createMessage = ({
    cmpId,
    data,
    senderId,
    receiversId,
    senderName,
  }: {
    cmpId: string;
    data: string;
    senderId: string;
    senderName: string;
    receiversId: string[];
  }) => {
    const messageId = getNewDocId(CollectionName.messages);
    const messageRef = doc(db, CollectionName.messages, messageId);

    const newMessage: IMessagesCollection = {
      MessageId: messageId,
      MessageCompanyId: cmpId,
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
  }: {
    lmt?: number;
    lastDoc?: DocumentData | null;
    receiverId: string;
  }) => {
    const messageRef = collection(db, CollectionName.messages);
    let queryParams: QueryConstraint[] = [
      where('MessageReceiversId', 'array-contains', receiverId),
      orderBy('MessageCreatedAt', 'desc'),
    ];

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
  }: {
    lmt?: number;
    lastDoc?: DocumentData | null;
    senderId: string;
  }) => {
    const messageRef = collection(db, CollectionName.messages);
    let queryParams: QueryConstraint[] = [
      where('MessageCreatedById', '==', senderId),
      orderBy('MessageCreatedAt', 'desc'),
    ];

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
