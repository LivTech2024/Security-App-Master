import { useState } from 'react';
import {
  IEmployeeRouteCollection,
  IShiftsCollection,
} from '../../@types/database';
import { formatDate } from '../../utilities/misc';
import EmpRouteModal from './modal/EmpRouteModal';

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
  const [empRouteModal, setEmpRouteModal] = useState(false);

  const [coordinates, setCoordinates] = useState<
    { lat: number; lng: number }[]
  >([]);
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
        {/* Show Shift Current Status */}
        <div>
          <p className="font-semibold">Shift Current Status</p>
          <div className="flex gap-4 overflow-x-auto shift-emp-scrollbar">
            {data?.ShiftCurrentStatus &&
            data?.ShiftCurrentStatus?.length > 0 ? (
              data?.ShiftCurrentStatus?.map((data, idx) => {
                return (
                  <div
                    key={idx}
                    className="flex flex-col bg-onHoverBg p-4 rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold capitalize">
                        Employee:
                      </span>
                      {data.StatusReportedByName}
                    </div>
                    <div className="flex items-center gap-2 capitalize">
                      <span className="font-semibold capitalize">
                        Current Status:
                      </span>
                      {data.Status}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold capitalize">
                        Started At:
                      </span>
                      {data.StatusStartedTime &&
                        formatDate(data.StatusStartedTime, 'DD MMM-YY HH:mm')}
                    </div>

                    {data.Status === 'completed' && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold capitalize">
                          Ended At:
                        </span>
                        {data.StatusReportedTime &&
                          formatDate(
                            data.StatusReportedTime,
                            'DD MMM-YY HH:mm'
                          )}
                      </div>
                    )}

                    {data.StatusEndReason && (
                      <div className="text-sm mt-1 text-textSecondary">
                        End Reason: {data.StatusEndReason}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <li className="capitalize list-decimal">Pending</li>
            )}
          </div>
        </div>
      </div>

      {/* Show all the tasks */}
      {data.ShiftTask.length > 0 ? (
        <div className="flex flex-col gap-1 mt-4">
          <p className="font-semibold">Shift Tasks</p>
          <div className="flex gap-6 overflow-x-auto shift-emp-scrollbar">
            {data.ShiftTask.map((task, idx) => {
              return (
                <div className="flex flex-col w-full min-w-[400px] max-w-[30%]">
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
                              <div className="flex gap-4 overflow-x-auto shift-emp-scrollbar">
                                {s.TaskPhotos?.map((img) => {
                                  return (
                                    <a
                                      key={idx}
                                      href={img}
                                      target="_blank"
                                      className="cursor-pointer text-textPrimaryBlue"
                                    >
                                      <img
                                        src={img}
                                        alt=""
                                        className="w-[100px] h-[100px] rounded object-cover"
                                      />
                                    </a>
                                  );
                                })}
                              </div>
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

      {/* Show wellness report data */}
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
                      {formatDate(res?.WellnessReportedAt, 'DD MMM-YY HH:mm')}
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
                        <img
                          src={res.WellnessImg}
                          alt=""
                          className="w-[100px] h-[100px] rounded"
                        />
                      </a>{' '}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Show Emp route details */}
      {empRoutes.length ? (
        <div className="flex flex-col gap-1 mt-4">
          <p className="font-semibold">Employees Route</p>
          <div className="flex flex-wrap gap-4">
            {assignedUsers?.map((res) => {
              const empRoute = empRoutes.find(
                (route) => route.EmpRouteEmpId === res.EmpId
              );
              if (empRoute && empRoute.EmpRouteLocations?.length > 0)
                return (
                  <div key={res.EmpId} className="flex flex-col">
                    <div
                      onClick={() => {
                        setCoordinates(
                          empRoute.EmpRouteLocations.map((loc) => {
                            return {
                              lat: loc.LocationCoordinates.latitude,
                              lng: loc.LocationCoordinates.longitude,
                            };
                          })
                        );
                        setEmpRouteModal(true);
                      }}
                      className="text-textPrimaryBlue cursor-pointer underline"
                    >
                      {res.EmpName}
                    </div>
                  </div>
                );
            })}
          </div>
        </div>
      ) : null}

      <EmpRouteModal
        coordinates={coordinates}
        opened={empRouteModal}
        setOpened={setEmpRouteModal}
      />
    </div>
  );
};

export default ShiftViewCard;
