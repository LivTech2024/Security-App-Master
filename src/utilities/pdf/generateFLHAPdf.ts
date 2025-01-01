import { IFLHACollection } from '../../@types/database';

function generateFLHAHtml(formInput: IFLHACollection): string {
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
    <h1>Field Level Hazard Assessment</h1>
    <table>
        <tr><th>Date</th><td>${formInput.FLHADate}</td></tr>
        <tr><th>Site</th><td>${formInput.FLHAShiftName}</td></tr>
        <tr><th>Time In</th><td>${formInput.FLHAShiftStartTime}</td></tr>
        <tr><th>Time Out</th><td>${formInput.FLHAShiftEndTime}</td></tr>
        <tr><th>Guard Location</th><td>${formInput.FLHALocationName}</td></tr>
        <tr><th>Site Address</th><td>${formInput.FLHALocationName}</td></tr>
        <tr><th>Start Temperature</th><td>${formInput.FLHATemperature}</td></tr>
        <tr><th>Feels Like</th><td>${formInput.FLHAFeelsLike}</td></tr>
        <tr><th>Wind Direction</th><td>${formInput.FLHAWindDirection}</td></tr>
        <tr><th>Wind Speed</th><td>${formInput.FLHAWindSpeed}</td></tr>
        <tr><th>Weather Notes</th><td>${formInput.FLHAWeatherChanges}</td></tr>
    </table>
    <h2>Tasks</h2>
    <table>
        <thead>
            <tr>
                <th>Task</th>
                <th>Hazard</th>
                <th>Priority</th>
                <th>Control</th>
            </tr>
        </thead>
        <tbody>
            ${formInput.FLHATasks.map(
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
    <h2>Hazards</h2>
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
                <td>${formInput.FLHAEnvironmentalHazards.map((s) => s.title).join(', ')}</td>
                <td>${formInput.FLHAAccessHazards.join(', ')}</td>
                <td>${formInput.FLHAPersonalLimitationHazards.join(', ')}</td>
            </tr>
        </tbody>
    </table>
    <h2>Shift Completion</h2>
    
    <h2>Signatures</h2>
    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Date</th>
                <th>Signature</th>
            </tr>
        </thead>
        <tbody>
            ${formInput.FLHAAdditionalSignatures.map(
              (signOff) => `
                <tr>
                    <td>${signOff.name}</td>
                    <td>${signOff.date}</td>
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
