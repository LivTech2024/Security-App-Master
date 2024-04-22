import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  IPatrolLogsCollection,
  IPatrolsCollection,
} from '../../@types/database';
import { useEffect, useState } from 'react';
import DbPatrol from '../../firebase_configs/DB/DbPatrol';
import { useInfiniteQuery } from '@tanstack/react-query';
import { DisplayCount, PageRoutes, REACT_QUERY_KEYS } from '../../@types/enum';
import dayjs from 'dayjs';
import { DocumentData } from 'firebase/firestore';
import DateFilterDropdown from '../../common/dropdown/DateFilterDropdown';
import { useInView } from 'react-intersection-observer';
import NoSearchResult from '../../common/NoSearchResult';
import { formatDate } from '../../utilities/misc';
import { PatrolStatus } from '../../component/patrolling/PatrolStatus';
import TableShimmer from '../../common/shimmer/TableShimmer';
import { useAuthState } from '../../store';

const PatrolLogs = () => {
  const { company, admin } = useAuthState();

  const [searchParam] = useSearchParams();

  const patrolId = searchParam.get('id');

  const [patrolData, setPatrolData] = useState<IPatrolsCollection | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatrolData = async () => {
      if (!patrolId) return;
      try {
        const patrolSnapshot = await DbPatrol.getPatrolById(patrolId);
        const patrolData = patrolSnapshot.data() as IPatrolsCollection;

        setPatrolData(patrolData);
      } catch (error) {
        console.log(error);
      }
    };

    fetchPatrolData();
  }, [patrolId]);

  //*Fetch Patrol Logs
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
      REACT_QUERY_KEYS.PATROL_LOG_LIST,
      patrolId,
      isLifeTime,
      startDate,
      endDate,
    ],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbPatrol.getPatrolLogs({
        lmt: DisplayCount.PATROL_LOG_LIST,
        lastDoc: pageParam,
        isLifeTime,
        startDate,
        endDate,
        patrolId: String(patrolId),
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

  const [data, setData] = useState<IPatrolLogsCollection[]>(() => {
    if (snapshotData) {
      return snapshotData.pages.flatMap((page) =>
        page.map((doc) => doc.data() as IPatrolLogsCollection)
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
      const docData: IPatrolLogsCollection[] = [];
      snapshotData.pages?.forEach((page) => {
        page?.forEach((doc) => {
          const data = doc.data() as IPatrolLogsCollection;
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
      <div className="flex justify-between w-full p-4 rounded bg-primaryGold text-surface items-center">
        <span className="font-semibold text-xl">
          Patrol Logs{' : '}
          <span className="italic">{patrolData?.PatrolName}</span>
        </span>
      </div>
      <div className="flex justify-between w-full p-4 rounded bg-surface shadow items-center">
        <DateFilterDropdown
          endDate={endDate}
          isLifetime={isLifeTime}
          setEndDate={setEndDate}
          setIsLifetime={setIsLifeTime}
          setStartDate={setStartDate}
          startDate={startDate}
        />
      </div>

      <table className="rounded overflow-hidden w-full">
        <thead className="bg-primary text-surface text-sm">
          <tr>
            <th className="uppercase px-4 py-2 w-[30%] text-start">
              Guard Name
            </th>
            <th className="uppercase px-4 py-2 w-[15%] text-start">Date</th>
            <th className="uppercase px-4 py-2 w-[15%] text-start">
              Started At
            </th>
            <th className="uppercase px-4 py-2 w-[15%] text-start">Ended At</th>
            <th className="uppercase px-4 py-2 w-[15%] text-center">
              Completion Count
            </th>

            <th className="uppercase px-4 py-2 w-[10%] text-end">Status</th>
          </tr>
        </thead>
        <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
          {data.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={7}>
                <NoSearchResult text="No result found" />
              </td>
            </tr>
          ) : (
            data.map((patrol) => {
              return (
                <tr
                  key={patrol.PatrolLogId}
                  onClick={() => {
                    if (admin && company) {
                      navigate(
                        PageRoutes.PATROLLING_VIEW + `?id=${patrol.PatrolLogId}`
                      );
                    } else {
                      navigate(
                        PageRoutes.CLIENT_PORTAL_PATROL_VIEW +
                          `?id=${patrol.PatrolLogId}`
                      );
                    }
                  }}
                  className="cursor-pointer"
                >
                  <td className="px-4 py-2 text-start align-top">
                    <span className="line-clamp-2">
                      {patrol.PatrolLogGuardName}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-start align-top ">
                    {formatDate(patrol.PatrolDate)}
                  </td>
                  <td className="px-4 py-2 text-start align-top ">
                    {formatDate(patrol.PatrolLogStartedAt, 'hh:mm A')}
                  </td>

                  <td className="px-4 py-2 text-start align-top">
                    {formatDate(patrol.PatrolLogEndedAt, 'hh:mm A')}
                  </td>
                  <td className="px-4 py-2 text-center align-top">
                    {patrol.PatrolLogPatrolCount}
                  </td>
                  <td className="px-4 py-2 text-end capitalize align-top">
                    <PatrolStatus status={patrol.PatrolLogStatus} />
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
    </div>
  );
};

export default PatrolLogs;
