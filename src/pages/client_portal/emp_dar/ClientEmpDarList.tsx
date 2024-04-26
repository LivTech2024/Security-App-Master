import { useDebouncedValue } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import { useAuthState } from '../../../store';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  DisplayCount,
  PageRoutes,
  REACT_QUERY_KEYS,
} from '../../../@types/enum';
import { DocumentData } from 'firebase/firestore';
import { IEmployeeDARCollection } from '../../../@types/database';
import DbClient from '../../../firebase_configs/DB/DbClient';
import dayjs from 'dayjs';
import { useInView } from 'react-intersection-observer';
import SearchBar from '../../../common/inputs/SearchBar';
import DateFilterDropdown from '../../../common/dropdown/DateFilterDropdown';
import NoSearchResult from '../../../common/NoSearchResult';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../../utilities/misc';
import TableShimmer from '../../../common/shimmer/TableShimmer';

const ClientEmpDarList = () => {
  const navigate = useNavigate();

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
      REACT_QUERY_KEYS.EMP_DAR_LIST,
      client!.ClientId,
      isLifeTime,
      startDate,
      endDate,
      debouncedQuery,
    ],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbClient.getClientEmpDar({
        lmt: DisplayCount.EMP_DAR_LIST,
        lastDoc: pageParam,
        clientId: client!.ClientId,
        isLifeTime,
        startDate,
        endDate,
        searchQuery: debouncedQuery,
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

  const [data, setData] = useState<IEmployeeDARCollection[]>(() => {
    if (snapshotData) {
      return snapshotData.pages.flatMap((page) =>
        page.map((doc) => doc.data() as IEmployeeDARCollection)
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
      const docData: IEmployeeDARCollection[] = [];
      snapshotData.pages?.forEach((page) => {
        page?.forEach((doc) => {
          const data = doc.data() as IEmployeeDARCollection;
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
        <span className="font-semibold text-xl">Reports</span>
      </div>

      <div className="flex items-center justify-between w-full gap-4 p-4 rounded bg-surface shadow">
        <SearchBar
          value={query}
          setValue={setQuery}
          placeholder="Search report by name"
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

      <table className="rounded overflow-hidden w-full">
        <thead className="bg-primary text-surface text-sm">
          <tr>
            <th className="uppercase px-4 py-2 w-[15%] text-start">
              Report Title
            </th>
            <th className="uppercase px-4 py-2 w-[15%] text-start">
              Employee Name
            </th>
            <th className="uppercase px-4 py-2 w-[15%] text-start">Date</th>
            <th className="uppercase px-4 py-2 w-[55%] text-end">Data</th>
          </tr>
        </thead>
        <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
          {data.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={4}>
                <NoSearchResult />
              </td>
            </tr>
          ) : (
            data.map((dar) => {
              return (
                <tr
                  key={dar.EmpDarId}
                  className="cursor-pointer"
                  onClick={() =>
                    navigate(
                      PageRoutes.CLIENT_PORTAL_EMP_DAR_VIEW +
                        `?id=${dar.EmpDarId}`
                    )
                  }
                >
                  <td className="align-top px-4 py-2 text-start">
                    <span className="line-clamp-3">{dar.EmpDarTitle}</span>
                  </td>
                  <td className="align-top px-4 py-2 text-start uppercase">
                    {dar.EmpDarEmpName}
                  </td>

                  <td className="align-top px-4 py-2 text-start">
                    <span className="line-clamp-2">
                      {formatDate(dar.EmpDarDate)}
                    </span>
                  </td>
                  <td className="align-top px-4 py-2 text-end">
                    <span className="line-clamp-4">{dar.EmpDarData}</span>
                  </td>
                </tr>
              );
            })
          )}
          <tr ref={ref}>
            <td colSpan={4}>
              {(isLoading || isFetchingNextPage) &&
                Array.from({ length: 10 }).map((_, idx) => (
                  <TableShimmer key={idx} />
                ))}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ClientEmpDarList;
