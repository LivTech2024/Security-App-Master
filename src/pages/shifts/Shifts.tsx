import { useState, useEffect } from "react";
import AddShiftModal from "../../component/shifts/modal/AddShiftModal";
import { DisplayCount, REACT_QUERY_KEYS } from "../../@types/enum";
import DbShift from "../../firebase_configs/DB/DbShift";
import { useInfiniteQuery } from "@tanstack/react-query";
import { DocumentData } from "firebase/firestore";
import { IShiftsCollection } from "../../@types/database";
import { useInView } from "react-intersection-observer";
import NoSearchResult from "../../common/NoSearchResult";
import TableShimmer from "../../common/shimmer/TableShimmer";
import { firebaseDataToObject, formatDate } from "../../utilities/misc";
import { useEditFormStore } from "../../store";
import { Shift } from "../../store/slice/editForm.slice";

const Shifts = () => {
  const [createShiftModal, setCreateShiftModal] = useState(false);

  const { setShiftEditData } = useEditFormStore();

  const {
    data: snapshotData,
    fetchNextPage,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    isFetching,
    error,
  } = useInfiniteQuery({
    queryKey: [REACT_QUERY_KEYS.SHIFT_LIST],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbShift.getShifts({
        lmt: DisplayCount.SHIFT_LIST,
        lastDoc: pageParam,
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

  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <div className="flex justify-between w-full p-4 rounded bg-primaryGold text-surface items-center">
        <span className="font-semibold text-xl">Shifts</span>
        <button
          onClick={() => {
            setShiftEditData(null);
            setCreateShiftModal(true);
          }}
          className="bg-primary text-surface px-4 py-2 rounded"
        >
          Create Shift
        </button>
      </div>

      <AddShiftModal
        opened={createShiftModal}
        setOpened={setCreateShiftModal}
      />

      <table className="rounded overflow-hidden w-full">
        <thead className="bg-primary text-surface text-sm">
          <tr>
            <th className="uppercase px-4 py-2 w-[20%] text-center">Date</th>
            <th className="uppercase px-4 py-2 w-[20%] text-center">
              Start Time
            </th>
            <th className="uppercase px-4 py-2 w-[20%] text-center">
              End Time
            </th>
            <th className="uppercase px-4 py-2 w-[20%] text-center">
              Position
            </th>
            <th className="uppercase px-4 py-2 w-[20%] text-center">
              Description
            </th>
          </tr>
        </thead>
        <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
          {data.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={5}>
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
                    setCreateShiftModal(true);
                  }}
                  className="cursor-pointer "
                >
                  <td className="px-4 py-2 text-center">
                    {formatDate(shift.ShiftDate)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {shift.ShiftStartTime}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {shift.ShiftEndTime}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {shift.ShiftPosition}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {shift.ShiftDescription || "N/A"}
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

export default Shifts;
