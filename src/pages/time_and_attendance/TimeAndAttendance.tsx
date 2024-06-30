import { useEffect, useState } from 'react';
import PageHeader from '../../common/PageHeader';
import DateFilterDropdown from '../../common/dropdown/DateFilterDropdown';
import dayjs from 'dayjs';
import useFetchEmployees from '../../hooks/fetch/useFetchEmployees';
import InputSelect from '../../common/inputs/InputSelect';
import { useAuthState } from '../../store';
import { useInfiniteQuery } from '@tanstack/react-query';
import DbEmployee from '../../firebase_configs/DB/DbEmployee';
import { DisplayCount } from '../../@types/enum';
import { DocumentData, Timestamp } from 'firebase/firestore';
import { IShiftsCollection } from '../../@types/database';
import { useInView } from 'react-intersection-observer';
import TableShimmer from '../../common/shimmer/TableShimmer';
import NoSearchResult from '../../common/NoSearchResult';
import {
  formatDate,
  getHoursDiffInTwoTimeString,
  toDate,
} from '../../utilities/misc';

const TimeAndAttendance = () => {
  const [startDate, setStartDate] = useState<Date | string | null>(
    dayjs().startOf('M').toDate()
  );

  const [endDate, setEndDate] = useState<Date | string | null>(
    dayjs().endOf('M').toDate()
  );

  const [empSearchQuery, setEmpSearchQuery] = useState('');

  const { data: employees } = useFetchEmployees({
    limit: 5,
    searchQuery: empSearchQuery,
  });

  const { company } = useAuthState();

  const [selectedEmpId, setSelectedEmpId] = useState('');

  const {
    data: snapshotData,
    fetchNextPage,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    isFetching,
    error,
  } = useInfiniteQuery({
    queryKey: [company!.CompanyId, selectedEmpId, startDate, endDate],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbEmployee.getEmpShifts({
        lmt: DisplayCount.SHIFT_LIST,
        lastDoc: pageParam,
        companyId: company!.CompanyId,
        startDate,
        endDate,
        empId: selectedEmpId,
      });
      return snapshot.docs;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage?.length === 0) {
        return null;
      }
      if (lastPage?.length === DisplayCount.VISITOR_LIST) {
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

  const getHoursSpent = (startTime?: Timestamp, endTime?: Timestamp) => {
    if (!startTime || !endTime) return 'N/A';

    return getHoursDiffInTwoTimeString(
      dayjs(toDate(endTime)).format('HH:mm'),
      dayjs(toDate(startTime)).format('HH:mm')
    );
  };

  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <PageHeader title="Time & Attendance" />
      <div className="flex items-center justify-between w-full gap-4 p-4 rounded bg-surface shadow">
        <InputSelect
          value={selectedEmpId}
          onChange={(e) => setSelectedEmpId(e as string)}
          data={employees.map((emp) => {
            return { label: emp.EmployeeName, value: emp.EmployeeId };
          })}
          searchValue={empSearchQuery}
          onSearchChange={setEmpSearchQuery}
          searchable
          clearable
          placeholder="Select employee"
        />
        <DateFilterDropdown
          endDate={endDate}
          setEndDate={setEndDate}
          setStartDate={setStartDate}
          startDate={startDate}
        />
      </div>
      <table className="rounded overflow-hidden w-full">
        <thead className="bg-primary text-surface text-sm">
          <tr>
            <th className="uppercase px-4 py-2 w-[20%] text-start">
              Shift Name
            </th>
            <th className="uppercase px-4 py-2 w-[20%] text-start">Location</th>
            <th className="uppercase px-4 py-2 w-[15%] text-start">Date</th>
            <th className="uppercase px-4 py-2 w-[15%] text-start">In Time</th>
            <th className="uppercase px-4 py-2 w-[15%] text-start">Out Time</th>
            <th className="uppercase px-4 py-2 w-[15%] text-end">
              Total Hrs Spent
            </th>
          </tr>
        </thead>
        <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
          {(data.length === 0 || !selectedEmpId) && !isLoading ? (
            <tr>
              <td colSpan={6}>
                <NoSearchResult
                  text={
                    !selectedEmpId
                      ? 'Please select a employee to view his reports'
                      : 'No result found'
                  }
                />
              </td>
            </tr>
          ) : (
            data.map((shift) => {
              return (
                <tr key={shift.ShiftId} className="cursor-pointer">
                  <td className="align-top px-4 py-2 text-start">
                    <span className="line-clamp-3">{shift.ShiftName}</span>
                  </td>
                  <td className="align-top px-4 py-2 text-start">
                    <div className="line-clamp-2">
                      {shift.ShiftLocationName || 'N/A'}
                    </div>
                  </td>

                  <td className="align-top px-4 py-2 text-start">
                    <span className="line-clamp-2">
                      {formatDate(shift.ShiftDate)}
                    </span>
                  </td>
                  <td className="align-top px-4 py-2 text-start ">
                    <span className="line-clamp-2">
                      {shift.ShiftCurrentStatus.find(
                        (s) => s.StatusReportedById === selectedEmpId
                      )?.StatusStartedTime
                        ? formatDate(
                            shift.ShiftCurrentStatus.find(
                              (s) => s.StatusReportedById === selectedEmpId
                            )?.StatusStartedTime,
                            'DD MMM-YY HH:mm'
                          )
                        : 'N/A'}
                    </span>
                  </td>
                  <td className="align-top px-4 py-2 text-start ">
                    <span className="line-clamp-2">
                      {shift.ShiftCurrentStatus.find(
                        (s) => s.StatusReportedById === selectedEmpId
                      )?.StatusReportedTime
                        ? formatDate(
                            shift.ShiftCurrentStatus.find(
                              (s) => s.StatusReportedById === selectedEmpId
                            )?.StatusReportedTime,
                            'DD MMM-YY HH:mm'
                          )
                        : 'N/A'}
                    </span>
                  </td>
                  <td className="align-top px-4 py-2 text-end">
                    <span className="line-clamp-2">
                      {shift.ShiftCurrentStatus.find(
                        (s) => s.StatusReportedById === selectedEmpId
                      )?.StatusShiftTotalHrs ??
                        getHoursSpent(
                          shift.ShiftCurrentStatus.find(
                            (s) => s.StatusReportedById === selectedEmpId
                          )?.StatusReportedTime as Timestamp,
                          shift.ShiftCurrentStatus.find(
                            (s) => s.StatusReportedById === selectedEmpId
                          )?.StatusStartedTime as Timestamp
                        )}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
          <tr ref={ref}>
            <td colSpan={6}>
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

export default TimeAndAttendance;
