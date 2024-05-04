import { IEmployeeDARCollection } from '../../@types/database';
import { Company } from '../../store/slice/auth.slice';
import { formatDate } from '../misc';

interface GenerateEmpDarHtmlArgs {
  empDarData: IEmployeeDARCollection;
  shiftStartTime: string;
  shiftEndTime: string;
  companyDetails: Company;
}

export const generateEmpDarHtml = ({
  empDarData,
  shiftEndTime,
  shiftStartTime,
  companyDetails,
}: GenerateEmpDarHtmlArgs) => {
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
        </style>
      </head>
      <body>

       <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem;">
         <img src="${companyDetails?.CompanyLogo}" style="width:100px; object-fit: cover;" alt="Company Logo">

         <p style="font-size:26px; text-align: center;">Daily Activity Report</p>

         <p>&nbsp;</p>
       </div>

       <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; border-bottom: 4px solid #fbbf39;
        padding-bottom: 8px;">
         <div style="display:flex; align-items:center;">
          <span>Employee Name: </span>
          <span>${' ' + empDarData.EmpDarEmpName}</span>
         </div>

         <div style="display:flex; align-items:center; justify-content:end; text-align: end;">
          <span>Date: </span>
          <span>${' ' + formatDate(empDarData.EmpDarDate)}</span>
         </div>

         <div style="display:flex; align-items:center;">
          <span>Shift Start Time: </span>
          <span> ${' ' + shiftStartTime}</span>
         </div>

         <div style="display:flex; align-items:center; justify-content:end; text-align: end;">
          <span>Shift End Time: </span>
          <span> ${' ' + shiftEndTime}</span>
         </div>
       </div>

        
  ${empDarData.EmpDarTile.map((data) => {
    return `
      <div
     style="margin-top: 40px;display: grid;grid-template-columns: repeat(2, minmax(0,   1fr));"> 

       <div style="display: flex; flex-direction: column">
        <div style="background: #fbbf39; padding: 8px; font-weight: 600">
          Place/Spot
        </div>
           <div style="padding: 8px; display: flex; flex-direction: column">
            <span>${data.TileLocation ?? 'N/A'}</span>
            <span style="color: #3e3f43; font-size: 14px; margin-top: 2px"
              >${data.TileTime ?? 'N/A'}</span
            >
           </div>
      </div>

      <div style="display: flex; flex-direction: column">
        <div style="background: #fbbf39; padding: 8px; font-weight: 600">
          Description
        </div>
        <div style="padding: 8px">
         ${data.TileContent ?? 'N/A'}
        </div>
      </div>

      ${
        data.TileImages.length > 0
          ? `<div
        style="display: flex;flex-direction: column;grid-column: span 2 / span 2;"
      >
        <div style="background: #fbbf39; padding: 8px; font-weight: 600">
          Images
        </div>

        <div
          style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;padding:16px 0px;"
        >
          ${data.TileImages.map((src) => {
            return `<img src="${src}" style="width:100px; height:100px; object-fit: cover; border-radius: 0.25rem;" alt="dar images">`;
          }).join('')}
        </div>
      </div>`
          : `<span></span>`
      }

    </div>`;
  }).join('')}
      
    
      </body>
    </html>
  `;
};
