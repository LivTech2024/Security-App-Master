import { useEffect, useState } from "react";
import {
  formatDate,
  getHoursDiffInTwoTimeString,
  toDate,
} from "../../../utilities/misc";
import DbSchedule, { ISchedule } from "../../../firebase_configs/DB/DbSchedule";
import { REACT_QUERY_KEYS } from "../../../@types/enum";
import { useQuery } from "@tanstack/react-query";
import { useAuthState } from "../../../store";
import SelectBranch from "../../../common/SelectBranch";
import dayjs from "dayjs";
import { numberFormatter } from "../../../utilities/NumberFormater";

const StatisticsView = ({ datesArray }: { datesArray: Date[] }) => {
  const [schedules, setSchedules] = useState<ISchedule[]>([]);

  const { company } = useAuthState();

  const [branch, setBranch] = useState("");

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

  const getUnassignedShiftForDay = (date: Date) => {
    return schedules.filter(
      (s) =>
        dayjs(toDate(s.shift.ShiftDate)).isSame(date, "date") &&
        s.shift.ShiftAssignedUserId.length === 0
    );
  };

  const getAssignedShiftForDay = (date: Date) => {
    return schedules.filter(
      (s) =>
        dayjs(toDate(s.shift.ShiftDate)).isSame(date, "date") &&
        s.shift.ShiftAssignedUserId.length > 0
    );
  };

  const getShiftsCost = (schedule: ISchedule[]) => {
    if (schedule.length === 0) return 0;

    let allShiftsCost = 0;

    schedule.forEach((sch) => {
      const { employee, shift } = sch;

      const shiftHours = getHoursDiffInTwoTimeString(
        shift.ShiftStartTime,
        shift.ShiftEndTime
      );

      allShiftsCost += employee.reduce((acc, obj) => {
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
      unAssignedShiftHours += unAssigned.reduce((acc, obj) => {
        const shiftHours = getHoursDiffInTwoTimeString(
          obj.shift.ShiftStartTime,
          obj.shift.ShiftEndTime
        );

        return acc + shiftHours;
      }, 0);

      assignedShiftTotal += assigned.length;
      assignedShiftHours += assigned.reduce((acc, obj) => {
        const shiftHours = getHoursDiffInTwoTimeString(
          obj.shift.ShiftStartTime,
          obj.shift.ShiftEndTime
        );

        return acc + shiftHours;
      }, 0);

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
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-4 justify-between">
        <SelectBranch selectedBranch={branch} setSelectedBranch={setBranch} />
      </div>
      <div className="flex w-full justify-between items-start">
        <div className="flex flex-col p-4 rounded-md bg-gray-200 gap-4 w-[40%]">
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
                    <td className="px-2 py-2">{formatDate(date, "dddd")}</td>
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
                      {assigned
                        .reduce((acc, obj) => {
                          const shiftHours = getHoursDiffInTwoTimeString(
                            obj.shift.ShiftStartTime,
                            obj.shift.ShiftEndTime
                          );

                          return acc + shiftHours;
                        }, 0)
                        .toFixed(2)}
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
                  {getTotals().assignedShiftTotal.toFixed(2)}
                </td>
                <td className="p-2 text-end">
                  {" "}
                  {numberFormatter(getTotals().totalCost, true)}
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
