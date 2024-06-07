import { AxiosResponse } from 'axios';

export const downloadPdf = (response: AxiosResponse, fileName: string) => {
  const blob = new Blob([response.data], { type: 'application/pdf' });

  // Create a link element
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);

  link.download = fileName; // Specify the filename for the downloaded file

  // Append the link to the body
  document.body.appendChild(link);

  // Trigger a click on the link to start the download
  link.click();

  // Remove the link from the DOM
  document.body.removeChild(link);
};
