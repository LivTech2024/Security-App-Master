import dayjs from 'dayjs';
import { IShiftsCollection } from '../@types/database';
import { sendEmail } from '../API/SendEmail';
import { getMinutesDiffInTwoTimeString, toDate } from './misc';

interface SendShiftDetailsEmailArgs {
  empEmail: string;
  shiftName: string;
  shiftStartTime: string;
  shiftEndTime: string;
  shiftDate: string;
  companyName: string;
  shiftAddress: string;
}

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

  try {
    if (!shift.ShiftCurrentStatus || shift.ShiftCurrentStatus.length === 0) {
      color = ['#fed7aa'];
    }

    if (
      shift.ShiftCurrentStatus &&
      Array.isArray(shift.ShiftCurrentStatus) &&
      shift.ShiftCurrentStatus.length > 0
    ) {
      if (shift.ShiftCurrentStatus.some((s) => s.Status === 'started')) {
        color = ['#fbcfe8'];
      }

      if (shift.ShiftCurrentStatus.some((s) => s.Status === 'pending')) {
        color = ['#fed7aa'];
      }
      if (shift.ShiftCurrentStatus.every((s) => s.Status === 'completed')) {
        color = ['#4ade80'];
      }

      //*Started Late
      if (
        shift.ShiftCurrentStatus.some(
          (s) =>
            s.StatusStartedTime &&
            getMinutesDiffInTwoTimeString(
              shift.ShiftStartTime,
              dayjs(toDate(s.StatusStartedTime)).format('HH:mm')
            ) > timeMarginInMins
        )
      ) {
        color = ['#a855f7'];
      }

      //*Ended Early
      if (
        shift.ShiftCurrentStatus.some(
          (s) =>
            s.Status === 'completed' &&
            s.StatusReportedTime &&
            getMinutesDiffInTwoTimeString(
              dayjs(toDate(s.StatusReportedTime)).format('HH:mm'),
              shift.ShiftEndTime
            ) > timeMarginInMins
        )
      ) {
        color = ['#ef4444'];
      }

      //*Ended Late
      if (
        shift.ShiftCurrentStatus.some(
          (s) =>
            s.StatusReportedTime &&
            getMinutesDiffInTwoTimeString(
              shift.ShiftEndTime,
              dayjs(toDate(s.StatusReportedTime)).get('hour').toString()
            ) > timeMarginInMins
        )
      ) {
        color = [...color, '#60a5fa'];
      }
    }

    return color;
  } catch (error) {
    console.log(error);
    return color;
  }
};
