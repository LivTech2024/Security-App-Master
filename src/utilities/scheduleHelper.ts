import dayjs, { Dayjs } from 'dayjs';
import { IShiftsCollection } from '../@types/database';
import { sendEmail } from '../API/SendEmail';
import { parseTime, toDate } from './misc';
import { ISchedule } from '../firebase_configs/DB/DbSchedule';

interface SendShiftDetailsEmailArgs {
  empEmail: string;
  shiftName: string;
  shiftStartTime: string;
  shiftEndTime: string;
  shiftDate: string;
  companyName: string;
  shiftAddress: string;
}

const getMinutesDifference = (date1: Dayjs, date2: Dayjs) => {
  const diff = date1.diff(date2, 'minutes');
  return diff;
};

export const sendShiftDetailsEmail = ({
  shiftDate,
  companyName,
  empEmail,
  shiftEndTime,
  shiftName,
  shiftStartTime,
  shiftAddress,
}: SendShiftDetailsEmailArgs) => {
  return sendEmail({
    to_email: empEmail,
    text: `You have been assigned for the following shift.\n Shift Name: ${shiftName} \n Date: ${shiftDate} \n Timing: ${shiftStartTime}-${shiftEndTime} \n Address: ${shiftAddress}`,
    subject: 'Your schedule update',
    from_name: companyName,
  });
};

export const getColorAccToShiftStatus = (
  shift: IShiftsCollection,
  timeMarginInMins: number,
  empId: string
) => {
  let isStarted = false;

  let color = ['#e5e7eb'];

  const { ShiftDate, ShiftStartTime, ShiftEndTime } = shift;

  const { hour: startHour, minute: startMinute } = parseTime(ShiftStartTime);
  const { hour: endHour, minute: endMinute } = parseTime(ShiftEndTime);

  const shiftStartTimeWithDate = dayjs(toDate(ShiftDate))
    .hour(startHour)
    .minute(startMinute)
    .second(0)
    .toDate();

  let shiftEndTimeWithDate = dayjs(toDate(ShiftDate))
    .hour(endHour)
    .minute(endMinute)
    .second(0)
    .toDate();

  if (dayjs(shiftEndTimeWithDate).isBefore(shiftStartTimeWithDate)) {
    shiftEndTimeWithDate = dayjs(shiftEndTimeWithDate).add(1, 'day').toDate();
  }

  try {
    const empShiftStatus = shift.ShiftCurrentStatus?.find(
      (s) => s?.StatusReportedById === empId
    );

    if (!empShiftStatus) {
      color = ['#fed7aa'];
    }

    if (empShiftStatus) {
      //*Pending
      if (empShiftStatus.Status === 'pending') {
        color = ['#fed7aa'];
      }

      //*Started
      if (empShiftStatus.Status === 'started') {
        color = ['#fbcfe8'];
        isStarted = true;
      }

      //*Completed
      if (empShiftStatus.Status === 'completed') {
        color = ['#4ade80'];
      }

      //*Started Late
      if (
        toDate(empShiftStatus.StatusStartedTime) &&
        getMinutesDifference(
          dayjs(toDate(empShiftStatus.StatusStartedTime)),
          dayjs(shiftStartTimeWithDate)
        ) > timeMarginInMins
      ) {
        color = [
          ...color.filter(
            (c) => c !== '#4ade80' && c !== '#fbcfe8' && c !== '#fed7aa'
          ),
          '#a855f7',
        ];
      }

      //*Ended Early
      if (
        empShiftStatus.Status === 'completed' &&
        toDate(empShiftStatus.StatusReportedTime) &&
        getMinutesDifference(
          dayjs(shiftEndTimeWithDate),
          dayjs(toDate(empShiftStatus.StatusReportedTime))
        ) > timeMarginInMins
      ) {
        color = [
          ...color.filter(
            (c) => c !== '#4ade80' && c !== '#fbcfe8' && c !== '#fed7aa'
          ),
          '#ef4444',
        ];
      }

      //*Ended Late
      if (
        empShiftStatus.Status === 'completed' &&
        toDate(empShiftStatus.StatusReportedTime) &&
        getMinutesDifference(
          dayjs(toDate(empShiftStatus.StatusReportedTime)),
          dayjs(shiftEndTimeWithDate)
        ) > timeMarginInMins
      ) {
        color = [
          ...color.filter(
            (c) => c !== '#4ade80' && c !== '#fbcfe8' && c !== '#fed7aa'
          ),
          '#60a5fa',
        ];
      }
    }

    return { color, isStarted };
  } catch (error) {
    console.log(error);
    return { color, isStarted };
  }
};

export const getShiftActualHours = ({
  shift,
  timeMarginInMins,
  empId,
}: {
  shift: IShiftsCollection;
  timeMarginInMins: number;
  empId?: string | null;
}) => {
  let shiftHours = 0,
    actualShiftHrsSpent = 0;

  const { ShiftDate, ShiftStartTime, ShiftEndTime } = shift;

  const { hour: startHour, minute: startMinute } = parseTime(ShiftStartTime);
  const { hour: endHour, minute: endMinute } = parseTime(ShiftEndTime);

  const shiftStartTimeWithDate = dayjs()
    .date(toDate(ShiftDate).getDate())
    .month(toDate(ShiftDate).getMonth())
    .hour(startHour)
    .minute(startMinute)
    .second(0)
    .toDate();

  let shiftEndTimeWithDate = dayjs()
    .date(toDate(ShiftDate).getDate())
    .month(toDate(ShiftDate).getMonth())
    .hour(endHour)
    .minute(endMinute)
    .second(0)
    .toDate();

  if (dayjs(shiftEndTimeWithDate).isBefore(shiftStartTimeWithDate)) {
    shiftEndTimeWithDate = dayjs(shiftEndTimeWithDate).add(1, 'day').toDate();
  }

  shiftHours =
    dayjs(shiftEndTimeWithDate).diff(shiftStartTimeWithDate, 'minutes') / 60;

  if (empId) {
    const empShiftStatus = shift.ShiftCurrentStatus.find(
      (s) => s.StatusReportedById === empId
    );

    if (empShiftStatus && empShiftStatus.Status === 'completed') {
      const { StatusStartedTime, StatusReportedTime } = empShiftStatus;
      if (StatusStartedTime && StatusReportedTime) {
        const startTimeDiff = dayjs(shiftStartTimeWithDate).diff(
          toDate(StatusStartedTime),
          'minutes'
        );

        const endTimeDiff = dayjs(shiftEndTimeWithDate).diff(
          toDate(StatusReportedTime),
          'minutes'
        );

        const startTime =
          (startTimeDiff >= 0 ? startTimeDiff : startTimeDiff * -1) >
          timeMarginInMins
            ? toDate(StatusStartedTime)
            : shiftStartTimeWithDate;

        const endTime =
          (endTimeDiff >= 0 ? endTimeDiff : endTimeDiff * -1) > timeMarginInMins
            ? toDate(StatusReportedTime)
            : shiftEndTimeWithDate;

        actualShiftHrsSpent = dayjs(endTime).diff(startTime, 'minutes') / 60;
      }
    }
  }

  return { shiftHours, actualShiftHrsSpent };
};

export const getScheduleForDay = (date: Date, schedules?: ISchedule[]) => {
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

export const isAnyShiftStartedForTheDay = (
  date: Date,
  schedules: ISchedule[]
) => {
  const scheduleForDay = getScheduleForDay(date, schedules);
  return scheduleForDay.some((s) =>
    s.shift.ShiftCurrentStatus.some(
      (status) => status.StatusReportedById && status.Status === 'started'
    )
  );
};
