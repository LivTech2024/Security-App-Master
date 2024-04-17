import axios from "axios";

const baseUrl = import.meta.env.VITE_SERVER_BASE_URL || "http://localhost:3000";

interface SendEmailArgs {
  to_email: string;
  subject: string;
  from_name: string;
  text?: string | null;
  html?: string | null;
  cc?: string[];
  bcc?: string[];
  attachments?: {
    filename: string;
    content: string; //*In base64 format
    contentType: string;
  }[];
}

export const sendEmail = ({
  from_name,
  subject,
  to_email,
  attachments,
  html,
  text,
  bcc,
  cc,
}: SendEmailArgs) => {
  return axios.post<SendEmailArgs>(`${baseUrl}/api/send_email`, {
    from_name,
    subject,
    to_email,
    attachments,
    html,
    text,
    cc,
    bcc,
  });
};
