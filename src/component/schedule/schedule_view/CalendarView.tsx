import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import empDefaultPlaceHolder from '../../../../public/assets/avatar.png';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { PageRoutes, REACT_QUERY_KEYS } from '../../../@types/enum';
import DbSchedule, {
  IEmpScheduleForWeek,
  ISchedule,
} from '../../../firebase_configs/DB/DbSchedule';
import {
  formatDate,
  getHoursDiffInTwoTimeString,
  toDate,
} from '../../../utilities/misc';
import { Draggable, DropPoint } from '../../../utilities/DragAndDropHelper';
import {
  IEmployeesCollection,
  IShiftsCollection,
} from '../../../@types/database';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../../utilities/TsxUtils';
import { errorHandler } from '../../../utilities/CustomError';
import { useAuthState } from '../../../store';
import AssignShiftModal from '../modal/AssignShiftModal';
import SelectBranch from '../../../common/SelectBranch';
import { Accordion, Tooltip } from '@mantine/core';
import { sendEmail } from '../../../API/SendEmail';
import { useNavigate } from 'react-router-dom';
import { getColorAccToShiftStatus } from '../../../utilities/scheduleHelper';
import { MdOutlineInfo } from 'react-icons/md';
import Button from '../../../common/button/Button';
import { AiOutlineClose } from 'react-icons/ai';
import { FaRegTrashAlt, FaUndo } from 'react-icons/fa';
import DbShift from '../../../firebase_configs/DB/DbShift';

interface CalendarViewProps {
  datesArray: Date[];
}

const CalendarView = ({ datesArray }: CalendarViewProps) => {
  const navigate = useNavigate();

  const [schedules, setSchedules] = useState<ISchedule[]>([]);

  const { company, empRoles, settings } = useAuthState();

  const [branch, setBranch] = useState('');

  const queryClient = useQueryClient();

  const { data, error } = useQuery({
    queryKey: [
      REACT_QUERY_KEYS.SCHEDULES,
      datesArray,
      branch,
      company!.CompanyId,
    ],
    queryFn: async () => {
      const data = await DbSchedule.getSchedules(
        datesArray[0],
        datesArray[datesArray.length - 1],
        company!.CompanyId,
        branch
      );
      return data;
    },
  });

  useEffect(() => {
    console.log(error);
    setSchedules(data || []);
  }, [data, error]);

  const getScheduleForDay = (date: Date, schedules?: ISchedule[]) => {
    if (!schedules) return [];
    return schedules
      .filter((schedule) =>
        dayjs(toDate(schedule.shift.ShiftDate)).isSame(date, 'date')
      )
      ?.sort(
        (a, b) =>
          Number(
            a?.shift.ShiftStartTime?.split(':')[0] +
              a?.shift.ShiftStartTime?.split(':')[1] || 0
          ) -
          Number(
            b?.shift.ShiftStartTime?.split(':')[0] +
              b?.shift.ShiftStartTime?.split(':')[1] || 0
          )
      );
  };

  const [selectedSchedule, setSelectedSchedule] = useState<ISchedule | null>(
    null
  );

  const [empAvailableForShift, setEmpAvailableForShift] = useState<
    IEmpScheduleForWeek[]
  >([]);

  const [isEmpLoading, setIsEmpLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(datesArray[0]);

  useEffect(() => {
    setSelectedDate(new Date());
  }, []);

  useEffect(() => {
    const fetchEmpSchedule = async () => {
      if (!selectedDate || !company) return;
      try {
        setIsEmpLoading(true);
        const data = await DbSchedule.getEmployeesSchedule({
          startDate: dayjs(selectedDate).startOf('week').toDate(),
          endDate: dayjs(selectedDate).endOf('week').toDate(),
          currentDate: toDate(selectedDate),
          cmpId: company.CompanyId,
          cmpBranchId: branch,
        });
        if (data) {
          setEmpAvailableForShift(data);
        }
        setIsEmpLoading(false);
      } catch (error) {
        errorHandler(error);
        setIsEmpLoading(false);
        console.log(error, 'error');
      }
    };
    fetchEmpSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const [resultToBePublished, setResultToBePublished] = useState<
    {
      shift: IShiftsCollection;
      emp: IEmpScheduleForWeek;
    }[]
  >([]);

  const [shiftToBeDeleted, setShiftToBeDeleted] = useState<string[]>([]);

  const dropResult = (draggableId: string, dropPointId: string) => {
    const selectedEmp = empAvailableForShift.find(
      (emp) => emp.EmpId === draggableId
    );
    const selectedShift = schedules.find(
      (s) => s.shift.ShiftId === dropPointId
    );

    if (selectedShift?.shift && selectedShift.shift.ShiftRequiredEmp > 1) {
      showSnackbar({
        message:
          'This shift requires more than 1 employee, click on the shift to assign multiple employees to it',
        type: 'error',
      });
      return;
    }

    if (selectedShift?.employee && selectedShift.employee.length > 0) {
      showSnackbar({
        message: 'This shift already have assigned employees',
        type: 'error',
      });
      return;
    }

    if (!selectedEmp || !selectedShift) return;

    const shiftHours = getHoursDiffInTwoTimeString(
      selectedShift.shift.ShiftStartTime,
      selectedShift.shift.ShiftEndTime
    );

    const totalEmpWeekHoursAfterAssignation =
      shiftHours + selectedEmp.EmpWeekHours;

    if (totalEmpWeekHoursAfterAssignation > selectedEmp.EmpMaxWeekHours) {
      showSnackbar({
        message: 'Employee maximum hours per week exceeded',
        type: 'info',
      });
    }

    setResultToBePublished((prev) => [
      ...prev,
      { emp: selectedEmp, shift: selectedShift.shift },
    ]);

    setEmpAvailableForShift((prev) =>
      prev.filter((e) => e.EmpId !== selectedEmp?.EmpId)
    );

    setSchedules((prev) => {
      const updatedSchedules = prev.map((schedule) => {
        if (schedule.shift.ShiftId === selectedShift?.shift.ShiftId) {
          // Update the employee field for the selected schedule
          const updatedEmp: Partial<IEmployeesCollection> = {
            EmployeeId: selectedEmp?.EmpId,
            EmployeeName: selectedEmp?.EmpName,
          };
          return {
            ...schedule,
            employee: [updatedEmp],
          };
        }
        return schedule;
      });

      return updatedSchedules as ISchedule[];
    });
  };

  const onPublish = async () => {
    try {
      showModalLoader({});

      if (resultToBePublished.length > 0) {
        const shiftAssignPromise = resultToBePublished.map(async (result) => {
          return DbSchedule.assignShiftToEmp(result.shift.ShiftId, [
            result.emp.EmpId,
          ]);
        });

        await Promise.all(shiftAssignPromise);

        const aggregatedEmails: {
          empEmail: string;
          empName: string;
          message: string;
        }[] = [];

        resultToBePublished.forEach((data) => {
          const { emp, shift } = data;
          const isExistIndex = aggregatedEmails.findIndex(
            (d) => d.empEmail === emp.EmpEmail
          );
          if (isExistIndex !== -1) {
            const prevMessage = aggregatedEmails[isExistIndex].message;
            aggregatedEmails[isExistIndex].message =
              `${prevMessage}\n\nShift Name: ${
                shift.ShiftName
              } \n Date: ${formatDate(shift.ShiftDate)} \nTiming: ${
                shift.ShiftStartTime
              }-${shift.ShiftEndTime}\nAddress: ${shift.ShiftLocationAddress}`;
          } else {
            aggregatedEmails.push({
              empEmail: emp.EmpEmail,
              empName: emp.EmpName,
              message: `You have been assigned for the following shift.\n\n Shift Name: ${
                shift.ShiftName
              } \n Date: ${formatDate(shift.ShiftDate)} \n Timing: ${
                shift.ShiftStartTime
              }-${shift.ShiftEndTime} \n Address: ${shift.ShiftLocationAddress}`,
            });
          }
        });

        await Promise.all(
          aggregatedEmails.map(async (res) => {
            return sendEmail({
              to_email: res.empEmail,
              text: res.message,
              subject: 'Your schedule update',
              from_name: company!.CompanyName,
            });
          })
        );

        setResultToBePublished([]);
      }

      if (shiftToBeDeleted.length > 0) {
        const shiftDeletePromise = shiftToBeDeleted.map(async (result) => {
          return DbShift.deleteShift(result);
        });

        await Promise.all(shiftDeletePromise);

        setShiftToBeDeleted([]);
      }

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.SCHEDULES],
      });

      showSnackbar({
        message: 'Schedule published successfully',
        type: 'success',
      });
      closeModalLoader();
    } catch (error) {
      closeModalLoader();
      errorHandler(error);
      console.log(error);
    }
  };

  const onUndo = (shiftId?: string, empId?: string) => {
    if (resultToBePublished.length === 0) {
      return;
    }

    const lastResultIndex = resultToBePublished.length - 1;

    let resultToBeUndo;

    if (shiftId && empId) {
      resultToBeUndo = resultToBePublished.find(
        (res) => res.shift.ShiftId === shiftId
      );
      setResultToBePublished((prev) =>
        prev.filter((res) => res.shift.ShiftId !== shiftId)
      );
    } else {
      resultToBeUndo = resultToBePublished[lastResultIndex];
      setResultToBePublished((prev) => prev.slice(0, -1));
    }

    if (!resultToBeUndo) return;

    setSelectedDate(toDate(resultToBeUndo.shift.ShiftDate));

    const { emp, shift } = resultToBeUndo;

    if (!empAvailableForShift.find((e) => e.EmpId === emp.EmpId)) {
      setEmpAvailableForShift((prev) => [...prev, emp]);
    }

    setSchedules((prev) => {
      const updatedSchedules = prev.map((schedule) => {
        if (schedule.shift.ShiftId === shift.ShiftId) {
          return {
            ...schedule,
            employee: [],
          };
        }
        return schedule;
      });

      return updatedSchedules as ISchedule[];
    });
  };

  const onDeleteClick = (shiftId: string) => {
    setShiftToBeDeleted((prev) => [...prev, shiftId]);
  };

  const onDeleteUndo = (shiftId: string) => {
    setShiftToBeDeleted((prev) => prev.filter((s) => s !== shiftId));
  };

  /****************For multiple employee assignation to single shift****************/

  const [assignMultipleEmpModal, setAssignMultipleEmpModal] = useState(false);

  return (
    <>
      <DndProvider backend={HTML5Backend}>
        <div className="flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center gap-4 justify-between">
            <div className="flex items-center gap-6">
              <SelectBranch
                selectedBranch={branch}
                setSelectedBranch={setBranch}
              />
              <Tooltip
                styles={{ tooltip: { padding: 0 } }}
                label={
                  <div className="bg-surface shadow p-4 rounded text-primary flex flex-col gap-2">
                    <div className="flex items-center gap-4 text-base">
                      <span className="size-6 bg-orange-200"></span>
                      <span className="mt-1">Pending</span>
                    </div>
                    <div className="flex items-center gap-4 text-base">
                      <span className="size-6 bg-pink-200"></span>
                      <span className="mt-1">Started</span>
                    </div>
                    <div className="flex items-center gap-4 text-base">
                      <span className="size-6 bg-green-400"></span>
                      <span className="mt-1">Completed</span>
                    </div>
                    <div className="flex items-center gap-4 text-base">
                      <span className="size-6 bg-purple-500"></span>
                      <span className="mt-1">Started Late</span>
                    </div>
                    <div className="flex items-center gap-4 text-base">
                      <span className="size-6 bg-red-500"></span>
                      <span className="mt-1">Ended Early</span>
                    </div>
                    <div className="flex items-center gap-4 text-base">
                      <span className="size-6 bg-blue-400"></span>
                      <span className="mt-1">Ended Late</span>
                    </div>
                    <div className="flex items-center gap-4 text-base">
                      <span className="size-6 bg-gradient-to-r from-purple-500 to-blue-400"></span>
                      <span className="mt-1">Started Late-Ended Late</span>
                    </div>
                  </div>
                }
              >
                <div className="flex items-center gap-2 mt-1 cursor-pointer font-semibold">
                  <MdOutlineInfo />
                  Colors pellet info
                </div>
              </Tooltip>
            </div>
            <div className="flex items-center gap-4">
              <button
                disabled={resultToBePublished.length === 0}
                className="rounded bg-gray-200 py-2 px-10 text-sm"
                onClick={() => onUndo()}
              >
                UNDO Drag/Drop
              </button>
              <button
                onClick={onPublish}
                disabled={
                  resultToBePublished.length === 0 &&
                  shiftToBeDeleted.length === 0
                }
                className="bg-secondary py-2 px-[88px] rounded text-sm text-surface font-semibold hover:bg-blueButtonHoverBg active:bg-blueButtonActiveBg disabled:bg-secondaryBlueBg"
              >
                Publish
              </button>
            </div>
          </div>

          <div className="flex items-start gap-6 w-full justify-between">
            <div className="flex w-full flex-wrap max-h-[80vh] overflow-auto remove-vertical-scrollbar">
              {datesArray.map((date, index) => {
                return (
                  <div
                    key={index}
                    className="flex flex-col h-full justify-start min-w-[180px] w-[14.23%] text-center max-h-[350px] overflow-auto remove-vertical-scrollbar "
                  >
                    <div
                      onClick={() => setSelectedDate(date)}
                      className="font-semibold cursor-pointer text-textPrimaryBlue sticky top-0 bg-background justify-center flex w-full px-2 pt-4"
                    >
                      <Button
                        label={dayjs(date).format('ddd MMM-DD')}
                        type="blue"
                        onClick={() => setSelectedDate(date)}
                        className="w-full text-sm rounded-full  border-[1px] border-[#02829b] bg-gradient-to-b from-[#7ed7df] to-[#00a9d0] hover:scale-[1.02] duration-200"
                      />
                    </div>

                    {getScheduleForDay(datesArray[index], schedules).length >
                    0 ? (
                      getScheduleForDay(datesArray[index], schedules).map(
                        (data, idx) => {
                          const colors = getColorAccToShiftStatus(
                            data.shift,
                            settings?.SettingEmpShiftTimeMarginInMins || 10
                          );

                          const backgroundStyle =
                            colors.length > 1
                              ? {
                                  background: `linear-gradient(to right, ${colors[0]}, ${colors[1]})`,
                                }
                              : { backgroundColor: colors[0] };

                          return shiftToBeDeleted.includes(
                            data.shift.ShiftId
                          ) ? (
                            <div className="flex flex-col w-full h-full min-h-[140px] justify-center items-center py-4">
                              <div>This Shift is Deleted</div>
                              <div
                                onClick={() => onDeleteUndo(data.shift.ShiftId)}
                                className="flex items-center gap-1 text-sm mt-1 text-textPrimaryBlue cursor-pointer hover:underline"
                              >
                                <span>Click to undo</span>
                                <FaUndo />
                              </div>
                            </div>
                          ) : (
                            <DropPoint
                              accept={`${formatDate(data.shift.ShiftDate, 'DDMMYYYY')}${data.shift.ShiftPosition}`}
                              className="h-full"
                              id={data.shift.ShiftId}
                              key={idx}
                            >
                              <div
                                onDoubleClick={() =>
                                  navigate(
                                    PageRoutes.SHIFT_VIEW +
                                      `?id=${data.shift.ShiftId}`
                                  )
                                }
                                onClick={() => {
                                  setSelectedSchedule(data);
                                  if (data.shift.ShiftRequiredEmp > 1) {
                                    setAssignMultipleEmpModal(true);
                                  }
                                }}
                                key={data.shift.ShiftId + idx}
                                className={`flex flex-col p-2 ${
                                  data.shift.ShiftRequiredEmp > 1 &&
                                  'cursor-pointer'
                                }`}
                              >
                                <div
                                  className={`h-[30px] py-1 text-sm font-semibold  px-2 flex ${data.employee.length === 0 ? 'justify-between' : 'justify-center'}`}
                                  style={backgroundStyle}
                                >
                                  {data.employee.length === 0 && (
                                    <span>&nbsp;</span>
                                  )}
                                  <span className="line-clamp-1 text-center">
                                    {data.shift.ShiftName}
                                  </span>
                                  {data.employee.length === 0 && (
                                    <span className="relative">
                                      <FaRegTrashAlt
                                        onClick={() => {
                                          if (
                                            data.shift?.ShiftAssignedUserId
                                              ?.length > 0 ||
                                            data?.employee?.length > 0
                                          ) {
                                            return;
                                          }
                                          onDeleteClick(data.shift.ShiftId);
                                        }}
                                        className="text-lg font-semibold text-textPrimaryRed ml-1 cursor-pointer"
                                      />
                                    </span>
                                  )}
                                </div>
                                <div className="bg-[#5e5c5c23] p-2 rounded  min-w-full items-center text-sm">
                                  <div className="text-sm font-medium line-clamp-1">
                                    {data.shift.ShiftPosition}
                                  </div>
                                  <div className="font-semibold line-clamp-1">
                                    {data.shift.ShiftStartTime}-
                                    {data.shift.ShiftEndTime}
                                  </div>
                                  {data.employee.length > 0 ? (
                                    data.employee.every(
                                      (emp) => emp.EmployeeCreatedAt
                                    ) ? (
                                      <Tooltip
                                        label={
                                          <div className=" py-[2px] rounded w-full text-center">
                                            {data.employee
                                              .map((emp) => emp?.EmployeeName)
                                              .join(',')}
                                          </div>
                                        }
                                      >
                                        <div className=" py-[2px] rounded w-full text-center line-clamp-1">
                                          {data.employee
                                            .map((emp) => emp?.EmployeeName)
                                            .join(',')}
                                        </div>
                                      </Tooltip>
                                    ) : (
                                      <div className="py-[2px] rounded w-full flex items-center gap-2">
                                        <AiOutlineClose
                                          onClick={() =>
                                            onUndo(
                                              data.shift.ShiftId,
                                              data.employee[0].EmployeeId
                                            )
                                          }
                                          className="text-textPrimaryRed font-semibold cursor-pointer text-lg hover:scale-[1.1] duration-200"
                                        />
                                        <span className="line-clamp-1">
                                          {data.employee
                                            .map((emp) => emp?.EmployeeName)
                                            .join(',')}
                                        </span>
                                      </div>
                                    )
                                  ) : (
                                    <div className="bg-[#ffff64] py-[2px] rounded w-full text-center line-clamp-1">
                                      (Unassigned)
                                    </div>
                                  )}
                                </div>
                              </div>
                            </DropPoint>
                          );
                        }
                      )
                    ) : (
                      <div className="flex flex-col">
                        <div className="h-[40px] "></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {selectedDate && (
              <div className="flex flex-col gap-4 p-4 bg-onHoverBg rounded shadow w-[30%] sticky top-0">
                <div className="font-semibold">
                  Available Employees ({dayjs(selectedDate).format('ddd MMM-D')}
                  )
                </div>
                <Accordion variant="contained">
                  {empRoles
                    .sort((a, b) =>
                      a.EmployeeRoleName.localeCompare(b.EmployeeRoleName)
                    )
                    .map((role) => {
                      return (
                        <Accordion.Item
                          key={role.EmployeeRoleId}
                          value={role.EmployeeRoleName}
                        >
                          <Accordion.Control>
                            {role.EmployeeRoleName}
                          </Accordion.Control>
                          <Accordion.Panel>
                            <div className="flex flex-col gap-4 max-h-[50vh] overflow-auto remove-vertical-scrollbar">
                              {empAvailableForShift.filter(
                                (emp) => emp.EmpRole === role.EmployeeRoleName
                              ).length > 0 && !isEmpLoading ? (
                                empAvailableForShift
                                  .filter(
                                    (emp) =>
                                      emp.EmpRole === role.EmployeeRoleName
                                  )
                                  .map((data) => {
                                    return (
                                      <Draggable
                                        draggableId={data.EmpId}
                                        type={`${formatDate(selectedDate, 'DDMMYYYY')}${
                                          data.EmpRole
                                        }`}
                                        callback={dropResult}
                                        canDrag={data.EmpIsAvailable}
                                        key={data.EmpId}
                                      >
                                        <div
                                          className={`flex items-center gap-2  p-2 rounded text-sm  ${
                                            data.EmpIsAvailable
                                              ? 'bg-primaryGold text-surface'
                                              : 'bg-gray-200 cursor-not-allowed'
                                          }`}
                                        >
                                          <img
                                            src={
                                              data.EmpImg ??
                                              empDefaultPlaceHolder
                                            }
                                            alt=""
                                            className="w-12 h-12 rounded-full object-cover"
                                          />
                                          <div
                                            key={data.EmpId}
                                            className="flex flex-col "
                                          >
                                            <div className="flex items-center gap-2 ">
                                              <span className="text-nowrap">
                                                Name:
                                              </span>
                                              <span className="font-semibold line-clamp-1">
                                                {data.EmpName}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span>Week shifts:</span>
                                              <span className="font-semibold">
                                                {data.EmpWeekShifts}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span>Week hours:</span>
                                              <span className="font-semibold">
                                                {data.EmpWeekHours.toFixed(1)}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </Draggable>
                                    );
                                  })
                              ) : isEmpLoading ? (
                                Array.from({ length: 5 }).map((_, idx) => {
                                  return (
                                    <div
                                      key={idx}
                                      className="bg-shimmerColor animate-pulse w-full h-[80px]"
                                    ></div>
                                  );
                                })
                              ) : (
                                <div className="bg-primaryGold font-bold py-1 px-2 rounded">
                                  No {role.EmployeeRoleName} available for{' '}
                                  {dayjs(selectedDate).format('ddd MMM-DD')}
                                </div>
                              )}
                            </div>
                          </Accordion.Panel>
                        </Accordion.Item>
                      );
                    })}
                </Accordion>
              </div>
            )}
          </div>

          {/* Modal */}
          <AssignShiftModal
            schedule={selectedSchedule}
            opened={assignMultipleEmpModal}
            setOpened={setAssignMultipleEmpModal}
            setSelectedSchedule={setSelectedSchedule}
          />
        </div>
      </DndProvider>
    </>
  );
};

export default CalendarView;
