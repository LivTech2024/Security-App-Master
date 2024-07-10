import { useSearchParams } from 'react-router-dom';
import PageHeader from '../../common/PageHeader';
import { useEffect, useState } from 'react';
import { ITaskLogsCollection, ITasksCollection } from '../../@types/database';
import DbCompany from '../../firebase_configs/DB/DbCompany';
import NoSearchResult from '../../common/NoSearchResult';
import { formatDate } from '../../utilities/misc';
import DateFilterDropdown from '../../common/dropdown/DateFilterDropdown';
import useFetchEmployees from '../../hooks/fetch/useFetchEmployees';
import dayjs from 'dayjs';
import { useInfiniteQuery } from '@tanstack/react-query';
import { DisplayCount, REACT_QUERY_KEYS } from '../../@types/enum';
import { DocumentData } from 'firebase/firestore';
import { useInView } from 'react-intersection-observer';
import InputSelect from '../../common/inputs/InputSelect';
import { Status } from '../../common/Status';
import TableShimmer from '../../common/shimmer/TableShimmer';

const TaskLogs = () => {
  const [searchParam] = useSearchParams();

  const taskId = searchParam.get('id');

  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<ITasksCollection | null>(null);

  useEffect(() => {
    if (!taskId) return;

    DbCompany.getTaskById(taskId)
      .then((snapshot) => {
        const trainCertsData = snapshot.data() as ITasksCollection;
        setData(trainCertsData);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, [taskId]);

  //*Fetch all allocation of the trainCerts
  const [startDate, setStartDate] = useState<Date | string | null>(
    dayjs().startOf('M').toDate()
  );

  const [endDate, setEndDate] = useState<Date | string | null>(
    dayjs().endOf('M').toDate()
  );

  const [isLifeTime, setIsLifeTime] = useState(false);

  const [empSearchQuery, setEmpSearchQuery] = useState('');

  const [selectedEmpId, setSelectedEmpId] = useState('');

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
      REACT_QUERY_KEYS.TASK_LOG_LIST,
      taskId,
      isLifeTime,
      startDate,
      endDate,
      selectedEmpId,
    ],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbCompany.getTaskLogs({
        lmt: DisplayCount.TASK_LOG_LIST,
        lastDoc: pageParam,
        isLifeTime,
        startDate,
        endDate,
        empId: selectedEmpId,
        taskId: taskId || '',
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

  const [taskLogData, settaskLogData] = useState<ITaskLogsCollection[]>(() => {
    if (snapshotData) {
      return snapshotData.pages.flatMap((page) =>
        page.map((doc) => doc.data() as ITaskLogsCollection)
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
      const docData: ITaskLogsCollection[] = [];
      snapshotData.pages?.forEach((page) => {
        page?.forEach((doc) => {
          const data = doc.data() as ITaskLogsCollection;
          docData.push(data);
        });
      });
      settaskLogData(docData);
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

  if (!data && !loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <NoSearchResult />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6 ">
        <PageHeader title="Task logs" />

        <div className="h-[40vh] bg-shimmerColor w-full animate-pulse"></div>
      </div>
    );
  }

  if (data)
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6">
        <PageHeader title="Task logs" />

        <div className="bg-surface shadow rounded p-4 grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="flex items-start gap-2">
            <span className="font-semibold">Task:</span>
            <span>{data.TaskDescription}</span>
          </div>
          <div className="flex items-start gap-2 ">
            <span className="font-semibold">Start Date:</span>
            <span className="line-clamp-2">
              {formatDate(data.TaskStartDate)}
            </span>
          </div>
          <div className="flex items-start gap-2 ">
            <span className="font-semibold">Start Time:</span>
            <span className="line-clamp-2">{data.TaskStartTime}</span>
          </div>
          <div className="flex items-start gap-2 ">
            <span className="font-semibold whitespace-nowrap">Alloted To:</span>
            <span className="line-clamp-2">
              {data.TaskAllotedLocationId
                ? `Location Name: ${data.TaskAllotedLocationName}`
                : data.TaskIsAllotedToAllEmps
                  ? 'All Employees'
                  : `Employees: ${data.TaskAllotedToEmps?.map((emp) => emp.EmpName).join(',')} `}
            </span>
          </div>
        </div>

        {/*     Logs     */}
        <div className="flex items-center justify-between w-full gap-4 p-4 rounded bg-surface shadow">
          <DateFilterDropdown
            endDate={endDate}
            isLifetime={isLifeTime}
            setEndDate={setEndDate}
            setIsLifetime={setIsLifeTime}
            setStartDate={setStartDate}
            startDate={startDate}
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
        <table className="rounded overflow-hidden w-full">
          <thead className="bg-primary text-surface text-sm">
            <tr>
              <th className="uppercase px-4 py-2 w-[25%] text-start">
                Employee Name
              </th>

              <th className="uppercase px-4 py-2 w-[25%] text-start">
                Comment
              </th>

              <th className="uppercase px-4 py-2 w-[25%] text-start">
                Completion Date
              </th>
              <th className="uppercase px-4 py-2 w-[25%] text-end">Status</th>
            </tr>
          </thead>
          <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
            {taskLogData.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={4}>
                  <NoSearchResult />
                </td>
              </tr>
            ) : (
              taskLogData.map((log) => {
                return (
                  <tr key={log.TaskId} className="">
                    <td className="align-top px-4 py-2 text-start">
                      <span className="line-clamp-3">{log.TaskLogEmpName}</span>
                    </td>

                    <td className="align-top px-4 py-2 text-start">
                      <span className="line-clamp-2">
                        {log.TaskLogComment || 'N/A'}
                      </span>
                    </td>

                    <td className="align-top px-4 py-2 text-start ">
                      <span className="line-clamp-2">
                        {formatDate(log.TaskLogCompletionTime)}
                      </span>
                    </td>
                    <td className="align-top px-4 py-2 text-end">
                      <div className="flex justify-end">
                        <Status status={log.TaskLogStatus} />
                      </div>
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

export default TaskLogs;
