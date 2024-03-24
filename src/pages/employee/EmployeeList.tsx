import { useEffect, useState } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import {
  DisplayCount,
  MinimumQueryCharacter,
  PageRoutes,
  REACT_QUERY_KEYS,
} from "../../@types/enum";
import DbEmployee from "../../firebase_configs/DB/DbEmployee";
import { DocumentData } from "firebase/firestore";
import { IEmployeesCollection } from "../../@types/database";
import NoSearchResult from "../../common/NoSearchResult";
import TableShimmer from "../../common/shimmer/TableShimmer";
import { useAuthState, useEditFormStore } from "../../store";
import { firebaseDataToObject, splitName } from "../../utilities/misc";
import { Employee } from "../../store/slice/editForm.slice";
import Button from "../../common/button/Button";
import AddEmpRoleModal from "../../component/employees/modal/AddEmpRoleModal";
import { useNavigate } from "react-router-dom";
import SearchBar from "../../common/inputs/SearchBar";
import InputSelect from "../../common/inputs/InputSelect";

const EmployeeList = () => {
  const navigate = useNavigate();

  const [addEmployeeRoleModal, setAddEmployeeRoleModal] = useState(false);

  const { setEmployeeEditData } = useEditFormStore();

  const { company, companyBranches } = useAuthState();

  const [query, setQuery] = useState("");

  const [branch, setBranch] = useState("");

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

        <div className="flex items-center gap-4">
          <Button
            type="blue"
            label="Create Employee Role"
            onClick={() => setAddEmployeeRoleModal(true)}
            className="px-4 py-2"
          />
          <button
            onClick={() => {
              setEmployeeEditData(null);
              navigate(PageRoutes.EMPLOYEE_CREATE_OR_EDIT);
            }}
            className="bg-primary text-surface px-4 py-2 rounded"
          >
            Create Employee
          </button>
        </div>
      </div>

      <div className="flex items-center bg-surface shadow p-4 rounded w-full justify-between">
        <SearchBar
          value={query}
          setValue={setQuery}
          placeholder="Search employee"
        />
        <InputSelect
          data={[
            { label: "All branch", value: "" },
            ...companyBranches.map((branches) => {
              return {
                label: branches.CompanyBranchName,
                value: branches.CompanyBranchId,
              };
            }),
          ]}
          placeholder="Select branch"
          className="text-lg"
          value={branch}
          onChange={(e) => setBranch(e as string)}
        />
      </div>

      <AddEmpRoleModal
        opened={addEmployeeRoleModal}
        setOpened={setAddEmployeeRoleModal}
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
          {data.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={5}>
                <NoSearchResult text="No employee" />
              </td>
            </tr>
          ) : (
            data.map((emp) => {
              const { firstName, lastName } = splitName(emp.EmployeeName);
              return (
                <tr
                  key={emp.EmployeeId}
                  onClick={() => {
                    setEmployeeEditData(
                      firebaseDataToObject(
                        emp as unknown as Record<string, unknown>
                      ) as unknown as Employee
                    );
                    navigate(PageRoutes.EMPLOYEE_CREATE_OR_EDIT);
                  }}
                  className="cursor-pointer"
                >
                  <td className="px-4 py-2 text-center">{firstName}</td>
                  <td className="px-4 py-2 text-center">{lastName}</td>
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

export default EmployeeList;
