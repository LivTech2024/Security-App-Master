import { useNavigate } from "react-router-dom";
import { IPatrolsCollection } from "../../@types/database";
import NoSearchResult from "../../common/NoSearchResult";
import TableShimmer from "../../common/shimmer/TableShimmer";
import { PatrolStatus } from "./PatrolStatus";

interface PatrollingListTableProps {
  data: IPatrolsCollection[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  redirectOnClick: string;
  ref: (node?: Element | null | undefined) => void;
}

const PatrolListTable = ({
  data,
  isLoading,
  isFetchingNextPage,
  redirectOnClick,
  ref,
}: PatrollingListTableProps) => {
  const navigate = useNavigate();
  return (
    <table className="rounded overflow-hidden w-full">
      <thead className="bg-primary text-surface text-sm">
        <tr>
          <th className="uppercase px-4 py-2 w-[20%] text-start">
            Patrol Name
          </th>
          <th className="uppercase px-4 py-2 w-[20%] text-start">Location</th>
          <th className="uppercase px-4 py-2 w-[10%] text-center">
            Checkpoints
          </th>
          <th className="uppercase px-4 py-2 w-[15%] text-center">
            Required Times
          </th>

          <th className="uppercase px-4 py-2 w-[20%] text-end">Status</th>
        </tr>
      </thead>
      <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
        {data.length === 0 && !isLoading ? (
          <tr>
            <td colSpan={7}>
              <NoSearchResult text="No result found" />
            </td>
          </tr>
        ) : (
          data.map((patrol) => {
            return (
              <tr
                key={patrol.PatrolId}
                onClick={() =>
                  navigate(redirectOnClick + `?id=${patrol.PatrolId}`)
                }
                className="cursor-pointer"
              >
                <td className="px-4 py-2 text-start align-top">
                  <span className="line-clamp-2">{patrol.PatrolName}</span>
                </td>
                <td className="px-4 py-2 text-start align-top ">
                  <span className="line-clamp-3">
                    {patrol.PatrolLocationName}
                  </span>
                </td>

                <td className="px-4 py-2 text-center align-top">
                  {patrol.PatrolCheckPoints.length.toFixed(1)}
                </td>
                <td className="px-4 py-2 text-center align-top">
                  {patrol.PatrolRequiredCount}
                </td>
                <td className="px-4 py-2 text-end capitalize align-top">
                  <PatrolStatus
                    status={
                      patrol.PatrolCurrentStatus[
                        patrol.PatrolCurrentStatus?.length - 1
                      ]?.Status || "pending"
                    }
                  />
                </td>
              </tr>
            );
          })
        )}
        <tr ref={ref}>
          <td colSpan={7}>
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

export default PatrolListTable;
