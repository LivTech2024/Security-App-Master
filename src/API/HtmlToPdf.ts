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
  return axios.post(
    `${baseUrl}/api/html_to_pdf`,
    {
      html,
      file_name,
      pdf_options: pdf_options
        ? pdf_options
        : { format: 'A4', orientation: 'portrait' },
    },
    { responseType: 'blob' }
  );
};
