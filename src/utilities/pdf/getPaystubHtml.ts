import { Company } from '../../store/slice/auth.slice';
import { numberFormatter } from '../NumberFormater';
import { getPdfHeader } from './common/getPdfHeader';

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
  companyDetails: Company;
}

export const getPaystubHtml = ({
  empHourlyRate,
  empName,
  empWorkedHours,
  endDate,
  startDate,
  companyDetails,
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
    `<title>Earning Statement</title>` +
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
    `text-align: left;  background-color: #f2f2f2;` +
    `}` +
    `</style>` +
    `</head>` +
    `<body>` +
    getPdfHeader(companyDetails) +
    `<p style="text-align: center; font-size:24px; font-weight:600;">Earning Statement</p>` +
    `<p><strong>Employee Name:</strong> ${empName}</p>` +
    `<p><strong>Pay Period:</strong> ${startDate}, to ${endDate}</p>` +
    `<p><strong>Pay Date:</strong> ${endDate}</p>` +
    `<table>` +
    `<tr>` +
    `<th>Income</th>` +
    `<th>Rate</th>` +
    `<th>Hours</th>` +
    `<th>Total</th>` +
    `</tr>` +
    `<tbody><tr>` +
    `<td>Regular Hours</td>` +
    ` <td>$${empHourlyRate}</td>` +
    ` <td>${empWorkedHours}</td>` +
    `<td>${numberFormatter(empHourlyRate * empWorkedHours, true)}</td>` +
    `</tr>` +
    `<tr>` +
    '<td colspan=3><strong>Total Gross Pay:</strong></td>' +
    `<td><strong>${numberFormatter(grossPay, true)}</strong></td>` +
    `</tr> </tbody>` +
    `</table>` +
    `<table style="margin-top:20px;">` +
    `<tr>` +
    `<th colspan=3 ><strong>Deductions</strong></th>` +
    `<th><strong>Total</strong></th>` +
    `</tr>` +
    `<tr>` +
    `<td>Income Tax (Federal)</td>` +
    `<td></td>` +
    `<td></td>` +
    `<td>${numberFormatter(calculateFederalIncomeTax(grossPay), true)}</td>` +
    `</tr>` +
    ` <tr>` +
    `<td>Income Tax (Provincial)</td>` +
    `<td></td>` +
    `<td></td>` +
    `<td>${numberFormatter(calculateProvincialIncomeTax(grossPay), true)}</td>` +
    `</tr>` +
    ` <tr>` +
    `<td>CPP Contributions</td>` +
    `<td></td>` +
    `<td></td>` +
    `<td>${numberFormatter(calculateCPPContributions(grossPay), true)}</td>` +
    `</tr>` +
    `<tr>` +
    `<td>Employment Insurance (EI) Premiums</td>` +
    `<td></td>` +
    `<td></td>` +
    `<td>${numberFormatter(calculateEIContributions(grossPay), true)}</td>` +
    `</tr>` +
    `<tr>` +
    '<td colspan=3><strong>Total Deductions:</strong></td>' +
    ` <td><strong>${numberFormatter(totalDeduction, true)}</strong></td>` +
    `</tr>` +
    `</table>` +
    `<p style="margin-top:20px;"><strong>Net Pay:</strong> ${numberFormatter(grossPay - totalDeduction, true)}</p>` +
    `</body>` +
    `</html>`;

  return html;
};
