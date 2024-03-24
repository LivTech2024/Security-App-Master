import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { toDate } from "../../../utilities/misc";
import DbSchedule, { ISchedule } from "../../../firebase_configs/DB/DbSchedule";
import { Draggable, DropPoint } from "../../../utilities/DragAndDropHelper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { REACT_QUERY_KEYS } from "../../../@types/enum";
import DbShift from "../../../firebase_configs/DB/DbShift";
import AssignShiftModal from "../modal/AssignShiftModal";
import { useAuthState } from "../../../store";
import InputSelect from "../../../common/inputs/InputSelect";

interface CalendarViewProps {
  datesArray: Date[];
  selectedDate: Date;
}

const CalendarView = ({ datesArray, selectedDate }: CalendarViewProps) => {
  const queryClient = useQueryClient();

  const [schedules, setSchedules] = useState<ISchedule[]>([]);

  const [assignShiftModal, setAssignShiftModal] = useState(false);

  const [selectedSchedule, setSelectedSchedule] = useState<ISchedule | null>(
    null
  );

  const { company, companyBranches } = useAuthState();

  const [branch, setBranch] = useState("");

  const { data } = useQuery({
    queryKey: [
      REACT_QUERY_KEYS.SCHEDULES,
      datesArray,
      company!.CompanyId,
      branch,
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
    if (!data) return;
    setSchedules(data);
  }, [data]);

  const getScheduleForDay = (date: Date, schedules?: ISchedule[]) => {
    if (!schedules) return [];
    return schedules.filter((schedule) =>
      dayjs(toDate(schedule.shift.ShiftDate)).isSame(date, "date")
    );
  };

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
    <div className="flex flex-col gap-4">
      <InputSelect
        data={[
          { label: "All branch", value: "" },
          ...companyBranches.map((branches) => {
            return {
              label: branches.CompanyBranchName,
              value: branches.CompanyBranchId,
            };
          }),
        ]}
        placeholder="Select branch"
        className="text-lg w-fit"
        value={branch}
        onChange={(e) => setBranch(e as string)}
      />
      <DndProvider backend={HTML5Backend}>
        <div className="flex flex-wrap w-full overflow-hidden">
          {datesArray.map((date, index) => {
            return (
              <div key={index} className="flex flex-col w-[14.28%]">
                <div className="border-b-[30px] border-gray-200 font-semibold text-center">
                  {dayjs(date).format("ddd MMM-DD")}
                </div>

                <div className="flex flex-col gap-2 p-2 w-full h-full">
                  {getScheduleForDay(datesArray[index], schedules).map(
                    (data) => {
                      return (
                        <Draggable
                          draggableId={data.shift.ShiftId}
                          type="box"
                          callback={dropResult}
                          canDrag={!data.employee ? true : false}
                        >
                          <div
                            onClick={() => {
                              setSelectedSchedule(data);
                              setAssignShiftModal(true);
                            }}
                            key={data.shift.ShiftId}
                            className={`flex flex-col border hover:border-gray-500 bg-[#5e5c5c23] p-1 rounded min-w-full items-center ${
                              !data.employee ? "cursor-move" : "cursor-pointer"
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
                              <div className=" py-[2px] rounded w-full text-center">
                                {data.employee.EmployeeName}
                              </div>
                            ) : (
                              <div className="bg-[#ffff64] py-[2px] rounded w-full text-center">
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
                    className="min-h-[75px]"
                  />
                </div>
              </div>
            );
          })}
        </div>
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

export default CalendarView;
