import { DatePickerInput } from "@mantine/dates";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { MdCalendarToday } from "react-icons/md";
import AddShiftModal from "../../component/shifts/modal/AddShiftModal";
import { useEditFormStore } from "../../store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { REACT_QUERY_KEYS } from "../../@types/enum";
import DbSchedule, { ISchedule } from "../../firebase_configs/DB/DbSchedule";
import { toDate } from "../../utilities/misc";
import AssignShiftModal from "../../component/schedule/modal/AssignShiftModal";
import { Select } from "@mantine/core";
import { FaCircleChevronLeft, FaCircleChevronRight } from "react-icons/fa6";
import { Draggable, DropPoint } from "../../utilities/DragAndDropHelper";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import DbShift from "../../firebase_configs/DB/DbShift";

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

  const [schedules, setSchedules] = useState<ISchedule[]>([]);

  const { data } = useQuery({
    queryKey: [REACT_QUERY_KEYS.SCHEDULES, datesArray],
    queryFn: async () => {
      const data = await DbSchedule.getScheduleForCalendarView(
        datesArray[0],
        datesArray[datesArray.length - 1]
      );
      return data;
    },
  });

  useEffect(() => {
    if (!data) return;
    setSchedules(data);
  }, [data]);

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

  const queryClient = useQueryClient();

  const dropResult = async (draggableId: string, dropPointId: string) => {
    try {
      await DbShift.changeShiftDate(draggableId, new Date(dropPointId));
      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.SCHEDULES],
      });
    } catch (error) {
      console.log(error);
    }
    console.log(draggableId, new Date(dropPointId));
  };

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

      {/* Top section */}
      <div className="flex items-center justify-between w-full">
        <Select
          allowDeselect={false}
          defaultValue="calendar"
          data={[{ label: "Calendar view", value: "calendar" }]}
          className="text-lg"
          styles={{
            input: {
              fontWeight: 500,
              fontSize: "18px",
              border: "1px solid #0000001A",
              padding: "4px 8px",
            },
          }}
        />

        <div className="flex items-center gap-4 mr-[10%]">
          <FaCircleChevronLeft
            className="text-2xl cursor-pointer"
            onClick={() =>
              setSelectedDate((prev) =>
                dayjs(prev).subtract(1, "week").toDate()
              )
            }
          />
          <label
            htmlFor="date_picker"
            className="flex items-center gap-4 cursor-pointer justify-center w-full"
          >
            <div className="font-semibold">
              Week of {dayjs(selectedDate).format("MMM DD, YYYY")}
            </div>

            <DatePickerInput
              type="default"
              id="date_picker"
              className="font-semibold"
              rightSection={
                <label>
                  <MdCalendarToday size={16} className="cursor-pointer" />
                </label>
              }
              value={selectedDate}
              onChange={(e) => setSelectedDate(e as Date)}
            />
          </label>
          <FaCircleChevronRight
            className="text-2xl cursor-pointer"
            onClick={() =>
              setSelectedDate((prev) => dayjs(prev).add(1, "week").toDate())
            }
          />
        </div>
        <div>&nbsp;</div>
      </div>
      <DndProvider backend={HTML5Backend}>
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
              {datesArray.map((date, index) => {
                return (
                  <td key={index} className="text-center px-2 py-2 align-top">
                    <div className="flex flex-col gap-4">
                      {getScheduleForDay(datesArray[index], schedules).map(
                        (data, idx) => {
                          return (
                            <Draggable
                              draggableId={data.shift.ShiftId}
                              type="box"
                              callback={dropResult}
                              canDrag={
                                getScheduleForDay(datesArray[index], schedules)
                                  .length ===
                                idx + 1
                                  ? true
                                  : false
                              }
                            >
                              <div
                                onClick={() => {
                                  setSelectedSchedule(data);
                                  setAssignShiftModal(true);
                                }}
                                key={data.shift.ShiftId}
                                className={`flex flex-col border hover:border-gray-500 bg-[#5e5c5c23] p-1 rounded cursor-move`}
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
                                    className="flex flex-col "
                                  >
                                    <div>{data.employee.EmployeeName}</div>
                                  </div>
                                ) : (
                                  <div className="bg-[#ffff64] py-[2px] rounded">
                                    (Unassigned)
                                  </div>
                                )}
                              </div>
                            </Draggable>
                          );
                        }
                      )}

                      <DropPoint
                        id={date.toDateString()}
                        accept="box"
                        className=" min-h-[75px]"
                      />
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </DndProvider>

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
