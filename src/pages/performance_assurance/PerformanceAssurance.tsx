import { useEffect, useState } from 'react';
import PageHeader from '../../common/PageHeader';
import dayjs from 'dayjs';
import empDefaultPlaceHolder from '../../../public/assets/avatar.png';
import { useAuthState } from '../../store';
import DateFilterDropdown from '../../common/dropdown/DateFilterDropdown';
import {
  IEmployeesCollection,
  IPatrolLogsCollection,
  IShiftsCollection,
} from '../../@types/database';
import DbEmployee from '../../firebase_configs/DB/DbEmployee';
import { formatDate } from '../../utilities/misc';
import { numberFormatter } from '../../utilities/NumberFormater';
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
import { IoArrowBackCircle } from 'react-icons/io5';

const PerformanceAssurance = () => {
  const { company } = useAuthState();

  const [startDate, setStartDate] = useState<Date | string | null>(
    dayjs().startOf('M').toDate()
  );

  const [endDate, setEndDate] = useState<Date | string | null>(
    dayjs().endOf('M').toDate()
  );

  const [selectedEmpId, setSelectedEmpId] = useState('');

  const [empShifts, setEmpShifts] = useState<IShiftsCollection[]>([]);

  const [empPatrolLogs, setEmpPatrolLogs] = useState<IPatrolLogsCollection[]>(
    []
  );

  const [loading, setLoading] = useState(false);

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
    ],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbEmployee.getEmployees({
        lmt: DisplayCount.EMPLOYEE_LIST,
        lastDoc: pageParam,
        searchQuery: debouncedQuery,
        cmpId: company!.CompanyId,
        branch,
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
      debouncedQuery.trim().length < MinimumQueryCharacter.EMPLOYEE
        ? false
        : true,
  });

  const [data, setData] = useState<IEmployeesCollection[]>(() => {
    if (snapshotData) {
      return snapshotData.pages.flatMap((page) =>
        page.map((doc) => doc.data() as IEmployeesCollection)
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
      const docData: IEmployeesCollection[] = [];
      snapshotData.pages?.forEach((page) => {
        page?.forEach((doc) => {
          const data = doc.data() as IEmployeesCollection;
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

  useEffect(() => {
    const fetchEmpReport = async () => {
      if (!company) return;

      if (!selectedEmpId || !startDate || !endDate) {
        setEmpShifts([]);
        setEmpPatrolLogs([]);
        return;
      }
      try {
        setLoading(true);

        setEmpPatrolLogs([]);
        setEmpShifts([]);

        //* Fetch all the shifts of employee
        const shiftSnapshot = await DbEmployee.getEmpShifts({
          companyId: company.CompanyId,
          empId: selectedEmpId,
          startDate,
          endDate,
        });

        if (shiftSnapshot.size > 0) {
          const shiftData = shiftSnapshot.docs.map(
            (doc) => doc.data() as IShiftsCollection
          );
          setEmpShifts(shiftData);
        } else {
          setEmpShifts([]);
        }

        //*Fetch all the patrol logs of employee
        const patrolLogSnapshot = await DbEmployee.getEmpPatrolLogs({
          empId: selectedEmpId,
          startDate,
          endDate,
        });

        if (patrolLogSnapshot.size > 0) {
          const patrolLogData = patrolLogSnapshot.docs.map(
            (doc) => doc.data() as IPatrolLogsCollection
          );
          setEmpPatrolLogs(patrolLogData);
        } else {
          setEmpPatrolLogs([]);
        }

        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };

    fetchEmpReport();
  }, [selectedEmpId, startDate, endDate]);

  const totalSpentHrsOnShift = () => {
    if (!selectedEmpId || empShifts.length === 0) return 0;

    return empShifts.reduce((acc, obj) => {
      return (
        acc +
        (obj.ShiftCurrentStatus.find(
          (status) => status.StatusReportedById === selectedEmpId
        )?.StatusShiftTotalHrs || 0)
      );
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
        <SelectBranch selectedBranch={branch} setSelectedBranch={setBranch} />
      </div>
      {!selectedEmpId ? (
        <table className="rounded overflow-hidden w-full">
          <thead className="bg-primary text-surface text-sm">
            <tr>
              <th className="uppercase px-4 py-2 w-[10%] text-start">Image</th>
              <th className="uppercase px-4 py-2 w-[15%] text-center">Name</th>
              <th className="uppercase px-4 py-2 w-[20%] text-center">Email</th>
              <th className="uppercase px-4 py-2 w-[20%] text-center">
                PHONE NUMBER
              </th>
              <th className="uppercase px-4 py-2 w-[20%] text-center">Role</th>
            </tr>
          </thead>
          <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
            {data.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={5}>
                  <NoSearchResult text="No employee" />
                </td>
              </tr>
            ) : (
              data.map((emp) => {
                return (
                  <tr
                    key={emp.EmployeeId}
                    onClick={() => {
                      setSelectedEmpId(emp.EmployeeId);
                    }}
                    className="cursor-pointer"
                  >
                    <td className="px-4 py-2 text-start">
                      <img
                        src={emp.EmployeeImg ?? empDefaultPlaceHolder}
                        alt=""
                        className="rounded-full object-cover w-14 h-14"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      {emp.EmployeeName}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {emp.EmployeeEmail}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {emp.EmployeePhone}
                    </td>
                    <td className="px-4 py-2 text-center capitalize">
                      {emp.EmployeeRole}
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
      ) : loading ? (
        <div className="h-[400px] bg-shimmerColor animate-pulse"></div>
      ) : (
        <div className="flex flex-col w-full gap-6 p-4 rounded bg-surface shadow">
          <div className="flex items-center gap-4">
            <div
              onClick={() => setSelectedEmpId('')}
              className="cursor-pointer"
            >
              <IoArrowBackCircle className="h-6 w-6" />
            </div>
            <DateFilterDropdown
              endDate={endDate}
              setEndDate={setEndDate}
              setStartDate={setStartDate}
              startDate={startDate}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-4">
              <p className="font-semibold flex gap-2">Start Date:</p>
              <p>{formatDate(startDate)}</p>
            </div>
            <div className="flex items-center gap-4">
              <p className="font-semibold flex gap-2">End Date:</p>
              <p>{formatDate(endDate)}</p>
            </div>

            <div className="flex items-center gap-4">
              <p className="font-semibold flex gap-2">
                No of shifts completed:
              </p>
              <p>{empShifts.length}</p>
            </div>

            <div className="flex items-center gap-4">
              <p className="font-semibold flex gap-2">
                No of patrol completed:
              </p>
              <p>{empPatrolLogs.length}</p>
            </div>

            <div className="flex items-center gap-4">
              <p className="font-semibold flex gap-2">
                Total hours spent on shifts
              </p>
              <p>{numberFormatter(totalSpentHrsOnShift())}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceAssurance;
