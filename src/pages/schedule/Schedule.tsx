import { DatePickerInput } from "@mantine/dates";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { MdCalendarToday } from "react-icons/md";
import AddShiftModal from "../../component/shifts/modal/AddShiftModal";
import { useEditFormStore } from "../../store";
import { useQuery } from "@tanstack/react-query";
import { REACT_QUERY_KEYS } from "../../@types/enum";
import DbSchedule, { ISchedule } from "../../firebase_configs/DB/DbSchedule";
import { toDate } from "../../utilities/misc";
import AssignShiftModal from "../../component/schedule/modal/AssignShiftModal";

const Schedule = () => {
  const [addShiftModal, setAddShiftModal] = useState(false);

  const [assignShiftModal, setAssignShiftModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [datesArray, setDatesArray] = useState<Date[]>([]);
  const [selectedTenure] = useState<"weekly" | "monthly">("weekly");

  const { setShiftEditData } = useEditFormStore();

  useEffect(() => {
    if (selectedTenure === "weekly") {
      setDatesArray([]);

      for (
        let i = dayjs(selectedDate).startOf("week");
        i.isBefore(dayjs(selectedDate).endOf("week"));
        i = dayjs(i).add(1, "day")
      ) {
        setDatesArray((prev) => [...prev, i.toDate()]);
      }
    }
  }, [selectedDate, selectedTenure]);

  const { data: schedules } = useQuery({
    queryKey: [REACT_QUERY_KEYS.SCHEDULES, datesArray],
    queryFn: async () => {
      const data = await DbSchedule.getScheduleForCalendarView(
        datesArray[0],
        datesArray[datesArray.length - 1]
      );
      return data;
    },
  });

  const getScheduleForDay = (date: Date, schedules?: ISchedule[]) => {
    if (!schedules) return [];
    return schedules.filter((schedule) =>
      dayjs(toDate(schedule.shift.ShiftDate)).isSame(date, "date")
    );
  };

  /*************Assign shift************** */
  const [selectedSchedule, setSelectedSchedule] = useState<ISchedule | null>(
    null
  );

  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <div className="flex justify-between w-full p-4 rounded bg-primaryGold text-surface items-center">
        <span className="font-semibold text-xl">Schedule</span>

        <button
          onClick={() => {
            setShiftEditData(null);
            setAddShiftModal(true);
          }}
          className="bg-primary text-surface px-4 py-2 rounded"
        >
          Add new shift
        </button>
      </div>

      <AddShiftModal opened={addShiftModal} setOpened={setAddShiftModal} />

      <div className="flex items-center gap-4">
        <div className="font-medium">
          Week of {dayjs(selectedDate).format("MMM DD, YYYY")}
        </div>
        <DatePickerInput
          rightSection={
            <label>
              <MdCalendarToday size={16} className="cursor-pointer" />
            </label>
          }
          value={selectedDate}
          onChange={(e) => setSelectedDate(e as Date)}
        />
      </div>

      <table className="w-full">
        <thead className="text-sm font-normal">
          <tr className="border-b-[30px] border-gray-200">
            {datesArray.map((dates, index) => {
              return (
                <th key={index} className="w-[14.29%] text-center font-bold">
                  {dayjs(dates).format("dddd MMM-DD")}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody className="text-sm">
          {/* Map all the shifts according to date */}

          <tr>
            {datesArray.map((_, index) => {
              return (
                <td key={index} className="text-center px-2 py-2 align-top">
                  <div className="flex flex-col gap-4">
                    {getScheduleForDay(datesArray[index], schedules).map(
                      (data) => {
                        return (
                          <div
                            onClick={() => {
                              setSelectedSchedule(data);
                              setAssignShiftModal(true);
                            }}
                            key={data.shift.ShiftId}
                            className={`flex flex-col ${
                              data.employee ? "cursor-move" : "cursor-pointer"
                            }`}
                          >
                            <div className="text-base font-medium">
                              {data.shift.ShiftName}
                            </div>
                            <div className="font-semibold">
                              {data.shift.ShiftStartTime}-
                              {data.shift.ShiftEndTime}
                            </div>
                            {data.employee ? (
                              <div
                                onClick={() => setAssignShiftModal(true)}
                                className="flex flex-col p-1 bg-[#faf9f9] border hover:border-gray-500"
                              >
                                <div>{data.employee.EmployeeName}</div>
                              </div>
                            ) : (
                              <div className="bg-[#ffff64] py-[2px]">
                                (Unassigned)
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>

      <div className="hidden">
        <AssignShiftModal
          opened={assignShiftModal}
          setOpened={setAssignShiftModal}
          selectedDate={selectedDate}
          schedule={selectedSchedule}
        />
      </div>
    </div>
  );
};

export default Schedule;
