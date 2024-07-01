import { useInView } from 'react-intersection-observer';
import PageHeader from '../../common/PageHeader';
import { useEffect, useState } from 'react';
import { IEmployeesCollection } from '../../@types/database';
import empDefaultPlaceHolder from '../../../public/assets/avatar.png';
import {
  DisplayCount,
  MinimumQueryCharacter,
  PageRoutes,
  REACT_QUERY_KEYS,
} from '../../@types/enum';
import { DocumentData } from 'firebase/firestore';
import DbEmployee from '../../firebase_configs/DB/DbEmployee';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuthState } from '../../store';
import { useDebouncedValue } from '@mantine/hooks';
import SearchBar from '../../common/inputs/SearchBar';
import SelectBranch from '../../common/SelectBranch';
import NoSearchResult from '../../common/NoSearchResult';
import TableShimmer from '../../common/shimmer/TableShimmer';
import { useNavigate } from 'react-router-dom';

const TimeAndAttendanceList = () => {
  const navigate = useNavigate();

  const { company } = useAuthState();

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

  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <PageHeader title="Time & Attendance List" />
      <div className="flex items-center justify-between w-full gap-4 p-4 rounded bg-surface shadow">
        <SearchBar
          value={query}
          setValue={setQuery}
          placeholder="Search employee"
        />
        <SelectBranch selectedBranch={branch} setSelectedBranch={setBranch} />
      </div>
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
                    navigate(
                      PageRoutes.TIME_AND_ATTENDANCE_VIEW +
                        `?emp_id=${emp.EmployeeId}&emp_name=${emp.EmployeeName}`
                    );
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
                  <td className="px-4 py-2 text-center">{emp.EmployeeName}</td>
                  <td className="px-4 py-2 text-center">{emp.EmployeeEmail}</td>
                  <td className="px-4 py-2 text-center">{emp.EmployeePhone}</td>
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
    </div>
  );
};

export default TimeAndAttendanceList;
