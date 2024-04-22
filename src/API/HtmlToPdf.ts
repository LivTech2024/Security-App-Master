import axios from 'axios';

const baseUrl = import.meta.env.VITE_SERVER_BASE_URL || 'http://localhost:3000';

export const htmlToPdf = ({
  file_name,
  html,
}: {
  html: string;
  file_name: string;
}) => {
  return axios.post<{ html: string; file_name: string }>(
    `${baseUrl}/api/html_to_pdf`,
    {
      html,
      file_name,
    }
  );
};
