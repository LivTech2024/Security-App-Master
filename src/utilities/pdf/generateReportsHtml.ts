import { IReportsCollection } from '../../@types/database';
import { Company } from '../../store/slice/auth.slice';
import { formatDate } from '../misc';
import { getPdfHeader } from './common/getPdfHeader';

export const generateReportsHtml = (
  companyDetails: Company,
  reportData: IReportsCollection
) => {
  return ` <!DOCTYPE html>
    <html>
      <head>
      <meta http-equiv="Content-Type" content="text/html;charset=UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            padding:10px;
          }
        </style>
      </head>
      <body>

      ${getPdfHeader(companyDetails)}

      <div style="font-weight:600; font-size:24px;  margin-bottom: 20px; text-align:center;">
        ${reportData.ReportCategoryName.toUpperCase()} REPORT
      </div>

      <div style="display:flex; justify-content: space-between; width:100%;  margin-bottom: 20px;">
        <div style="display:flex; align-items:center; gap:4px;">
          <span style="font-weight:600;">Report Name:</span>
          <span>${reportData.ReportName}</span>
        </div>
        <div style="display:flex; align-items:center; gap:4px;">
          <span style="font-weight:600;">Report Status:</span>
          <span>${reportData.ReportStatus}</span>
        </div>
      </div>

      <div style="display:flex; justify-content: space-between; width:100%;  margin-bottom: 20px;">
        <div style="display:flex; align-items:center; gap:4px;">
          <span style="font-weight:600;">Report Category:</span>
          <span>${reportData.ReportCategoryName}</span>
        </div>
        <div style="display:flex; align-items:center; gap:4px;">
          <span style="font-weight:600;">Employee Name:</span>
          <span>${reportData.ReportEmployeeName}</span>
        </div>
      </div>

      <div style="display:flex; justify-content: space-between; width:100%;  margin-bottom: 20px;">
        <div style="display:flex; align-items:center; gap:4px;">
          <span style="font-weight:600;">Report Date:</span>
          <span>${formatDate(reportData.ReportCreatedAt, 'DD MMM-YY HH:mm')}</span>
        </div>
        <div style="display:flex; align-items:center; gap:4px;">
          <span style="font-weight:600;">Report Location:</span>
          <span>${reportData.ReportLocationName}</span>
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:4px;  margin-bottom: 20px;">
          <span style="font-weight:600;">Report Data:</span>
          <span>${reportData.ReportData}</span>
      </div>

      <div style="display:flex; flex-direction:column; gap:8px;  margin-bottom: 20px;">

        <span style="font-weight:600;">Report Images:</span>
        <div style="display:flex;  align-items:center;  gap:16px; width:100%;  flex-wrap: wrap;">
        ${reportData.ReportImage?.map(
          (img) =>
            `<img src="${img}" style="width: 100px;  height: 100px; border-radius: 0.25rem;object-fit: cover;" alt="report image"/>`
        ).join('')}
        </div>

      </div>
      
     </body>
    </html>`;
};
