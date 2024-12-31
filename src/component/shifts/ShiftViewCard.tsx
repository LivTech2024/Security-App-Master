import { useState } from 'react';
import {
  IEmployeeRouteCollection,
  IShiftsCollection,
} from '../../@types/database';
import { formatDate } from '../../utilities/misc';
import { errorHandler } from '../../utilities/CustomError';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../utilities/TsxUtils';
import DbShift from '../../firebase_configs/DB/DbShift';
import { RxUpdate } from 'react-icons/rx';
import UpdateShiftTimeModal from './modal/UpdateShiftTimeModal';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IDevelopmentDetails, PageRoutes } from '../../@types/enum';
import { openContextModal } from '@mantine/modals';
import Button from '../../common/button/Button';
import { useUIState } from '../../store';
import { FaCheck } from 'react-icons/fa';

const ShiftViewCard = ({
  data,
  assignedUsers,
  acknowledgedUsers,
  empRoutes,
  setShouldRefetch,
}: {
  data: IShiftsCollection;
  assignedUsers: { EmpName: string; EmpId: string }[];
  acknowledgedUsers: string[];
  empRoutes: IEmployeeRouteCollection[];
  setShouldRefetch: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { setLoading } = useUIState();

  const [searchParam] = useSearchParams();

  const dev = searchParam.get('dev');

  const markShiftEnded = async (empId: string) => {
    try {
      showModalLoader({});

      await DbShift.markShiftEnded(data.ShiftId, empId);

      showSnackbar({
        message: 'Shift marked completed for selected employee',
        type: 'success',
      });

      setShouldRefetch((prev) => !prev);

      closeModalLoader();
    } catch (error) {
      console.log(error);
      errorHandler(error);
      closeModalLoader();
    }
  };

  const [updateShiftTimeModal, setUpdateShiftTimeModal] = useState(false);

  const [updateShiftTimeArgs, setUpdateShiftTimeArgs] = useState<{
    empId: string;
    field: 'start_time' | 'end_time';
  }>({ empId: '', field: 'start_time' });

  const navigate = useNavigate();

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
          <p className="font-semibold">Is special shift:</p>
          <ul>{data.ShiftIsSpecialShift ? 'Yes' : 'No'}</ul>
        </div>

        {/* Show Shift Current Status */}
        <div className="w-full flex flex-col col-span-2">
          <p className="font-semibold">Shift Current Status</p>
          <div className="flex gap-4 overflow-x-auto shift-emp-scrollbar w-full">
            {data?.ShiftCurrentStatus &&
            data?.ShiftCurrentStatus?.length > 0 ? (
              data?.ShiftCurrentStatus?.map((data, idx) => {
                return (
                  <div
                    key={idx}
                    className="flex flex-col bg-onHoverBg p-4 rounded-md w-full min-w-[300px]"
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
                      <RxUpdate
                        onClick={() => {
                          if (!data.StatusReportedById) return;
                          setUpdateShiftTimeModal(true);
                          setUpdateShiftTimeArgs({
                            empId: data.StatusReportedById,
                            field: 'start_time',
                          });
                        }}
                        className="text-textPrimaryBlue cursor-pointer hover:scale-105"
                      />
                    </div>

                    {data.Status === 'completed' ? (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold capitalize">
                          Ended At:
                        </span>
                        {data.StatusReportedTime &&
                          formatDate(
                            data.StatusReportedTime,
                            'DD MMM-YY HH:mm'
                          )}{' '}
                        <RxUpdate
                          onClick={() => {
                            if (!data.StatusReportedById) return;
                            setUpdateShiftTimeModal(true);
                            setUpdateShiftTimeArgs({
                              empId: data.StatusReportedById,
                              field: 'end_time',
                            });
                          }}
                          className="text-textPrimaryBlue cursor-pointer hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          openContextModal({
                            modal: 'confirmModal',
                            withCloseButton: false,
                            centered: true,
                            closeOnClickOutside: true,
                            innerProps: {
                              title: 'Confirm',
                              body: 'Are you sure to mark this shift ended',
                              onConfirm: () => {
                                if (data.StatusReportedById) {
                                  markShiftEnded(data.StatusReportedById);
                                }
                              },
                            },
                            size: '30%',
                            styles: {
                              body: { padding: '0px' },
                            },
                          });
                        }}
                        className="flex items-center gap-2 text-textPrimaryBlue cursor-pointer underline"
                      >
                        Mark this shift ended
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

      <UpdateShiftTimeModal
        empId={updateShiftTimeArgs.empId}
        field={updateShiftTimeArgs.field}
        opened={updateShiftTimeModal}
        setOpened={setUpdateShiftTimeModal}
        setShouldRefetch={setShouldRefetch}
        shiftId={data.ShiftId}
      />

      {/* Show all the tasks */}
      {data.ShiftTask.length > 0 ? (
        <div className="flex flex-col gap-1 mt-4">
          <p className="font-semibold">Shift Start Tasks</p>
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

      {data.ShiftTask.length > 0 &&
      data.ShiftTask.some((t) => t.ShiftTaskReturnReq) ? (
        <div className="flex flex-col gap-1 mt-4">
          <p className="font-semibold">Shift End Tasks</p>
          <div className="flex gap-6 overflow-x-auto shift-emp-scrollbar">
            {data.ShiftTask.filter((res) => res.ShiftTaskReturnReq).map(
              (task, idx) => {
                return (
                  <div className="flex flex-col w-full min-w-[400px] max-w-[30%]">
                    <span className="text-lg font-semibold">
                      {idx + 1}. {task.ShiftTask}
                    </span>
                    {task?.ShiftReturnTaskStatus?.length > 0 ? (
                      <div className="flex flex-col gap-4 h-full w-full justify-between">
                        {task.ShiftReturnTaskStatus?.map((s) => {
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
              }
            )}
          </div>
        </div>
      ) : null}

      {/* Show wellness report data */}

      <div className="flex flex-col gap-1 mt-4">
        <p className="font-semibold">Wellness report</p>
        {data?.ShiftGuardWellnessReport.length ? (
          <div className="flex flex-wrap gap-6 ">
            {data?.ShiftGuardWellnessReport?.map((res, idx) => {
              return (
                <div
                  key={idx}
                  className="flex flex-col bg-onHoverBg shadow rounded p-4"
                >
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
                  {res.WellnessImg ? (
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
                  ) : (
                    <div>
                      <FaCheck className="w-[100px] h-[100px] text-textPrimaryGreen" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : dev == IDevelopmentDetails.DEV_NAME ? (
          <div className="flex items-center flex-wrap gap-4 mt-4">
            {data.ShiftCurrentStatus.filter(
              (s) => s.Status === 'completed'
            ).map((s) => {
              return (
                <div
                  key={s.StatusReportedById}
                  className="flex flex-col bg-onHoverBg p-4 rounded "
                >
                  <div>Employee: {s.StatusReportedByName}</div>
                  <Button
                    label="Complete"
                    onClick={() => {
                      openContextModal({
                        modal: 'confirmModal',
                        withCloseButton: false,
                        centered: true,
                        closeOnClickOutside: true,
                        innerProps: {
                          title: 'Confirm',
                          body: `Are you sure to complete wellness report of ${s.StatusReportedByName}`,
                          onConfirm: async () => {
                            setLoading(true);
                            await DbShift.completeWellnessCheck(
                              data.ShiftId,
                              s.StatusReportedById || ''
                            );
                            setShouldRefetch(true);
                            setLoading(false);
                          },
                        },
                        size: '30%',
                        styles: {
                          body: { padding: '0px' },
                        },
                      });
                    }}
                    type="black"
                    className="mt-1 text-xs px-2 py-[6px]"
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div>N/A</div>
        )}
      </div>

      {/* Show Emp route details */}
      {empRoutes.length ? (
        <div className="flex flex-col gap-1 mt-4">
          <p className="font-semibold">Employees Route</p>
          <div className="flex flex-wrap gap-4">
            {assignedUsers?.map((res) => {
              const empRoute = empRoutes.find(
                (route) => route.EmpRouteEmpId === res.EmpId
              );
              if (empRoute && empRoute.EmpRouteLocations?.length > 0) {
                return (
                  <div key={res.EmpId} className="flex flex-col">
                    <div
                      onClick={() =>
                        navigate(
                          PageRoutes.EMPLOYEE_ROUTE +
                            `?id=${empRoute.EmpRouteId}&is_mobile_guard=${data.ShiftClientId ? false : true}`
                        )
                      }
                      className="text-textPrimaryBlue cursor-pointer underline"
                    >
                      {res.EmpName}
                    </div>
                  </div>
                );
              } else {
                return <span>N/A</span>;
              }
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ShiftViewCard;
