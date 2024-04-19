import { useEffect, useState } from 'react';
import { useAuthState } from '../../store';
import {
  QueryConstraint,
  collection,
  limit,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../firebase_configs/config';
import { CollectionName } from '../../@types/enum';
import dayjs from 'dayjs';
import { IMessagesCollection } from '../../@types/database';

const useListenMessage = () => {
  const { company, admin, client } = useAuthState();

  const [message, setMessage] = useState<IMessagesCollection | null>(null);

  useEffect(() => {
    const messageRef = collection(db, CollectionName.messages);

    let queryParams: QueryConstraint[] = [
      where(
        'MessageCreatedAt',
        '>=',
        dayjs(new Date()).subtract(1, 'hour').toDate()
      ),
    ];

    if (company && admin) {
      queryParams = [
        ...queryParams,
        where('MessageReceiversId', 'array-contains', company.CompanyId),
      ];
    } else if (client) {
      queryParams = [
        ...queryParams,
        where('MessageReceiversId', 'array-contains', client.ClientId),
      ];
    }

    queryParams = [...queryParams, limit(1)];

    const messageQuery = query(messageRef, ...queryParams);

    const unsubscribe = onSnapshot(messageQuery, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot?.docs[0]?.data() as IMessagesCollection;
        setMessage(data);
      }
    });

    return () => unsubscribe();
  }, [admin, client, company]);

  return { message };
};

export default useListenMessage;
