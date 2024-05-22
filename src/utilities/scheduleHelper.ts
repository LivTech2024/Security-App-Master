import dayjs from 'dayjs';
import { IShiftsCollection } from '../@types/database';
import { sendEmail } from '../API/SendEmail';
import { getHoursDiffInTwoTimeString, toDate } from './misc';

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
  let color = 'bg-gray-200';

  try {
    if (!shift.ShiftCurrentStatus || shift.ShiftCurrentStatus.length === 0) {
      color = 'bg-orange-200';
    }

    if (
      shift.ShiftCurrentStatus &&
      Array.isArray(shift.ShiftCurrentStatus) &&
      shift.ShiftCurrentStatus.length > 0
    ) {
      if (shift.ShiftCurrentStatus.some((s) => s.Status === 'started')) {
        color = 'bg-pink-200';
      }

      if (shift.ShiftCurrentStatus.some((s) => s.Status === 'pending')) {
        color = 'bg-orange-200';
      }
      if (shift.ShiftCurrentStatus.every((s) => s.Status === 'completed')) {
        color = 'bg-green-400';
      }

      //*Started Late
      if (
        shift.ShiftCurrentStatus.some(
          (s) =>
            s.StatusStartedTime &&
            getHoursDiffInTwoTimeString(
              shift.ShiftStartTime,
              dayjs(toDate(s.StatusStartedTime)).get('hour').toString()
            ) > timeMarginInMins
        )
      ) {
        color = 'bg-purple-500';
      }

      //*Ended Early
      if (
        shift.ShiftCurrentStatus.some(
          (s) =>
            s.StatusReportedTime &&
            getHoursDiffInTwoTimeString(
              dayjs(toDate(s.StatusReportedTime)).get('hour').toString(),
              shift.ShiftEndTime
            ) > timeMarginInMins
        )
      ) {
        color = 'bg-red-500';
      }

      //*Ended Late
      if (
        shift.ShiftCurrentStatus.some(
          (s) =>
            s.StatusReportedTime &&
            getHoursDiffInTwoTimeString(
              shift.ShiftEndTime,
              dayjs(toDate(s.StatusReportedTime)).get('hour').toString()
            ) > timeMarginInMins
        )
      ) {
        color = 'bg-blue-400';
      }
    }

    return color;
  } catch (error) {
    console.log(error);
    return color;
  }
};
