import {
  IPatrolLogsCollection,
  IPatrolsCollection,
} from '../../@types/database';
import { formatDate } from '../misc';

export function generatePatrolReportHTML({
  logData,
  patrolData,
}: {
  logData: IPatrolLogsCollection;
  patrolData: IPatrolsCollection;
}) {
  // Destructure the data
  const { PatrolName, PatrolLocationName } = patrolData;

  const {
    PatrolLogCheckPoints,
    PatrolDate,
    PatrolLogFeedbackComment,
    PatrolLogCreatedAt,
  } = logData;

  // Generate HTML for checkpoints
  const checkpointsHTML = PatrolLogCheckPoints.map(
    (checkpoint) => `
    <div style="margin-bottom: 20px; display:flex; flex-direction:column; gap:4px;">
      <div><strong>${checkpoint.CheckPointName}</strong></div>
      <div>Status: ${checkpoint.CheckPointStatus}</div>
      ${checkpoint.CheckPointComment ? `<div>Comment: ${checkpoint.CheckPointComment}</div>` : ''}
      ${checkpoint.CheckPointImage?.length ? `<div style="display:flex; align-items:center; gap:16px; flex-wrap: wrap;"> ${Array.isArray(checkpoint.CheckPointImage) ? checkpoint.CheckPointImage.map((img) => `<img src="${img}" alt="Checkpoint image" style="width: 100px; height: 100px; border-radius:4px;">`).join('') : `<img src="${checkpoint.CheckPointImage}" alt="Checkpoint image" style="width: 100px; height: 100px; border-radius:4px;">`} </div>` : ''}
      <div>Time: ${formatDate(checkpoint.CheckPointReportedAt, 'HH:mm')}</div>
    </div>
  `
  ).join('');

  // Generate full HTML
  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .header { margin-bottom: 20px; }
          .header div { margin-bottom: 5px; }
          .checkpoints { margin-top: 20px; }

           @media print {
           body {
            font-size: 12px; /* Adjust font size for print */
           }
         }
        </style>
      </head>
      <body>
        <div class="header">
          <div><strong>Patrol Name:</strong> ${PatrolName}</div>
          <div><strong>Date:</strong> ${formatDate(PatrolDate)}</div>
          <div><strong>Location:</strong> ${PatrolLocationName}</div>
          <div><strong>Feedback:</strong> ${PatrolLogFeedbackComment}</div>
        </div>
        <div class="checkpoints">
          ${checkpointsHTML}
        </div>
        <div class="footer">
          <div><strong>Last Updated:</strong> ${formatDate(PatrolLogCreatedAt, 'DD MMM-YY HH:mm')}</div>
        </div>
      </body>
    </html>
  `;

  return html;
}
