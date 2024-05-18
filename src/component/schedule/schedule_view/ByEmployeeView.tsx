import { useEffect, useState } from 'react';
import { useAuthState } from '../../../store';
import DbSchedule, { ISchedule } from '../../../firebase_configs/DB/DbSchedule';
import { useQuery } from '@tanstack/react-query';
import { REACT_QUERY_KEYS } from '../../../@types/enum';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import dayjs from 'dayjs';
import {
  formatDate,
  getHoursDiffInTwoTimeString,
  toDate,
} from '../../../utilities/misc';
import { Draggable, DropPoint } from '../../../utilities/DragAndDropHelper';
import DbEmployee from '../../../firebase_configs/DB/DbEmployee';
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
import SelectBranch from '../../../common/SelectBranch';
import { sendEmail } from '../../../API/SendEmail';

interface ByEmployeeViewProps {
  datesArray: Date[];
}

const ByEmployeeView = ({ datesArray }: ByEmployeeViewProps) => {
  const { company } = useAuthState();

  const [branchId, setBranchId] = useState('');

  //*Fetch all the schedule for the week

  const [schedules, setSchedules] = useState<ISchedule[]>([]);

  const { data, error } = useQuery({
    queryKey: [
      REACT_QUERY_KEYS.SCHEDULES,
      datesArray,
      branchId,
      company!.CompanyId,
    ],
    queryFn: async () => {
      const data = await DbSchedule.getSchedules(
        datesArray[0],
        datesArray[datesArray.length - 1],
        company!.CompanyId,
        branchId
      );
      return data;
    },
  });

  useEffect(() => {
    console.log(error);
    setSchedules(data || []);
  }, [data, error]);

  //*Fetch all the employees

  const [employees, setEmployees] = useState<IEmployeesCollection[]>([]);

  const { data: snapshotData, error: empError } = useQuery({
    queryKey: [REACT_QUERY_KEYS.EMPLOYEE_LIST, company!.CompanyId, branchId],
    queryFn: async () => {
      const snapshot = await DbEmployee.getEmployees({
        cmpId: company!.CompanyId,
        branch: branchId,
      });
      return snapshot.docs;
    },
  });

  useEffect(() => {
    console.log(empError);
    if (snapshotData) {
      setEmployees(
        snapshotData.map((doc) => doc.data() as IEmployeesCollection)
      );
    }
  }, [snapshotData, empError]);

  const getUnassignedShiftForDay = (date: Date) => {
    if (!schedules) return [];
    return schedules.filter(
      (schedule) =>
        schedule.employee.length === 0 &&
        dayjs(toDate(schedule.shift.ShiftDate)).isSame(date, 'date')
    );
  };

  const getEmpShiftForDay = (empId: string, date: Date) => {
    const empScheduleForDay = schedules.find(
      (schedule) =>
        schedule.employee.find((emp) => emp.EmployeeId === empId) &&
        dayjs(toDate(schedule.shift.ShiftDate)).isSame(date, 'date')
    );

    return empScheduleForDay?.shift || null;
  };

  const getEmpShiftForWeek = (empId: string) => {
    const empScheduleForDay = schedules.filter((schedule) =>
      schedule?.employee?.find((emp) => emp.EmployeeId === empId)
    );

    return empScheduleForDay.map((s) => s.shift);
  };

  const [resultToBePublished, setResultToBePublished] = useState<
    {
      shift: IShiftsCollection;
      emp: IEmployeesCollection;
    }[]
  >([]);

  const dropResult = (draggableId: string, dropPointId: string) => {
    const selectedEmp = employees.find((emp) => emp.EmployeeId === dropPointId);
    const selectedShift = schedules.find(
      (s) => s.shift.ShiftId === draggableId
    );

    if (!selectedEmp || !selectedShift) return;

    if (selectedEmp.EmployeeIsAvailable !== 'available') {
      showSnackbar({
        message: `This employee is ${
          selectedEmp.EmployeeIsAvailable === 'on_vacation'
            ? 'On vacation'
            : selectedEmp.EmployeeIsAvailable === 'out_of_reach' &&
              'Out of reach'
        }`,
        type: 'error',
      });
      return;
    }

    if (selectedShift?.shift && selectedShift.shift.ShiftRequiredEmp > 1) {
      showSnackbar({
        message:
          'This shift requires more than 1 employee, use calendar view for assigning single shift to multiple employees',
        type: 'error',
      });
      return;
    }

    const shiftHours = getHoursDiffInTwoTimeString(
      selectedShift.shift.ShiftStartTime,
      selectedShift.shift.ShiftEndTime
    );

    const empShifts = getEmpShiftForWeek(selectedEmp.EmployeeId);

    const empWeekHours = empShifts.reduce((acc, shift) => {
      const shiftHours = getHoursDiffInTwoTimeString(
        shift.ShiftStartTime,
        shift.ShiftEndTime
      );
      return acc + shiftHours;
    }, 0);

    if (empWeekHours + shiftHours > selectedEmp.EmployeeMaxHrsPerWeek) {
      showSnackbar({
        message: 'Employee maximum hours per week exceeded',
        type: 'info',
      });
    }

    setResultToBePublished((prev) => [
      ...prev,
      { emp: selectedEmp, shift: selectedShift.shift },
    ]);

    setSchedules((prev) => {
      const updatedSchedules = prev.map((schedule) => {
        if (schedule.shift.ShiftId === selectedShift?.shift.ShiftId) {
          // Update the employee field for the selected schedule
          const updatedEmp: Partial<IEmployeesCollection> = {
            EmployeeId: selectedEmp?.EmployeeId,
            EmployeeName: selectedEmp?.EmployeeName,
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
          result.emp.EmployeeId,
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
          (d) => d.empEmail === emp.EmployeeEmail
        );
        if (isExistIndex !== -1) {
          const prevMessage = aggregatedEmails[isExistIndex].message;
          aggregatedEmails[isExistIndex].message =
            `${prevMessage}\n\nShift Name: ${
              shift.ShiftName
            }\nDate: ${formatDate(shift.ShiftDate)} \nTiming: ${
              shift.ShiftStartTime
            }-${shift.ShiftEndTime}\nAddress: ${shift.ShiftLocationAddress}`;
        } else {
          aggregatedEmails.push({
            empEmail: emp.EmployeeEmail,
            empName: emp.EmployeeName,
            message: `You have been assigned for the following shift.\n\n Shift Name: ${
              shift.ShiftName
            } \n Date: ${formatDate(shift.ShiftDate)} \n Timing: ${
              shift.ShiftStartTime
            }-${shift.ShiftEndTime} \n Address: ${shift.ShiftLocationAddress}`,
          });
        }
      });

      const sendEmailPromise = aggregatedEmails.map(async (res) => {
        return sendEmail({
          to_email: res.empEmail,
          text: res.message,
          subject: 'Your schedule update',
          from_name: company!.CompanyName,
        });
      });

      await Promise.all(sendEmailPromise);

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

    const { shift } = resultToBeUndo;

    setResultToBePublished((prev) => prev.slice(0, -1));

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

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4 justify-between">
          <SelectBranch
            selectedBranch={branchId}
            setSelectedBranch={setBranchId}
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

        <div className="flex items-start gap-4 w-full ">
          <div className="w-[80%] max-h-[80vh] overflow-auto remove-vertical-scrollbar">
            <table className="w-full">
              <thead className="sticky top-0">
                <tr className="border-b border-gray-400 bg-gray-200 border-x border-x-gray-200">
                  <th className="w-[15%] px-2 py-1">&nbsp;</th>
                  {datesArray.map((date) => {
                    return (
                      <th className="w- text-center px-2 py-1">
                        <span className="line-clamp-1">
                          {dayjs(date).format('ddd MMM-DD')}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const empShifts = getEmpShiftForWeek(emp.EmployeeId);
                  return (
                    <tr className="border-b border-gray-400">
                      <td className="py-4 px-2 border-l border-gray-400">
                        <div className="flex flex-col">
                          <span>{emp.EmployeeName}</span>
                          <span className="font-semibold pl-1 text-sm">
                            {empShifts.length > 0 ? (
                              <div>
                                {' '}
                                {empShifts.length} shift -{' '}
                                {empShifts.reduce((acc, shift) => {
                                  const shiftHours =
                                    getHoursDiffInTwoTimeString(
                                      shift.ShiftStartTime,
                                      shift.ShiftEndTime
                                    );
                                  return acc + shiftHours;
                                }, 0)}
                                {' hours'}
                              </div>
                            ) : (
                              <div className="">Not Scheduled</div>
                            )}
                          </span>
                          {emp.EmployeeIsAvailable !== 'available' && (
                            <span>
                              {emp.EmployeeIsAvailable === 'on_vacation'
                                ? 'On vacation'
                                : emp.EmployeeIsAvailable === 'out_of_reach'
                                  ? 'Out of reach'
                                  : 'Available'}
                            </span>
                          )}
                        </div>
                      </td>
                      {datesArray.map((date, idx) => {
                        const shift = getEmpShiftForDay(emp.EmployeeId, date);
                        return (
                          <td
                            className={`text-center px-2 border-l ${
                              datesArray.length === idx + 1 && 'border-r'
                            } border-gray-400`}
                          >
                            {shift ? (
                              <div className="flex flex-col text-sm items-center">
                                <span>{shift.ShiftName}</span>
                                <span className="font-semibold">
                                  {shift.ShiftStartTime} -{shift.ShiftEndTime}
                                </span>
                                <span>{shift.ShiftPosition}</span>
                              </div>
                            ) : (
                              <DropPoint
                                accept={`${formatDate(date, 'DDMMYYYY')}${emp.EmployeeRole}`}
                                id={emp.EmployeeId}
                                className="min-h-[60px]"
                              >
                                <div>&nbsp;</div>
                              </DropPoint>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-1 p-4 bg-gray-200 rounded w-[18%] max-h-[80vh] overflow-scroll remove-vertical-scrollbar">
            <div className="font-semibold text-lg">Unassigned shifts</div>
            {datesArray.map((date) => {
              const unUnassignedShifts = getUnassignedShiftForDay(date);
              return (
                <div className={`flex flex-col gap-2`}>
                  {unUnassignedShifts.length > 0 && (
                    <div className="text-center font-bold bg-[#ffffcc]">
                      {formatDate(date)}
                    </div>
                  )}
                  {unUnassignedShifts.map((res) => {
                    return (
                      <Draggable
                        callback={dropResult}
                        draggableId={res.shift.ShiftId}
                        type={`${formatDate(res.shift.ShiftDate, 'DDMMYYYY')}${
                          res.shift.ShiftPosition
                        }`}
                      >
                        <div className="flex flex-col text-sm items-center">
                          <span>{res.shift.ShiftName}</span>
                          <span className="font-semibold">
                            {res.shift.ShiftStartTime} -{res.shift.ShiftEndTime}
                          </span>
                          <span>{res.shift.ShiftPosition}</span>
                        </div>
                      </Draggable>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default ByEmployeeView;
