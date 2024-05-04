//utils function
function calculateFederalIncomeTax(grossPay: number): number {
  // Calculate federal income tax based on the gross pay
  // This calculation is simplified and should be adjusted based on the actual tax rates and brackets
  return grossPay * 0.15; // Placeholder calculation
}

function calculateProvincialIncomeTax(grossPay: number): number {
  // Calculate provincial income tax based on the gross pay
  // This calculation is simplified and should be adjusted based on the actual tax rates and brackets for Alberta
  return grossPay * 0.1; // Placeholder calculation
}

function calculateCPPContributions(grossPay: number): number {
  // Calculate CPP contributions based on the gross pay
  // This calculation is simplified and should be adjusted based on the actual CPP contribution rates
  return grossPay * 0.05; // Placeholder calculation
}

function calculateEIContributions(grossPay: number): number {
  // Calculate EI contributions based on the gross pay
  // This calculation is simplified and should be adjusted based on the actual EI contribution rates
  return grossPay * 0.033; // Placeholder calculation
}

interface GetPaystubHtmlArgs {
  startDate: string;
  endDate: string;
  empName: string;
  empHourlyRate: number;
  empWorkedHours: number;
  companyName: string;
}

export const getPaystubHtml = ({
  empHourlyRate,
  empName,
  empWorkedHours,
  endDate,
  startDate,
  companyName,
}: GetPaystubHtmlArgs) => {
  const grossPay = empHourlyRate * empWorkedHours;

  const totalDeduction =
    calculateCPPContributions(grossPay) +
    calculateEIContributions(grossPay) +
    calculateFederalIncomeTax(grossPay) +
    calculateProvincialIncomeTax(grossPay);

  const html =
    `<!DOCTYPE html>` +
    `<html>` +
    `<head>` +
    `<title>Pay Stub</title>` +
    `<style>` +
    `body {` +
    `font-family: Arial, sans-serif;` +
    `}` +
    `table {` +
    `width: 100%;` +
    `border-collapse: collapse;` +
    `}` +
    `th, td {` +
    `padding: 8px;` +
    `border-bottom: 1px solid #ddd;` +
    ` }` +
    `th {` +
    `text-align: left;` +
    `}` +
    `</style>` +
    `</head>` +
    `<body>` +
    `<h2>Pay Stub</h2>` +
    `<p><strong>Employee Name:</strong> ${empName}</p>` +
    `<p><strong>Pay Period:</strong> ${startDate}, to ${endDate}</p>` +
    `<table>` +
    `<tr>` +
    `<th>Description</th>` +
    `<th>Rate</th>` +
    `<th>Hours</th>` +
    `<th>Total</th>` +
    `</tr>` +
    `  <tr>` +
    `<td>Regular Hours</td>` +
    ` <td>$${empHourlyRate}</td>` +
    ` <td>${empWorkedHours}</td>` +
    `<td>$${(empHourlyRate * empWorkedHours).toFixed(2)}</td>` +
    `</tr>` +
    `<tr>` +
    '<td colspan=`3`><strong>Total Gross Pay:</strong></td>' +
    `<td><strong>$${grossPay.toFixed(2)}</strong></td>` +
    `</tr>` +
    `<tr>` +
    '<td colspan=`4`><strong>Deductions:</strong></td>' +
    `</tr>` +
    `<tr>` +
    `<td>Income Tax (Federal)</td>` +
    `<td></td>` +
    `<td></td>` +
    `<td>-$${calculateFederalIncomeTax(grossPay)}</td>` +
    `</tr>` +
    ` <tr>` +
    `<td>Income Tax (Provincial)</td>` +
    `<td></td>` +
    `<td></td>` +
    `<td>-$${calculateProvincialIncomeTax(grossPay)}</td>` +
    `</tr>` +
    ` <tr>` +
    `<td>CPP Contributions</td>` +
    `<td></td>` +
    `<td></td>` +
    `<td>-$${calculateCPPContributions(grossPay)}</td>` +
    `</tr>` +
    `<tr>` +
    `<td>Employment Insurance (EI) Premiums</td>` +
    `<td></td>` +
    `<td></td>` +
    `<td>-$${calculateEIContributions(grossPay)}</td>` +
    `</tr>` +
    `<tr>` +
    '<td colspan=`3`><strong>Total Deductions:</strong></td>' +
    ` <td><strong>-$${totalDeduction.toFixed(2)}</strong></td>` +
    `</tr>` +
    `</table>` +
    `<p><strong>Net Pay:</strong> $${(grossPay - totalDeduction).toFixed(
      2
    )}</p>` +
    `<p><strong>Employer:</strong> ${companyName}</p>` +
    `</body>` +
    `</html>`;

  return html;
};
