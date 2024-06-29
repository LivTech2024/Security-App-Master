/* eslint-disable @typescript-eslint/no-unused-vars */
import { IPayStubsCollection } from '../../@types/database';
import { Company } from '../../store/slice/auth.slice';
import { numberFormatter } from '../NumberFormater';
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
  const earningRemainingArray = [
    ...Array.from({
      length:
        payStub.PayStubDeductions.length - payStub.PayStubEarnings.length > 0
          ? payStub.PayStubDeductions.length - payStub.PayStubEarnings.length
          : 0,
    }),
  ];

  const deductionRemainingArray = [
    ...Array.from({
      length:
        payStub.PayStubEarnings.length - payStub.PayStubDeductions.length > 0
          ? payStub.PayStubEarnings.length - payStub.PayStubDeductions.length
          : 0,
    }),
  ];

  const html = `<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 16px;
        padding: 0;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }
      th,
      td {
        padding: 8px;
      }
      th {
        background-color: #4f4a4a36;
      }
    </style>
  </head>
  <body>
    ${getPdfHeader(companyDetails)}
    <div
      style="
        font-size: 14px;
        background-color: #f2f2f2d0;
        padding: 16px;
        border-radius: 4px;
      "
    >
      <p style="text-align: center; font-size: 24px; font-weight: 600">
        Earning Statement
      </p>
      <p><strong>Employee Name:</strong> ${payStub.PayStubEmpName}</p>
      <p>
        <strong>Pay Period:</strong>
        ${formatDate(payStub.PayStubPayPeriodStartDate)} to ${formatDate(payStub.PayStubPayPeriodEndDate)}
      </p>
      <p><strong>Pay Date:</strong> ${formatDate(payStub.PayStubPayDate)}</p>

      <div
        style="
          display: flex;
          justify-content: center;
          align-items: start;
          gap: 16px;
          margin-top: 32px;
        "
      >
        <div
          style="
            border-right: 1px solid black;
            width: 100%;
            padding-right: 16px;
          "
        >
          <table>
            <thead>
              <tr>
                <th style="text-align: left">Income</th>
                <th style="text-align: left">Qty</th>
                <th style="text-align: center">Rate</th>
                <th style="text-align: right">Current</th>
                <th style="text-align: right">YTD Amount</th>
              </tr>
            </thead>
            <tbody>
            ${payStub.PayStubEarnings.map(
              (data) =>
                `<tr>
                <td style="text-align: left; border-bottom: 1px solid #ddd;">${data.Income}</td>
                <td style="text-align: left; border-bottom: 1px solid #ddd;">${data.Quantity ?? ''}</td>
                <td style="text-align: center; border-bottom: 1px solid #ddd;">${data.Rate ?? ''}</td>
                <td style="text-align: right; border-bottom: 1px solid #ddd;">${numberFormatter(data.CurrentAmount, true)}</td>
                <td style="text-align: right; border-bottom: 1px solid #ddd;">${numberFormatter(data.YTDAmount, true)}</td>
              </tr>`
            ).join('')}

            

            ${earningRemainingArray.map((_) => `<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>`).join('')}
              
            </tbody>
            <tfoot>
              <tr>
                <th colspan="3" style="text-align: left">Total Earnings</th>
                <th style="text-align: right">${numberFormatter(
                  payStub.PayStubEarnings.reduce(
                    (acc, obj) => acc + obj.CurrentAmount,
                    0
                  ),
                  true
                )}</th>
                <th style="text-align: right">${numberFormatter(
                  payStub.PayStubEarnings.reduce(
                    (acc, obj) => acc + obj.YTDAmount,
                    0
                  ),
                  true
                )}</th>
              </tr>
            </tfoot>
          </table>
        </div>
        <div style="width: 100%">
          <table>
            <thead>
              <tr>
                <th style="text-align: left">Deduction</th>
                <th style="text-align: center">Percentage</th>
                <th style="text-align: right">Current</th>
                <th style="text-align: right">YTD Amount</th>
              </tr>
            </thead>
            <tbody>
              ${payStub.PayStubDeductions.map(
                (data) =>
                  `<tr>
                <td style="text-align: left; border-bottom: 1px solid #ddd;">${data.Deduction}</td>
                <td style="text-align: center; border-bottom: 1px solid #ddd;">${data.Percentage}%</td>
                <td style="text-align: right; border-bottom: 1px solid #ddd;">${numberFormatter(data.Amount, true)}</td>
                <td style="text-align: right; border-bottom: 1px solid #ddd;">${numberFormatter(data.YearToDateAmt, true)}</td>
              </tr>`
              ).join('')}

               ${deductionRemainingArray.map((_) => `<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>`).join('')}
              
            </tbody>
            <tfoot>
              <tr>
                <th colspan="2" style="text-align: left">Total Deductions</th>
                <th style="text-align: right">${numberFormatter(
                  payStub.PayStubDeductions.reduce(
                    (acc, obj) => acc + obj.Amount,
                    0
                  ),
                  true
                )}</th>
                <th style="text-align: right">${numberFormatter(
                  payStub.PayStubDeductions.reduce(
                    (acc, obj) => acc + obj.YearToDateAmt,
                    0
                  ),
                  true
                )}</th>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div
        style="
          margin-top: 30px;
          gap: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        "
      >
        <div style="font-weight: 700; font-size: 15px">Net Pay</div>
        <div><span style="font-weight: 600">Current Amount</span> : ${numberFormatter(payStub.PayStubNetPay.Amount, true)}</div>
        <div><span style="font-weight: 600">YTD Amount</span> : ${numberFormatter(payStub.PayStubNetPay.YearToDateAmt, true)} </div>
      </div>
    </div>
  </body>
</html>`;

  return html;
};
