import { useNavigate } from 'react-router-dom';
import { useAuthState } from '../../store';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useInfiniteQuery } from '@tanstack/react-query';
import { DisplayCount, PageRoutes, REACT_QUERY_KEYS } from '../../@types/enum';
import DbShift from '../../firebase_configs/DB/DbShift';
import { DocumentData } from 'firebase/firestore';
import { IFLHACollection } from '../../@types/database';
import { useInView } from 'react-intersection-observer';
import PageHeader from '../../common/PageHeader';
import DateFilterDropdown from '../../common/dropdown/DateFilterDropdown';
import SelectLocation from '../../common/SelectLocation';
import NoSearchResult from '../../common/NoSearchResult';
import { formatDate } from '../../utilities/misc';
import TableShimmer from '../../common/shimmer/TableShimmer';

const FLHAList = () => {
  const navigate = useNavigate();

  const { company } = useAuthState();

  const [selectedLocation, setSelectedLocation] = useState('');

  const [startDate, setStartDate] = useState<Date | string | null>(
    dayjs().startOf('M').toDate()
  );

  const [endDate, setEndDate] = useState<Date | string | null>(
    dayjs().endOf('M').toDate()
  );

  const [isLifeTime, setIsLifeTime] = useState(false);

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
      REACT_QUERY_KEYS.FLHA_LIST,
      company!.CompanyId,
      selectedLocation,
      isLifeTime,
      startDate,
      endDate,
    ],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbShift.getFLHAs({
        lmt: DisplayCount.FLHA_LIST,
        lastDoc: pageParam,
        cmpId: company!.CompanyId,
        endDate,
        isLifeTime,
        startDate,
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

  const [data, setData] = useState<IFLHACollection[]>(() => {
    if (snapshotData) {
      return snapshotData.pages.flatMap((page) =>
        page.map((doc) => doc.data() as IFLHACollection)
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
      const docData: IFLHACollection[] = [];
      snapshotData.pages?.forEach((page) => {
        page?.forEach((doc) => {
          const data = doc.data() as IFLHACollection;
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
    <div className="flex flex-col gap-4 p-6">
      <PageHeader title="Field Level Hazard Assessments" />

      <div className="flex justify-between w-full p-4 rounded bg-surface shadow items-center">
        <DateFilterDropdown
          endDate={endDate}
          isLifetime={isLifeTime}
          setEndDate={setEndDate}
          setIsLifetime={setIsLifeTime}
          setStartDate={setStartDate}
          startDate={startDate}
        />
        <SelectLocation
          selectedLocation={selectedLocation}
          setSelectedLocation={setSelectedLocation}
        />
      </div>

      <table className="rounded overflow-hidden w-full">
        <thead className="bg-primary text-surface text-sm">
          <tr>
            <th className="uppercase px-4 py-2 w-[25%] text-start">Location</th>
            <th className="uppercase px-4 py-2 w-[25%] text-center">
              Employee
            </th>
            <th className="uppercase px-4 py-2 w-[20%] text-end">Shift Date</th>
            <th className="uppercase px-4 py-2 w-[15%] text-end">
              Shift Start Time
            </th>

            <th className="uppercase px-4 py-2 w-[15%] text-end">
              Shift End Time
            </th>
          </tr>
        </thead>
        <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
          {data.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={5}>
                <NoSearchResult />
              </td>
            </tr>
          ) : (
            data.map((flha) => {
              return (
                <tr
                  onClick={() =>
                    navigate(PageRoutes.FLHA_VIEW + `?id=${flha.FLHAID}`)
                  }
                  key={flha.FLHAID}
                  className="cursor-pointer "
                >
                  <td className="px-4 py-2 align-top text-start">
                    {flha.FLHALocationName}
                  </td>
                  <td className="px-4 py-2 align-top text-center">
                    <span className="line-clamp-3">
                      {flha.FLHAEmployeeName}
                    </span>
                  </td>
                  <td className="px-4 py-2 align-top text-end">
                    {formatDate(flha.FLHADate, 'DD MMM-YY')}
                  </td>
                  <td className="px-4 py-2 align-top text-end">
                    <span className="line-clamp-3">
                      {flha.FLHAShiftStartTime}
                    </span>
                  </td>
                  <td className="px-4 py-2 align-top text-end">
                    <span className="line-clamp-3">
                      {flha.FLHAShiftEndTime}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
          <tr ref={ref}>
            <td colSpan={5}>
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

export default FLHAList;
