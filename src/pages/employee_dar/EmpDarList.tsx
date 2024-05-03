import { useEffect, useState } from 'react';
import PageHeader from '../../common/PageHeader';
import EmpDarListMenus from '../../component/emp_dar/EmpDarListMenus';
import dayjs from 'dayjs';
import { useAuthState } from '../../store';
import { useInfiniteQuery } from '@tanstack/react-query';
import { DisplayCount, PageRoutes, REACT_QUERY_KEYS } from '../../@types/enum';
import DbEmployee from '../../firebase_configs/DB/DbEmployee';
import { DocumentData } from 'firebase/firestore';
import { IEmployeeDARCollection } from '../../@types/database';
import { useInView } from 'react-intersection-observer';
import NoSearchResult from '../../common/NoSearchResult';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utilities/misc';
import TableShimmer from '../../common/shimmer/TableShimmer';

const EmpDarList = () => {
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState<Date | string | null>(
    dayjs().startOf('M').toDate()
  );

  const [endDate, setEndDate] = useState<Date | string | null>(
    dayjs().endOf('M').toDate()
  );

  const [isLifeTime, setIsLifeTime] = useState(false);

  const [selectedEmpId, setSelectedEmpId] = useState('');

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
    queryKey: [
      REACT_QUERY_KEYS.EMP_DAR_LIST,
      company!.CompanyId,
      isLifeTime,
      startDate,
      endDate,
      selectedEmpId,
    ],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbEmployee.getEmpDars({
        lmt: DisplayCount.EMP_DAR_LIST,
        lastDoc: pageParam,
        cmpId: company!.CompanyId,
        isLifeTime,
        startDate,
        endDate,
        empId: selectedEmpId,
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

  const [data, setData] = useState<IEmployeeDARCollection[]>(() => {
    if (snapshotData) {
      return snapshotData.pages.flatMap((page) =>
        page.map((doc) => doc.data() as IEmployeeDARCollection)
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
      const docData: IEmployeeDARCollection[] = [];
      snapshotData.pages?.forEach((page) => {
        page?.forEach((doc) => {
          const data = doc.data() as IEmployeeDARCollection;
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
      <PageHeader title="Employees daily activity report" />
      <EmpDarListMenus
        endDate={endDate}
        isLifeTime={isLifeTime}
        setEndDate={setEndDate}
        setIsLifeTime={setIsLifeTime}
        setStartDate={setStartDate}
        startDate={startDate}
        selectedEmpId={selectedEmpId}
        setSelectedEmpId={setSelectedEmpId}
      />

      <table className="rounded overflow-hidden w-full">
        <thead className="bg-primary text-surface text-sm">
          <tr>
            <th className="uppercase px-4 py-2 w-[15%] text-start">
              Employee Name
            </th>
            <th className="uppercase px-4 py-2 w-[15%] text-start">Date</th>
            <th className="uppercase px-4 py-2 w-[15%] text-end">Location</th>
          </tr>
        </thead>
        <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
          {data.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={3}>
                <NoSearchResult />
              </td>
            </tr>
          ) : (
            data.map((dar) => {
              return (
                <tr
                  key={dar.EmpDarId}
                  className="cursor-pointer"
                  onClick={() =>
                    navigate(
                      PageRoutes.EMPLOYEE_DAR_VIEW + `?id=${dar.EmpDarId}`
                    )
                  }
                >
                  <td className="align-top px-4 py-2 text-start capitalize">
                    <span className="line-clamp-2">{dar.EmpDarEmpName}</span>
                  </td>

                  <td className="align-top px-4 py-2 text-start">
                    <span className="line-clamp-2">
                      {formatDate(dar.EmpDarDate)}
                    </span>
                  </td>
                  <td className="align-top px-4 py-2 text-end">
                    <span className="line-clamp-2">
                      {dar.EmpDarLocationName}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
          <tr ref={ref}>
            <td colSpan={3}>
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

export default EmpDarList;
