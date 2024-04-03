import { useNavigate } from "react-router";
import {
  DisplayCount,
  MinimumQueryCharacter,
  PageRoutes,
  REACT_QUERY_KEYS,
} from "../../@types/enum";
import { useEffect, useState } from "react";
import { useAuthState } from "../../store";
import { useDebouncedValue } from "@mantine/hooks";
import { useInfiniteQuery } from "@tanstack/react-query";
import DbPatrol from "../../firebase_configs/DB/DbPatrol";
import { DocumentData } from "firebase/firestore";
import { IPatrolsCollection } from "../../@types/database";
import { useInView } from "react-intersection-observer";
import TableShimmer from "../../common/shimmer/TableShimmer";
import NoSearchResult from "../../common/NoSearchResult";

export const PatrolStatus = ({
  status,
}: {
  status: "pending" | "started" | "completed";
}) => {
  return (
    <div className="flex justify-end">
      <div className="flex items-center gap-2">
        {status === "pending" ? (
          <div className="w-[12px] h-[12px] rounded-full bg-primaryGold">
            &nbsp;
          </div>
        ) : status === "started" ? (
          <div className="w-[12px] h-[12px] rounded-full bg-primaryRed">
            &nbsp;
          </div>
        ) : (
          <div className="w-[12px] h-[12px] rounded-full bg-primaryGreen">
            &nbsp;
          </div>
        )}
        <span className="capitalize font-medium">{status}</span>
      </div>
    </div>
  );
};

const PatrollingList = () => {
  const navigate = useNavigate();

  const { company } = useAuthState();

  //const [query, setQuery] = useState("");

  const [debouncedQuery] = useDebouncedValue("", 200);

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
      REACT_QUERY_KEYS.PATROL_LIST,
      debouncedQuery,
      company!.CompanyId,
    ],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbPatrol.getPatrols({
        lmt: DisplayCount.PATROL_LIST,
        lastDoc: pageParam,
        searchQuery: debouncedQuery,
        cmpId: company!.CompanyId,
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
      debouncedQuery.trim().length < MinimumQueryCharacter.PATROL
        ? false
        : true,
  });

  const [data, setData] = useState<IPatrolsCollection[]>(() => {
    if (snapshotData) {
      return snapshotData.pages.flatMap((page) =>
        page.map((doc) => doc.data() as IPatrolsCollection)
      );
    }
    return [];
  });

  useEffect(() => {
    console.log(error, "error");
  }, [error]);

  // we are looping through the snapshot returned by react-query and converting them to data
  useEffect(() => {
    if (snapshotData) {
      const docData: IPatrolsCollection[] = [];
      snapshotData.pages?.forEach((page) => {
        page?.forEach((doc) => {
          const data = doc.data() as IPatrolsCollection;
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
        <span className="font-semibold text-xl">Patrolling</span>

        <button
          onClick={() => {
            navigate(PageRoutes.PATROLLING_CREATE_OR_EDIT);
          }}
          className="bg-primary text-surface px-4 py-2 rounded"
        >
          Create Patrolling
        </button>
      </div>

      <table className="rounded overflow-hidden w-full">
        <thead className="bg-primary text-surface text-sm">
          <tr>
            <th className="uppercase px-4 py-2 w-[15%] text-start">
              Patrol Name
            </th>
            <th className="uppercase px-4 py-2 w-[15%] text-start">Location</th>
            <th className="uppercase px-4 py-2 w-[15%] text-start">Time</th>
            <th className="uppercase px-4 py-2 w-[10%] text-center">
              Checkpoints
            </th>
            <th className="uppercase px-4 py-2 w-[15%] text-end">
              Required Times
            </th>
            <th className="uppercase px-4 py-2 w-[15%] text-end">
              Completed Times
            </th>
            <th className="uppercase px-4 py-2 w-[15%] text-end">Status</th>
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
                  key={patrol.PatrolId}
                  onClick={() =>
                    navigate(
                      PageRoutes.PATROLLING_VIEW + `?id=${patrol.PatrolId}`
                    )
                  }
                  className="cursor-pointer"
                >
                  <td className="px-4 py-2 text-start align-top">
                    <span className="line-clamp-2">{patrol.PatrolName}</span>
                  </td>
                  <td className="px-4 py-2 text-start align-top ">
                    <span className="line-clamp-3">
                      {patrol.PatrolLocationName}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-start align-top">
                    <span className="line-clamp-2">{patrol.PatrolTime}</span>
                  </td>
                  <td className="px-4 py-2 text-center align-top">
                    {patrol.PatrolCheckPoints.length.toFixed(1)}
                  </td>
                  <td className="px-4 py-2 text-center align-top">
                    {patrol.PatrolRequiredCount}
                  </td>
                  <td className="px-4 py-2 text-center align-top">
                    {patrol.PatrolCompletedCount}
                  </td>
                  <td className="px-4 py-2 text-end capitalize align-top">
                    <span className="flex items-center justify-end gap-2">
                      <PatrolStatus status={patrol.PatrolCurrentStatus} />
                      <span>
                        {patrol.PatrolCompletedCount}/
                        {patrol.PatrolRequiredCount}
                      </span>
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
    </div>
  );
};

export default PatrollingList;
