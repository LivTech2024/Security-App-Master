import { useEffect, useState } from 'react';
import PageHeader from '../../common/PageHeader';
import dayjs from 'dayjs';
import empDefaultPlaceHolder from '../../../public/assets/avatar.png';
import { useAuthState } from '../../store';
import {
  IEmployeesCollection,
  IPatrolLogsCollection,
  IShiftsCollection,
} from '../../@types/database';
import DbEmployee from '../../firebase_configs/DB/DbEmployee';

import {
  DisplayCount,
  MinimumQueryCharacter,
  REACT_QUERY_KEYS,
} from '../../@types/enum';
import { DocumentData } from 'firebase/firestore';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useDebouncedValue } from '@mantine/hooks';
import SearchBar from '../../common/inputs/SearchBar';
import SelectBranch from '../../common/SelectBranch';
import { useInView } from 'react-intersection-observer';
import NoSearchResult from '../../common/NoSearchResult';
import TableShimmer from '../../common/shimmer/TableShimmer';
import { getShiftActualHours } from '../../utilities/scheduleHelper';
import DateFilterDropdown from '../../common/dropdown/DateFilterDropdown';
import { numberFormatter } from '../../utilities/NumberFormater';

interface IEmployeeListWithPerformance extends IEmployeesCollection {
  TotalShifts: number;
  TotalShiftHrsSpent: number;
  TotalPatrol: number;
}

const PerformanceAssurance = () => {
  const { company } = useAuthState();

  const [startDate, setStartDate] = useState<Date | string | null>(
    dayjs().startOf('M').toDate()
  );

  const [endDate, setEndDate] = useState<Date | string | null>(
    dayjs().endOf('M').toDate()
  );

  const [query, setQuery] = useState('');

  const [branch, setBranch] = useState('');

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
      REACT_QUERY_KEYS.EMPLOYEE_LIST,
      debouncedQuery,
      company!.CompanyId,
      branch,
      startDate,
      endDate,
    ],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbEmployee.getEmployees({
        lastDoc: pageParam,
        searchQuery: debouncedQuery,
        cmpId: company!.CompanyId,
        branch,
      });

      const docData: IEmployeeListWithPerformance[] = [];

      await Promise.all(
        snapshot?.docs.map(async (doc) => {
          const emp = doc.data() as IEmployeesCollection;
          const empDataWithPerformance = await fetchEpmPerformance(emp);
          docData.push(empDataWithPerformance);
        })
      );
      return { docs: snapshot.docs, docData: docData };
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.docs?.length === 0) {
        return null;
      }
      if (lastPage.docs?.length === DisplayCount.EMPLOYEE_LIST) {
        return lastPage.docs.at(-1);
      }
      return null;
    },
    initialPageParam: null as null | DocumentData,
    enabled:
      debouncedQuery.trim().length > 0 &&
      debouncedQuery.trim().length < MinimumQueryCharacter.EMPLOYEE
        ? false
        : true,
  });

  const fetchDataFromSnapshot = () => {
    if (snapshotData) {
      const docData: IEmployeeListWithPerformance[] = [];
      snapshotData.pages?.forEach((page) => {
        page.docData?.forEach(async (data) => {
          docData.push(data);
        });
      });
      return docData;
    }

    return [];
  };

  const [data, setData] = useState<IEmployeeListWithPerformance[]>(() =>
    fetchDataFromSnapshot()
  );

  useEffect(() => {
    console.log(error, 'error');
  }, [error]);

  // we are looping through the snapshot returned by react-query and converting them to data
  useEffect(() => {
    setData(fetchDataFromSnapshot());
  }, [snapshotData]);

  // hook for pagination
  const { ref, inView } = useInView();

  // this is for pagination
  useEffect(() => {
    if (inView && hasNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [fetchNextPage, inView, hasNextPage, isFetching]);

  const { settings } = useAuthState();

  const fetchEpmPerformance = async (emp: IEmployeesCollection) => {
    let empWithPerformance: IEmployeeListWithPerformance = {
      ...emp,
      TotalPatrol: 0,
      TotalShiftHrsSpent: 0,
      TotalShifts: 0,
    };
    if (!company) return empWithPerformance;

    const { EmployeeId } = emp;
    try {
      //* Fetch all the shifts of employee
      const shiftSnapshot = await DbEmployee.getEmpShifts({
        companyId: company.CompanyId,
        empId: EmployeeId,
        startDate,
        endDate,
      });

      if (shiftSnapshot.size > 0) {
        const shiftData = shiftSnapshot.docs.map(
          (doc) => doc.data() as IShiftsCollection
        );

        const totalShiftHrs = totalSpentHrsOnShift(emp.EmployeeId, shiftData);

        empWithPerformance = {
          ...empWithPerformance,
          TotalShiftHrsSpent: totalShiftHrs,
          TotalShifts: shiftData.length,
        };
      }

      //*Fetch all the patrol logs of employee
      const patrolLogSnapshot = await DbEmployee.getEmpPatrolLogs({
        empId: EmployeeId,
        startDate,
        endDate,
      });

      if (patrolLogSnapshot.size > 0) {
        const patrolLogData = patrolLogSnapshot.docs.map(
          (doc) => doc.data() as IPatrolLogsCollection
        );
        empWithPerformance = {
          ...empWithPerformance,
          TotalPatrol: patrolLogData.length,
        };
      }

      return empWithPerformance;
    } catch (error) {
      console.log(error);
      return empWithPerformance;
    }
  };

  const totalSpentHrsOnShift = (
    empId: string,
    empShifts: IShiftsCollection[]
  ) => {
    if (empShifts.length === 0) return 0;

    return empShifts.reduce((acc, obj) => {
      const { actualShiftHrsSpent } = getShiftActualHours({
        shift: obj,
        empId,
        timeMarginInMins: settings?.SettingEmpShiftTimeMarginInMins || 0,
      });
      return acc + actualShiftHrsSpent;
    }, 0);
  };

  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <PageHeader title="Performance Assurance" />
      <div className="flex items-center justify-between w-full gap-4 p-4 rounded bg-surface shadow">
        <SearchBar
          value={query}
          setValue={setQuery}
          placeholder="Search employee"
        />
        <div className="flex items-center gap-4 w-full justify-end">
          <DateFilterDropdown
            endDate={endDate}
            setEndDate={setEndDate}
            setStartDate={setStartDate}
            startDate={startDate}
          />
          <SelectBranch selectedBranch={branch} setSelectedBranch={setBranch} />
        </div>
      </div>
      <table className="rounded overflow-hidden w-full">
        <thead className="bg-primary text-surface text-sm">
          <tr>
            <th className="uppercase px-4 py-2 w-[10%] text-start">Image</th>
            <th className="uppercase px-4 py-2 w-[15%] text-start">Name</th>
            <th className="uppercase px-4 py-2 w-[15%] text-start">Email</th>
            <th className="uppercase px-4 py-2 w-[15%] text-end">
              Total Shifts
            </th>
            <th className="uppercase px-4 py-2 w-[15%] text-end">
              Total Shift Hours
            </th>
            <th className="uppercase px-4 py-2 w-[15%] text-end">
              Total Patrols
            </th>
            {(!query || query.length === 0) && (
              <th className="uppercase px-4 py-2 w-[10%] text-end">Rank</th>
            )}
          </tr>
        </thead>
        <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
          {data.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={7}>
                <NoSearchResult text="No employee" />
              </td>
            </tr>
          ) : (
            data
              .sort((a, b) => (b?.TotalShifts || 0) - (a?.TotalShifts || 0))
              .map((emp, idx) => {
                return (
                  <tr key={emp.EmployeeId}>
                    <td className="px-4 py-2 text-start">
                      <img
                        src={emp.EmployeeImg ?? empDefaultPlaceHolder}
                        alt=""
                        className="rounded-full object-cover w-14 h-14"
                      />
                    </td>
                    <td className="px-4 py-2 text-start">{emp.EmployeeName}</td>
                    <td className="px-4 py-2 text-start">
                      {emp.EmployeeEmail}
                    </td>

                    <td className="px-4 py-2 text-end">
                      {numberFormatter(emp.TotalShifts, false, 1)}
                    </td>
                    <td className="px-4 py-2 text-end">
                      {numberFormatter(emp.TotalShiftHrsSpent)}
                    </td>
                    <td className="px-4 py-2 text-end capitalize">
                      {numberFormatter(emp.TotalPatrol, false, 1)}
                    </td>
                    {(!query || query.length === 0) && (
                      <td className="px-4 py-2 text-end capitalize">
                        #{idx + 1}
                      </td>
                    )}
                  </tr>
                );
              })
          )}
          <tr ref={ref}>
            <td colSpan={7}>
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

export default PerformanceAssurance;
