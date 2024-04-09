import { formatDate } from "./misc";

export const generateStatsViewHtml = (
  shiftsSummary: JSX.Element,
  employeesScheduled: JSX.Element,
  companyName: string,
  date: Date
) => {
  return `
      <html>
        <head>
          <style>
            /* Add any custom styles here */
            table {
              border-collapse: collapse;
              width: 100%;
            }
            th, td {
              border: 1px solid black;
              padding: 8px;
              text-align: left;
            }
          </style>
        </head>
        <body>
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; width:100%";>
          <span style="font-weight:600;font-size:20px;">${companyName}</span>
          <span style="margin:16px 0px;">Week of ${formatDate(
            date,
            "D MMM, YYYY"
          )}</span>
        </div>
        <div>
          ${shiftsSummary}
          </div>
          <div style="margin-top:20px;">
          ${employeesScheduled}
          </div>
        </body>
      </html>
    `;
};
