import { useEffect, useState } from 'react';
import PageHeader from '../../common/PageHeader';
import Button from '../../common/button/Button';
import { useAuthState, useEditFormStore } from '../../store';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  DisplayCount,
  MinimumQueryCharacter,
  PageRoutes,
  REACT_QUERY_KEYS,
} from '../../@types/enum';
import DbCompany from '../../firebase_configs/DB/DbCompany';
import { DocumentData } from 'firebase/firestore';
import { useDebouncedValue } from '@mantine/hooks';
import { ITasksCollection } from '../../@types/database';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';
import NoSearchResult from '../../common/NoSearchResult';
import { formatDate } from '../../utilities/misc';
import TableShimmer from '../../common/shimmer/TableShimmer';
import SearchBar from '../../common/inputs/SearchBar';
import SelectBranch from '../../common/SelectBranch';
import CreateTaskModal from '../../component/task_and_tracking/modal/CreateTaskModal';
import { MdEdit } from 'react-icons/md';

const TaskList = () => {
  const { setTaskEditData } = useEditFormStore();

  const [branchId, setBranchId] = useState('');

  const { company } = useAuthState();

  const [query, setQuery] = useState('');

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
      REACT_QUERY_KEYS.TASK_LIST,
      company!.CompanyId,
      branchId,
      debouncedQuery,
    ],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbCompany.getTasks({
        lmt: DisplayCount.TASK_LIST,
        lastDoc: pageParam,
        cmpId: company!.CompanyId,
        cmpBranchId: branchId,
        searchQuery: debouncedQuery,
      });
      return snapshot.docs;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage?.length === 0) {
        return null;
      }
      if (lastPage?.length === DisplayCount.TASK_LIST) {
        return lastPage.at(-1);
      }
      return null;
    },
    initialPageParam: null as null | DocumentData,
    enabled:
      debouncedQuery.trim().length > 0 &&
      debouncedQuery.trim().length < MinimumQueryCharacter.TASK_LIST
        ? false
        : true,
  });

  const [data, setData] = useState<ITasksCollection[]>(() => {
    if (snapshotData) {
      return snapshotData.pages.flatMap((page) =>
        page.map((doc) => doc.data() as ITasksCollection)
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
      const docData: ITasksCollection[] = [];
      snapshotData.pages?.forEach((page) => {
        page?.forEach((doc) => {
          const data = doc.data() as ITasksCollection;
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

  const [taskCreateModal, setTaskCreateModal] = useState(false);
  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <PageHeader
        title="Task assignment and tracking"
        rightSection={
          <Button
            label="Create new task"
            type="black"
            onClick={() => {
              setTaskEditData(null);
              setTaskCreateModal(true);
            }}
          />
        }
      />
      <CreateTaskModal
        opened={taskCreateModal}
        setOpened={setTaskCreateModal}
      />
      <div className="flex items-center bg-surface shadow p-4 rounded w-full justify-between">
        <SearchBar
          value={query}
          setValue={setQuery}
          placeholder="Search task"
        />
        <SelectBranch
          selectedBranch={branchId}
          setSelectedBranch={setBranchId}
        />
      </div>

      <table className="rounded overflow-hidden w-full">
        <thead className="bg-primary text-surface text-sm">
          <tr>
            <th className="uppercase px-4 py-2 w-[20%] text-start">Task</th>
            <th className="uppercase px-4 py-2 w-[15%] text-start">
              Start Date
            </th>
            <th className="uppercase px-4 py-2 w-[15%] text-start">
              Start Time
            </th>

            <th className="uppercase px-4 py-2 w-[10%] text-start">For Days</th>
            <th className="uppercase px-4 py-2 w-[35%] text-start">
              Alloted To
            </th>
            <th className="uppercase px-4 py-2 w-[5%] text-end"></th>
          </tr>
        </thead>
        <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
          {data.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={6}>
                <NoSearchResult />
              </td>
            </tr>
          ) : (
            data.map((task) => {
              return (
                <tr key={task.TaskId} className="cursor-pointer">
                  <td
                    onClick={() =>
                      navigate(
                        PageRoutes.TASK_AND_TRACKING_LOGS + `?id=${task.TaskId}`
                      )
                    }
                    className="align-top px-4 py-2 text-start"
                  >
                    <span className="line-clamp-3">{task.TaskDescription}</span>
                  </td>
                  <td
                    onClick={() =>
                      navigate(
                        PageRoutes.TASK_AND_TRACKING_LOGS + `?id=${task.TaskId}`
                      )
                    }
                    className="align-top px-4 py-2 text-start"
                  >
                    <span className="line-clamp-3">
                      {formatDate(task.TaskStartDate)}
                    </span>
                  </td>
                  <td
                    onClick={() =>
                      navigate(
                        PageRoutes.TASK_AND_TRACKING_LOGS + `?id=${task.TaskId}`
                      )
                    }
                    className="align-top px-4 py-2 text-start"
                  >
                    <span className="line-clamp-3">{task.TaskStartTime}</span>
                  </td>

                  <td
                    onClick={() =>
                      navigate(
                        PageRoutes.TASK_AND_TRACKING_LOGS + `?id=${task.TaskId}`
                      )
                    }
                    className="align-top px-4 py-2 text-start"
                  >
                    <span className="line-clamp-2">{task.TaskForDays}</span>
                  </td>
                  <td
                    onClick={() =>
                      navigate(
                        PageRoutes.TASK_AND_TRACKING_LOGS + `?id=${task.TaskId}`
                      )
                    }
                    className="align-top px-4 py-2 text-start"
                  >
                    <span className="line-clamp-2">
                      {task.TaskAllotedLocationId
                        ? `Location Name: ${task.TaskAllotedLocationName}`
                        : task.TaskIsAllotedToAllEmps
                          ? 'All Employees'
                          : `Employees: ${task.TaskAllotedToEmps?.map((emp) => emp.EmpName).join(',')} `}
                    </span>
                  </td>
                  <td
                    onClick={() => {
                      setTaskEditData(task);
                      setTaskCreateModal(true);
                    }}
                    className="px-4 py-2 text-end capitalize align-top flex justify-end"
                  >
                    <MdEdit className="text-lg text-textPrimaryBlue cursor-pointer hover:scale-110 duration-150" />
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

export default TaskList;
