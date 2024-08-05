import { useEffect, useState } from 'react';
import { IMessagesCollection } from '../../@types/database';
import { DocumentData } from 'firebase/firestore';
import { DisplayCount, REACT_QUERY_KEYS } from '../../@types/enum';
import DbMessaging from '../../firebase_configs/DB/DbMessaging';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { formatDate } from '../../utilities/misc';
import NoSearchResult from '../../common/NoSearchResult';

interface ReceivedMessageListProps {
  receiverId: string;
  startDate: string | Date | null;
  endDate: string | Date | null;
  isLifeTime: boolean;
}

const ReceivedMessageList = ({
  receiverId,
  endDate,
  isLifeTime,
  startDate,
}: ReceivedMessageListProps) => {
  const {
    data: snapshotData,
    fetchNextPage,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    isFetching,
    error,
  } = useInfiniteQuery({
    queryKey: [
      REACT_QUERY_KEYS.MESSAGE_RECEIVED_LIST,
      receiverId,
      endDate,
      isLifeTime,
      startDate,
    ],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbMessaging.getReceivedMessages({
        lmt: DisplayCount.MESSAGE_RECEIVED_LIST,
        lastDoc: pageParam,
        receiverId: receiverId,
        endDate,
        isLifeTime,
        startDate,
      });
      return snapshot.docs;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage?.length === 0) {
        return null;
      }
      if (lastPage?.length === DisplayCount.MESSAGE_RECEIVED_LIST) {
        return lastPage.at(-1);
      }
      return null;
    },
    initialPageParam: null as null | DocumentData,
  });

  const [data, setData] = useState<IMessagesCollection[]>(() => {
    if (snapshotData) {
      return snapshotData.pages.flatMap((page) =>
        page.map((doc) => doc.data() as IMessagesCollection)
      );
    }
    return [];
  });

  useEffect(() => {
    console.log(error, 'error');
  }, [error]);

  // we are looping through the snapshot returned by react-query and converting them to data
  useEffect(() => {
    if (snapshotData) {
      const docData: IMessagesCollection[] = [];
      snapshotData.pages?.forEach((page) => {
        page?.forEach((doc) => {
          const data = doc.data() as IMessagesCollection;
          docData.push(data);
        });
      });
      setData(docData);
    }
  }, [snapshotData]);

  // hook for pagination
  const { ref, inView } = useInView();

  // this is for pagination
  useEffect(() => {
    if (inView && hasNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [fetchNextPage, inView, hasNextPage, isFetching]);
  return (
    <div className="bg-surface p-4 rounded shadow-md flex flex-col gap-6">
      <div className="font-semibold text-lg">Received</div>
      {/* Received Messages list */}
      <div className="flex flex-col h-[calc(100vh-260px)] gap-4 overflow-auto remove-vertical-scrollbar">
        {data.length === 0 && !isLoading ? (
          <div className="flex items-center justify-between w-full">
            <NoSearchResult text="No received messages" />
          </div>
        ) : (
          data.map((msg) => {
            return (
              <div
                key={msg.MessageId}
                className="flex flex-col bg-onHoverBg p-4 rounded w-full gap-2"
              >
                <div>
                  From:{' '}
                  <span className="font-semibold">
                    {msg.MessageCreatedByName}
                  </span>
                </div>

                <span>{msg.MessageData}</span>
                <span className="text-sm mt-2 font-medium">
                  {formatDate(msg.MessageCreatedAt, 'HH:mm - DD MMM')}
                </span>
              </div>
            );
          })
        )}

        <div ref={ref}>
          <div>&nbsp;</div>
          {(isLoading || isFetchingNextPage) &&
            Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="animate-pulse w-full mt-2">
                <div className="h-[150px] bg-shimmerColor w-full"></div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ReceivedMessageList;
