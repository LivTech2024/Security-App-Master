import { useInfiniteQuery } from '@tanstack/react-query';
import {
  DisplayCount,
  MinimumQueryCharacter,
  PageRoutes,
  REACT_QUERY_KEYS,
} from '../../../@types/enum';
import { useAuthState } from '../../../store';
import { useDebouncedValue } from '@mantine/hooks';
import DbClient from '../../../firebase_configs/DB/DbClient';
import { DocumentData } from 'firebase/firestore';
import { IPatrolsCollection } from '../../../@types/database';
import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import PatrolListTable from '../../../component/patrolling/PatrolListTable';

const ClientPatrolsList = () => {
  const { client } = useAuthState();

  //const [query, setQuery] = useState("");

  const [debouncedQuery] = useDebouncedValue('', 200);

  const {
    data: snapshotData,
    fetchNextPage,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    isFetching,
    error,
  } = useInfiniteQuery({
    queryKey: [REACT_QUERY_KEYS.PATROL_LIST, debouncedQuery, client!.ClientId],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbClient.getClientPatrols({
        lmt: DisplayCount.PATROL_LIST,
        lastDoc: pageParam,
        searchQuery: debouncedQuery,
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
    enabled:
      debouncedQuery.trim().length > 0 &&
      debouncedQuery.trim().length < MinimumQueryCharacter.PATROL
        ? false
        : true,
  });

  const [data, setData] = useState<IPatrolsCollection[]>(() => {
    if (snapshotData) {
      return snapshotData.pages.flatMap((page) =>
        page.map((doc) => doc.data() as IPatrolsCollection)
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
      const docData: IPatrolsCollection[] = [];
      snapshotData.pages?.forEach((page) => {
        page?.forEach((doc) => {
          const data = doc.data() as IPatrolsCollection;
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
        <span className="font-semibold text-xl">Patrols</span>
      </div>

      <PatrolListTable
        data={data}
        isFetchingNextPage={isFetchingNextPage}
        isLoading={isLoading}
        redirectOnClick={PageRoutes.CLIENT_PORTAL_PATROL_VIEW}
        ref={ref}
      />
    </div>
  );
};

export default ClientPatrolsList;
