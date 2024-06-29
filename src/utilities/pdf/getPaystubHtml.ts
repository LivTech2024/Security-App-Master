import { IPayStubsCollection } from '../../@types/database';
import { Company } from '../../store/slice/auth.slice';
import { formatDate } from '../misc';
import { getPdfHeader } from './common/getPdfHeader';

interface GetPaystubHtmlArgs {
  payStub: IPayStubsCollection;
  companyDetails: Company;
}

export const getPaystubHtml = ({
  payStub,
  companyDetails,
}: GetPaystubHtmlArgs) => {
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
    `<p><strong>Employee Name:</strong> ${payStub.PayStubEmpName}</p>` +
    `<p><strong>Pay Period:</strong> ${formatDate(payStub.PayStubPayPeriodStartDate)}, to ${formatDate(payStub.PayStubPayPeriodStartDate)}</p>` +
    `<p><strong>Pay Date:</strong> ${formatDate(payStub.PayStubPayDate)}</p>` +
    `<table>` +
    `<tr>` +
    `<th>Income</th>` +
    `<th>Rate</th>` +
    `<th>Hours</th>` +
    `<th>Total</th>` +
    `</tr>` +
    `<tbody><tr>` +
    /*  `<td>Regular Hours</td>` +
    ` <td>$${empHourlyRate}</td>` +
    ` <td>${empWorkedHours}</td>` +
    `<td>${numberFormatter(empHourlyRate * empWorkedHours, true)}</td>` +
    `</tr>` + */
    `<tr>` +
    '<td colspan=3><strong>Total Gross Pay:</strong></td>' +
    //`<td><strong>${numberFormatter(grossPay, true)}</strong></td>` +
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
    //`<td>${numberFormatter(calculateFederalIncomeTax(grossPay), true)}</td>` +
    `</tr>` +
    ` <tr>` +
    `<td>Income Tax (Provincial)</td>` +
    `<td></td>` +
    `<td></td>` +
    //`<td>${numberFormatter(calculateProvincialIncomeTax(grossPay), true)}</td>` +
    `</tr>` +
    ` <tr>` +
    `<td>CPP Contributions</td>` +
    `<td></td>` +
    `<td></td>` +
    //`<td>${numberFormatter(calculateCPPContributions(grossPay), true)}</td>` +
    `</tr>` +
    `<tr>` +
    `<td>Employment Insurance (EI) Premiums</td>` +
    `<td></td>` +
    `<td></td>` +
    //`<td>${numberFormatter(calculateEIContributions(grossPay), true)}</td>` +
    `</tr>` +
    `<tr>` +
    '<td colspan=3><strong>Total Deductions:</strong></td>' +
    /*  ` <td><strong>${numberFormatter(totalDeduction, true)}</strong></td>` +
    `</tr>` */ +`</table>` +
    /*  `<p style="margin-top:20px;"><strong>Net Pay:</strong> ${numberFormatter(grossPay - totalDeduction, true)}</p>` */ +`</body>` +
    `</html>`;

  return html;
};
