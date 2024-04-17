import axios from "axios";

const baseUrl = "http://localhost:3000";

interface SendEmailArgs {
  to_email: string;
  subject: string;
  from_name: string;
  text?: string | null;
  html?: string | null;
  cc?: string[];
  bcc?: string[];
  attachments?: { filename: string; content: string; contentType: string }[];
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
