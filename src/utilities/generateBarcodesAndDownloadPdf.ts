import QRCode from "qrcode";
import { htmlStringToPdf } from "./htmlStringToPdf";

interface QrCodeData {
  code: string;
  label: string;
}
const qrCodesHtmlString = async (qrCodesData: QrCodeData[]) => {
  let html = "";
  const htmlStart =
    '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta http-equiv="X-UA-Compatible" content="IE=edge" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>';

  html = html + htmlStart;

  html =
    html +
    '<style> body{ font-family: -apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif; font-size: smaller;margin: 0;padding: 0;} </style>';

  html =
    html +
    '<body> <div style="display: flex; gap: 0.25cm; flex-wrap: wrap; vertical-align: top; width: 21cm; height:100%;">';

  let barcodeCounter = 0;
  for (const item of qrCodesData) {
    if (barcodeCounter % 9 === 0 && barcodeCounter !== 0) {
      html =
        html +
        '</div><div style="page-break-after: always;"></div><div style="display: flex; gap: 0.25cm; flex-wrap: wrap; vertical-align: top; width: 21cm; height:100%;">';
    }
    const barcodeBase64 = await QRCode.toDataURL(item.code);

    html += `<div style="display: flex; flex-direction: column; align-items:center; height:100%;"><img src=${barcodeBase64} style="width:192px";/><div style="padding-bottom:10px;">${item.label}</div></div>`;

    // Increase counter
    barcodeCounter++;
  }

  html = html + "</div></body></html>";

  return html;
};

export async function generateBarcodesAndDownloadPDF(QrCodeData: QrCodeData[]) {
  const html = await qrCodesHtmlString(QrCodeData);
  await htmlStringToPdf("checkpoints_qrcodes.pdf", html);
}
