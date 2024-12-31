import { useNavigate } from 'react-router';
import {
  DisplayCount,
  MinimumQueryCharacter,
  PageRoutes,
  REACT_QUERY_KEYS,
} from '../../@types/enum';
import { useEffect, useState } from 'react';
import { useAuthState, useEditFormStore } from '../../store';
import { useDebouncedValue } from '@mantine/hooks';
import { useInfiniteQuery } from '@tanstack/react-query';
import DbPatrol from '../../firebase_configs/DB/DbPatrol';
import { DocumentData } from 'firebase/firestore';
import { IPatrolsCollection } from '../../@types/database';
import { useInView } from 'react-intersection-observer';
import PatrolListTable from '../../component/patrolling/PatrolListTable';
import PageHeader from '../../common/PageHeader';
import Button from '../../common/button/Button';
import SelectLocation from '../../common/SelectLocation';
import SelectBranch from '../../common/SelectBranch';

export const PatrolStatus = ({
  status,
}: {
  status: 'pending' | 'started' | 'completed';
}) => {
  return (
    <div className="flex justify-end">
      <div className="flex items-center gap-2">
        {status === 'pending' ? (
          <div className="w-[12px] h-[12px] rounded-full bg-primaryGold">
            &nbsp;
          </div>
        ) : status === 'started' ? (
          <div className="w-[12px] h-[12px] rounded-full bg-primaryRed">
            &nbsp;
          </div>
        ) : (
          <div className="w-[12px] h-[12px] rounded-full bg-primaryGreen">
            &nbsp;
          </div>
        )}
        <span className="capitalize font-medium">{status}</span>
      </div>
    </div>
  );
};

const PatrollingList = () => {
  const navigate = useNavigate();

  const { setPatrolEditData } = useEditFormStore();

  const { company } = useAuthState();

  //const [query, setQuery] = useState("");

  const [debouncedQuery] = useDebouncedValue('', 200);

  const [selectedLocation, setSelectedLocation] = useState('');

  const [selectedBranch, setSelectedBranch] = useState('');

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
      REACT_QUERY_KEYS.PATROL_LIST,
      debouncedQuery,
      company!.CompanyId,
      selectedLocation,
      selectedBranch,
    ],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbPatrol.getPatrols({
        lmt: DisplayCount.PATROL_LIST,
        lastDoc: pageParam,
        searchQuery: debouncedQuery,
        cmpId: company!.CompanyId,
        locationId: selectedLocation,
        branchId: selectedBranch,
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
      <PageHeader
        title="Patrolling"
        rightSection={
          <Button
            label="Create Patrolling"
            onClick={() => {
              setPatrolEditData(null);
              navigate(PageRoutes.PATROLLING_CREATE_OR_EDIT);
            }}
            type="black"
          />
        }
      />

      <div className="flex justify-between w-full p-4 rounded bg-surface shadow items-center">
        <SelectBranch
          selectedBranch={selectedBranch}
          setSelectedBranch={setSelectedBranch}
        />
        <SelectLocation
          selectedLocation={selectedLocation}
          setSelectedLocation={setSelectedLocation}
        />
      </div>

      <PatrolListTable
        data={data}
        isFetchingNextPage={isFetchingNextPage}
        isLoading={isLoading}
        redirectOnClick={PageRoutes.PATROLLING_LOGS}
        ref={ref}
      />
    </div>
  );
};

export default PatrollingList;
