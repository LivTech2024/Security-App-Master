import { IShiftsCollection } from '../@types/database';
import { sendEmail } from '../API/SendEmail';
import { getHoursDiffInTwoTimeString } from './misc';

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

export const getColorAccToShiftStatus = (shift: IShiftsCollection) => {
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
      const shiftHours = getHoursDiffInTwoTimeString(
        shift.ShiftStartTime,
        shift.ShiftEndTime
      );

      if (shift.ShiftCurrentStatus.some((s) => s.Status === 'started')) {
        color = 'bg-pink-200';
      }

      if (shift.ShiftCurrentStatus.some((s) => s.Status === 'pending')) {
        color = 'bg-orange-200';
      }
      if (shift.ShiftCurrentStatus.every((s) => s.Status === 'completed')) {
        color = 'bg-green-400';
      }
      if (
        shift.ShiftCurrentStatus.some(
          (s) => s.StatusShiftTotalHrs && s.StatusShiftTotalHrs < shiftHours
        )
      ) {
        color = 'bg-red-400';
      }
      if (
        shift.ShiftCurrentStatus.some(
          (s) => s.StatusShiftTotalHrs && s.StatusShiftTotalHrs > shiftHours
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
