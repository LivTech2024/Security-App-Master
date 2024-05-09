import { useInfiniteQuery } from '@tanstack/react-query';
import { DisplayCount, REACT_QUERY_KEYS } from '../../../@types/enum';
import DbClient from '../../../firebase_configs/DB/DbClient';
import { useAuthState } from '../../../store';
import { DocumentData } from 'firebase/firestore';
import { IShiftsCollection } from '../../../@types/database';
import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import NoSearchResult from '../../../common/NoSearchResult';
import { formatDate, toDate } from '../../../utilities/misc';
import TableShimmer from '../../../common/shimmer/TableShimmer';
import DbEmployee from '../../../firebase_configs/DB/DbEmployee';
import PageHeader from '../../../common/PageHeader';

interface ShiftsCollection
  extends Omit<IShiftsCollection, 'ShiftAssignedUserId'> {
  ShiftAssignedUsers: string[];
}

const ClientShifts = () => {
  const { client } = useAuthState();

  const {
    data: snapshotData,
    fetchNextPage,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    isFetching,
    error,
  } = useInfiniteQuery({
    queryKey: [REACT_QUERY_KEYS.SHIFT_LIST, client!.ClientId],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbClient.getClientShifts({
        lmt: DisplayCount.SHIFT_LIST,
        lastDoc: pageParam,
        clientId: client!.ClientId,
      });

      const docData: ShiftsCollection[] = [];

      await Promise.all(
        snapshot?.docs?.map(async (doc) => {
          const data = doc.data() as IShiftsCollection;
          const { ShiftAssignedUserId } = data;
          const assignedUsersName: string[] = [];

          await Promise.all(
            ShiftAssignedUserId.map(async (id) => {
              const empData = await DbEmployee.getEmpById(id);
              const { EmployeeName } = empData;
              assignedUsersName.push(EmployeeName);
            })
          );

          docData.push({ ...data, ShiftAssignedUsers: assignedUsersName });
        })
      );

      return { docs: snapshot.docs, docData: docData };
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.docs?.length === 0) {
        return null;
      }
      if (lastPage.docs?.length === DisplayCount.SHIFT_LIST) {
        return lastPage.docs.at(-1);
      }
      return null;
    },
    initialPageParam: null as null | DocumentData,
  });

  const fetchDataFromSnapshot = () => {
    if (snapshotData) {
      const docData: ShiftsCollection[] = [];
      snapshotData.pages?.forEach((page) => {
        page?.docData?.forEach((data) => {
          docData.push(data);
        });
      });
      return docData;
    }

    return [];
  };

  const [data, setData] = useState<ShiftsCollection[]>(() =>
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
  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <PageHeader title="Shifts" />

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

            <th className="uppercase px-4 py-2 text-end">Employee</th>
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
            data
              .sort(
                (a, b) =>
                  toDate(b.ShiftDate).getTime() - toDate(a.ShiftDate).getTime()
              )
              .map((shift) => {
                return (
                  <tr key={shift.ShiftId} className="">
                    <td className="px-4 py-2 text-start">{shift.ShiftName}</td>
                    <td className="px-4 py-2 text-start">
                      {formatDate(shift.ShiftDate)}
                    </td>
                    <td className="px-4 py-2 text-start">
                      {shift.ShiftStartTime}
                    </td>
                    <td className="px-4 py-2 text-start">
                      {shift.ShiftEndTime}
                    </td>

                    <td className="px-4 py-2 text-end">
                      {shift.ShiftAssignedUsers.join(',') || 'N/A'}
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

export default ClientShifts;
