import { sendEmail } from "./sendEmail";

interface SendShiftDetailsEmailArgs {
  empEmail: string;
  empName: string;
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
  empName,
  shiftEndTime,
  shiftName,
  shiftStartTime,
  shiftAddress,
}: SendShiftDetailsEmailArgs) => {
  return sendEmail({
    to_email: empEmail,
    to_name: empName,
    message: `You have been assigned for the following shift.\n Shift Name: ${shiftName} \n Date: ${shiftDate} \n Timing: ${shiftStartTime}-${shiftEndTime} \n Address: ${shiftAddress}`,
    subject: "Your schedule update",
    from_name: companyName,
  });
};
