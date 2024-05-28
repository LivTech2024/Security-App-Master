import axios from 'axios';

const baseUrl = import.meta.env.VITE_SERVER_BASE_URL || 'http://localhost:3000';

export const htmlToPdf = ({
  file_name,
  html,
  pdf_options,
}: {
  html: string;
  file_name: string;
  pdf_options?: {
    format: 'A3' | 'A4' | 'A4' | 'Letter';
    orientation: 'portrait' | 'landscape';
  };
}) => {
  console.log(pdf_options, 'in frontend');
  return axios.post(
    `${baseUrl}/api/html_to_pdf`,
    {
      html,
      file_name,
      pdf_options,
    },
    { responseType: 'blob' }
  );
};
