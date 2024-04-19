import { useNavigate } from 'react-router-dom';
import { IShiftsCollection } from '../../@types/database';
import NoSearchResult from '../../common/NoSearchResult';
import { formatDate } from '../../utilities/misc';
import TableShimmer from '../../common/shimmer/TableShimmer';

interface ShiftListTableProps {
  data: IShiftsCollection[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  redirectOnClick: string;
  ref: () => void;
}

const ShiftListTable = ({
  data,
  isFetchingNextPage,
  isLoading,
  redirectOnClick,
  ref,
}: ShiftListTableProps) => {
  const navigate = useNavigate();
  return (
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
          <th className="uppercase px-4 py-2 w-[16.67%] text-start">
            Position
          </th>
          <th className="uppercase px-4 py-2 w-[16.67%] text-end">
            Description
          </th>
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
          data.map((shift) => {
            return (
              <tr
                key={shift.ShiftId}
                onClick={() =>
                  navigate(redirectOnClick + `?id=${shift.ShiftId}`)
                }
                className="cursor-pointer "
              >
                <td className="px-4 py-2 text-start">{shift.ShiftName}</td>
                <td className="px-4 py-2 text-start">
                  {formatDate(shift.ShiftDate)}
                </td>
                <td className="px-4 py-2 text-start">{shift.ShiftStartTime}</td>
                <td className="px-4 py-2 text-start">{shift.ShiftEndTime}</td>
                <td className="px-4 py-2 text-start capitalize">
                  {shift.ShiftPosition}
                </td>
                <td className="px-4 py-2 text-end">
                  {shift.ShiftDescription || 'N/A'}
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

export default ShiftListTable;
