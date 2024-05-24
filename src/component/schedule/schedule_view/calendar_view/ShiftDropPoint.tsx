import dayjs from 'dayjs';
import Button from '../../../../common/button/Button';
import { DropPoint } from '../../../../utilities/DragAndDropHelper';
import { formatDate, toDate } from '../../../../utilities/misc';
import { ISchedule } from '../../../../firebase_configs/DB/DbSchedule';
import { getColorAccToShiftStatus } from '../../../../utilities/scheduleHelper';
import { useAuthState } from '../../../../store';
import { FaRegTrashAlt, FaUndo } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { PageRoutes } from '../../../../@types/enum';
import { Tooltip } from '@mantine/core';
import { AiOutlineClose } from 'react-icons/ai';
import empDefaultPlaceHolder from '../../../../../public/assets/avatar.png';

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
}: ShiftDropPointProps) => {
  const { settings } = useAuthState();

  const navigate = useNavigate();

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
  return (
    <div
      key={index}
      className="flex flex-col h-full justify-start min-w-[180px] w-[14.23%] text-center max-h-[350px] overflow-auto remove-vertical-scrollbar "
    >
      <div
        onClick={() => setSelectedDate(date)}
        className="font-semibold cursor-pointer text-textPrimaryBlue sticky top-0 bg-background justify-center flex w-full px-2 pt-4"
      >
        <Button
          label={dayjs(date).format('ddd MMM-DD')}
          type="blue"
          onClick={() => setSelectedDate(date)}
          className="w-full text-sm rounded-full  border-[1px] border-[#02829b] bg-gradient-to-b from-[#7ed7df] to-[#00a9d0] hover:scale-[1.02] duration-200"
        />
      </div>

      {getScheduleForDay(datesArray[index], schedules).length > 0 ? (
        getScheduleForDay(datesArray[index], schedules).map((data, idx) => {
          const colors = getColorAccToShiftStatus(
            data.shift,
            settings?.SettingEmpShiftTimeMarginInMins || 10
          );

          const backgroundStyle =
            colors.length > 1
              ? {
                  background: `linear-gradient(to right, ${colors[0]}, ${colors[1]})`,
                }
              : { backgroundColor: colors[0] };

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
                onDoubleClick={() =>
                  navigate(PageRoutes.SHIFT_VIEW + `?id=${data.shift.ShiftId}`)
                }
                onClick={() => {
                  setSelectedSchedule(data);
                  if (data.shift.ShiftRequiredEmp > 1) {
                    setAssignMultipleEmpModal(true);
                  }
                }}
                key={data.shift.ShiftId + idx}
                className={`flex flex-col p-2 ${
                  data.shift.ShiftRequiredEmp > 1 && 'cursor-pointer'
                }`}
              >
                <div
                  className={`h-[30px] py-1 text-sm font-semibold  px-2 flex ${data.employee.length === 0 ? 'justify-between' : 'justify-center'}`}
                  style={backgroundStyle}
                >
                  {data.employee.length === 0 && <span>&nbsp;</span>}
                  <span className="line-clamp-1 text-center">
                    {data.shift.ShiftName}
                  </span>
                  {data.employee.length === 0 && (
                    <span className="relative">
                      <FaRegTrashAlt
                        onClick={() => {
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
                  )}
                </div>
                <div className="bg-[#5e5c5c23] p-2 rounded  min-w-full items-center text-sm">
                  <div className="text-sm font-medium line-clamp-1">
                    {data.shift.ShiftPosition}
                  </div>
                  <div className="font-semibold line-clamp-1">
                    {data.shift.ShiftStartTime}-{data.shift.ShiftEndTime}
                  </div>
                  {/* Employees */}
                  <div className="flex w-full overflow-x-auto remove-horizontal-scrollbar shift-emp-scrollbar gap-2">
                    {data.employee.length > 0 ? (
                      data.employee.map((emp) => {
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
                            <div className=" py-[2px] w-full text-center line-clamp-1 flex justify-between items-center gap-1 border-2 border-gray-500 rounded-full px-1 min-w-full mt-1">
                              <img
                                src={
                                  data.employee[0].EmployeeImg ??
                                  empDefaultPlaceHolder
                                }
                                alt=""
                                className="w-8 h-8 rounded-full"
                              />

                              <span className="line-clamp-1">
                                {emp.EmployeeName}
                              </span>

                              <AiOutlineClose
                                onClick={() =>
                                  onUndo(
                                    data.shift.ShiftId,
                                    data.employee[0].EmployeeId
                                  )
                                }
                                className="text-textPrimaryRed font-bold cursor-pointer min-w-[18px] text-xl hover:scale-[1.1] duration-200"
                              />
                            </div>
                          </Tooltip>
                        );
                      })
                    ) : (
                      <div className="bg-[#ffff64] py-[2px] rounded w-full text-center line-clamp-1">
                        (Unassigned)
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
    </div>
  );
};

export default ShiftDropPoint;
