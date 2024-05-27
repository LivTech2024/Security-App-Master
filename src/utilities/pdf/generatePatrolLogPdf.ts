export const generatePatrolLogPdf = (patrolViewHtml: string, date: string) => {
  return `
      <html>
        <head>
          <style>
           body {
            font-family: Arial, sans-serif;
            padding:20px;
          }
          </style>
        </head>
        <body>
        <div style="display:flex; flex-direction:column; >
        <div>Date: ${date}<div>
          ${patrolViewHtml}
          </div>
        </body>
      </html>
    `;
};
