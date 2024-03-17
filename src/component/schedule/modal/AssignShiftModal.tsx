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
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const [empSchedulesForWeek, setEmpSchedulesForWeek] = useState<
    IEmpScheduleForWeek[]
  >([]);

  useEffect(() => {
    setSelectedEmpId(schedule?.employee ? schedule.employee.EmployeeId : null);
    const fetchEmpScheduleForWeek = async () => {
      if (!schedule) return;
      try {
        const data = await DbSchedule.getEmployeesSchedule(
          dayjs(selectedDate).startOf("week").toDate(),
          dayjs(selectedDate).endOf("week").toDate(),
          toDate(schedule?.shift.ShiftDate),
          schedule.shift.ShiftPosition
        );
        if (data) {
          setEmpSchedulesForWeek(data);
        }
      } catch (error) {
        console.log(error, "error");
      }
    };
    fetchEmpScheduleForWeek();
  }, [selectedDate, opened, schedule]);

  const onSubmit = async () => {
    if (!schedule || !selectedEmpId) return;
    try {
      showModalLoader({});

      await DbSchedule.assignShiftToEmp(schedule.shift.ShiftId, selectedEmpId);
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
      disableSubmit={!selectedEmpId}
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
            {empSchedulesForWeek.map((data) => {
              const { firstName, lastName } = splitName(data.EmpName);
              return (
                <tr
                  onClick={() => {
                    if (!data.EmpIsAvailable) return;
                    setSelectedEmpId(data.EmpId);
                  }}
                  className={`${
                    selectedEmpId === data.EmpId
                      ? "bg-blue-500 text-surface"
                      : "bg-surface"
                  } cursor-pointer`}
                >
                  <td className="text-start px-4 py-2">{firstName}</td>
                  <td className="text-start px-4 py-2">{lastName}</td>
                  <td className="text-start px-4 py-2">{data.EmpPhone}</td>
                  <td className="text-start px-4 py-2">{data.EmpWeekShifts}</td>
                  <td className="text-start px-4 py-2">
                    {data.EmpWeekHours.toFixed(1)}
                  </td>
                  <td className="text-center px-4 py-2">
                    {schedule?.employee ? (
                      <span className="font-semibold">Currently assigned </span>
                    ) : data.EmpIsAvailable ? (
                      <TiTick className="text-textPrimaryGreen text-xl text-center" />
                    ) : (
                      <RxCross1 className="text-textPrimaryRed text-xl text-center" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Dialog>
  );
};

export default AssignShiftModal;
