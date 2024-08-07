import { useEffect, useState } from 'react';
import { IClientsCollection, IMessagesCollection } from '../../@types/database';
import { DocumentData } from 'firebase/firestore';
import { DisplayCount, REACT_QUERY_KEYS } from '../../@types/enum';
import DbMessaging from '../../firebase_configs/DB/DbMessaging';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { formatDate, toDate } from '../../utilities/misc';
import NoSearchResult from '../../common/NoSearchResult';
import DbEmployee from '../../firebase_configs/DB/DbEmployee';
import DbClient from '../../firebase_configs/DB/DbClient';
import { FaRegTrashAlt } from 'react-icons/fa';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../utilities/TsxUtils';
import { openContextModal } from '@mantine/modals';
import { errorHandler } from '../../utilities/CustomError';
import { useAuthState } from '../../store';

export interface ISentMessagesCollection
  extends Omit<IMessagesCollection, 'MessageReceiversId'> {
  MessageReceiversId: { id: string; name: string }[];
}

interface SentMessageListProps {
  senderId: string;
  startDate: string | Date | null;
  endDate: string | Date | null;
  isLifeTime: boolean;
  selectedCreatorType?: 'employee' | 'client' | 'system';
}

const SentMessageList = ({
  senderId,
  endDate,
  isLifeTime,
  startDate,
  selectedCreatorType,
}: SentMessageListProps) => {
  const { client } = useAuthState();

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
      REACT_QUERY_KEYS.MESSAGE_SENT_LIST,
      senderId,
      endDate,
      isLifeTime,
      startDate,
      selectedCreatorType,
    ],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbMessaging.getSentMessages({
        lmt: DisplayCount.MESSAGE_SENT_LIST,
        lastDoc: pageParam,
        senderId: senderId,
        endDate,
        isLifeTime,
        startDate,
      });

      const docData: ISentMessagesCollection[] = [];

      await Promise.all(
        snapshot?.docs.map(async (doc) => {
          const data = doc.data() as IMessagesCollection;
          const { MessageReceiversId } = data;
          const newRecList: { id: string; name: string }[] = [];
          await Promise.all(
            MessageReceiversId.map(async (id) => {
              const emp = await DbEmployee.getEmpById(id);
              if (
                emp &&
                (!selectedCreatorType || selectedCreatorType === 'employee')
              ) {
                newRecList.push({ id, name: emp.EmployeeName });
              } else {
                const clientSnapshot = await DbClient.getClientById(id);
                const clientData = clientSnapshot?.data() as IClientsCollection;
                if (
                  clientData &&
                  (!selectedCreatorType || selectedCreatorType === 'client')
                ) {
                  newRecList.push({ id, name: clientData.ClientName });
                } else if (client && client.ClientId === senderId) {
                  newRecList.push({ id, name: 'Admin' });
                }
              }
            })
          );
          docData.push({ ...data, MessageReceiversId: newRecList });
        })
      );
      return {
        docs: snapshot.docs,
        docData: docData
          .filter((res) =>
            res.MessageReceiversId.some(
              (r) => r.name.length > 0 && r.id.length > 0
            )
          )
          .sort(
            (a, b) =>
              toDate(b.MessageCreatedAt).getTime() -
              toDate(a.MessageCreatedAt).getTime()
          ),
      };
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.docs?.length === 0) {
        return null;
      }
      if (lastPage.docs?.length === DisplayCount.MESSAGE_SENT_LIST) {
        return lastPage.docs.at(-1);
      }
      return null;
    },
    initialPageParam: null as null | DocumentData,
  });

  const fetchDataFromSnapshot = () => {
    if (snapshotData) {
      const docData: ISentMessagesCollection[] = [];
      snapshotData.pages?.forEach((page) => {
        page.docData?.forEach(async (data) => {
          docData.push(data);
        });
      });
      return docData;
    }

    return [];
  };

  const [data, setData] = useState<ISentMessagesCollection[]>(() =>
    fetchDataFromSnapshot()
  );

  useEffect(() => {
    console.log(error, 'error');
  }, [error]);

  // we are looping through the snapshot returned by react-query and converting them to data
  useEffect(() => {
    setData(fetchDataFromSnapshot());
  }, [snapshotData]);

  // hook for pagination
  const { ref, inView } = useInView();

  // this is for pagination
  useEffect(() => {
    if (inView && hasNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [fetchNextPage, inView, hasNextPage, isFetching]);

  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);

  const onMessageDelete = async (id: string) => {
    try {
      setLoading(true);

      await DbMessaging.deleteMessage(id);

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.MESSAGE_SENT_LIST],
      });

      showSnackbar({
        message: 'Message deleted successfully',
        type: 'success',
      });

      setLoading(false);
    } catch (error) {
      setLoading(false);
      errorHandler(error);
      console.log(error);
    }
  };

  useEffect(() => {
    if (loading) {
      showModalLoader({});
    } else {
      closeModalLoader();
    }
    return () => closeModalLoader();
  }, [loading]);

  return (
    <div className="bg-surface p-4 rounded shadow-md flex flex-col gap-6">
      <div className="font-semibold text-lg">Sent</div>
      {/* Received Messages list */}
      <div className="flex flex-col h-[calc(100vh-260px)] gap-4 overflow-auto remove-vertical-scrollbar">
        {data.length === 0 && !isLoading ? (
          <div className="flex items-center justify-between w-full">
            <NoSearchResult text="No sent messages" />
          </div>
        ) : (
          data.map((msg) => {
            return (
              <div
                key={msg.MessageId}
                className="flex flex-col bg-onHoverBg p-4 rounded w-full gap-2"
              >
                <div className="flex items-center justify-between w-full gap-4">
                  <div className="w-[80%]">
                    To:{' '}
                    <span className="font-semibold capitalize">
                      {msg.MessageReceiversId.map((rec) => rec.name).join(
                        ' , '
                      )}
                    </span>
                  </div>
                  <FaRegTrashAlt
                    onClick={() => {
                      openContextModal({
                        modal: 'confirmModal',
                        withCloseButton: false,
                        centered: true,
                        closeOnClickOutside: true,
                        innerProps: {
                          title: 'Confirm',
                          body: 'Are you sure to delete this message',
                          onConfirm: () => {
                            onMessageDelete(msg.MessageId);
                          },
                        },
                        size: '30%',
                        styles: {
                          body: { padding: '0px' },
                        },
                      });
                    }}
                    className="text-textPrimaryRed cursor-pointer text-lg"
                  />
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
            Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="animate-pulse w-full mt-2">
                <div className="h-[150px] bg-shimmerColor w-full"></div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default SentMessageList;
