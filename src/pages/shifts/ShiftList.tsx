import { useState, useEffect } from 'react';
import { DisplayCount, PageRoutes, REACT_QUERY_KEYS } from '../../@types/enum';
import DbShift from '../../firebase_configs/DB/DbShift';
import { useInfiniteQuery } from '@tanstack/react-query';
import { DocumentData } from 'firebase/firestore';
import { IShiftsCollection } from '../../@types/database';
import { useInView } from 'react-intersection-observer';
import { useAuthState, useEditFormStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import ShiftListTable from '../../component/shifts/ShiftListTable';
import PageHeader from '../../common/PageHeader';
import Button from '../../common/button/Button';
import DateFilterDropdown from '../../common/dropdown/DateFilterDropdown';
import SelectLocation from '../../common/SelectLocation';
import dayjs from 'dayjs';

const ShiftList = () => {
  const { setShiftEditData } = useEditFormStore();

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
      REACT_QUERY_KEYS.SHIFT_LIST,
      company!.CompanyId,
      selectedLocation,
      isLifeTime,
      startDate,
      endDate,
    ],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbShift.getShifts({
        lmt: DisplayCount.SHIFT_LIST,
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

  const navigate = useNavigate();

  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <PageHeader
        title="Shifts"
        rightSection={
          <Button
            label="Create Shift"
            type="black"
            onClick={() => {
              setShiftEditData(null);
              navigate(PageRoutes.SHIFT_CREATE_OR_EDIT);
            }}
          />
        }
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

      <ShiftListTable
        data={data}
        isFetchingNextPage={isFetchingNextPage}
        isLoading={isLoading}
        redirectOnClick={PageRoutes.SHIFT_VIEW}
        ref={ref}
      />
    </div>
  );
};

export default ShiftList;
