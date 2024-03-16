import { useEffect, useState } from "react";
import AddEmployeeModal from "../../component/employees/modal/AddEmployeeModal";
import { useDebouncedValue } from "@mantine/hooks";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import {
  DisplayCount,
  MinimumQueryCharacter,
  REACT_QUERY_KEYS,
} from "../../@types/enum";
import DbEmployee from "../../firebase_configs/DB/DbEmployee";
import { DocumentData } from "firebase/firestore";
import { IEmployeesCollection } from "../../@types/database";
import NoSearchResult from "../../common/NoSearchResult";
import NotFound from "../../common/NotFound";
import TableShimmer from "../../common/shimmer/TableShimmer";
import { useEditFormStore } from "../../store";
import { firebaseDataToObject } from "../../utilities/misc";
import { Employee } from "../../store/slice/editForm.slice";

const Employees = () => {
  const [addEmployeeDialog, setAddEmployeeDialog] = useState(false);

  const { setEmployeeEditData } = useEditFormStore();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [query, setQuery] = useState("");

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
    queryKey: [REACT_QUERY_KEYS.EMPLOYEE_LIST, debouncedQuery],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbEmployee.getEmployees({
        lmt: DisplayCount.EMPLOYEE_LIST,
        lastDoc: pageParam,
        searchQuery: debouncedQuery,
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
    console.log(error, "error");
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
      <div className="flex justify-between w-full p-4 rounded bg-primaryGold text-surface items-center">
        <span className="font-semibold text-xl">Employees</span>

        <button
          onClick={() => {
            setAddEmployeeDialog(true);
            setEmployeeEditData(null);
          }}
          className="bg-primary text-surface px-4 py-2 rounded"
        >
          Create Employee
        </button>
      </div>

      <AddEmployeeModal
        opened={addEmployeeDialog}
        setOpened={setAddEmployeeDialog}
      />

      <table className="rounded overflow-hidden w-full">
        <thead className="bg-primary text-surface text-sm">
          <tr>
            <th className="uppercase px-4 py-2 w-[20%] text-center">
              First Name
            </th>
            <th className="uppercase px-4 py-2 w-[20%] text-center">
              Last Name
            </th>
            <th className="uppercase px-4 py-2 w-[20%] text-center">Email</th>
            <th className="uppercase px-4 py-2 w-[20%] text-center">
              PHONE NUMBER
            </th>
            <th className="uppercase px-4 py-2 w-[20%] text-center">Role</th>
          </tr>
        </thead>
        <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
          {data.length === 0 && query && !isLoading ? (
            <tr>
              <td colSpan={5}>
                <NoSearchResult />
              </td>
            </tr>
          ) : data.length === 0 && !query && !isLoading ? (
            <tr>
              <td colSpan={5}>
                <NotFound />
              </td>
            </tr>
          ) : (
            data.map((emp) => {
              return (
                <tr
                  key={emp.EmployeeId}
                  onClick={() => {
                    setEmployeeEditData(
                      firebaseDataToObject(
                        emp as unknown as Record<string, unknown>
                      ) as unknown as Employee
                    );
                    setAddEmployeeDialog(true);
                  }}
                  className="cursor-pointer"
                >
                  <td className="px-4 py-2 text-center">
                    {emp.EmployeeName.split(" ")[0]}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {emp.EmployeeName.split(" ")[1]}
                  </td>
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

export default Employees;
