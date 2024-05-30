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
            getMinutesDiffInTwoTimeString(
              shift.ShiftStartTime,
              dayjs(toDate(s.StatusStartedTime)).format('HH:mm')
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
            getMinutesDiffInTwoTimeString(
              dayjs(toDate(s.StatusReportedTime)).format('HH:mm'),
              shift.ShiftEndTime
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
            getMinutesDiffInTwoTimeString(
              shift.ShiftEndTime,
              dayjs(toDate(s.StatusReportedTime)).format('HH:mm')
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
