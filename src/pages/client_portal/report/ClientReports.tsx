import { useInfiniteQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import {
  DisplayCount,
  PageRoutes,
  REACT_QUERY_KEYS,
} from '../../../@types/enum';
import DbClient from '../../../firebase_configs/DB/DbClient';
import { useAuthState } from '../../../store';
import { DocumentData } from 'firebase/firestore';
import { IReportsCollection } from '../../../@types/database';
import { useInView } from 'react-intersection-observer';
import ReportListTable from '../../../component/report/ReportListTable';
import DateFilterDropdown from '../../../common/dropdown/DateFilterDropdown';
import SearchBar from '../../../common/inputs/SearchBar';
import { useDebouncedValue } from '@mantine/hooks';
import PageHeader from '../../../common/PageHeader';
import SelectLocation from '../../../common/SelectLocation';

const ClientReports = () => {
  const [startDate, setStartDate] = useState<Date | string | null>(
    dayjs().startOf('M').toDate()
  );

  const [endDate, setEndDate] = useState<Date | string | null>(
    dayjs().endOf('M').toDate()
  );

  const [isLifeTime, setIsLifeTime] = useState(false);

  const { client } = useAuthState();

  const [query, setQuery] = useState('');

  const [debouncedQuery] = useDebouncedValue(query, 200);

  const [selectedLocation, setSelectedLocation] = useState('');

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
      REACT_QUERY_KEYS.REPORT_LIST,
      client!.ClientId,
      isLifeTime,
      startDate,
      endDate,
      debouncedQuery,
      selectedLocation,
    ],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbClient.getClientReports({
        lmt: DisplayCount.REPORT_LIST,
        lastDoc: pageParam,
        clientId: client!.ClientId,
        isLifeTime,
        startDate,
        endDate,
        searchQuery: debouncedQuery,
        locationId: selectedLocation,
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

  const [data, setData] = useState<IReportsCollection[]>(() => {
    if (snapshotData) {
      return snapshotData.pages.flatMap((page) =>
        page.map((doc) => doc.data() as IReportsCollection)
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
      const docData: IReportsCollection[] = [];
      snapshotData.pages?.forEach((page) => {
        page?.forEach((doc) => {
          const data = doc.data() as IReportsCollection;
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
      <PageHeader title="Reports" />

      <div className="flex items-center justify-between w-full gap-4 p-4 rounded bg-surface shadow">
        <SearchBar
          value={query}
          setValue={setQuery}
          placeholder="Search report by name"
        />

        <div className="flex gap-4 items-center w-full justify-end">
          <SelectLocation
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
          />
          <DateFilterDropdown
            endDate={endDate}
            isLifetime={isLifeTime}
            setEndDate={setEndDate}
            setIsLifetime={setIsLifeTime}
            setStartDate={setStartDate}
            startDate={startDate}
          />
        </div>
      </div>

      <ReportListTable
        data={data}
        isFetchingNextPage={isFetchingNextPage}
        isLoading={isLoading}
        redirectOnClick={PageRoutes.CLIENT_PORTAL_REPORT_VIEW}
        ref={ref}
      />
    </div>
  );
};

export default ClientReports;
