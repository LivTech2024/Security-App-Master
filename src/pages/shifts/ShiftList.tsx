import { useState, useEffect } from "react";
import { DisplayCount, PageRoutes, REACT_QUERY_KEYS } from "../../@types/enum";
import DbShift from "../../firebase_configs/DB/DbShift";
import { useInfiniteQuery } from "@tanstack/react-query";
import { DocumentData } from "firebase/firestore";
import { IShiftsCollection } from "../../@types/database";
import { useInView } from "react-intersection-observer";
import NoSearchResult from "../../common/NoSearchResult";
import TableShimmer from "../../common/shimmer/TableShimmer";
import { firebaseDataToObject, formatDate } from "../../utilities/misc";
import { useAuthState, useEditFormStore } from "../../store";
import { Shift } from "../../store/slice/editForm.slice";
import { useNavigate } from "react-router-dom";

const ShiftList = () => {
  const { setShiftEditData } = useEditFormStore();

  const { company } = useAuthState();

  const {
    data: snapshotData,
    fetchNextPage,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    isFetching,
    error,
  } = useInfiniteQuery({
    queryKey: [REACT_QUERY_KEYS.SHIFT_LIST, company!.CompanyId],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbShift.getShifts({
        lmt: DisplayCount.SHIFT_LIST,
        lastDoc: pageParam,
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
    console.log(error, "error");
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
      <div className="flex justify-between w-full p-4 rounded bg-primaryGold text-surface items-center">
        <span className="font-semibold text-xl">Shifts</span>
        <button
          onClick={() => {
            setShiftEditData(null);
            navigate(PageRoutes.SHIFT_CREATE_OR_EDIT);
          }}
          className="bg-primary text-surface px-4 py-2 rounded"
        >
          Create Shift
        </button>
      </div>

      <table className="rounded overflow-hidden w-full">
        <thead className="bg-primary text-surface text-sm">
          <tr>
            <th className="uppercase px-4 py-2 w-[16.67%] text-start">Name</th>
            <th className="uppercase px-4 py-2 w-[16.67%] text-start">Date</th>
            <th className="uppercase px-4 py-2 w-[16.67%] text-start">
              Start Time
            </th>
            <th className="uppercase px-4 py-2 w-[16.67%] text-start">
              End Time
            </th>
            <th className="uppercase px-4 py-2 w-[16.67%] text-start">
              Position
            </th>
            <th className="uppercase px-4 py-2 w-[16.67%] text-end">
              Description
            </th>
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
            data.map((shift) => {
              return (
                <tr
                  key={shift.ShiftId}
                  onClick={() => {
                    setShiftEditData(
                      firebaseDataToObject(
                        shift as unknown as Record<string, unknown>
                      ) as unknown as Shift
                    );
                    navigate(PageRoutes.SHIFT_CREATE_OR_EDIT);
                  }}
                  className="cursor-pointer "
                >
                  <td className="px-4 py-2 text-start">{shift.ShiftName}</td>
                  <td className="px-4 py-2 text-start">
                    {formatDate(shift.ShiftDate)}
                  </td>
                  <td className="px-4 py-2 text-start">
                    {shift.ShiftStartTime}
                  </td>
                  <td className="px-4 py-2 text-start">{shift.ShiftEndTime}</td>
                  <td className="px-4 py-2 text-start capitalize">
                    {shift.ShiftPosition}
                  </td>
                  <td className="px-4 py-2 text-end">
                    {shift.ShiftDescription || "N/A"}
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

export default ShiftList;
