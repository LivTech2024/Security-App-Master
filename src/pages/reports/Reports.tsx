import { useEffect, useState } from "react";
import DateFilterDropdown from "../../common/dropdown/DateFilterDropdown";
import dayjs from "dayjs";
import NoSearchResult from "../../common/NoSearchResult";
import { useAuthState } from "../../store";
import { useInfiniteQuery } from "@tanstack/react-query";
import { DisplayCount, REACT_QUERY_KEYS } from "../../@types/enum";
import DbCompany from "../../firebase_configs/DB/DbCompany";
import { DocumentData } from "firebase/firestore";
import { IReportsCollection } from "../../@types/database";
import { useInView } from "react-intersection-observer";
import { formatDate } from "../../utilities/misc";
import TableShimmer from "../../common/shimmer/TableShimmer";
import SelectBranch from "../../common/SelectBranch";

const Reports = () => {
  const [startDate, setStartDate] = useState<Date | string | null>(
    dayjs().startOf("M").toDate()
  );

  const [endDate, setEndDate] = useState<Date | string | null>(
    dayjs().endOf("M").toDate()
  );

  const [isLifeTime, setIsLifeTime] = useState(false);

  const [branchId, setBranchId] = useState("");

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
      REACT_QUERY_KEYS.REPORT_LIST,
      company!.CompanyId,
      isLifeTime,
      startDate,
      endDate,
      branchId,
    ],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbCompany.getReports({
        lmt: DisplayCount.REPORT_LIST,
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
      if (lastPage?.length === DisplayCount.EMPLOYEE_LIST) {
        return lastPage.at(-1);
      }
      return null;
    },
    initialPageParam: null as null | DocumentData,
  });

  const [data, setData] = useState<IReportsCollection[]>(() => {
    if (snapshotData) {
      return snapshotData.pages.flatMap((page) =>
        page.map((doc) => doc.data() as IReportsCollection)
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
      const docData: IReportsCollection[] = [];
      snapshotData.pages?.forEach((page) => {
        page?.forEach((doc) => {
          const data = doc.data() as IReportsCollection;
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
        <span className="font-semibold text-xl">Reports</span>
      </div>
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
              Report Name
            </th>
            <th className="uppercase px-4 py-2 w-[10%] text-start">Category</th>
            <th className="uppercase px-4 py-2 w-[15%] text-start">
              Employee Name
            </th>
            <th className="uppercase px-4 py-2 w-[30%] text-start">Data</th>

            <th className="uppercase px-4 py-2 w-[10%] text-end">Status</th>
            <th className="uppercase px-4 py-2 w-[15%] text-end">Date</th>
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
            data.map((report) => {
              return (
                <tr key={report.ReportId}>
                  <td className="align-top px-4 py-2 text-start">
                    <span className="line-clamp-3">{report.ReportName}</span>
                  </td>
                  <td className="align-top px-4 py-2 text-start uppercase">
                    {report.ReportCategory}
                  </td>

                  <td className="align-top px-4 py-2 text-start">
                    <span className="line-clamp-2">
                      {report.ReportEmployeeName}
                    </span>
                  </td>
                  <td className="align-top px-4 py-2 text-start">
                    <span className="line-clamp-4">{report.ReportData}</span>
                  </td>
                  <td className="align-top px-4 py-2 text-end capitalize">
                    {report.ReportStatus}
                  </td>
                  <td className="align-top px-4 py-2 text-end">
                    {formatDate(report.ReportCreatedAt)}
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

export default Reports;
