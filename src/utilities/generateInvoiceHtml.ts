import dayjs from "dayjs";
import { IInvoiceItems, IInvoiceTaxList } from "../@types/database";
import { Company } from "../store/slice/auth.slice";
import { InvoiceFormFields } from "./zod/schema";

interface GenerateInvoiceHTMLArgs {
  invoiceData: InvoiceFormFields;
  invoiceItems: IInvoiceItems[];
  invoiceTaxList: IInvoiceTaxList[];
  companyDetails: Company;
}

export function generateInvoiceHTML({
  companyDetails,
  invoiceData,
  invoiceItems,
  invoiceTaxList,
}: GenerateInvoiceHTMLArgs) {
  const itemsHTML = invoiceItems
    .map(
      (item) => `
    <tr>
      <td>${item.ItemName}</td>
      <td>${item.ItemQuantity}</td>
      <td>${item.ItemPrice}</td>
      <td>${item.ItemTotal}</td>
    </tr>
  `
    )
    .join("");

  const taxesHTML = invoiceTaxList
    .map(
      (tax) => `
    <tr>
      <td>${tax.TaxName}</td>
      <td>${tax.TaxAmount}</td>
    </tr>
  `
    )
    .join("");

  return `
    <html>
      <head>
        <style>
          /* Add your custom styles here */
          body {
            font-family: Arial, sans-serif;
          }
          .invoice-header {
            text-align: center;
            margin-bottom: 20px;
          }
          .invoice-header h1 {
            margin: 0;
          }
          .invoice-details {
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <h1 style="font-weight:600; font-size:24px;">Invoice</h1>
          <p>${companyDetails.CompanyName}</p>
          <p>${companyDetails.CompanyPhone}</p>
          <p>${companyDetails.CompanyEmail}</p>
        </div>
        <div class="invoice-details">
          <p>Customer Name: ${invoiceData.InvoiceCustomerName}</p>
          <p>Customer Phone: ${invoiceData.InvoiceCustomerPhone}</p>
          ${
            invoiceData.InvoiceCustomerAddress &&
            `<p>Customer Address: ${invoiceData.InvoiceCustomerAddress}</p>`
          }
          <p>Invoice Number: ${invoiceData.InvoiceNumber}</p>
          <p>Invoice Date: ${dayjs(invoiceData.InvoiceDate).format(
            "DD/MM/YYYY"
          )}</p>
          <p>Invoice Due Date: ${dayjs(invoiceData.InvoiceDueDate).format(
            "DD/MM/YYYY"
          )}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
        <div>
          <p>Subtotal: ${invoiceData.InvoiceSubtotal}</p>
        </div>
        <table style="margin-top:20px;">
          <thead>
            <tr>
              <th>Tax Name</th>
              <th>Tax Amount</th>
            </tr>
          </thead>
          <tbody>
            ${taxesHTML}
          </tbody>
        </table>
        <div style="margin-bottom:4px;">
          <p style="font-weight:600; font-size:20px;">Total Amount: ${
            invoiceData.InvoiceTotalAmount
          }</p>
        </div>
        ${
          invoiceData.InvoiceDescription &&
          `<div style="margin-bottom:4px;">
          <p>Description: ${invoiceData.InvoiceDescription}</p>
        </div>`
        }
       ${
         invoiceData.InvoiceTerms &&
         `<div style="margin-bottom:4px;">
          <p>Terms & Conditions: ${invoiceData.InvoiceTerms}</p>
        </div>`
       }
      </body>
    </html>
  `;
}
