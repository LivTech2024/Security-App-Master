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
import NoSearchResult from '../../../common/NoSearchResult';
import { useNavigate } from 'react-router-dom';
import { formatDate, toDate } from '../../../utilities/misc';
import TableShimmer from '../../../common/shimmer/TableShimmer';
import PageHeader from '../../../common/PageHeader';
import EmpDarListMenus from '../../../component/emp_dar/EmpDarListMenus';

const ClientEmpDarList = () => {
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState<Date | string | null>(
    dayjs().startOf('M').toDate()
  );

  const [endDate, setEndDate] = useState<Date | string | null>(
    dayjs().endOf('M').toDate()
  );

  const [isLifeTime, setIsLifeTime] = useState(false);

  const [selectedEmpId, setSelectedEmpId] = useState('');

  const { client } = useAuthState();

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
      REACT_QUERY_KEYS.EMP_DAR_LIST,
      client!.ClientId,
      isLifeTime,
      startDate,
      endDate,
      selectedEmpId,
      selectedLocation,
    ],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbClient.getClientEmpDar({
        lmt: DisplayCount.EMP_DAR_LIST,
        lastDoc: pageParam,
        clientId: client!.ClientId,
        isLifeTime,
        startDate,
        endDate,
        empId: selectedEmpId,
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

  function groupAndSortData(data: IEmployeeDARCollection[]) {
    // Group data by EmpDarShiftId
    const groupedData = data.reduce(
      (acc, item) => {
        const shiftId = item.EmpDarShiftId || item.EmpDarCalloutId;

        if (typeof shiftId === 'string' && shiftId.trim()) {
          if (!acc[shiftId]) {
            acc[shiftId] = [];
          }
          acc[shiftId].push(item);
        }

        return acc;
      },
      {} as { [key: string]: IEmployeeDARCollection[] }
    );

    const sortedItems: IEmployeeDARCollection[] = [];

    // Convert grouped data into an array and sort each group
    Object.values(groupedData).forEach((items) => {
      items.sort((a, b) => {
        const dateComparison =
          toDate(b.EmpDarDate).getTime() - toDate(a.EmpDarDate).getTime();

        const startedAtTimeComparison =
          toDate(b.EmpDarCreatedAt).getTime() -
          toDate(a.EmpDarCreatedAt).getTime();
        if (dateComparison !== 0) {
          return dateComparison; // Sort by EmpDarDate first
        }
        // If EmpDarDate is the same, sort by EmpDarCreatedAt
        return startedAtTimeComparison;
      });

      sortedItems.push(...items);
    });

    return sortedItems;
  }
  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <PageHeader title="Employees daily activity report" />
      <EmpDarListMenus
        endDate={endDate}
        isLifeTime={isLifeTime}
        setEndDate={setEndDate}
        setIsLifeTime={setIsLifeTime}
        setStartDate={setStartDate}
        startDate={startDate}
        selectedEmpId={selectedEmpId}
        setSelectedEmpId={setSelectedEmpId}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
      />

      <table className="rounded overflow-hidden w-full">
        <thead className="bg-primary text-surface text-sm">
          <tr>
            <th className="uppercase px-4 py-2 w-[30%] text-start">
              Employee Name
            </th>
            <th className="uppercase px-4 py-2 w-[15%] text-start">Date</th>
            <th className="uppercase px-4 py-2 w-[15%] text-start">
              Created At
            </th>
            <th className="uppercase px-4 py-2 w-[50%] text-end">Location</th>
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
            groupAndSortData(data).map((dar) => {
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
                  <td className="align-top px-4 py-2 text-start capitalize">
                    <span className="line-clamp-2">{dar.EmpDarEmpName}</span>
                  </td>

                  <td className="align-top px-4 py-2 text-start">
                    <span className="line-clamp-2">
                      {formatDate(dar.EmpDarDate)}
                    </span>
                  </td>
                  <td className="align-top px-4 py-2 text-start">
                    <span className="line-clamp-2">
                      {formatDate(dar.EmpDarCreatedAt, 'DD MMM-YY HH:mm')}
                    </span>
                  </td>
                  <td className="align-top px-4 py-2 text-end">
                    <span className="line-clamp-2">
                      {dar.EmpDarLocationName}
                    </span>
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
