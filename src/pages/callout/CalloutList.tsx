import { useEffect, useState } from 'react';
import PageHeader from '../../common/PageHeader';
import Button from '../../common/button/Button';
import CreateCalloutModal from '../../component/callout/modal/CreateCalloutModal';
import { useAuthState } from '../../store';
import dayjs from 'dayjs';
import { useInfiniteQuery } from '@tanstack/react-query';
import { DisplayCount, PageRoutes, REACT_QUERY_KEYS } from '../../@types/enum';
import DbShift from '../../firebase_configs/DB/DbShift';
import { DocumentData } from 'firebase/firestore';
import { ICalloutsCollection } from '../../@types/database';
import { useInView } from 'react-intersection-observer';
import DateFilterDropdown from '../../common/dropdown/DateFilterDropdown';
import SelectLocation from '../../common/SelectLocation';
import NoSearchResult from '../../common/NoSearchResult';
import { formatDate } from '../../utilities/misc';
import TableShimmer from '../../common/shimmer/TableShimmer';
import { numberFormatter } from '../../utilities/NumberFormater';
import { Status } from '../../common/Status';
import { useNavigate } from 'react-router-dom';

const CalloutList = () => {
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
      REACT_QUERY_KEYS.CALLOUT_LIST,
      company!.CompanyId,
      selectedLocation,
      isLifeTime,
      startDate,
      endDate,
    ],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbShift.getCallouts({
        lmt: DisplayCount.CALLOUT_LIST,
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

  const [data, setData] = useState<ICalloutsCollection[]>(() => {
    if (snapshotData) {
      return snapshotData.pages.flatMap((page) =>
        page.map((doc) => doc.data() as ICalloutsCollection)
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
      const docData: ICalloutsCollection[] = [];
      snapshotData.pages?.forEach((page) => {
        page?.forEach((doc) => {
          const data = doc.data() as ICalloutsCollection;
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

  //*Modal states
  const [createCalloutModal, setCreateCalloutModal] = useState(false);
  return (
    <div className="flex flex-col gap-4 p-6">
      <PageHeader
        title="Callouts"
        rightSection={
          <Button
            label="Create Callout"
            type="black"
            onClick={() => {
              setCreateCalloutModal(true);
            }}
          />
        }
      />
      <CreateCalloutModal
        opened={createCalloutModal}
        setOpened={setCreateCalloutModal}
      />

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
            <th className="uppercase px-4 py-2 w-[15%] text-start">Location</th>
            <th className="uppercase px-4 py-2 w-[30%] text-start">Address</th>
            <th className="uppercase px-4 py-2 w-[15%] text-start">Time</th>
            <th className="uppercase px-4 py-2 w-[15%] text-center">
              No. of Employees
            </th>

            <th className="uppercase px-4 py-2 w-[25%] text-end">Status</th>
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
            data.map((callout) => {
              return (
                <tr
                  onClick={() =>
                    navigate(
                      PageRoutes.CALL_OUT_VIEW + `?id=${callout.CalloutId}`
                    )
                  }
                  key={callout.CalloutId}
                  className="cursor-pointer "
                >
                  <td className="px-4 py-2 align-top text-start">
                    {callout.CalloutLocationName}
                  </td>
                  <td className="px-4 py-2 align-top text-start">
                    <span className="line-clamp-3">
                      {callout.CalloutLocationAddress}
                    </span>
                  </td>
                  <td className="px-4 py-2 align-top text-start">
                    {formatDate(callout.CalloutDateTime, 'DD MMM-YY HH:mm')}
                  </td>
                  <td className="px-4 py-2 align-top text-center">
                    {numberFormatter(
                      callout.CalloutAssignedEmpsId.length,
                      false,
                      1
                    )}
                  </td>

                  <td className="px-4 py-2 align-top text-end capitalize flex justify-end">
                    <Status
                      status={
                        callout.CalloutStatus.length === 0
                          ? 'pending'
                          : callout.CalloutStatus[0].Status
                      }
                    />
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

export default CalloutList;
