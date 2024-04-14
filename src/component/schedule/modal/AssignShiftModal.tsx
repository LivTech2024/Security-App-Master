import { useEffect, useState } from "react";
import Dialog from "../../../common/Dialog";
import DbSchedule, {
  IEmpScheduleForWeek,
  ISchedule,
} from "../../../firebase_configs/DB/DbSchedule";
import dayjs from "dayjs";
import { formatDate, splitName, toDate } from "../../../utilities/misc";
import { TiTick } from "react-icons/ti";
import { RxCross1 } from "react-icons/rx";
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from "../../../utilities/TsxUtils";
import { errorHandler } from "../../../utilities/CustomError";
import { useQueryClient } from "@tanstack/react-query";
import { REACT_QUERY_KEYS } from "../../../@types/enum";
import { IEmployeesCollection } from "../../../@types/database";
import { useAuthState } from "../../../store";
import { sendShiftDetailsEmail } from "../../../utilities/scheduleHelper";
import empDefaultPlaceHolder from "../../../../public/assets/avatar.png";

const AssignShiftModal = ({
  opened,
  setOpened,
  schedule,
  setSelectedSchedule,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
  schedule: ISchedule | null;
  setSelectedSchedule: React.Dispatch<React.SetStateAction<ISchedule | null>>;
}) => {
  const [selectedEmps, setSelectedEmps] = useState<IEmployeesCollection[]>([]);

  const queryClient = useQueryClient();

  const [empSchedulesForWeek, setEmpSchedulesForWeek] = useState<
    IEmpScheduleForWeek[]
  >([]);

  const { company } = useAuthState();

  useEffect(() => {
    const fetchEmpSchedule = async () => {
      if (!schedule || !company) return;
      try {
        const data = await DbSchedule.getEmployeesSchedule({
          startDate: dayjs(toDate(schedule.shift.ShiftDate))
            .startOf("week")
            .toDate(),
          endDate: dayjs(toDate(schedule.shift.ShiftDate))
            .endOf("week")
            .toDate(),
          currentDate: toDate(schedule?.shift.ShiftDate),
          empRole: schedule.shift.ShiftPosition,
          cmpId: company.CompanyId,
          cmpBranchId: schedule.shift.ShiftCompanyBranchId,
        });
        if (data) {
          setEmpSchedulesForWeek(data);
        }
      } catch (error) {
        console.log(error, "error");
      }
    };
    fetchEmpSchedule();
  }, [opened, schedule, company]);

  const onSubmit = async () => {
    if (!schedule || selectedEmps.length === 0 || !company) {
      return;
    }
    if (schedule.shift.ShiftRequiredEmp !== selectedEmps.length) {
      showSnackbar({
        message: `This shift requires ${
          schedule?.shift.ShiftRequiredEmp
        } ${schedule?.shift.ShiftPosition.toUpperCase()}s`,
        type: "error",
      });
      return;
    }
    try {
      showModalLoader({});

      await DbSchedule.assignShiftToEmp(
        schedule.shift.ShiftId,
        selectedEmps.map((emp) => emp.EmployeeId)
      );

      const { shift } = schedule;

      const sendEmailPromise = selectedEmps.map(async (emp) => {
        return sendShiftDetailsEmail({
          companyName: company!.CompanyName,
          empEmail: emp.EmployeeEmail,
          empName: emp.EmployeeName,
          shiftAddress: shift.ShiftLocationAddress || "N/A",
          shiftDate: formatDate(shift.ShiftDate),
          shiftEndTime: shift.ShiftEndTime,
          shiftName: shift.ShiftName,
          shiftStartTime: shift.ShiftStartTime,
        });
      });

      await Promise.all(sendEmailPromise);

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.SCHEDULES],
      });
      showSnackbar({ message: "Shift assigned successfully", type: "success" });
      closeModalLoader();
      setOpened(false);
    } catch (error) {
      errorHandler(error);
      closeModalLoader();
      console.log(error);
    }
  };

  const handleRowClicked = (data: IEmpScheduleForWeek) => {
    if (
      !data.EmpIsAvailable ||
      (schedule?.shift?.ShiftAssignedUserId &&
        schedule?.shift?.ShiftAssignedUserId.length > 0)
    )
      return;
    const emp: Partial<IEmployeesCollection> = {
      EmployeeId: data.EmpId,
      EmployeeEmail: data.EmpEmail,
      EmployeeName: data.EmpName,
    };

    setSelectedEmps((prev) => {
      if (prev.find((e) => e.EmployeeId === emp.EmployeeId)) {
        return prev.filter((e) => e.EmployeeId !== emp.EmployeeId);
      } else {
        if (selectedEmps.length === schedule?.shift.ShiftRequiredEmp) {
          showSnackbar({
            message: `This shift requires only ${
              schedule?.shift.ShiftRequiredEmp
            } ${schedule?.shift.ShiftPosition.toUpperCase()}s`,
            type: "error",
          });
          return prev;
        }
        return [...prev, emp as IEmployeesCollection];
      }
    });
  };

  return (
    <Dialog
      opened={opened}
      setOpened={setOpened}
      title="Assign shift to multiple employees"
      size="80%"
      isFormModal
      positiveCallback={onSubmit}
      disableSubmit={selectedEmps.length === 0}
      showBottomTool={
        schedule?.shift?.ShiftAssignedUserId &&
        schedule?.shift?.ShiftAssignedUserId.length > 0
          ? false
          : true
      }
      onClose={() => setSelectedSchedule(null)}
    >
      <div className="flex flex-col bg-gray-100 rounded-md p-4">
        <div className="font-semibold text-lg">
          Assign shift to {schedule?.shift.ShiftRequiredEmp} available{" "}
          {schedule?.shift.ShiftPosition.toUpperCase()}s
          <span className="ml-2 font-medium text-sm">
            {schedule?.shift.ShiftName} (
            {schedule?.shift.ShiftDate &&
              dayjs(toDate(schedule?.shift.ShiftDate)).format("dddd MMM-DD")}
            )
          </span>
        </div>
        <div className="bg-blue-500 py-1 px-2 text-xs text-surface w-fit mt-2 rounded">
          Highlighted {schedule?.shift.ShiftPosition.toUpperCase()} will be
          assigned
        </div>

        <table className="mt-4 text-sm">
          <thead className="">
            <tr>
              <th className="py-2 px-4 text-start w-[5%]">Image</th>
              <th className="py-2 px-4 text-start w-[15%]">First Name</th>
              <th className="py-2 px-4 text-start w-[15%]">Last Name</th>
              <th className="py-2 px-4 text-start w-[15%]">Phone</th>
              <th className="py-2 px-4 text-center w-[15%]">Week Shifts</th>
              <th className="py-2 px-4 text-center w-[15%]">Week Hours</th>
              <th className="py-2 px-4 text-end w-[20%]">Available</th>
            </tr>
          </thead>
          <tbody>
            {empSchedulesForWeek.length > 0 ? (
              empSchedulesForWeek.map((data) => {
                const { firstName, lastName } = splitName(data.EmpName);
                return (
                  <tr
                    onClick={() => handleRowClicked(data)}
                    className={`${
                      selectedEmps?.find((emp) => emp.EmployeeId === data.EmpId)
                        ? "bg-blue-500 text-surface"
                        : "bg-surface"
                    } cursor-pointer`}
                  >
                    <td className="text-start px-4 py-2">
                      <img
                        src={data.EmpImg ?? empDefaultPlaceHolder}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    </td>
                    <td className="text-start px-4 py-2">{firstName}</td>
                    <td className="text-start px-4 py-2">{lastName}</td>
                    <td className="text-start px-4 py-2">{data.EmpPhone}</td>
                    <td className="text-center px-4 py-2">
                      {data.EmpWeekShifts}
                    </td>
                    <td className="text-center px-4 py-2">
                      {data.EmpWeekHours.toFixed(1)}
                    </td>
                    <td className="text-end px-4 py-2">
                      <div className="flex justify-end">
                        {schedule?.employee &&
                        schedule.employee.find(
                          (emp) => emp.EmployeeId === data.EmpId
                        ) ? (
                          <span className="font-semibold">
                            Currently assigned{" "}
                          </span>
                        ) : data.EmpIsAvailable ? (
                          <TiTick className="text-textPrimaryGreen text-xl" />
                        ) : (
                          <RxCross1 className="text-textPrimaryRed text-xl" />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="p-4 text-center text-base">
                  <span className="bg-primaryGold p-2 rounded">
                    No employee available for this shift
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Dialog>
  );
};

export default AssignShiftModal;
