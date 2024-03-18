import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { REACT_QUERY_KEYS } from "../../../@types/enum";
import DbSchedule, {
  IEmpScheduleForWeek,
  ISchedule,
} from "../../../firebase_configs/DB/DbSchedule";
import { toDate } from "../../../utilities/misc";
import { Draggable, DropPoint } from "../../../utilities/DragAndDropHelper";
import {
  IEmployeesCollection,
  IShiftsCollection,
  ShiftPositions,
} from "../../../@types/database";
import { MdOutlineClose } from "react-icons/md";
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from "../../../utilities/TsxUtils";
import { errorHandler } from "../../../utilities/CustomError";
import { sendEmail } from "../../../utilities/sendEmail";

interface PositionViewProps {
  datesArray: Date[];
}

const PositionView = ({ datesArray }: PositionViewProps) => {
  const [schedules, setSchedules] = useState<ISchedule[]>([]);

  const { data } = useQuery({
    queryKey: [REACT_QUERY_KEYS.SCHEDULES, datesArray],
    queryFn: async () => {
      const data = await DbSchedule.getSchedules(
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

  const [showEmpListByPosition, setShowEmpListByPosition] =
    useState<ShiftPositions | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [empAvailableForShift, setEmpAvailableForShift] = useState<
    IEmpScheduleForWeek[]
  >([]);

  const [isEmpLoading, setIsEmpLoading] = useState(false);

  useEffect(() => {
    const fetchEmpSchedule = async () => {
      if (!showEmpListByPosition || !selectedDate) return;
      try {
        setIsEmpLoading(true);
        const data = await DbSchedule.getEmployeesSchedule(
          dayjs(selectedDate).startOf("week").toDate(),
          dayjs(selectedDate).endOf("week").toDate(),
          toDate(selectedDate),
          showEmpListByPosition
        );
        if (data) {
          setEmpAvailableForShift(data.filter((emp) => emp.EmpIsAvailable));
        }
        setIsEmpLoading(false);
      } catch (error) {
        errorHandler(error);
        setIsEmpLoading(false);
        console.log(error, "error");
      }
    };
    fetchEmpSchedule();
  }, [selectedDate, showEmpListByPosition]);

  const [resultToBePublished, setResultToBePublished] = useState<
    {
      shift: IShiftsCollection;
      emp: IEmpScheduleForWeek;
    }[]
  >([]);

  const dropResult = (draggableId: string, dropPointId: string) => {
    const selectedEmp = empAvailableForShift.find(
      (emp) => emp.EmpId === draggableId
    );
    const selectedShift = schedules.find(
      (s) => s.shift.ShiftId === dropPointId
    );

    if (selectedShift?.employee) {
      showSnackbar({
        message: "This shift already have assigned employees",
        type: "error",
      });
      return;
    }

    if (!selectedEmp || !selectedShift) return;

    setResultToBePublished((prev) => [
      ...prev,
      { emp: selectedEmp, shift: selectedShift.shift },
    ]);

    setEmpAvailableForShift((prev) =>
      prev.filter((e) => e.EmpId !== selectedEmp?.EmpId)
    );

    setSchedules((prev) => {
      const updatedSchedules = prev.map((schedule) => {
        if (schedule.shift.ShiftId === selectedShift?.shift.ShiftId) {
          // Update the employee field for the selected schedule
          const updatedEmp: Partial<IEmployeesCollection> = {
            EmployeeId: selectedEmp?.EmpId,
            EmployeeName: selectedEmp?.EmpName,
          };
          return {
            ...schedule,
            employee: updatedEmp,
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
        return DbSchedule.assignShiftToEmp(
          result.shift.ShiftId,
          result.emp.EmpId
        );
      });

      await Promise.all(shiftAssignPromise);

      const sendEmailPromise = resultToBePublished.map(async (res) => {
        const { emp, shift } = res;
        return sendEmail({
          to_email: emp.EmpEmail,
          to_name: emp.EmpName,
          message: `You have been assigned for the shift. Shift Name: ${shift.ShiftName}\n Timing: ${shift.ShiftStartTime}-${shift.ShiftEndTime} \n location: ${shift.ShiftLocation}`,
          subject: "You schedule update",
        });
      });

      Promise.allSettled(sendEmailPromise).catch((error) => {
        console.log(error, "Error while sending emails to employees");
      });

      setResultToBePublished([]);

      showSnackbar({
        message: "Schedule published successfully",
        type: "success",
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

    const { emp, shift } = resultToBeUndo;

    setResultToBePublished((prev) => prev.slice(0, -1));

    setEmpAvailableForShift((prev) => [...prev, emp]);

    setSchedules((prev) => {
      const updatedSchedules = prev.map((schedule) => {
        if (schedule.shift.ShiftId === shift.ShiftId) {
          return {
            ...schedule,
            employee: null,
          };
        }
        return schedule;
      });

      return updatedSchedules as ISchedule[];
    });
  };

  return (
    <>
      <DndProvider backend={HTML5Backend}>
        <div className="flex flex-col gap-4 overflow-hidden">
          {/* Employee list */}
          {showEmpListByPosition && selectedDate && (
            <div className="flex flex-col gap-4">
              <div className="font-medium flex items-center gap-2">
                Available
                <span className="capitalize font-semibold">
                  {showEmpListByPosition}
                </span>
                for{" "}
                <span className="font-semibold">
                  {dayjs(selectedDate).format("ddd MMM-DD")}
                </span>
                <MdOutlineClose
                  onClick={() => {
                    setShowEmpListByPosition(null);
                    setSelectedDate(null);
                  }}
                  className="text-textPrimaryRed text-xl ml-4 cursor-pointer mb-[1px]"
                />
              </div>
              <div className="flex items-center gap-4 flex-wrap cursor-move">
                {empAvailableForShift.length > 0 && !isEmpLoading ? (
                  empAvailableForShift.map((data) => {
                    return (
                      <Draggable
                        draggableId={data.EmpId}
                        type={selectedDate.toString()}
                        callback={dropResult}
                      >
                        <div
                          key={data.EmpId}
                          className="flex flex-col bg-primaryGold p-2 rounded text-sm text-surface"
                        >
                          <div className="flex items-center gap-2">
                            Name:{" "}
                            <span className="font-semibold">
                              {data.EmpName}
                            </span>{" "}
                          </div>
                          <div className="flex items-center gap-2">
                            Week shifts:{" "}
                            <span className="font-semibold">
                              {data.EmpWeekShifts}
                            </span>{" "}
                          </div>
                          <div className="flex items-center gap-2">
                            Week hours:{" "}
                            <span className="font-semibold">
                              {data.EmpWeekHours}
                            </span>{" "}
                          </div>
                        </div>
                      </Draggable>
                    );
                  })
                ) : isEmpLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => {
                    return (
                      <div
                        key={idx}
                        className="bg-shimmerColor animate-pulse w-[150px] h-[80px]"
                      ></div>
                    );
                  })
                ) : (
                  <div className="bg-primaryGold font-bold py-1 px-2 rounded">
                    No {showEmpListByPosition} available for{" "}
                    {dayjs(selectedDate).format("ddd MMM-DD")}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex items-center gap-4 justify-end">
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
          <div className="flex flex-wrap w-full overflow-hidden">
            {datesArray.map((date, index) => {
              return (
                <div
                  key={index}
                  className="flex flex-col w-[14.28%] text-center"
                >
                  <div className="font-semibold">
                    {dayjs(date).format("ddd MMM-DD")}
                  </div>

                  {getScheduleForDay(datesArray[index], schedules).length >
                  0 ? (
                    getScheduleForDay(datesArray[index], schedules).map(
                      (data, idx) => {
                        return (
                          <DropPoint
                            accept={toDate(data.shift.ShiftDate).toString()}
                            className="h-full"
                            id={data.shift.ShiftId}
                            key={idx}
                          >
                            <div
                              key={data.shift.ShiftId + idx}
                              className={`flex flex-col p-2`}
                            >
                              <div
                                onClick={() => {
                                  setSelectedDate(toDate(data.shift.ShiftDate));
                                  setShowEmpListByPosition(
                                    data.shift.ShiftPosition
                                  );
                                }}
                                className="h-[30px] bg-gray-200 py-1 text-sm font-semibold cursor-pointer text-textPrimaryBlue capitalize"
                              >
                                {data.shift.ShiftPosition}
                              </div>

                              <div className="bg-[#5e5c5c23] p-2 rounded  min-w-full items-center text-sm">
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
                            </div>
                          </DropPoint>
                        );
                      }
                    )
                  ) : (
                    <div className="flex flex-col">
                      <div className="h-[40px] "></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DndProvider>
    </>
  );
};

export default PositionView;
