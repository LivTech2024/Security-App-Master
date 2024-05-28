import { IInvoicesCollection } from '../../@types/database';
import { Company } from '../../store/slice/auth.slice';
import { numberFormatter } from '../NumberFormater';
import { formatDate } from '../misc';

interface GenerateInvoiceHTMLArgs {
  invoiceData: IInvoicesCollection;
  companyDetails: Company;
  clientBalance: number;
}

export async function generateInvoiceHTML({
  companyDetails,
  invoiceData,
  clientBalance,
}: GenerateInvoiceHTMLArgs) {
  const { InvoiceItems, InvoiceTaxList } = invoiceData;

  const itemsHTML = InvoiceItems.map(
    (item) => `
    <tr>
      <td>${item.ItemDescription}</td>
      <td>${item.ItemQuantity}</td>
      <td>${numberFormatter(item.ItemPrice, true)}</td>
      <td>${numberFormatter(item.ItemTotal, true)}</td>
    </tr>
  `
  ).join('');

  const taxesHTML = InvoiceTaxList.map(
    (tax) => `
    <tr>
      <td>${tax.TaxName}@${tax.TaxPercentage}%</td>
      <td>${numberFormatter(tax.TaxAmount, true)}</td>
    </tr>
  `
  ).join('');

  return `
  <!DOCTYPE html>
    <html>
      <head>
      <meta http-equiv="Content-Type" content="text/html;charset=UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            padding:10px;
          }
          .invoice-details {
            display: -webkit-box;
            -webkit-box-pack: justify;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
          /* Styles specifically for printing (PDF) */
         @media print {
           body {
            font-size: 12px; /* Adjust font size for print */
           }
         }
        </style>
      </head>
      <body>
        <div style="display: -webkit-box; -webkit-box-pack: justify; margin-bottom: 20px;">
         
        <img src="${
          companyDetails.CompanyLogo
        }" style="width:100px; object-fit: cover;" alt="Company Logo">

          <div style="text-align: end;">
            <p>${companyDetails.CompanyName}</p>
            <p>${companyDetails.CompanyPhone}</p>
            <p>${companyDetails.CompanyEmail}</p>
            <p>${companyDetails.CompanyAddress}</p>
          </div>
        </div>
        <div class="invoice-details">
          <div style="max-width:50%">
            <p>Customer Name: ${invoiceData.InvoiceClientName}</p>
            <p>Customer Phone: ${invoiceData.InvoiceClientPhone}</p>
            ${invoiceData.InvoiceClientAddress ? `<p>Customer Address: ${invoiceData.InvoiceClientAddress}</p>` : ''}
          </div>
          <div style="text-align: end; max-width:50%;">
            <p>Invoice Number: ${invoiceData.InvoiceNumber}</p>
            <p>Invoice Date: ${formatDate(invoiceData.InvoiceDate)}</p>
            <p>Invoice Due Date: ${formatDate(invoiceData.InvoiceDueDate)}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width:35%;">Description</th>
              <th style="width:25%;">Qty / Hrs / Hits</th>
              <th style="width:20%;">Rate</th>
              <th style="width:20%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
        <div style="padding:20px 0;">
          <p>Subtotal: ${numberFormatter(invoiceData.InvoiceSubtotal, true)}</p>
        </div>
        ${
          invoiceData.InvoiceTaxList.length > 0
            ? `<table>
          <thead>
            <tr>
              <th>Tax Name</th>
              <th>Tax Amount</th>
            </tr>
          </thead>
          <tbody>
            ${taxesHTML}
          </tbody>
        </table>`
            : '<div></div>'
        }
        <div style="padding-bottom:20px">
          <p>Total Amount: ${numberFormatter(
            invoiceData.InvoiceTotalAmount,
            true
          )}</p>
          <p>Amount Paid: ${numberFormatter(
            invoiceData.InvoiceReceivedAmount,
            true
          )}</p>
          <p>Amount Due: ${numberFormatter(clientBalance, true)}</p>
        </div>
        <div style="padding:20px 0;">
          ${
            invoiceData.InvoiceDescription
              ? `<p>Description: ${invoiceData.InvoiceDescription || '-'}</p>`
              : ''
          }
          ${
            invoiceData.InvoiceTerms
              ? `<p>Terms & Conditions: ${invoiceData.InvoiceTerms || '-'}</p>`
              : ''
          }
        </div>
      </body>
    </html>
  `;
}
