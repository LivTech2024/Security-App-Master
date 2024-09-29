import { useEffect, useState } from 'react';
import { formatDate, formatDateRange, toDate } from '../../../utilities/misc';
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
import { getShiftActualHours } from '../../../utilities/scheduleHelper';

interface IEmpShifts {
  empId: string;
  empName: string;
  empShifts: number;
  empHours: number;
  empActualHoursSpent: number;
  empPayRate: number;
  empApproxCost: number;
  empCurrentCost: number;
}

const StatisticsView = () => {
  const { settings } = useAuthState();

  const [schedules, setSchedules] = useState<ISchedule[]>([]);

  const [empHavingShifts, setEmpHavingShifts] = useState<IEmpShifts[]>([]);

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
    let approxCost = 0,
      currentCost = 0;

    if (schedule.length === 0) return { approxCost, currentCost };

    schedule.forEach((sch) => {
      const { employee, shift } = sch;

      employee.forEach((obj) => {
        const { shiftHours, actualShiftHrsSpent } = getShiftActualHours({
          shift,
          timeMarginInMins: settings?.SettingEmpShiftTimeMarginInMins || 0,
          empId: obj.EmployeeId,
        });

        approxCost += obj.EmployeePayRate * shiftHours;
        currentCost += obj.EmployeePayRate * actualShiftHrsSpent;
      }, 0);
    });

    return { approxCost, currentCost };
  };

  const getTotals = () => {
    let unAssignedShiftTotal = 0,
      unAssignedShiftHours = 0,
      assignedShiftTotal = 0,
      assignedShiftHours = 0,
      assignedShiftActualHours = 0,
      totalApproxCost = 0,
      totalCurrentCost = 0;

    datesArray.forEach((date) => {
      const unAssigned = getUnassignedShiftForDay(date);
      const assigned = getAssignedShiftForDay(date);

      unAssignedShiftTotal += unAssigned.length;

      unAssignedShiftHours += getShiftHours(unAssigned).shiftHrs;

      assignedShiftTotal += assigned.length;

      assignedShiftHours += getShiftHours(assigned).shiftHrs;

      assignedShiftActualHours += getShiftHours(assigned).actualHrsSpent;

      totalApproxCost += getShiftsCost(assigned).approxCost;
      totalCurrentCost += getShiftsCost(assigned).currentCost;
    });

    return {
      unAssignedShiftHours,
      unAssignedShiftTotal,
      assignedShiftHours,
      assignedShiftTotal,
      totalApproxCost,
      assignedShiftActualHours,
      totalCurrentCost,
    };
  };

  //*Populate emps and his shifts

  useEffect(() => {
    const updatedEmpHavingShifts: IEmpShifts[] = [];

    schedules?.forEach((schedule) => {
      if (schedule?.employee?.length > 0) {
        const { employee, shift } = schedule;

        employee.forEach((emp) => {
          const { actualShiftHrsSpent, shiftHours } = getShiftActualHours({
            shift,
            timeMarginInMins: settings?.SettingEmpShiftTimeMarginInMins || 0,
            empId: emp.EmployeeId,
          });

          const existingEmpIndex = updatedEmpHavingShifts.findIndex(
            (e) => e.empId === emp.EmployeeId
          );
          if (existingEmpIndex !== -1) {
            updatedEmpHavingShifts[existingEmpIndex] = {
              ...updatedEmpHavingShifts[existingEmpIndex],
              empShifts: updatedEmpHavingShifts[existingEmpIndex].empShifts + 1,
              empHours:
                updatedEmpHavingShifts[existingEmpIndex].empHours + shiftHours,
              empActualHoursSpent:
                updatedEmpHavingShifts[existingEmpIndex].empActualHoursSpent +
                actualShiftHrsSpent,
              empApproxCost:
                updatedEmpHavingShifts[existingEmpIndex].empApproxCost +
                shiftHours *
                  updatedEmpHavingShifts[existingEmpIndex].empPayRate,
              empCurrentCost:
                updatedEmpHavingShifts[existingEmpIndex].empCurrentCost +
                actualShiftHrsSpent *
                  updatedEmpHavingShifts[existingEmpIndex].empPayRate,
            };
          } else {
            updatedEmpHavingShifts.push({
              empId: emp.EmployeeId,
              empName: emp.EmployeeName,
              empApproxCost: shiftHours * emp.EmployeePayRate,
              empCurrentCost: actualShiftHrsSpent * emp.EmployeePayRate,
              empHours: shiftHours,
              empActualHoursSpent: actualShiftHrsSpent,
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
    let shiftHrs = 0,
      actualHrsSpent = 0;

    if (schedule.length === 0) return { shiftHrs, actualHrsSpent };

    schedule.forEach((sch) => {
      const { employee, shift } = sch;

      employee.forEach((obj) => {
        const { shiftHours, actualShiftHrsSpent } = getShiftActualHours({
          shift,
          timeMarginInMins: settings?.SettingEmpShiftTimeMarginInMins || 0,
          empId: obj.EmployeeId,
        });

        shiftHrs += shiftHours;
        actualHrsSpent += actualShiftHrsSpent;
      });
    });

    return { shiftHrs, actualHrsSpent };
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
      <div className="flex  w-full justify-between items-start gap-8">
        <div
          id="shiftsSummary"
          className="flex flex-col p-4 rounded-lg bg-surface shadow-md gap-4 w-full"
        >
          <div className="font-semibold text-xl">Shifts summary</div>

          <table className="w-full">
            <thead>
              <tr>
                <th className="px-2 text-start w-[20%]"></th>
                <th
                  className="px-2 text-center w-[25%] text-primaryRed"
                  colSpan={2}
                >
                  Unassigned
                </th>
                <th className="px-2 text-center w-[35%]" colSpan={3}>
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
                <th className="px-2 text-center pt-1">Spent Hrs</th>
                <th className="px-2 text-end pt-1">Approx Cost</th>
                <th className="px-2 text-end pt-1">Current Cost</th>
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
                      {numberFormatter(unAssigned.length)}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {numberFormatter(
                        unAssigned.reduce((acc, obj) => {
                          const { shiftHours } = getShiftActualHours({
                            shift: obj.shift,
                            timeMarginInMins: 0,
                          });
                          return acc + shiftHours;
                        }, 0)
                      )}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {numberFormatter(assigned.length)}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {numberFormatter(getShiftHours(assigned).shiftHrs, false)}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {numberFormatter(
                        getShiftHours(assigned).actualHrsSpent,
                        false
                      )}
                    </td>
                    <td className="px-2 py-2 text-end">
                      {numberFormatter(
                        getShiftsCost(assigned).approxCost,
                        true
                      )}
                    </td>
                    <td className="px-2 py-2 text-end">
                      {numberFormatter(
                        getShiftsCost(assigned).currentCost,
                        true
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-400 font-semibold">
                <td className="p-2">Total</td>
                <td className="p-2 text-center">
                  {numberFormatter(getTotals().unAssignedShiftTotal)}
                </td>
                <td className="p-2 text-center">
                  {numberFormatter(getTotals().unAssignedShiftHours)}
                </td>

                <td className="p-2 text-center">
                  {numberFormatter(getTotals().assignedShiftTotal)}
                </td>
                <td className="p-2 text-center">
                  {numberFormatter(getTotals().assignedShiftHours)}
                </td>
                <td className="p-2 text-center">
                  {numberFormatter(getTotals().assignedShiftActualHours)}
                </td>
                <td className="p-2 text-end">
                  {numberFormatter(getTotals().totalApproxCost, true)}
                </td>
                <td className="p-2 text-end">
                  {numberFormatter(getTotals().totalCurrentCost, true)}
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
            Employees Scheduled{' : '}
            {startDate &&
              endDate &&
              formatDateRange({
                startDateString: startDate.toString(),
                endDateString: endDate.toString(),
              })}
          </div>
          <table>
            <thead>
              <tr className="bg-onHoverBg border-b border-gray-400">
                <th className="px-2 py-1 text-start w-[20%]">Name</th>
                <th className="px-2 py-1 text-center w-[5%]">Shifts</th>
                <th className="px-2 py-1 text-center w-[10%]">Hours</th>
                <th className="px-2 py-1 text-center w-[15%]">Spent Hrs</th>
                <th className="px-2 py-1 text-center w-[14%]">Rate</th>
                <th className="px-2 py-1 text-end w-[18%]">Approx Cost</th>
                <th className="px-2 py-1 text-end w-[18%]">Current Cost</th>
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
                      {numberFormatter(data.empActualHoursSpent)}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {numberFormatter(data.empPayRate, true)}
                    </td>
                    <td className="px-2 py-2 text-end">
                      {numberFormatter(data.empApproxCost, true)}
                    </td>
                    <td className="px-2 py-2 text-end">
                      {numberFormatter(data.empCurrentCost, true)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="font-semibold border-t border-gray-400">
                <td className="px-2 py-2 text-start">Total</td>
                <td className="px-2 py-2 text-center">
                  {numberFormatter(
                    empHavingShifts.reduce((acc, obj) => acc + obj.empShifts, 0)
                  )}
                </td>
                <td className="px-2 py-2 text-center">
                  {numberFormatter(
                    empHavingShifts.reduce((acc, obj) => acc + obj.empHours, 0)
                  )}
                </td>
                <td className="px-2 py-2 text-center">
                  {numberFormatter(
                    empHavingShifts.reduce(
                      (acc, obj) => acc + obj.empActualHoursSpent,
                      0
                    )
                  )}
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
                <td className="px-2 py-2 text-end">
                  {numberFormatter(
                    empHavingShifts.reduce(
                      (acc, obj) => acc + obj.empCurrentCost,
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
