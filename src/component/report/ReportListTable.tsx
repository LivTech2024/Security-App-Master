import { useNavigate } from 'react-router-dom';
import { IReportsCollection } from '../../@types/database';
import NoSearchResult from '../../common/NoSearchResult';
import TableShimmer from '../../common/shimmer/TableShimmer';
import { formatDate } from '../../utilities/misc';

interface ReportListTableProps {
  data: IReportsCollection[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  redirectOnClick: string;
  ref: () => void;
}

const ReportListTable = ({
  data,
  isFetchingNextPage,
  isLoading,
  redirectOnClick,
  ref,
}: ReportListTableProps) => {
  const navigate = useNavigate();
  return (
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
              <tr
                key={report.ReportId}
                className="cursor-pointer"
                onClick={() =>
                  navigate(redirectOnClick + `?id=${report.ReportId}`)
                }
              >
                <td className="align-top px-4 py-2 text-start">
                  <span className="line-clamp-3">{report.ReportName}</span>
                </td>
                <td className="align-top px-4 py-2 text-start uppercase">
                  {report.ReportCategoryName}
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
  );
};

export default ReportListTable;
