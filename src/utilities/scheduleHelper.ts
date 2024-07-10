import dayjs, { Dayjs } from 'dayjs';
import { IShiftsCollection } from '../@types/database';
import { sendEmail } from '../API/SendEmail';
import { parseTime, toDate } from './misc';

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
  timeMarginInMins: number
) => {
  let color = ['#e5e7eb'];

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

  try {
    if (!shift.ShiftCurrentStatus || shift.ShiftCurrentStatus.length === 0) {
      color = ['#fed7aa'];
    }

    if (
      shift.ShiftCurrentStatus &&
      Array.isArray(shift.ShiftCurrentStatus) &&
      shift.ShiftCurrentStatus.length > 0
    ) {
      //*Pending
      if (shift.ShiftCurrentStatus.some((s) => s.Status === 'pending')) {
        color = ['#fed7aa'];
      }

      //*Started
      if (shift.ShiftCurrentStatus.some((s) => s.Status === 'started')) {
        color = ['#fbcfe8'];
      }

      //*Completed
      if (shift.ShiftCurrentStatus.every((s) => s.Status === 'completed')) {
        color = ['#4ade80'];
      }

      //*Started Late
      if (
        shift.ShiftCurrentStatus.some(
          (s) =>
            toDate(s.StatusStartedTime) &&
            getMinutesDifference(
              dayjs(toDate(s.StatusStartedTime)),
              dayjs(shiftStartTimeWithDate)
            ) > timeMarginInMins
        )
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
        shift.ShiftCurrentStatus.some(
          (s) =>
            s.Status === 'completed' &&
            toDate(s.StatusReportedTime) &&
            getMinutesDifference(
              dayjs(shiftEndTimeWithDate),
              dayjs(toDate(s.StatusReportedTime))
            ) > timeMarginInMins
        )
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
        shift.ShiftCurrentStatus.some(
          (s) =>
            s.Status === 'completed' &&
            toDate(s.StatusReportedTime) &&
            getMinutesDifference(
              dayjs(toDate(s.StatusReportedTime)),
              dayjs(shiftEndTimeWithDate)
            ) > timeMarginInMins
        )
      ) {
        color = [
          ...color.filter(
            (c) => c !== '#4ade80' && c !== '#fbcfe8' && c !== '#fed7aa'
          ),
          '#60a5fa',
        ];
      }
    }

    return color;
  } catch (error) {
    //console.log(error);
    return color;
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
