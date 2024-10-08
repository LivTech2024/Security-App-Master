import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import empDefaultPlaceHolder from '../../../../../public/assets/avatar.png';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { CollectionName, REACT_QUERY_KEYS } from '../../../../@types/enum';
import Fuse from 'fuse.js';
import DbSchedule, {
  IEmpScheduleForWeek,
  ISchedule,
} from '../../../../firebase_configs/DB/DbSchedule';
import {
  formatDate,
  getHoursDiffInTwoTimeString,
  getRandomNumbers,
  removeTimeFromDate,
  toDate,
} from '../../../../utilities/misc';
import { Draggable } from '../../../../utilities/DragAndDropHelper';
import {
  IEmployeesCollection,
  IShiftTasksChild,
  IShiftsCollection,
} from '../../../../@types/database';
import { showSnackbar } from '../../../../utilities/TsxUtils';
import { errorHandler } from '../../../../utilities/CustomError';
import { useAuthState, useUIState } from '../../../../store';
import AssignShiftModal from '../../modal/AssignShiftModal';
import SelectBranch from '../../../../common/SelectBranch';
import { Accordion } from '@mantine/core';
import { sendEmail } from '../../../../API/SendEmail';
import DbShift from '../../../../firebase_configs/DB/DbShift';
import ShiftDropPoint from './ShiftDropPoint';
import Button from '../../../../common/button/Button';
import { openContextModal } from '@mantine/modals';
import { Timestamp, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getNewDocId } from '../../../../firebase_configs/DB/utils';
import { db } from '../../../../firebase_configs/config';
import SearchBar from '../../../../common/inputs/SearchBar';
import ColorPelletTooltip from './ColorPelletTooltip';
import SaveAndPublishButton from './SaveAndPublishButton';

interface CalendarViewProps {
  datesArray: Date[];
}

const CalendarView = ({ datesArray }: CalendarViewProps) => {
  const { setLoading } = useUIState();

  const [resultToBePublished, setResultToBePublished] = useState<
    {
      shift: IShiftsCollection;
      emp: IEmpScheduleForWeek;
    }[]
  >([]);

  const [shiftToBeDeleted, setShiftToBeDeleted] = useState<string[]>([]);

  const [schedules, setSchedules] = useState<ISchedule[]>([]);

  const { company, empRoles } = useAuthState();

  const [branch, setBranch] = useState('');

  const queryClient = useQueryClient();

  const { data, error, isLoading } = useQuery({
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

    setSchedules([]);

    data?.forEach((s) => {
      //*Check if this shift is in resultToBePublishedArray
      if (
        resultToBePublished.length > 0 &&
        resultToBePublished.find((r) => r.shift.ShiftId === s.shift.ShiftId)
      ) {
        const prevShiftResultData = resultToBePublished.find(
          (r) => r.shift.ShiftId === s.shift.ShiftId
        );

        const employee: Partial<IEmployeesCollection> = {
          EmployeeId: prevShiftResultData?.emp?.EmpId,
          EmployeeName: prevShiftResultData?.emp?.EmpName,
          EmployeeImg: prevShiftResultData?.emp?.EmpImg,
          EmployeeRole: prevShiftResultData?.emp?.EmpRole,
          EmployeeEmail: prevShiftResultData?.emp?.EmpEmail,
        };

        setSchedules((prev) => [
          ...prev,
          {
            shift: s.shift,
            employee: [employee as IEmployeesCollection],
          },
        ]);
      } else {
        setSchedules((prev) => [...prev, s]);
      }
    });
  }, [data, error]);

  const [selectedSchedule, setSelectedSchedule] = useState<ISchedule | null>(
    null
  );

  const [empAvailableForShift, setEmpAvailableForShift] = useState<
    IEmpScheduleForWeek[]
  >([]);

  const [isEmpLoading, setIsEmpLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(datesArray[0]);

  const [unPublishedShifts, setUnPublishedShifts] = useState<
    {
      shift: IShiftsCollection;
      emp: IEmployeesCollection;
    }[]
  >([]);

  useEffect(() => {
    setSelectedDate(new Date());
  }, []);

  useEffect(() => {
    const fetchEmpSchedule = async () => {
      if (!selectedDate || !company) return;
      try {
        setIsEmpLoading(true);
        const data = await DbSchedule.getEmployeesSchedule({
          startDate: dayjs(selectedDate).startOf('week').toDate(),
          endDate: dayjs(selectedDate).endOf('week').toDate(),
          currentDate: toDate(selectedDate),
          cmpId: company.CompanyId,
          cmpBranchId: branch,
        });
        if (data) {
          const filteredData = data.filter(
            (d) =>
              !resultToBePublished.find(
                (r) =>
                  r.emp.EmpId === d.EmpId &&
                  dayjs(toDate(r.shift?.ShiftDate)).isSame(selectedDate, 'day')
              )
          );
          setEmpAvailableForShift(filteredData);
        }
        setIsEmpLoading(false);
      } catch (error) {
        errorHandler(error);
        setIsEmpLoading(false);
        console.log(error, 'error');
      }
    };
    fetchEmpSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, branch]);

  useEffect(() => {
    if (!schedules || schedules.length === 0) return;
    const unPublished = schedules.filter(
      (s) =>
        s.shift.ShiftIsPublished === false &&
        s.shift.ShiftAssignedUserId.length === 1 &&
        s.employee.length === 1
    );

    setUnPublishedShifts(
      unPublished.map((s) => {
        return { emp: s.employee[0], shift: s.shift };
      })
    );
  }, [schedules]);

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
          'This shift requires more than 1 employee, click on the shift to assign multiple employees to it',
        type: 'error',
      });
      return;
    }

    if (selectedShift?.employee && selectedShift.employee.length > 0) {
      showSnackbar({
        message: 'This shift already have assigned employees',
        type: 'error',
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
        message: 'Employee maximum hours per week exceeded',
        type: 'info',
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
            EmployeeImg: selectedEmp?.EmpImg,
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

  const onSavePublish = async (action: 'save' | 'save_publish' | 'publish') => {
    try {
      setLoading(true);

      if (resultToBePublished.length > 0 && action !== 'publish') {
        const shiftAssignPromise = resultToBePublished.map(async (result) => {
          return DbSchedule.assignShiftToEmp(
            result.shift.ShiftId,
            [result.emp.EmpId],
            action === 'save_publish' ? true : false
          );
        });

        await Promise.all(shiftAssignPromise);

        if (action === 'save_publish') {
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
              aggregatedEmails[isExistIndex].message =
                `${prevMessage}\n\nShift Name: ${
                  shift.ShiftName
                } \n Date: ${formatDate(shift.ShiftDate)} \nTiming: ${
                  shift.ShiftStartTime
                }-${shift.ShiftEndTime}\nAddress: ${shift.ShiftLocationAddress}`;
            } else {
              aggregatedEmails.push({
                empEmail: emp.EmpEmail,
                empName: emp.EmpName,
                message: `You have been assigned for the following shift.\n\n Shift Name: ${
                  shift.ShiftName
                } \n Date: ${formatDate(shift.ShiftDate)} \n Timing: ${
                  shift.ShiftStartTime
                }-${shift.ShiftEndTime} \n Address: ${shift.ShiftLocationAddress}`,
              });
            }
          });

          await Promise.all(
            aggregatedEmails.map(async (res) => {
              return sendEmail({
                to_email: res.empEmail,
                text: res.message,
                subject: 'Your schedule update',
                from_name: company!.CompanyName,
              });
            })
          );
        }

        setResultToBePublished([]);
      }

      if (unPublishedShifts.length > 0 && action === 'publish') {
        console.log('Publishing shifts');
        const shiftPublishedPromise = unPublishedShifts.map(async (result) => {
          return DbSchedule.markShiftAsPublished(result.shift.ShiftId, true);
        });

        await Promise.all(shiftPublishedPromise);

        const aggregatedEmails: {
          empEmail: string;
          empName: string;
          message: string;
        }[] = [];

        unPublishedShifts.forEach((data) => {
          const { emp, shift } = data;
          const isExistIndex = aggregatedEmails.findIndex(
            (d) => d.empEmail === emp.EmployeeEmail
          );
          if (isExistIndex !== -1) {
            const prevMessage = aggregatedEmails[isExistIndex].message;
            aggregatedEmails[isExistIndex].message =
              `${prevMessage}\n\nShift Name: ${
                shift.ShiftName
              } \n Date: ${formatDate(shift.ShiftDate)} \nTiming: ${
                shift.ShiftStartTime
              }-${shift.ShiftEndTime}\nAddress: ${shift.ShiftLocationAddress}`;
          } else {
            aggregatedEmails.push({
              empEmail: emp.EmployeeEmail,
              empName: emp.EmployeeName,
              message: `You have been assigned for the following shift.\n\n Shift Name: ${
                shift.ShiftName
              } \n Date: ${formatDate(shift.ShiftDate)} \n Timing: ${
                shift.ShiftStartTime
              }-${shift.ShiftEndTime} \n Address: ${shift.ShiftLocationAddress}`,
            });
          }
        });

        await Promise.all(
          aggregatedEmails.map(async (res) => {
            return sendEmail({
              to_email: res.empEmail,
              text: res.message,
              subject: 'Your schedule update',
              from_name: company!.CompanyName,
            });
          })
        );

        setUnPublishedShifts([]);
      }
      if (shiftToBeDeleted.length > 0) {
        const shiftDeletePromise = shiftToBeDeleted.map(async (result) => {
          return DbShift.deleteShift(result);
        });

        await Promise.all(shiftDeletePromise);

        setShiftToBeDeleted([]);
      }

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.SCHEDULES],
      });

      showSnackbar({
        message: `Schedule ${action === 'save' ? 'saved' : action === 'save_publish' ? 'saved and published' : 'published'} successfully`,
        type: 'success',
      });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      errorHandler(error);
      console.log(error);
    }
  };

  const onUndo = (shiftId?: string, empId?: string) => {
    if (resultToBePublished.length === 0) {
      return;
    }

    const lastResultIndex = resultToBePublished.length - 1;

    let resultToBeUndo;

    if (shiftId && empId) {
      resultToBeUndo = resultToBePublished.find(
        (res) => res.shift.ShiftId === shiftId
      );
      setResultToBePublished((prev) =>
        prev.filter((res) => res.shift.ShiftId !== shiftId)
      );
    } else {
      resultToBeUndo = resultToBePublished[lastResultIndex];
      setResultToBePublished((prev) => prev.slice(0, -1));
    }

    if (!resultToBeUndo) return;

    setSelectedDate(toDate(resultToBeUndo.shift.ShiftDate));

    const { emp, shift } = resultToBeUndo;

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

  const onDeleteClick = (shiftId: string) => {
    setShiftToBeDeleted((prev) => [...prev, shiftId]);
  };

  const onDeleteUndo = (shiftId: string) => {
    setShiftToBeDeleted((prev) => prev.filter((s) => s !== shiftId));
  };

  /****************For multiple employee assignation to single shift****************/

  const [assignMultipleEmpModal, setAssignMultipleEmpModal] = useState(false);

  /***************Shift Copy Feature********************* */

  const onCopyShiftCopy = async () => {
    const isWeekly = datesArray.length === 7;
    try {
      setLoading(true);
      const shiftCreatePromise = schedules.map(async (data) => {
        const { ShiftDate, ShiftTask } = data.shift;

        const shiftId = getNewDocId(CollectionName.shifts);
        const shiftDocRef = doc(db, CollectionName.shifts, shiftId);
        const shiftTasks: IShiftTasksChild[] = [];

        ShiftTask.map((task, idx) => {
          if (task.ShiftTask && task.ShiftTask.length > 0) {
            const random = getRandomNumbers();
            const shiftTaskId = `${shiftId}${random}${idx}`;

            shiftTasks.push({
              ShiftTaskId: shiftTaskId,
              ShiftTask: task.ShiftTask,
              ShiftTaskQrCodeReq: task.ShiftTaskQrCodeReq,
              ShiftTaskReturnReq: task.ShiftTaskReturnReq,
              ShiftTaskStatus: [],
              ShiftReturnTaskStatus: [],
            });
          }
        });

        const newShiftDate = isWeekly
          ? (removeTimeFromDate(
              dayjs(toDate(ShiftDate)).add(7, 'days').toDate()
            ) as unknown as Timestamp)
          : (removeTimeFromDate(
              dayjs(toDate(ShiftDate))
                .add(dayjs().daysInMonth(), 'day')
                .toDate()
            ) as unknown as Timestamp);

        const newShiftData: IShiftsCollection = {
          ...data.shift,
          ShiftId: shiftId,
          ShiftAcknowledgedByEmpId: [],
          ShiftAssignedUserId: [],
          ShiftCurrentStatus: [],
          ShiftGuardWellnessReport: [],
          ShiftDate: newShiftDate,
          ShiftTask: shiftTasks,
          ShiftCreatedAt: serverTimestamp(),
          ShiftModifiedAt: serverTimestamp(),
        };

        await setDoc(shiftDocRef, newShiftData);
      });

      await Promise.all(shiftCreatePromise);

      setLoading(false);

      showSnackbar({
        message: 'All shifts copied successfully',
        type: 'success',
      });
    } catch (error) {
      setLoading(false);
      console.log(error);
      errorHandler(error);
    }
  };

  //* Emp search feature
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEmployees, setFilteredEmployees] =
    useState(empAvailableForShift);

  useEffect(() => {
    const fuse = new Fuse(empAvailableForShift, {
      keys: ['EmpName', 'EmpRole'],
      threshold: 0.3,
    });

    if (searchQuery) {
      const result = fuse.search(searchQuery).map(({ item }) => item);
      setFilteredEmployees(result);
    } else {
      setFilteredEmployees(empAvailableForShift);
    }
  }, [searchQuery, empAvailableForShift]);

  //*Copy single shift

  const [copiedShifts, setCopiedShifts] = useState<IShiftsCollection[]>([]);

  return (
    <>
      <DndProvider backend={HTML5Backend}>
        <div className="flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center gap-4 justify-between">
            <div className="flex items-center gap-6">
              <SelectBranch
                selectedBranch={branch}
                setSelectedBranch={setBranch}
              />
              <Button
                type="black"
                onClick={() => {
                  openContextModal({
                    modal: 'confirmModal',
                    withCloseButton: false,
                    centered: true,
                    closeOnClickOutside: true,
                    innerProps: {
                      title: 'Confirm',
                      body: (
                        <div className="flex flex-col">
                          <div className="font-semibold text-base leading-5">
                            Are you sure to copy all the shifts to next{' '}
                            {datesArray.length === 7 ? 'Week' : 'Month'}?
                          </div>
                          <div className="mt-4">
                            This will create a heavy load on your system, make
                            sure you have stable internet connection
                          </div>
                        </div>
                      ),
                      onConfirm: () => {
                        onCopyShiftCopy();
                      },
                    },
                    size: '30%',
                    styles: {
                      body: { padding: '0px' },
                    },
                  });
                }}
                label={`Copy All Shifts To Next ${datesArray.length === 7 ? 'Week' : 'Month'}`}
                className="text-sm"
              />
              <ColorPelletTooltip />
            </div>
            <div className="flex items-center gap-4">
              <button
                disabled={resultToBePublished.length === 0}
                className="rounded bg-gray-200 py-2 px-10 text-sm"
                onClick={() => onUndo()}
              >
                UNDO Drag/Drop
              </button>

              <SaveAndPublishButton
                isSaveAndPublishDisabled={
                  resultToBePublished.length === 0 &&
                  shiftToBeDeleted.length === 0
                }
                isSaveDisabled={
                  resultToBePublished.length === 0 &&
                  shiftToBeDeleted.length === 0
                }
                isPublishDisabled={unPublishedShifts.length === 0}
                callback={onSavePublish}
              />
            </div>
          </div>

          <div className="flex items-start gap-6 w-full justify-between">
            <div className="flex w-full flex-wrap max-h-[80vh] overflow-auto remove-vertical-scrollbar">
              {datesArray.map((date, index) => {
                return (
                  <ShiftDropPoint
                    index={index}
                    date={date}
                    datesArray={datesArray}
                    onDeleteClick={onDeleteClick}
                    onDeleteUndo={onDeleteUndo}
                    onUndo={onUndo}
                    schedules={schedules}
                    setAssignMultipleEmpModal={setAssignMultipleEmpModal}
                    setSelectedDate={setSelectedDate}
                    setSelectedSchedule={setSelectedSchedule}
                    shiftToBeDeleted={shiftToBeDeleted}
                    isLoading={isLoading}
                    copiedShifts={copiedShifts}
                    setCopiedShifts={setCopiedShifts}
                  />
                );
              })}
            </div>
            {selectedDate && (
              <div className="flex flex-col gap-4 p-4 bg-onHoverBg rounded shadow w-[30%] sticky top-0">
                <div className="flex flex-col gap-2  w-full">
                  <span className="font-semibold">
                    Onboard Employees ({dayjs(selectedDate).format('ddd MMM-D')}
                    )
                  </span>
                </div>
                <Accordion variant="contained">
                  {empRoles
                    .sort((a, b) =>
                      a.EmployeeRoleName.localeCompare(b.EmployeeRoleName)
                    )
                    .map((role) => {
                      return (
                        <Accordion.Item
                          key={role.EmployeeRoleId}
                          value={role.EmployeeRoleName}
                        >
                          <Accordion.Control>
                            {role.EmployeeRoleName}
                          </Accordion.Control>
                          <Accordion.Panel>
                            <div className="flex flex-col gap-4">
                              <SearchBar
                                value={searchQuery}
                                setValue={setSearchQuery}
                              />
                              <div className="flex flex-col gap-4 max-h-[50vh] overflow-y-auto shift-emp-scrollbar">
                                {filteredEmployees.filter(
                                  (emp) => emp.EmpRole === role.EmployeeRoleName
                                ).length > 0 && !isEmpLoading ? (
                                  filteredEmployees
                                    .filter(
                                      (emp) =>
                                        emp.EmpRole === role.EmployeeRoleName
                                    )
                                    .map((data) => {
                                      return (
                                        <Draggable
                                          draggableId={data.EmpId}
                                          type={`${formatDate(selectedDate, 'DDMMYYYY')}${
                                            data.EmpRole
                                          }`}
                                          callback={dropResult}
                                          canDrag={
                                            data.EmpAvailabilityStatus ===
                                            'available'
                                          }
                                          key={data.EmpId}
                                        >
                                          <div
                                            className={`flex items-center gap-2  p-2 rounded text-sm  ${
                                              data.EmpAvailabilityStatus ===
                                              'available'
                                                ? 'bg-primaryGreen text-surface'
                                                : data.EmpAvailabilityStatus ===
                                                    'on_shift'
                                                  ? 'bg-gray-200 cursor-not-allowed'
                                                  : 'bg-textPrimaryRed cursor-not-allowed text-surface'
                                            }`}
                                          >
                                            <img
                                              src={
                                                data.EmpImg ??
                                                empDefaultPlaceHolder
                                              }
                                              alt=""
                                              className="w-12 h-12 rounded-full object-cover"
                                            />
                                            <div
                                              key={data.EmpId}
                                              className="flex flex-col "
                                            >
                                              <div className="flex items-center gap-2 ">
                                                <span className="text-nowrap">
                                                  Name:
                                                </span>
                                                <span className="font-semibold line-clamp-1">
                                                  {data.EmpName}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <span>Week shifts:</span>
                                                <span className="font-semibold">
                                                  {data.EmpWeekShifts}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <span>Week hours:</span>
                                                <span className="font-semibold">
                                                  {data.EmpWeekHours.toFixed(1)}
                                                </span>
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
                                        className="bg-shimmerColor animate-pulse w-full h-[80px]"
                                      ></div>
                                    );
                                  })
                                ) : (
                                  <div className="bg-primaryGold font-bold py-1 px-2 rounded">
                                    No {role.EmployeeRoleName} available for{' '}
                                    {dayjs(selectedDate).format('ddd MMM-DD')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Accordion.Panel>
                        </Accordion.Item>
                      );
                    })}
                </Accordion>
              </div>
            )}
          </div>

          {/* Modal */}
          <AssignShiftModal
            schedule={selectedSchedule}
            opened={assignMultipleEmpModal}
            setOpened={setAssignMultipleEmpModal}
            setSelectedSchedule={setSelectedSchedule}
          />
        </div>
      </DndProvider>
    </>
  );
};

export default CalendarView;
