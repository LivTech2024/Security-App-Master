import {
  IEmployeeRouteCollection,
  IShiftsCollection,
} from '../../@types/database';
import { formatDate } from '../../utilities/misc';

const ShiftViewCard = ({
  data,
  assignedUsers,
  acknowledgedUsers,
  empRoutes,
}: {
  data: IShiftsCollection;
  assignedUsers: { EmpName: string; EmpId: string }[];
  acknowledgedUsers: string[];
  empRoutes: IEmployeeRouteCollection[];
}) => {
  return (
    <div className="bg-surface shadow-md rounded-lg p-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="font-semibold">Shift Name:</p>
          <p>{data?.ShiftName || 'N/A'}</p>
        </div>
        <div>
          <p className="font-semibold">Shift Position:</p>
          <p>{data?.ShiftPosition || 'N/A'}</p>
        </div>
        <div>
          <p className="font-semibold">Shift Date:</p>
          <p>{data?.ShiftDate ? formatDate(data?.ShiftDate) : 'N/A'}</p>
        </div>
        <div>
          <p className="font-semibold">Shift Start Time:</p>
          <p>{data?.ShiftStartTime || 'N/A'}</p>
        </div>
        <div>
          <p className="font-semibold">Shift End Time:</p>
          <p>{data?.ShiftEndTime || 'N/A'}</p>
        </div>
        <div>
          <p className="font-semibold">Shift Location:</p>
          <p>{data?.ShiftLocationName || 'N/A'}</p>
          {data?.ShiftLocationAddress && <p>{data?.ShiftLocationAddress}</p>}
        </div>
        <div>
          <p className="font-semibold">Shift Restricted Radius:</p>
          <p>
            {data?.ShiftEnableRestrictedRadius
              ? `${data?.ShiftRestrictedRadius} meters`
              : 'Not enabled'}
          </p>
        </div>
        <div>
          <p className="font-semibold">Shift Description:</p>
          <p>{data?.ShiftDescription || 'N/A'}</p>
        </div>
        <div>
          <p className="font-semibold">Shift Assigned Users:</p>
          <p>{assignedUsers.map((res) => res.EmpName).join(' , ') || 'N/A'}</p>
        </div>
        <div>
          <p className="font-semibold">Shift Acknowledged By Employees:</p>
          <ul>{acknowledgedUsers.join(' , ') || 'N/A'}</ul>
        </div>
        <div>
          <p className="font-semibold">Shift Current Status</p>
          <ul className="px-4">
            {data?.ShiftCurrentStatus &&
            data?.ShiftCurrentStatus?.length > 0 ? (
              data?.ShiftCurrentStatus?.map((data, idx) => {
                return (
                  <div key={idx} className="flex flex-col">
                    <li className="capitalize list-decimal">
                      {data.Status} by {data.StatusReportedByName}
                    </li>
                    {data.StatusEndReason && (
                      <li className="text-sm mt-1 text-textSecondary">
                        End Reason: {data.StatusEndReason}
                      </li>
                    )}
                  </div>
                );
              })
            ) : (
              <li className="capitalize list-decimal">Pending</li>
            )}
          </ul>
        </div>
      </div>

      {data.ShiftTask.length > 0 ? (
        <div className="flex flex-col gap-1 mt-4">
          <p className="font-semibold">Shift Tasks</p>
          <div className="flex flex-wrap gap-6">
            {data.ShiftTask.map((task, idx) => {
              return (
                <div className="flex flex-col ">
                  <span className="text-lg font-semibold">
                    {idx + 1}. {task.ShiftTask}
                  </span>
                  {task?.ShiftTaskStatus?.length > 0 ? (
                    <div className="flex flex-col gap-4 h-full w-full justify-between">
                      {task.ShiftTaskStatus?.map((s) => {
                        return (
                          <div className="justify-between h-full bg-onHoverBg rounded p-4 ">
                            <div className=" flex flex-col ">
                              <span className="capitalize">
                                Status: {s.TaskStatus}
                              </span>
                              <span>Employee: {s.TaskCompletedByName}</span>
                              <span>
                                Completion Time:{' '}
                                {formatDate(
                                  s.TaskCompletionTime,
                                  'DD MMM-YY hh-mm A'
                                )}
                              </span>
                              {s.TaskPhotos?.length ? (
                                <span>Images: </span>
                              ) : null}
                              {s.TaskPhotos?.map((img, idx) => {
                                return (
                                  <a
                                    key={img}
                                    href={img}
                                    target="_blank"
                                    className="cursor-pointer text-textPrimaryBlue"
                                  >
                                    {idx + 1}. {img.slice(0, 30)}...
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="pl-4">Status: Pending</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      {data?.ShiftGuardWellnessReport.length ? (
        <div className="flex flex-col gap-1 mt-4">
          <p className="font-semibold">Wellness report</p>
          <div className="flex flex-wrap gap-6">
            {data?.ShiftGuardWellnessReport?.map((res, idx) => {
              return (
                <div key={idx} className="flex flex-col">
                  {res.WellnessEmpName && (
                    <div>Employee Name: {res?.WellnessEmpName}</div>
                  )}
                  {res.WellnessReportedAt && (
                    <div>
                      Reported At:{' '}
                      {formatDate(res?.WellnessReportedAt, 'DD MMM-YY hh:mm A')}
                    </div>
                  )}
                  {res.WellnessComment && (
                    <div>Comment: {res?.WellnessComment}</div>
                  )}
                  {res.WellnessImg && (
                    <div>
                      Image:{' '}
                      <a
                        href={res?.WellnessImg}
                        className="text-textPrimaryBlue cursor-pointer"
                      >
                        {res?.WellnessImg?.slice(0, 30)}...
                      </a>{' '}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {empRoutes.length ? (
        <div className="flex flex-col gap-1 mt-4">
          <p className="font-semibold">Employees Route</p>
          <div className="flex flex-wrap gap-4">
            {assignedUsers?.map((res) => {
              if (empRoutes.find((route) => route.EmpRouteEmpId === res.EmpId))
                return (
                  <div key={res.EmpId} className="flex flex-col">
                    <div className="text-textPrimaryBlue cursor-pointer underline">
                      {res.EmpName}
                    </div>
                  </div>
                );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ShiftViewCard;
