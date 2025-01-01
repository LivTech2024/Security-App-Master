import { IFLHACollection } from '../../@types/database';
import { Company } from '../../store/slice/auth.slice';
import { formatDate } from '../misc';
import { getPdfHeader } from './common/getPdfHeader';

function generateFLHAHtml(
  formInput: IFLHACollection,
  companyDetails: Company
): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>FLHA Form</title>
    <style>
        body { font-family: Arial, sans-serif; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #000; padding: 8px; text-align: left; }
        th { background-color: #f4f4f4; }
    </style>
</head>
<body>
    ${getPdfHeader(companyDetails)}
    <h3 style="text-align:center;">Field Level Hazard Assessment</h3>
    <table>
        <tr><th style="width:50%;">Date</th><td>${formatDate(formInput.FLHADate)}</td></tr>
        <tr><th style="width:50%;">Site</th><td>${formInput.FLHAShiftName}</td></tr>
        <tr><th style="width:50%;">Time In</th><td>${formInput.FLHAShiftStartTime}</td></tr>
        <tr><th style="width:50%;">Time Out</th><td>${formInput.FLHAShiftEndTime}</td></tr>
        <tr><th style="width:50%;">Guard Location</th><td>${formInput.FLHALocationName}</td></tr>
        <tr><th style="width:50%;">Site Address</th><td>${formInput.FLHALocationName}</td></tr>
        <tr><th style="width:50%;">Start Temperature</th><td>${formInput.FLHATemperature}</td></tr>
        <tr><th style="width:50%;">Feels Like</th><td>${formInput.FLHAFeelsLike}</td></tr>
        <tr><th style="width:50%;">Wind Direction</th><td>${formInput.FLHAWindDirection}</td></tr>
        <tr><th style="width:50%;">Wind Speed</th><td>${formInput.FLHAWindSpeed}</td></tr>
        <tr><th style="width:50%;">Weather Notes</th><td>${formInput.FLHAWeatherChanges}</td></tr>
    </table>
    <h4>Tasks</h4>
    <table>
        <thead>
            <tr>
                <th>Tasks</th>
                <th>Hazards</th>
                <th>Priority</th>
                <th>ELIMINATE / CONTROL HAZARDS</th>
            </tr>
        </thead>
        <tbody>
            ${formInput.FLHATasks?.map(
              (task) => `
                <tr>
                    <td>${task.name}</td>
                    <td>${task.hazards}</td>
                    <td>${task.priority}</td>
                    <td>${task.controlHazards}</td>
                </tr>
            `
            ).join('')}
        </tbody>
    </table>
    <h4>Hazards</h4>
    <table>
        <thead>
            <tr>
                <th>Environmental Hazards</th>
                <th>Access/Egress Hazards</th>
                <th>Personal Limitations</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                  ${formInput.FLHAEnvironmentalHazards.map((res) => {
                    return `<div style="display:flex; border-bottom:2px; padding-bottom:8px; justify-content: space-between; gap:10px;">
                      <span>${res.title}</span>
                      <span style="font-size:18px;">${res.isChecked ? '&#x2713;' : '&#10006;'}</span>
                    </div>`;
                  }).join('')}
                </td>
                <td>
                   ${formInput.FLHAAccessHazards.map((res) => {
                     return `<div style="display:flex; border-bottom:2px; padding-bottom:8px; justify-content: space-between; gap:10px;">
                      <span>${res.title}</span>
                      <span style="font-size:18px;">${res.isChecked ? '&#x2713;' : '&#10006;'}</span>
                    </div>`;
                   }).join('')}
                </td>
                <td>
                  ${formInput.FLHAPersonalLimitationHazards.map((res) => {
                    return `<div style="display:flex; border-bottom:2px; padding-bottom:8px; justify-content: space-between; gap:10px;">
                      <span>${res.title}</span>
                      <span style="font-size:18px;">${res.isChecked ? '&#x2713;' : '&#10006;'}</span>
                    </div>`;
                  }).join('')}
                </td>
            </tr>
        </tbody>
    </table>
    <h4>Shift Completion</h4>
     <table>
    ${formInput.FLHAShiftCompletion.map((res) => {
      return `<tr><th style="width:50%;">${res.question}</th><td>${res.response}</td></tr>`;
    }).join('')}
    </table>
    
    <h4>Signatures</h4>
    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Date</th>
                <th>Signature</th>
            </tr>
        </thead>
        <tbody>
            ${formInput.FLHAAdditionalSignatures?.map(
              (signOff) => `
                <tr>
                    <td>${signOff.name}</td>
                    <td>${formatDate(signOff.date)}</td>
                    <td><img style="width:100px; height:50px;" src="${signOff.url}"/></td>
                </tr>
            `
            ).join('')}
        </tbody>
    </table>
    <p><strong>Employee Signature:</strong> <img style="width:100px; height:50px;" src="${formInput.FLHAEmployeeStartSignature}"/> </p>
    <p><strong>Supervisor Signature:</strong> <img style="width:100px; height:50px;" src="${formInput.FLHASupervisorSignature}"/></p>
</body>
</html>
    `;
}

export default generateFLHAHtml;
