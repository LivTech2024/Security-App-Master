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
import { getHoursDiffInTwoTimeString, toDate } from "../../../utilities/misc";
import { Draggable, DropPoint } from "../../../utilities/DragAndDropHelper";
import {
  IEmployeesCollection,
  IShiftsCollection,
} from "../../../@types/database";
import { MdOutlineClose } from "react-icons/md";
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from "../../../utilities/TsxUtils";
import { errorHandler } from "../../../utilities/CustomError";
import { sendEmail } from "../../../utilities/sendEmail";
import { useAuthState } from "../../../store";
import InputSelect from "../../../common/inputs/InputSelect";
import AssignShiftModal from "../modal/AssignShiftModal";

interface PositionViewProps {
  datesArray: Date[];
}

const PositionView = ({ datesArray }: PositionViewProps) => {
  const [schedules, setSchedules] = useState<ISchedule[]>([]);

  const { company, companyBranches } = useAuthState();

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

  const getScheduleForDay = (date: Date, schedules?: ISchedule[]) => {
    if (!schedules) return [];
    return schedules.filter((schedule) =>
      dayjs(toDate(schedule.shift.ShiftDate)).isSame(date, "date")
    );
  };

  const [showEmpListByPosition, setShowEmpListByPosition] = useState<
    string | null
  >(null);

  const [selectedSchedule, setSelectedSchedule] = useState<ISchedule | null>(
    null
  );

  const [shiftBranchId, setShiftBranchId] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [empAvailableForShift, setEmpAvailableForShift] = useState<
    IEmpScheduleForWeek[]
  >([]);

  const [isEmpLoading, setIsEmpLoading] = useState(false);

  useEffect(() => {
    const fetchEmpSchedule = async () => {
      if (!showEmpListByPosition || !selectedDate || !company) return;
      try {
        setIsEmpLoading(true);
        const data = await DbSchedule.getEmployeesSchedule({
          startDate: dayjs(selectedDate).startOf("week").toDate(),
          endDate: dayjs(selectedDate).endOf("week").toDate(),
          currentDate: toDate(selectedDate),
          empRole: showEmpListByPosition,
          cmpId: company.CompanyId,
          cmpBranchId: shiftBranchId,
        });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, showEmpListByPosition, shiftBranchId]);

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

    if (selectedShift?.shift && selectedShift.shift.ShiftRequiredEmp > 1) {
      showSnackbar({
        message:
          "This shift requires more than 1 employee, click on the shift to assign multiple employees to it",
        type: "error",
      });
      return;
    }

    if (selectedShift?.employee && selectedShift.employee.length > 0) {
      showSnackbar({
        message: "This shift already have assigned employees",
        type: "error",
      });
      return;
    }

    if (!selectedEmp || !selectedShift) return;

    const shiftHours = getHoursDiffInTwoTimeString(
      selectedShift.shift.ShiftStartTime,
      selectedShift.shift.ShiftEndTime
    );

    const totalEmpWeekHoursAfterAssignation =
      shiftHours + selectedEmp.EmpWeekHours;

    if (totalEmpWeekHoursAfterAssignation > selectedEmp.EmpMaxWeekHours) {
      showSnackbar({
        message: "Employee maximum hours per week exceeded",
        type: "info",
      });
    }

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
            employee: [updatedEmp],
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
        return DbSchedule.assignShiftToEmp(result.shift.ShiftId, [
          result.emp.EmpId,
        ]);
      });

      await Promise.all(shiftAssignPromise);

      const aggregatedEmails: {
        empEmail: string;
        empName: string;
        message: string;
      }[] = [];

      resultToBePublished.forEach((data) => {
        const { emp, shift } = data;
        const isExistIndex = aggregatedEmails.findIndex(
          (d) => d.empEmail === emp.EmpEmail
        );
        if (isExistIndex !== -1) {
          const prevMessage = aggregatedEmails[isExistIndex].message;
          aggregatedEmails[
            isExistIndex
          ].message = `${prevMessage}\n\nShift Name: ${shift.ShiftName}\nTiming: ${shift.ShiftStartTime}-${shift.ShiftEndTime}\nAddress: ${shift.ShiftAddress}`;
        } else {
          aggregatedEmails.push({
            empEmail: emp.EmpEmail,
            empName: emp.EmpName,
            message: `You have been assigned for the following shift.\n\n Shift Name: ${shift.ShiftName}\n Timing: ${shift.ShiftStartTime}-${shift.ShiftEndTime} \n Address: ${shift.ShiftAddress}`,
          });
        }
      });

      const sendEmailPromise = aggregatedEmails.map(async (res) => {
        return sendEmail({
          to_email: res.empEmail,
          to_name: res.empName,
          message: res.message,
          subject: "Your schedule update",
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

    if (!empAvailableForShift.find((e) => e.EmpId === emp.EmpId)) {
      setEmpAvailableForShift((prev) => [...prev, emp]);
    }

    setSchedules((prev) => {
      const updatedSchedules = prev.map((schedule) => {
        if (schedule.shift.ShiftId === shift.ShiftId) {
          return {
            ...schedule,
            employee: [],
          };
        }
        return schedule;
      });

      return updatedSchedules as ISchedule[];
    });
  };

  /****************For multiple employee assignation to single shift****************/

  const [assignMultipleEmpModal, setAssignMultipleEmpModal] = useState(false);

  return (
    <>
      <DndProvider backend={HTML5Backend}>
        <div className="flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center gap-4 justify-between">
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
              className="text-lg"
              value={branch}
              onChange={(e) => setBranch(e as string)}
            />
            <div className="flex items-center gap-4">
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
          </div>
          {/* Employee list */}
          {showEmpListByPosition && selectedDate && !assignMultipleEmpModal && (
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
              <div className="flex items-center gap-4 flex-wrap">
                {empAvailableForShift.length > 0 && !isEmpLoading ? (
                  empAvailableForShift.map((data) => {
                    return (
                      <Draggable
                        draggableId={data.EmpId}
                        type={`${selectedDate.toString()}${showEmpListByPosition}`}
                        callback={dropResult}
                      >
                        <div className="flex items-center gap-2 bg-primaryGold p-2 rounded text-sm text-surface">
                          <img
                            src={data.EmpImg}
                            alt=""
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div key={data.EmpId} className="flex flex-col ">
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
                                {data.EmpWeekHours.toFixed(1)}
                              </span>{" "}
                            </div>
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
                            accept={`${toDate(
                              data.shift.ShiftDate
                            ).toString()}${data.shift.ShiftPosition}`}
                            className="h-full"
                            id={data.shift.ShiftId}
                            key={idx}
                          >
                            <div
                              onClick={() => {
                                setSelectedDate(toDate(data.shift.ShiftDate));
                                setSelectedSchedule(data);
                                setShiftBranchId(
                                  data.shift.ShiftCompanyBranchId || null
                                );
                                if (data.shift.ShiftRequiredEmp > 1) {
                                  setShowEmpListByPosition(null);
                                  setAssignMultipleEmpModal(true);
                                  return;
                                }

                                setShowEmpListByPosition(
                                  data.shift.ShiftPosition
                                );
                              }}
                              key={data.shift.ShiftId + idx}
                              className={`flex flex-col p-2 cursor-pointer`}
                            >
                              <div className="h-[30px] bg-gray-200 py-1 text-sm font-semibold  text-textPrimaryBlue capitalize">
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
                                {data.employee.length > 0 ? (
                                  <div className=" py-[2px] rounded w-full text-center line-clamp-1">
                                    {data.employee
                                      .map((emp) => emp.EmployeeName)
                                      .join(",")}
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

          <AssignShiftModal
            schedule={selectedSchedule}
            selectedDate={selectedDate}
            opened={assignMultipleEmpModal}
            setOpened={setAssignMultipleEmpModal}
          />
        </div>
      </DndProvider>
    </>
  );
};

export default PositionView;
