import { useInfiniteQuery } from '@tanstack/react-query';
import {
  DisplayCount,
  PageRoutes,
  REACT_QUERY_KEYS,
} from '../../../@types/enum';
import DbClient from '../../../firebase_configs/DB/DbClient';
import { useAuthState } from '../../../store';
import { DocumentData } from 'firebase/firestore';
import { IShiftsCollection } from '../../../@types/database';
import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import ShiftListTable from '../../../component/shifts/ShiftListTable';

const ClientShifts = () => {
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
    queryKey: [REACT_QUERY_KEYS.SHIFT_LIST, client!.ClientId],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbClient.getClientShifts({
        lmt: DisplayCount.SHIFT_LIST,
        lastDoc: pageParam,
        clientId: client!.ClientId,
      });
      return snapshot.docs;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage?.length === 0) {
        return null;
      }
      if (lastPage?.length === DisplayCount.EMPLOYEE_LIST) {
        return lastPage.at(-1);
      }
      return null;
    },
    initialPageParam: null as null | DocumentData,
  });

  const [data, setData] = useState<IShiftsCollection[]>(() => {
    if (snapshotData) {
      return snapshotData.pages.flatMap((page) =>
        page.map((doc) => doc.data() as IShiftsCollection)
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
      const docData: IShiftsCollection[] = [];
      snapshotData.pages?.forEach((page) => {
        page?.forEach((doc) => {
          const data = doc.data() as IShiftsCollection;
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
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <div className="flex justify-between w-full p-4 rounded bg-primaryGold text-surface items-center">
        <span className="font-semibold text-xl">Shifts</span>
      </div>

      <ShiftListTable
        data={data}
        isFetchingNextPage={isFetchingNextPage}
        isLoading={isLoading}
        redirectOnClick={PageRoutes.CLIENT_PORTAL_SHIFT_VIEW}
        ref={ref}
      />
    </div>
  );
};

export default ClientShifts;
