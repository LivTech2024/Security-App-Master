import { useInView } from 'react-intersection-observer';
import PageHeader from '../../common/PageHeader';
import DateFilterDropdown from '../../common/dropdown/DateFilterDropdown';
import { useEffect, useState } from 'react';
import { IVisitorsCollection } from '../../@types/database';
import { DocumentData } from 'firebase/firestore';
import { DisplayCount, PageRoutes, REACT_QUERY_KEYS } from '../../@types/enum';
import DbCompany from '../../firebase_configs/DB/DbCompany';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuthState } from '../../store';
import dayjs from 'dayjs';
import SelectBranch from '../../common/SelectBranch';
import NoSearchResult from '../../common/NoSearchResult';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utilities/misc';
import TableShimmer from '../../common/shimmer/TableShimmer';

const VisitorList = () => {
  const [startDate, setStartDate] = useState<Date | string | null>(
    dayjs().startOf('M').toDate()
  );

  const [endDate, setEndDate] = useState<Date | string | null>(
    dayjs().endOf('M').toDate()
  );

  const [isLifeTime, setIsLifeTime] = useState(false);

  const [branchId, setBranchId] = useState('');

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
      REACT_QUERY_KEYS.VISITOR_LIST,
      company!.CompanyId,
      isLifeTime,
      startDate,
      endDate,
      branchId,
    ],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbCompany.getVisitors({
        lmt: DisplayCount.VISITOR_LIST,
        lastDoc: pageParam,
        cmpId: company!.CompanyId,
        isLifeTime,
        startDate,
        endDate,
        branchId,
      });
      return snapshot.docs;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage?.length === 0) {
        return null;
      }
      if (lastPage?.length === DisplayCount.VISITOR_LIST) {
        return lastPage.at(-1);
      }
      return null;
    },
    initialPageParam: null as null | DocumentData,
  });

  const [data, setData] = useState<IVisitorsCollection[]>(() => {
    if (snapshotData) {
      return snapshotData.pages.flatMap((page) =>
        page.map((doc) => doc.data() as IVisitorsCollection)
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
      const docData: IVisitorsCollection[] = [];
      snapshotData.pages?.forEach((page) => {
        page?.forEach((doc) => {
          const data = doc.data() as IVisitorsCollection;
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
      <PageHeader title="Visitors" />
      <div className="flex items-center justify-between w-full gap-4 p-4 rounded bg-surface shadow">
        <DateFilterDropdown
          endDate={endDate}
          isLifetime={isLifeTime}
          setEndDate={setEndDate}
          setIsLifetime={setIsLifeTime}
          setStartDate={setStartDate}
          startDate={startDate}
        />
        <SelectBranch
          selectedBranch={branchId}
          setSelectedBranch={setBranchId}
        />
      </div>
      <table className="rounded overflow-hidden w-full">
        <thead className="bg-primary text-surface text-sm">
          <tr>
            <th className="uppercase px-4 py-2 w-[15%] text-start">
              Visitor Name
            </th>
            <th className="uppercase px-4 py-2 w-[15%] text-start">Contact</th>

            <th className="uppercase px-4 py-2 w-[15%] text-start">In Time</th>
            <th className="uppercase px-4 py-2 w-[15%] text-start">Out Time</th>
            <th className="uppercase px-4 py-2 w-[15%] text-start">Location</th>

            <th className="uppercase px-4 py-2 w-[25%] text-end">Asset</th>
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
            data.map((visitor) => {
              return (
                <tr
                  key={visitor.VisitorName}
                  className="cursor-pointer"
                  onClick={() =>
                    navigate(
                      PageRoutes.VISITOR_VIEW + `?id=${visitor.VisitorId}`
                    )
                  }
                >
                  <td className="align-top px-4 py-2 text-start">
                    <span className="line-clamp-3">{visitor.VisitorName}</span>
                  </td>
                  <td className="align-top px-4 py-2 text-start">
                    <div className="flex flex-col">
                      <span>{visitor.VisitorContactNumber}</span>
                      <span className="text-textSecondary leading-3 text-sm">
                        {visitor.VisitorEmail}
                      </span>
                    </div>
                  </td>

                  <td className="align-top px-4 py-2 text-start">
                    <span className="line-clamp-2">
                      {formatDate(visitor.VisitorInTime, 'DD MMM-YY hh:mm A')}
                    </span>
                  </td>
                  <td className="align-top px-4 py-2 text-start ">
                    <span className="line-clamp-2">
                      {formatDate(visitor.VisitorOutTime, 'DD MMM-YY hh:mm A')}
                    </span>
                  </td>
                  <td className="align-top px-4 py-2 text-start ">
                    <span className="line-clamp-2">
                      {visitor.VisitorLocationName}
                    </span>
                  </td>
                  <td className="align-top px-4 py-2 text-end">
                    <span className="line-clamp-2">
                      {visitor.VisitorAssetHandover}
                    </span>
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

export default VisitorList;
