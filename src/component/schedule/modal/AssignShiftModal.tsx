import { useEffect, useState } from "react";
import Dialog from "../../../common/Dialog";
import DbSchedule, {
  IEmpScheduleForWeek,
  ISchedule,
} from "../../../firebase_configs/DB/DbSchedule";
import dayjs from "dayjs";
import { splitName, toDate } from "../../../utilities/misc";
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
import { sendEmail } from "../../../utilities/sendEmail";
import { IEmployeesCollection } from "../../../@types/database";
import { useAuthState } from "../../../store";

const AssignShiftModal = ({
  opened,
  setOpened,
  selectedDate,
  schedule,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
  selectedDate: Date;
  schedule: ISchedule | null;
}) => {
  const [selectedEmp, setSelectedEmp] = useState<IEmployeesCollection | null>(
    null
  );

  const queryClient = useQueryClient();

  const [empSchedulesForWeek, setEmpSchedulesForWeek] = useState<
    IEmpScheduleForWeek[]
  >([]);

  const { company } = useAuthState();

  useEffect(() => {
    setSelectedEmp(schedule?.employee ? schedule.employee : null);
    const fetchEmpSchedule = async () => {
      if (!schedule || !company) return;
      try {
        const data = await DbSchedule.getEmployeesSchedule({
          startDate: dayjs(selectedDate).startOf("week").toDate(),
          endDate: dayjs(selectedDate).endOf("week").toDate(),
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
  }, [selectedDate, opened, schedule]);

  const onSubmit = async () => {
    if (
      !schedule ||
      !selectedEmp ||
      selectedEmp.EmployeeId === schedule?.employee?.EmployeeId
    ) {
      return;
    }
    try {
      showModalLoader({});

      await DbSchedule.assignShiftToEmp(
        schedule.shift.ShiftId,
        selectedEmp.EmployeeId
      );
      sendEmail({
        to_email: selectedEmp.EmployeeEmail,
        to_name: selectedEmp.EmployeeName,
        message: `You have been assigned for the shift.\n Shift Name: ${schedule.shift.ShiftName}\n Timing: ${schedule.shift.ShiftStartTime}-${schedule.shift.ShiftEndTime} \n Address: ${schedule.shift.ShiftAddress}`,
        subject: "Your schedule update",
      });
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

  return (
    <Dialog
      opened={opened}
      setOpened={setOpened}
      title="Assign shift"
      size="auto"
      isFormModal
      positiveCallback={onSubmit}
      disableSubmit={
        !selectedEmp ||
        selectedEmp.EmployeeId === schedule?.employee?.EmployeeId
      }
    >
      <div className="flex flex-col bg-gray-100 rounded-md p-4">
        <div className="font-semibold text-lg">
          Assign shift to available{" "}
          {schedule?.shift.ShiftPosition.toUpperCase()}
          <span className="ml-2 font-medium text-sm">
            {schedule?.shift.ShiftName} (
            {dayjs(selectedDate).format("dddd MMM-DD")})
          </span>
        </div>
        <div className="bg-blue-500 py-1 px-2 text-xs text-surface w-fit mt-2 rounded">
          Highlighted {schedule?.shift.ShiftPosition.toUpperCase()} will be
          assigned
        </div>

        <table className="mt-4 text-sm">
          <thead className="">
            <tr>
              <th className="py-2 px-4 text-start">First Name</th>
              <th className="py-2 px-4 text-start">Last Name</th>
              <th className="py-2 px-4 text-start">Phone</th>
              <th className="py-2 px-4 text-start">Week Shifts</th>
              <th className="py-2 px-4 text-start">Week Hours</th>
              <th className="py-2 px-4 text-end">Available</th>
            </tr>
          </thead>
          <tbody>
            {empSchedulesForWeek.length > 0 ? (
              empSchedulesForWeek.map((data) => {
                const { firstName, lastName } = splitName(data.EmpName);
                return (
                  <tr
                    onClick={() => {
                      if (!data.EmpIsAvailable) return;
                      const emp: Partial<IEmployeesCollection> = {
                        EmployeeId: data.EmpId,
                        EmployeeEmail: data.EmpEmail,
                        EmployeeName: data.EmpName,
                      };
                      setSelectedEmp(emp as IEmployeesCollection);
                    }}
                    className={`${
                      selectedEmp?.EmployeeId === data.EmpId
                        ? "bg-blue-500 text-surface"
                        : "bg-surface"
                    } cursor-pointer`}
                  >
                    <td className="text-start px-4 py-2">{firstName}</td>
                    <td className="text-start px-4 py-2">{lastName}</td>
                    <td className="text-start px-4 py-2">{data.EmpPhone}</td>
                    <td className="text-start px-4 py-2">
                      {data.EmpWeekShifts}
                    </td>
                    <td className="text-start px-4 py-2">
                      {data.EmpWeekHours.toFixed(1)}
                    </td>
                    <td className="text-center px-4 py-2">
                      {schedule?.employee &&
                      schedule.employee.EmployeeId === data.EmpId ? (
                        <span className="font-semibold">
                          Currently assigned{" "}
                        </span>
                      ) : data.EmpIsAvailable ? (
                        <TiTick className="text-textPrimaryGreen text-xl text-center" />
                      ) : (
                        <RxCross1 className="text-textPrimaryRed text-xl text-center" />
                      )}
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
