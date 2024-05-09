import {
  IPatrolLogsCollection,
  IPatrolsCollection,
} from '../../@types/database';
import { Company } from '../../store/slice/auth.slice';
import { formatDate } from '../misc';

interface GeneratePatrolLogsHtmlArgs {
  patrolLogs: IPatrolLogsCollection[];
  companyDetails: Company;
  patrolData: IPatrolsCollection;
  startDate: Date | null;
  endDate: Date | null;
}

function addOrdinalSuffix(num: number): string {
  if (num <= 0) {
    return num.toString();
  }

  const lastDigit = num % 10;
  const lastTwoDigits = num % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return num + 'th';
  }

  switch (lastDigit) {
    case 1:
      return num + 'st';
    case 2:
      return num + 'nd';
    case 3:
      return num + 'rd';
    default:
      return num + 'th';
  }
}

export const generatePatrolLogsHtml = ({
  companyDetails,
  patrolLogs,
  endDate,
  patrolData,
  startDate,
}: GeneratePatrolLogsHtmlArgs) => {
  const tableRowHTML = patrolLogs
    .map(
      (log) => `
    <tr>
      <td>${log.PatrolLogGuardName}</td>
      <td>${formatDate(log.PatrolDate)}</td>
      <td>${addOrdinalSuffix(log.PatrolLogPatrolCount)}</td>
    </tr>
  `
    )
    .join('');

  return `
  <!DOCTYPE html>
    <html>
      <head>
      <meta http-equiv="Content-Type" content="text/html;charset=UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            padding:20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
        </style>
      </head>
      <body>
        <div style="display: flex;justify-content: space-between;margin-bottom: 20px;">
         
        <img src="${companyDetails.CompanyLogo}" style="width:140px; object-fit: cover;" alt="Company Logo">

          <div style="text-align: end;">
            <p>${companyDetails.CompanyName}</p>
            <p>${companyDetails.CompanyPhone}</p>
            <p>${companyDetails.CompanyEmail}</p>
            <p>${companyDetails.CompanyAddress}</p>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div style="display: flex; align-items:center; gap:3px;">
            <span>Patrol Name: </span>
            <span style="font-weight:550;">${patrolData.PatrolName}</span>
          </div>
          <div style="display: flex; align-items:center; gap:3px; justify-content:end; text-align:end;">
            <span>Patrol Location: </span>
            <span style="font-weight:550;">${patrolData.PatrolLocationName}</span>
          </div>
        </div>

        ${
          startDate &&
          endDate &&
          `<div style="display: flex; justify-content: space-between; ">
          <div style="display: flex; align-items:center; gap:3px;">
            <span>Start Date: </span>
            <span style="font-weight:550;">${formatDate(startDate)}</span>
          </div>
          <div style="display: flex; align-items:center; gap:3px; justify-content:end; text-align:end;">
            <span>End Date: </span>
            <span style="font-weight:550;">${formatDate(endDate)}</span>
          </div>
        </div>`
        }

        <table style="margin-top: 20px;">
          <thead>
            <tr>
              <th style="width:40%;">Guard Name</th>
              <th style="width:30%;">Date</th>
              <th style="width:30%;">Hit Count</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowHTML}
          </tbody>
        
            <tr style="font-weight:600;">
              <td>Total Hit</td>
               <td></td>
               <td>${patrolLogs.length}</td>
            </tr>
          
        <table>  
      </body>
    </html>
  `;
};
