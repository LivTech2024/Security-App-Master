import { useEffect, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import {
  DisplayCount,
  IEmployeeStatus,
  MinimumQueryCharacter,
  PageRoutes,
  REACT_QUERY_KEYS,
} from '../../@types/enum';
import DbEmployee from '../../firebase_configs/DB/DbEmployee';
import { DocumentData } from 'firebase/firestore';
import {
  IEmpLicenseDetails,
  IEmployeesCollection,
} from '../../@types/database';
import NoSearchResult from '../../common/NoSearchResult';
import TableShimmer from '../../common/shimmer/TableShimmer';
import { useAuthState, useEditFormStore } from '../../store';
import { firebaseDataToObject, splitName, toDate } from '../../utilities/misc';
import { Employee } from '../../store/slice/editForm.slice';
import Button from '../../common/button/Button';
import AddEmpRoleModal from '../../component/employees/modal/AddEmpRoleModal';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../../common/inputs/SearchBar';
import SelectBranch from '../../common/SelectBranch';
import empDefaultPlaceHolder from '../../../public/assets/avatar.png';
import PageHeader from '../../common/PageHeader';
import dayjs from 'dayjs';
import { Tooltip } from '@mantine/core';
import { MdOutlineWarningAmber } from 'react-icons/md';

const EmployeeList = () => {
  const navigate = useNavigate();

  const [addEmployeeRoleModal, setAddEmployeeRoleModal] = useState(false);

  const { setEmployeeEditData } = useEditFormStore();

  const { company } = useAuthState();

  const [query, setQuery] = useState('');

  const [branch, setBranch] = useState('');

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
    console.log(error, 'error');
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

  const getEmpStatus = (status: IEmployeeStatus) => {
    switch (status) {
      case IEmployeeStatus.ON_BOARD:
        return 'Onboard';
      case IEmployeeStatus.OFF_BOARD:
        return 'Offboard';
      case IEmployeeStatus.LEAVED:
        return 'Leaved';
      case IEmployeeStatus.FIRED:
        return 'Fired';

      default:
        return 'N/A';
    }
  };

  const empLicenseExpDetails = (empLicenses: IEmpLicenseDetails[]) => {
    let text: string | null = null;
    empLicenses.find((license) => {
      const diff = dayjs(toDate(license.LicenseExpDate)).diff(
        new Date(),
        'day'
      );
      if (diff >= 0 && diff <= 3) {
        text = `${license.LicenseType} license expiring in ${diff} days`;
      } else if (diff < 0) {
        text = `${license.LicenseType} license expired ${diff * -1} days ago`;
      }
    });

    return text;
  };

  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <PageHeader
        title="Employees"
        rightSection={
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
        }
      />

      <div className="flex items-center bg-surface shadow p-4 rounded w-full justify-between">
        <SearchBar
          value={query}
          setValue={setQuery}
          placeholder="Search employee"
        />
        <SelectBranch selectedBranch={branch} setSelectedBranch={setBranch} />
      </div>

      <AddEmpRoleModal
        opened={addEmployeeRoleModal}
        setOpened={setAddEmployeeRoleModal}
      />

      <table className="rounded overflow-hidden w-full">
        <thead className="bg-primary text-surface text-sm">
          <tr>
            <th className="uppercase px-4 py-2 w-[8%] text-start">Image</th>
            <th className="uppercase px-4 py-2 w-[15%] text-start">
              First Name
            </th>
            <th className="uppercase px-4 py-2 w-[15%] text-start">
              Last Name
            </th>
            <th className="uppercase px-4 py-2 w-[20%] text-start">Email</th>
            <th className="uppercase px-4 py-2 w-[15%] text-start">
              PHONE NUMBER
            </th>
            <th className="uppercase px-4 py-2 w-[15%] text-end">Role</th>
            <th className="uppercase px-4 py-2 w-[10%] text-end">Status</th>
            <th className="w-[2%]"></th>
          </tr>
        </thead>
        <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
          {data.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={8}>
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
                  <td className="px-4 py-2 text-start">
                    <img
                      src={emp.EmployeeImg || empDefaultPlaceHolder}
                      alt=""
                      className="rounded-full object-cover w-14 h-14"
                    />
                  </td>
                  <td className="px-4 py-2 text-start">{firstName}</td>
                  <td className="px-4 py-2 text-start">{lastName}</td>
                  <td className="px-4 py-2 text-start">{emp.EmployeeEmail}</td>
                  <td className="px-4 py-2 text-start">{emp.EmployeePhone}</td>
                  <td className="px-4 py-2 text-end capitalize">
                    {emp.EmployeeRole}
                  </td>
                  <td className="px-4 py-2 capitalize">
                    <div className="flex flex-col gap-2">
                      <span className="text-end">
                        {getEmpStatus(emp.EmployeeStatus || 'N/A')}
                      </span>
                    </div>
                  </td>
                  <td className=" py-2 px-2">
                    {empLicenseExpDetails(emp.EmployeeLicenses) && (
                      <Tooltip
                        styles={{ tooltip: { padding: 0 } }}
                        label={
                          <div className="bg-surface shadow px-4 py-2 text-textPrimary font-semibold capitalize flex items-center gap-2">
                            <span>
                              <MdOutlineWarningAmber className="text-2xl text-textPrimaryRed animate-pulse font-semibold" />
                            </span>
                            <span>
                              {empLicenseExpDetails(emp.EmployeeLicenses)}
                            </span>
                          </div>
                        }
                      >
                        <div>
                          <MdOutlineWarningAmber className="text-2xl text-textPrimaryRed animate-pulse font-semibold" />
                        </div>
                      </Tooltip>
                    )}
                  </td>
                </tr>
              );
            })
          )}
          <tr ref={ref}>
            <td colSpan={8}>
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
