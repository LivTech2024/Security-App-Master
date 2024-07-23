import DateFilterDropdown from '../../../common/dropdown/DateFilterDropdown';
import PageHeader from '../../../common/PageHeader';
import { useAuthState } from '../../../store';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useInfiniteQuery } from '@tanstack/react-query';
import { DisplayCount, REACT_QUERY_KEYS } from '../../../@types/enum';
import DbHR from '../../../firebase_configs/DB/DbHR';
import { DocumentData } from 'firebase/firestore';
import { ILeaveRequestsCollection } from '../../../@types/database';
import { useInView } from 'react-intersection-observer';
import SelectBranch from '../../../common/SelectBranch';
import useFetchEmployees from '../../../hooks/fetch/useFetchEmployees';
import InputSelect from '../../../common/inputs/InputSelect';
import NoSearchResult from '../../../common/NoSearchResult';
import { formatDate } from '../../../utilities/misc';
import { Status } from '../../../common/Status';
import TableShimmer from '../../../common/shimmer/TableShimmer';
import LeaveReqUpdateModal from '../../../component/hrm/modal/LeaveReqUpdateModal';

const LeaveRequestList = () => {
  const { company } = useAuthState();

  const [startDate, setStartDate] = useState<Date | string | null>(
    dayjs().startOf('M').toDate()
  );

  const [endDate, setEndDate] = useState<Date | string | null>(
    dayjs().endOf('M').toDate()
  );

  const [isLifeTime, setIsLifeTime] = useState(false);

  const [selectedBranchId, setSelectedBranchId] = useState('');

  const [selectedEmpId, setSelectedEmpId] = useState('');

  const [empSearchQuery, setEmpSearchQuery] = useState('');

  const { data: employees } = useFetchEmployees({
    limit: 5,
    searchQuery: empSearchQuery,
  });

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
      REACT_QUERY_KEYS.LEAVE_REQ_LIST,
      company!.CompanyId,
      isLifeTime,
      startDate,
      endDate,
      selectedBranchId,
      selectedEmpId,
    ],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbHR.getLeaveRequests({
        lmt: DisplayCount.LEAVE_REQ_LIST,
        lastDoc: pageParam,
        cmpId: company!.CompanyId,
        endDate,
        isLifeTime,
        startDate,
        branchId: selectedBranchId,
        empId: selectedEmpId,
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

  const [data, setData] = useState<ILeaveRequestsCollection[]>(() => {
    if (snapshotData) {
      return snapshotData.pages.flatMap((page) =>
        page.map((doc) => doc.data() as ILeaveRequestsCollection)
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
      const docData: ILeaveRequestsCollection[] = [];
      snapshotData.pages?.forEach((page) => {
        page?.forEach((doc) => {
          const data = doc.data() as ILeaveRequestsCollection;
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

  const [leaveReqUpdateModal, setLeaveReqUpdateModal] = useState(false);

  const [selectedLeaveReq, setSelectedLeaveReq] =
    useState<ILeaveRequestsCollection | null>(null);
  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <PageHeader title="Leave requests" />
      <div className="flex justify-between w-full p-4 rounded bg-surface shadow items-center">
        <DateFilterDropdown
          endDate={endDate}
          isLifetime={isLifeTime}
          setEndDate={setEndDate}
          setIsLifetime={setIsLifeTime}
          setStartDate={setStartDate}
          startDate={startDate}
        />
        <div className="flex justify-end w-full gap-4">
          <SelectBranch
            selectedBranch={selectedBranchId}
            setSelectedBranch={setSelectedBranchId}
          />
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
        </div>
      </div>

      <table className="rounded overflow-hidden w-full">
        <thead className="bg-primary text-surface text-sm">
          <tr>
            <th className="uppercase px-4 py-2 w-[15%] text-start">
              Employee Name
            </th>
            <th className="uppercase px-4 py-2 w-[25%] text-start">Reason</th>

            <th className="uppercase px-4 py-2 w-[12%] text-start">
              From Date
            </th>

            <th className="uppercase px-4 py-2 w-[12%] text-start">To Date</th>
            <th className="uppercase px-4 py-2 w-[12%] text-start">
              Paid Leave
            </th>
            <th className="uppercase px-4 py-2 w-[12%] text-start">
              Paid Amount
            </th>
            <th className="uppercase px-4 py-2 w-[12%] text-end">Status</th>
          </tr>
        </thead>
        <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
          {data.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={7}>
                <NoSearchResult />
              </td>
            </tr>
          ) : (
            data.map((res) => {
              return (
                <tr
                  onClick={() => {
                    setSelectedLeaveReq(res);
                    setLeaveReqUpdateModal(true);
                  }}
                  key={res.LeaveReqId}
                  className="cursor-pointer"
                >
                  <td className="align-top px-4 py-2 text-start capitalize">
                    <span className="line-clamp-2">{res.LeaveReqEmpName}</span>
                  </td>
                  <td className="align-top px-4 py-2 text-start">
                    <span className="line-clamp-2">{res.LeaveReqReason}</span>
                  </td>
                  <td className="align-top px-4 py-2 text-start">
                    <span className="line-clamp-2">
                      {formatDate(res.LeaveReqFromDate)}
                    </span>
                  </td>
                  <td className="align-top px-4 py-2 text-start">
                    <span className="line-clamp-2">
                      {formatDate(res.LeaveReqToDate)}
                    </span>
                  </td>
                  <td className="align-top px-4 py-2 text-start">
                    <span className="line-clamp-2">
                      {res.LeaveReqIsPaidLeave ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="align-top px-4 py-2 text-start">
                    <span className="line-clamp-2">
                      {res.LeaveReqPaidLeaveAmt || 'N/A'}
                    </span>
                  </td>

                  <td className="align-top px-4 py-2 text-end">
                    <span className="flex justify-end">
                      <Status status={res.LeaveReqStatus} />
                    </span>
                  </td>
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

      <LeaveReqUpdateModal
        data={selectedLeaveReq}
        opened={leaveReqUpdateModal}
        setOpened={setLeaveReqUpdateModal}
      />
    </div>
  );
};

export default LeaveRequestList;
