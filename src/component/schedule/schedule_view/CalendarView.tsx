import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import empDefaultPlaceHolder from '../../../../public/assets/avatar.png';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { REACT_QUERY_KEYS } from '../../../@types/enum';
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
import { Accordion } from '@mantine/core';
import { sendEmail } from '../../../API/SendEmail';
//import { Accordion } from "@mantine/core";

interface CalendarViewProps {
  datesArray: Date[];
}

const CalendarView = ({ datesArray }: CalendarViewProps) => {
  const [schedules, setSchedules] = useState<ISchedule[]>([]);

  const { company, empRoles } = useAuthState();

  const [branch, setBranch] = useState('');

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
    setSelectedDate(datesArray[0]);
  }, [datesArray]);

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
          console.log(res, 'res');
          return sendEmail({
            to_email: res.empEmail,
            text: res.message,
            subject: 'Your schedule update',
            from_name: company!.CompanyName,
          });
        })
      );

      setResultToBePublished([]);

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

  const onUndo = () => {
    if (resultToBePublished.length === 0) return;
    const lastResultIndex = resultToBePublished.length - 1;

    const resultToBeUndo = resultToBePublished[lastResultIndex];

    setSelectedDate(toDate(resultToBeUndo.shift.ShiftDate));

    const { emp, shift } = resultToBeUndo;

    setResultToBePublished((prev) => prev.slice(0, -1));

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

  /****************For multiple employee assignation to single shift****************/

  const [assignMultipleEmpModal, setAssignMultipleEmpModal] = useState(false);

  return (
    <>
      <DndProvider backend={HTML5Backend}>
        <div className="flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center gap-4 justify-between">
            <SelectBranch
              selectedBranch={branch}
              setSelectedBranch={setBranch}
            />
            <div className="flex items-center gap-4">
              <button
                disabled={resultToBePublished.length === 0}
                className="rounded bg-gray-200 py-2 px-10 text-sm"
                onClick={onUndo}
              >
                UNDO Drag/Drop
              </button>
              <button
                onClick={onPublish}
                disabled={resultToBePublished.length === 0}
                className="bg-secondary py-2 px-[88px] rounded text-sm text-surface font-semibold hover:bg-blueButtonHoverBg active:bg-blueButtonActiveBg disabled:bg-secondaryBlueBg"
              >
                Publish
              </button>
            </div>
          </div>

          <div className="flex items-start gap-6 w-full justify-between">
            <div className="flex w-full flex-wrap overflow-hidden">
              {datesArray.map((date, index) => {
                return (
                  <div
                    key={index}
                    className="flex flex-col h-full justify-start min-w-[180px] w-[14.23%] text-center"
                  >
                    <div
                      onClick={() => setSelectedDate(date)}
                      className="font-semibold cursor-pointer text-textPrimaryBlue"
                    >
                      {dayjs(date).format('ddd MMM-DD')}
                    </div>

                    {getScheduleForDay(datesArray[index], schedules).length >
                    0 ? (
                      getScheduleForDay(datesArray[index], schedules).map(
                        (data, idx) => {
                          return (
                            <DropPoint
                              accept={`${toDate(
                                data.shift.ShiftDate
                              ).toString()}${data.shift.ShiftPosition}`}
                              className="h-full"
                              id={data.shift.ShiftId}
                              key={idx}
                            >
                              <div
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
                                <div className="h-[30px] bg-gray-200 py-1 text-sm font-semibold ">
                                  {data.shift.ShiftPosition}
                                </div>

                                <div className="bg-[#5e5c5c23] p-2 rounded  min-w-full items-center text-sm">
                                  <div className="text-base font-medium">
                                    {data.shift.ShiftName}
                                  </div>
                                  <div className="font-semibold">
                                    {data.shift.ShiftStartTime}-
                                    {data.shift.ShiftEndTime}
                                  </div>
                                  {data.employee.length > 0 ? (
                                    <div className=" py-[2px] rounded w-full text-center line-clamp-1">
                                      {data.employee
                                        .map((emp) => emp?.EmployeeName)
                                        .join(',')}
                                    </div>
                                  ) : (
                                    <div className="bg-[#ffff64] py-[2px] rounded w-full text-center">
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
              <div className="flex flex-col gap-4 p-4 bg-onHoverBg rounded shadow w-[30%]">
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
                            <div className="flex flex-col gap-4">
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
                                        type={`${selectedDate.toString()}${
                                          data.EmpRole
                                        }`}
                                        callback={dropResult}
                                        canDrag={data.EmpIsAvailable}
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
                                            <div className="flex items-center gap-2">
                                              Name:{' '}
                                              <span className="font-semibold">
                                                {data.EmpName}
                                              </span>{' '}
                                            </div>
                                            <div className="flex items-center gap-2">
                                              Week shifts:{' '}
                                              <span className="font-semibold">
                                                {data.EmpWeekShifts}
                                              </span>{' '}
                                            </div>
                                            <div className="flex items-center gap-2">
                                              Week hours:{' '}
                                              <span className="font-semibold">
                                                {data.EmpWeekHours.toFixed(1)}
                                              </span>{' '}
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
                                      className="bg-shimmerColor animate-pulse w-[150px] h-[80px]"
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
