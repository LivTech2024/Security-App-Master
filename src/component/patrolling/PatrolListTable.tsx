import { useNavigate } from 'react-router-dom';
import { IPatrolsCollection } from '../../@types/database';
import NoSearchResult from '../../common/NoSearchResult';
import TableShimmer from '../../common/shimmer/TableShimmer';
import { MdEdit } from 'react-icons/md';
import { useAuthState, useEditFormStore } from '../../store';
import { PageRoutes } from '../../@types/enum';

interface PatrollingListTableProps {
  data: IPatrolsCollection[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  redirectOnClick: string;
  ref: () => void;
}

const PatrolListTable = ({
  data,
  isLoading,
  isFetchingNextPage,
  redirectOnClick,
  ref,
}: PatrollingListTableProps) => {
  const navigate = useNavigate();

  const handleRowClicked = (patrolId: string) => {
    navigate(redirectOnClick + `?id=${patrolId}`);
  };

  const { setPatrolEditData } = useEditFormStore();

  const { admin, company } = useAuthState();

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

          {admin && company && (
            <th className="uppercase px-4 py-2 w-[5%] text-end">&nbsp;</th>
          )}
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
              <tr key={patrol.PatrolId} className="cursor-pointer">
                <td
                  onClick={() => handleRowClicked(patrol.PatrolId)}
                  className="px-4 py-2 text-start align-top"
                >
                  <span className="line-clamp-2">{patrol.PatrolName}</span>
                </td>
                <td
                  onClick={() => handleRowClicked(patrol.PatrolId)}
                  className="px-4 py-2 text-start align-top "
                >
                  <span className="line-clamp-3">
                    {patrol.PatrolLocationName}
                  </span>
                </td>

                <td
                  onClick={() => handleRowClicked(patrol.PatrolId)}
                  className="px-4 py-2 text-center align-top"
                >
                  {patrol.PatrolCheckPoints.length.toFixed(1)}
                </td>

                {admin && company && (
                  <td
                    onClick={() => {
                      if (admin && company) {
                        setPatrolEditData(patrol);
                        navigate(PageRoutes.PATROLLING_CREATE_OR_EDIT);
                      }
                    }}
                    className="px-4 py-2 text-end capitalize align-top flex justify-end"
                  >
                    <MdEdit className="text-lg text-textPrimaryBlue cursor-pointer hover:scale-110 duration-150" />
                  </td>
                )}
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
