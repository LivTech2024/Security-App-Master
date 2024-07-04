import { useEffect, useState } from 'react';
import {
  formatDate,
  getHoursDiffInTwoTimeString,
  parseTime,
  toDate,
} from '../../../utilities/misc';
import DbSchedule, { ISchedule } from '../../../firebase_configs/DB/DbSchedule';
import { PageRoutes, REACT_QUERY_KEYS } from '../../../@types/enum';
import { useQuery } from '@tanstack/react-query';
import { useAuthState } from '../../../store';
import SelectBranch from '../../../common/SelectBranch';
import dayjs from 'dayjs';
import { numberFormatter } from '../../../utilities/NumberFormater';
import Button from '../../../common/button/Button';
import { generateStatsViewHtml } from '../../../utilities/pdf/genrateStatsViewHtml';
import { htmlStringToPdf } from '../../../utilities/htmlStringToPdf';
import DateFilterDropdown from '../../../common/dropdown/DateFilterDropdown';
import { useNavigate } from 'react-router-dom';

const StatisticsView = () => {
  const [schedules, setSchedules] = useState<ISchedule[]>([]);

  const [empHavingShifts, setEmpHavingShifts] = useState<
    {
      empId: string;
      empName: string;
      empShifts: number;
      empHours: number;
      empPayRate: number;
      empApproxCost: number;
    }[]
  >([]);

  const [startDate, setStartDate] = useState<Date | string | null>(
    dayjs().startOf('week').toDate()
  );

  const [endDate, setEndDate] = useState<Date | string | null>(
    dayjs().endOf('week').toDate()
  );

  const [datesArray, setDatesArray] = useState<Date[]>([]);

  useEffect(() => {
    setDatesArray([]);

    for (
      let i = dayjs(startDate).startOf('day');
      i.isBefore(dayjs(endDate).endOf('day'));
      i = dayjs(i).add(1, 'day')
    ) {
      setDatesArray((prev) => [...prev, i.toDate()]);
    }
  }, [startDate, endDate]);

  const { company } = useAuthState();

  const [branch, setBranch] = useState('');

  const { data, error } = useQuery({
    queryKey: [
      REACT_QUERY_KEYS.SCHEDULES,
      datesArray,
      startDate,
      endDate,
      branch,
      company!.CompanyId,
    ],
    queryFn: async () => {
      const data = await DbSchedule.getSchedules(
        startDate as Date,
        endDate as Date,
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

  const getUnassignedShiftForDay = (date: Date) => {
    return schedules.filter(
      (s) =>
        dayjs(toDate(s.shift.ShiftDate)).isSame(date, 'date') &&
        s.shift.ShiftAssignedUserId.length === 0
    );
  };

  const getAssignedShiftForDay = (date: Date) => {
    return schedules.filter(
      (s) =>
        dayjs(toDate(s.shift.ShiftDate)).isSame(date, 'date') &&
        s.shift.ShiftAssignedUserId.length > 0
    );
  };

  const getShiftsCost = (schedule: ISchedule[]) => {
    if (schedule.length === 0) return 0;

    let allShiftsCost = 0;

    schedule.forEach((sch) => {
      const { employee, shift } = sch;

      const { ShiftDate, ShiftStartTime, ShiftEndTime } = shift;

      const { hour: startHour, minute: startMinute } =
        parseTime(ShiftStartTime);
      const { hour: endHour, minute: endMinute } = parseTime(ShiftEndTime);

      const shiftStartTimeWithDate = dayjs()
        .date(toDate(ShiftDate).getDate())
        .month(toDate(ShiftDate).getMonth())
        .hour(startHour)
        .minute(startMinute)
        .second(0)
        .toDate();

      const shiftEndTimeWithDate = dayjs()
        .date(toDate(ShiftDate).getDate())
        .month(toDate(ShiftDate).getMonth())
        .hour(endHour)
        .minute(endMinute)
        .second(0)
        .add(startHour > endHour ? 1 : 0, 'day')
        .toDate();

      let shiftHours = dayjs(shiftEndTimeWithDate).diff(
        shiftStartTimeWithDate,
        'hours'
      );

      allShiftsCost += employee.reduce((acc, obj) => {
        if (
          shift?.ShiftCurrentStatus &&
          Array.isArray(shift?.ShiftCurrentStatus)
        ) {
          const empShiftStatus = shift?.ShiftCurrentStatus?.find(
            (status) => status.StatusReportedById === obj.EmployeeId
          );
          if (
            empShiftStatus &&
            empShiftStatus.StatusReportedTime &&
            empShiftStatus.StatusStartedTime
          ) {
            shiftHours = dayjs(toDate(empShiftStatus.StatusReportedTime)).diff(
              toDate(empShiftStatus.StatusStartedTime),
              'hours'
            );
          }
        }
        return acc + obj.EmployeePayRate * shiftHours;
      }, 0);
    });

    return allShiftsCost;
  };

  const getTotals = () => {
    let unAssignedShiftTotal = 0,
      unAssignedShiftHours = 0,
      assignedShiftTotal = 0,
      assignedShiftHours = 0,
      totalCost = 0;

    datesArray.forEach((date) => {
      const unAssigned = getUnassignedShiftForDay(date);
      const assigned = getAssignedShiftForDay(date);

      unAssignedShiftTotal += unAssigned.length;

      unAssignedShiftHours += getShiftHours(unAssigned);

      assignedShiftTotal += assigned.length;

      assignedShiftHours += getShiftHours(assigned);

      totalCost += getShiftsCost(assigned);
    });

    return {
      unAssignedShiftHours,
      unAssignedShiftTotal,
      assignedShiftHours,
      assignedShiftTotal,
      totalCost,
    };
  };

  //*Populate emps and his shifts

  useEffect(() => {
    const updatedEmpHavingShifts: {
      empId: string;
      empName: string;
      empShifts: number;
      empHours: number;
      empPayRate: number;
      empApproxCost: number;
    }[] = [];

    schedules?.forEach((schedule) => {
      if (schedule?.employee?.length > 0) {
        const { employee, shift } = schedule;

        const { ShiftDate, ShiftStartTime, ShiftEndTime } = shift;

        const { hour: startHour, minute: startMinute } =
          parseTime(ShiftStartTime);
        const { hour: endHour, minute: endMinute } = parseTime(ShiftEndTime);

        const shiftStartTimeWithDate = dayjs()
          .date(toDate(ShiftDate).getDate())
          .month(toDate(ShiftDate).getMonth())
          .hour(startHour)
          .minute(startMinute)
          .second(0)
          .toDate();

        const shiftEndTimeWithDate = dayjs()
          .date(toDate(ShiftDate).getDate())
          .month(toDate(ShiftDate).getMonth())
          .hour(endHour)
          .minute(endMinute)
          .second(0)
          .add(startHour > endHour ? 1 : 0, 'day')
          .toDate();

        let shiftHours = dayjs(toDate(shiftEndTimeWithDate)).diff(
          toDate(shiftStartTimeWithDate),
          'hours'
        );

        employee.forEach((emp) => {
          if (
            shift?.ShiftCurrentStatus &&
            Array.isArray(shift?.ShiftCurrentStatus)
          ) {
            const empStatus = shift.ShiftCurrentStatus.find(
              (e) => e.StatusReportedById === emp.EmployeeId
            );
            const startTime = empStatus?.StatusStartedTime;
            const endTime = empStatus?.StatusReportedTime;
            if (startTime && endTime) {
              shiftHours = dayjs(toDate(endTime)).diff(
                toDate(startTime),
                'hours'
              );
            }
            const empShiftStatus = shift?.ShiftCurrentStatus?.find(
              (status) => status.StatusReportedById === emp.EmployeeId
            );
            if (empShiftStatus && empShiftStatus.StatusShiftTotalHrs) {
              shiftHours = empShiftStatus.StatusShiftTotalHrs;
            }
          }

          const existingEmpIndex = updatedEmpHavingShifts.findIndex(
            (e) => e.empId === emp.EmployeeId
          );
          if (existingEmpIndex !== -1) {
            updatedEmpHavingShifts[existingEmpIndex] = {
              ...updatedEmpHavingShifts[existingEmpIndex],
              empShifts: updatedEmpHavingShifts[existingEmpIndex].empShifts + 1,
              empHours:
                updatedEmpHavingShifts[existingEmpIndex].empHours + shiftHours,
              empApproxCost:
                updatedEmpHavingShifts[existingEmpIndex].empApproxCost +
                shiftHours *
                  updatedEmpHavingShifts[existingEmpIndex].empPayRate,
            };
          } else {
            updatedEmpHavingShifts.push({
              empId: emp.EmployeeId,
              empName: emp.EmployeeName,
              empApproxCost: shiftHours * emp.EmployeePayRate,
              empHours: shiftHours,
              empPayRate: emp.EmployeePayRate,
              empShifts: 1,
            });
          }
        });
      }
    });

    setEmpHavingShifts(updatedEmpHavingShifts); // Update state with the accumulated changes
  }, [schedules]);

  const getShiftHours = (schedule: ISchedule[]) => {
    return schedule.reduce((acc, obj) => {
      let shiftTotalHrsSpentByAllEmp = 0;

      const { ShiftDate, ShiftStartTime, ShiftEndTime } = obj.shift;

      const { hour: startHour, minute: startMinute } =
        parseTime(ShiftStartTime);
      const { hour: endHour, minute: endMinute } = parseTime(ShiftEndTime);

      const shiftStartTimeWithDate = dayjs()
        .date(toDate(ShiftDate).getDate())
        .month(toDate(ShiftDate).getMonth())
        .hour(startHour)
        .minute(startMinute)
        .second(0)
        .toDate();

      const shiftEndTimeWithDate = dayjs()
        .date(toDate(ShiftDate).getDate())
        .month(toDate(ShiftDate).getMonth())
        .hour(endHour)
        .minute(endMinute)
        .second(0)
        .add(startHour > endHour ? 1 : 0, 'day')
        .toDate();

      if (
        obj?.shift?.ShiftCurrentStatus &&
        Array.isArray(obj?.shift?.ShiftCurrentStatus) &&
        obj?.shift?.ShiftCurrentStatus.length > 0
      ) {
        shiftTotalHrsSpentByAllEmp = obj.shift.ShiftCurrentStatus.reduce(
          (acc, obj) => {
            const { StatusStartedTime, StatusReportedTime } = obj;
            let actualHrsSpent = 0;
            if (StatusStartedTime && StatusReportedTime) {
              actualHrsSpent = dayjs(toDate(StatusReportedTime)).diff(
                toDate(StatusStartedTime),
                'hours'
              );
            } else {
              actualHrsSpent = dayjs(shiftEndTimeWithDate).diff(
                shiftStartTimeWithDate,
                'hours'
              );
            }
            return acc + actualHrsSpent;
          },
          0
        );
      } else {
        shiftTotalHrsSpentByAllEmp =
          dayjs(shiftEndTimeWithDate).diff(shiftStartTimeWithDate, 'hours') *
          (obj.shift.ShiftAssignedUserId.length || 1);
      }

      return acc + shiftTotalHrsSpentByAllEmp;
    }, 0);
  };

  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-4 justify-between bg-surface p-4 rounded shadow">
        <SelectBranch selectedBranch={branch} setSelectedBranch={setBranch} />
        <div className="flex items-center gap-4 w-full justify-end">
          <DateFilterDropdown
            endDate={endDate}
            setEndDate={setEndDate}
            setStartDate={setStartDate}
            startDate={startDate}
          />
          <Button
            label="Print"
            onClick={async () => {
              const shiftsSummaryHtml =
                document.getElementById('shiftsSummary')?.outerHTML || '';
              const employeesScheduledHtml =
                document.getElementById('employeesScheduled')?.outerHTML || '';

              const pdfHtml = generateStatsViewHtml(
                shiftsSummaryHtml as unknown as JSX.Element,
                employeesScheduledHtml as unknown as JSX.Element,
                company!.CompanyName,
                datesArray[0]
              );
              await htmlStringToPdf('test.pdf', pdfHtml);
            }}
            type="black"
            className="px-12 py-2"
          />
        </div>
      </div>
      <div className="flex w-full justify-between items-start gap-8">
        <div
          id="shiftsSummary"
          className="flex flex-col p-4 rounded-lg bg-surface shadow-md gap-4 w-full"
        >
          <div className="font-semibold text-xl">Shifts summary</div>

          <table className="w-full">
            <thead>
              <tr>
                <th className="px-2 text-start w-[30%]"></th>
                <th
                  className="px-2 text-center w-[25%] text-primaryRed"
                  colSpan={2}
                >
                  Unassigned
                </th>
                <th className="px-2 text-center w-[25%]" colSpan={2}>
                  Assigned
                </th>
                <th className="px-2 text-start w-[20%]"></th>
              </tr>
              <tr className="border-b border-gray-400">
                <th className="px-2 text-start pt-1"></th>
                <th className="px-2 text-center pt-1 text-primaryRed">Shift</th>
                <th className="px-2 text-center pt-1 text-primaryRed">Hours</th>
                <th className="px-2 text-center pt-1">Shift</th>
                <th className="px-2 text-center pt-1">Hours</th>
                <th className="px-2 text-end pt-1">Approx Cost</th>
              </tr>
            </thead>
            <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
              {datesArray.map((date, idx) => {
                const unAssigned = getUnassignedShiftForDay(date);
                const assigned = getAssignedShiftForDay(date);
                return (
                  <tr key={idx}>
                    <td className="px-2 py-2">
                      {datesArray.length > 7
                        ? formatDate(date, 'DD-MMM ddd')
                        : formatDate(date, 'dddd')}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {unAssigned.length.toFixed(2)}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {unAssigned
                        .reduce((acc, obj) => {
                          const shiftHours = getHoursDiffInTwoTimeString(
                            obj.shift.ShiftStartTime,
                            obj.shift.ShiftEndTime
                          );

                          return acc + shiftHours;
                        }, 0)
                        .toFixed(2)}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {assigned.length.toFixed(2)}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {numberFormatter(getShiftHours(assigned), false)}
                    </td>
                    <td className="px-2 py-2 text-end">
                      {numberFormatter(getShiftsCost(assigned), true)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-400 font-semibold">
                <td className="p-2">Total</td>
                <td className="p-2 text-center">
                  {getTotals().unAssignedShiftTotal.toFixed(2)}
                </td>
                <td className="p-2 text-center">
                  {getTotals().unAssignedShiftHours.toFixed(2)}
                </td>
                <td className="p-2 text-center">
                  {getTotals().assignedShiftTotal.toFixed(2)}
                </td>
                <td className="p-2 text-center">
                  {getTotals().assignedShiftHours.toFixed(2)}
                </td>
                <td className="p-2 text-end">
                  {' '}
                  {numberFormatter(getTotals().totalCost, true)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div
          id="employeesScheduled"
          className="flex flex-col p-4 rounded-lg bg-surface shadow-md gap-4 w-full"
        >
          <div className="font-semibold text-xl">
            Employees Scheduled This Week
          </div>
          <table>
            <thead>
              <tr className="bg-onHoverBg border-b border-gray-400">
                <th className="px-2 py-1 text-start">Employee Name</th>
                <th className="px-2 py-1 text-center">Shifts</th>
                <th className="px-2 py-1 text-center">Hours</th>
                <th className="px-2 py-1 text-center">Pay Rate</th>
                <th className="px-2 py-1 text-end">Approx Cost</th>
              </tr>
            </thead>
            <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
              {empHavingShifts.map((data) => {
                return (
                  <tr key={data.empId}>
                    <td
                      onClick={() =>
                        navigate(
                          PageRoutes.TIME_AND_ATTENDANCE_VIEW +
                            `?emp_id=${data.empId}&emp_name=${data.empName}`
                        )
                      }
                      className="px-2 py-2 text-start text-textPrimaryBlue cursor-pointer hover:underline"
                    >
                      {data.empName}
                    </td>
                    <td className="px-2 py-2 text-center">{data.empShifts}</td>
                    <td className="px-2 py-2 text-center">
                      {numberFormatter(data.empHours)}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {numberFormatter(data.empPayRate, true)}
                    </td>
                    <td className="px-2 py-2 text-end">
                      {numberFormatter(data.empApproxCost, true)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="font-semibold border-t border-gray-400">
                <td className="px-2 py-2 text-start">Total</td>
                <td className="px-2 py-2 text-center">
                  {empHavingShifts.reduce((acc, obj) => acc + obj.empShifts, 0)}
                </td>
                <td className="px-2 py-2 text-center">
                  {empHavingShifts
                    .reduce((acc, obj) => acc + obj.empHours, 0)
                    .toFixed(2)}
                </td>
                <td className="px-2 py-2 text-center"></td>
                <td className="px-2 py-2 text-end">
                  {numberFormatter(
                    empHavingShifts.reduce(
                      (acc, obj) => acc + obj.empApproxCost,
                      0
                    ),
                    true
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StatisticsView;
