import dayjs from 'dayjs';
import Button from '../../../../common/button/Button';
import { DropPoint } from '../../../../utilities/DragAndDropHelper';
import {
  formatDate,
  getRandomNumbers,
  removeTimeFromDate,
  toDate,
} from '../../../../utilities/misc';
import DbSchedule, {
  ISchedule,
} from '../../../../firebase_configs/DB/DbSchedule';
import { getColorAccToShiftStatus } from '../../../../utilities/scheduleHelper';
import { useAuthState } from '../../../../store';
import { FaRegTrashAlt, FaUndo } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import {
  CollectionName,
  PageRoutes,
  REACT_QUERY_KEYS,
} from '../../../../@types/enum';
import { Tooltip } from '@mantine/core';
import { AiOutlineClose } from 'react-icons/ai';
import empDefaultPlaceHolder from '../../../../../public/assets/avatar.png';
import { openContextModal } from '@mantine/modals';
import {
  IEmployeesCollection,
  IShiftsCollection,
  IShiftTasksChild,
} from '../../../../@types/database';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../../../utilities/TsxUtils';
import { useQueryClient } from '@tanstack/react-query';
import { errorHandler } from '../../../../utilities/CustomError';
import { useEffect, useState } from 'react';
import { MdContentCopy, MdContentPaste } from 'react-icons/md';
import { getNewDocId } from '../../../../firebase_configs/DB/utils';
import { db } from '../../../../firebase_configs/config';
import { doc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';

interface ShiftDropPointProps {
  index: number;
  date: Date;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date | null>>;
  datesArray: Date[];
  schedules: ISchedule[];
  shiftToBeDeleted: string[];
  onDeleteUndo: (shiftId: string) => void;
  setSelectedSchedule: React.Dispatch<React.SetStateAction<ISchedule | null>>;
  setAssignMultipleEmpModal: React.Dispatch<React.SetStateAction<boolean>>;
  onDeleteClick: (shiftId: string) => void;
  onUndo: (shiftId?: string, empId?: string) => void;
  isLoading: boolean;
  copiedShifts: IShiftsCollection[];
  setCopiedShifts: React.Dispatch<React.SetStateAction<IShiftsCollection[]>>;
}

const ShiftDropPoint = ({
  index,
  setSelectedDate,
  date,
  datesArray,
  schedules,
  shiftToBeDeleted,
  onDeleteUndo,
  setSelectedSchedule,
  setAssignMultipleEmpModal,
  onDeleteClick,
  onUndo,
  isLoading,
  copiedShifts,
  setCopiedShifts,
}: ShiftDropPointProps) => {
  const { settings } = useAuthState();

  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);

  const getScheduleForDay = (date: Date, schedules?: ISchedule[]) => {
    if (!schedules) return [];
    return schedules
      .filter((schedule) =>
        dayjs(toDate(schedule.shift.ShiftDate)).isSame(date, 'date')
      )
      ?.sort(
        (a, b) =>
          Number(
            a?.shift.ShiftStartTime?.split(':')[0] +
              a?.shift.ShiftStartTime?.split(':')[1] || 0
          ) -
          Number(
            b?.shift.ShiftStartTime?.split(':')[0] +
              b?.shift.ShiftStartTime?.split(':')[1] || 0
          )
      );
  };

  const removeEmpFromPublishedShift = async (
    shiftId: string,
    empId: string
  ) => {
    try {
      if (!shiftId || !empId) return;
      setLoading(true);

      await DbSchedule.removeEmpFromShift(shiftId, empId);

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.SCHEDULES],
      });

      showSnackbar({
        message: 'Employee removed from the shift successfully',
        type: 'success',
      });
      setLoading(false);
    } catch (error) {
      console.log(error);
      errorHandler(error);
      setLoading(false);
    }
  };

  const onEmpRemoveClick = (data: ISchedule, emp: IEmployeesCollection) => {
    if (emp.EmployeeCreatedAt) {
      openContextModal({
        modal: 'confirmModal',
        withCloseButton: false,
        centered: true,
        closeOnClickOutside: true,
        innerProps: {
          title: 'Confirm',
          body: (
            <div className="">
              Are you sure to remove{' '}
              <span className="font-semibold">{emp.EmployeeName}</span> from
              this shift
            </div>
          ),
          onConfirm: () => {
            removeEmpFromPublishedShift(data.shift.ShiftId, emp.EmployeeId);
          },
        },
        size: '30%',
        styles: {
          body: { padding: '0px' },
        },
      });
    } else {
      onUndo(data.shift.ShiftId, emp.EmployeeId);
    }
  };

  const handleCopyClicked = (shift: IShiftsCollection) => {
    if (copiedShifts.find((prev) => prev.ShiftId === shift.ShiftId)) {
      setCopiedShifts((prev) =>
        prev.filter((s) => s.ShiftId !== shift.ShiftId)
      );
    } else {
      setCopiedShifts((prev) => [...prev, shift]);
    }
  };

  const handlePasteClicked = async (date: Date) => {
    if (!copiedShifts || copiedShifts.length === 0 || !date) return;
    try {
      setLoading(true);

      const shiftCreatePromise = copiedShifts.map(async (data) => {
        const { ShiftTask } = data;

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

        const newShiftDate = removeTimeFromDate(date) as unknown as Timestamp;

        const newShiftData: IShiftsCollection = {
          ...data,
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

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.SCHEDULES],
      });

      setCopiedShifts([]);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log(error);
      errorHandler(error);
    }
  };

  useEffect(() => {
    if (loading) {
      showModalLoader({});
    } else {
      closeModalLoader();
    }
    return () => closeModalLoader();
  }, [loading]);

  return (
    <div
      key={index}
      className="flex flex-col h-full justify-start min-w-[180px] w-[14.23%] text-center max-h-[420px] overflow-auto remove-vertical-scrollbar "
    >
      <div
        onClick={() => setSelectedDate(date)}
        className="font-semibold cursor-pointer text-textPrimaryBlue sticky top-0 bg-background justify-center flex w-full px-2 pt-4"
      >
        <Button
          label={`${dayjs(date).format('ddd MMM-DD')} ${getScheduleForDay(datesArray[index], schedules).length ? '(' + getScheduleForDay(datesArray[index], schedules).length + ')' : ''}`}
          type="blue"
          onClick={() => setSelectedDate(date)}
          className="w-full text-sm rounded-full  border-[1px] border-[#02829b] bg-gradient-to-b from-[#7ed7df] to-[#00a9d0] hover:scale-[1.02] duration-200"
        />
      </div>

      {isLoading ? (
        <div className="p-2 h-full w-full">
          <div className="w-full min-h-[140px] bg-shimmerColor animate-pulse"></div>
        </div>
      ) : getScheduleForDay(datesArray[index], schedules).length > 0 ? (
        getScheduleForDay(datesArray[index], schedules).map((data, idx) => {
          return shiftToBeDeleted.includes(data.shift.ShiftId) ? (
            <div className="flex flex-col w-full h-full min-h-[140px] justify-center items-center py-4">
              <div>This Shift is Deleted</div>
              <div
                onClick={() => onDeleteUndo(data.shift.ShiftId)}
                className="flex items-center gap-1 text-sm mt-1 text-textPrimaryBlue cursor-pointer hover:underline"
              >
                <span>Click to undo</span>
                <FaUndo />
              </div>
            </div>
          ) : (
            <DropPoint
              accept={`${formatDate(data.shift.ShiftDate, 'DDMMYYYY')}${data.shift.ShiftPosition}`}
              className="h-full"
              id={data.shift.ShiftId}
              key={idx}
            >
              <div
                onDoubleClick={() => {
                  navigate(PageRoutes.SHIFT_VIEW + `?id=${data.shift.ShiftId}`);
                }}
                onClick={() => {
                  setSelectedSchedule(data);
                  if (data.shift.ShiftRequiredEmp > 1) {
                    setTimeout(() => setAssignMultipleEmpModal(true), 500);
                  }
                }}
                key={data.shift.ShiftId + idx}
                className={`flex flex-col p-2 ${
                  data.shift.ShiftRequiredEmp > 1 && 'cursor-pointer'
                }`}
              >
                <div
                  className={`h-[30px] bg-[#5e5c5c34] border-b border-inputBorder py-1 text-sm font-semibold  px-2 flex justify-between`}
                >
                  <span
                    onClick={() => handleCopyClicked(data.shift)}
                    className={`${copiedShifts.find((prev) => prev.ShiftId === data.shift.ShiftId) ? 'text-textSecondary' : 'text-textPrimaryBlue'}  cursor-pointer pt-1 mr-1`}
                  >
                    <MdContentCopy />
                  </span>
                  <span className="line-clamp-1 text-center ">
                    {data.shift.ShiftName}
                  </span>
                  {data.employee.length === 0 ? (
                    <span className="">
                      <FaRegTrashAlt
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            data.shift?.ShiftAssignedUserId?.length > 0 ||
                            data?.employee?.length > 0
                          ) {
                            return;
                          }
                          onDeleteClick(data.shift.ShiftId);
                        }}
                        className="text-lg font-semibold text-textPrimaryRed ml-1 cursor-pointer"
                      />
                    </span>
                  ) : (
                    <span>&nbsp;</span>
                  )}
                </div>
                <div className="bg-[#5e5c5c23] p-2 rounded  min-w-full items-center text-sm">
                  <div className="text-sm font-medium line-clamp-1">
                    {data.shift.ShiftPosition}
                  </div>
                  <div className="font-semibold line-clamp-1">
                    {data.shift.ShiftCurrentStatus[0]?.StatusStartedTime
                      ? formatDate(
                          data.shift.ShiftCurrentStatus[0]?.StatusStartedTime,
                          'HH:mm'
                        )
                      : data.shift.ShiftStartTime}
                    -
                    {data.shift.ShiftCurrentStatus[0]?.StatusReportedTime &&
                    data.shift.ShiftCurrentStatus[0]?.Status === 'completed'
                      ? formatDate(
                          data.shift.ShiftCurrentStatus[0]?.StatusReportedTime,
                          'HH:mm'
                        )
                      : data.shift.ShiftEndTime}
                  </div>
                  {/* Employees */}
                  <div className="flex w-full overflow-x-auto remove-horizontal-scrollbar shift-emp-scrollbar gap-2">
                    {data.employee.length > 0 &&
                    data.employee.length === data.shift.ShiftRequiredEmp ? (
                      data.employee.map((emp) => {
                        const colors = getColorAccToShiftStatus(
                          data.shift,
                          settings?.SettingEmpShiftTimeMarginInMins || 10,
                          emp.EmployeeId
                        );

                        const backgroundStyle =
                          colors.length > 1
                            ? {
                                background: `linear-gradient(to right, ${colors[0]}, ${colors[1]})`,
                              }
                            : { backgroundColor: colors[0] };
                        return (
                          <Tooltip
                            key={emp.EmployeeId}
                            label={
                              <div className=" py-[2px] rounded w-full text-center">
                                <span className="line-clamp-1">
                                  {emp.EmployeeName}
                                </span>
                              </div>
                            }
                          >
                            <div
                              style={backgroundStyle}
                              className=" py-[2px] w-full text-center line-clamp-1 flex justify-between items-center gap-1 border-2 border-gray-500 rounded-full px-1 min-w-full mt-1"
                            >
                              <img
                                src={
                                  data.employee[0].EmployeeImg ||
                                  empDefaultPlaceHolder
                                }
                                alt=""
                                className="w-8 h-8 rounded-full"
                              />

                              <span className="line-clamp-1">
                                {emp.EmployeeName}
                              </span>

                              <AiOutlineClose
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEmpRemoveClick(data, emp);
                                }}
                                className="text-textPrimaryRed font-bold cursor-pointer min-w-[18px] text-xl hover:scale-[1.1] duration-200"
                              />
                            </div>
                          </Tooltip>
                        );
                      })
                    ) : (
                      <div className="bg-[#ffff64] py-[2px] rounded w-full text-center line-clamp-1">
                        (Unassigned){' '}
                        {data.shift.ShiftAssignedUserId.length || 0}/
                        {data.shift.ShiftRequiredEmp}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </DropPoint>
          );
        })
      ) : (
        <div className="flex flex-col">
          <div className="h-[40px] "></div>
        </div>
      )}
      {copiedShifts.length > 0 && (
        <div
          onClick={() =>
            openContextModal({
              modal: 'confirmModal',
              withCloseButton: false,
              centered: true,
              closeOnClickOutside: true,
              innerProps: {
                title: 'Confirm',
                body: `Are you sure to paste copied shifts to ${formatDate(date)}`,
                onConfirm: () => {
                  handlePasteClicked(date);
                },
              },
              size: '30%',
              styles: {
                body: { padding: '0px' },
              },
            })
          }
          className="flex flex-col gap-2 items-center justify-center p-4 opacity-20 hover:opacity-100 duration-500 cursor-pointer"
        >
          <MdContentPaste />
          <span className="text-sm text-textSecondary">
            Paste the copied shifts here
          </span>
        </div>
      )}
    </div>
  );
};

export default ShiftDropPoint;
