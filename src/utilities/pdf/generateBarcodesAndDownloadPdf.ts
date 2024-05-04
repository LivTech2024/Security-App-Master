import QRCode from 'qrcode';
import { htmlStringToPdf } from '../htmlStringToPdf';

interface QrCodeData {
  code: string;
  label: string;
}
const qrCodesHtmlString = async (qrCodesData: QrCodeData[]) => {
  let html = '';
  const htmlStart =
    '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta http-equiv="X-UA-Compatible" content="IE=edge" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>';

  html = html + htmlStart;

  html =
    html +
    '<style> body{ font-family: -apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif; font-size: smaller;margin: 0;padding: 0;} </style>';

  html =
    html +
    '<body> <div style="display: flex; flex-wrap: wrap; vertical-align: top; width: 100%; height:100%; justify-content:between;  column-gap:6px; row-gap:18px;">';

  let barcodeCounter = 0;
  for (const item of qrCodesData) {
    if (barcodeCounter % 20 === 0 && barcodeCounter !== 0) {
      html =
        html +
        '</div><div style="page-break-after: always;"></div><div style="display: flex; gap: 0px; flex-wrap: wrap; vertical-align: top; width: 100%; height:100%; justify-content:between;  column-gap:6px; row-gap:18px;">';
    }
    const barcodeBase64 = await QRCode.toDataURL(item.code);

    html += `<div style="display: flex; flex-direction: column; align-items:center; height:210px; width:192px; padding:16px; border:1px solid black; border-radius:8px;">
       <img src=${barcodeBase64} style="width:150px; object-fit:cover;"/>
       <div style="padding-bottom:12px;">${item.label}</div>
    </div>`;

    // Increase counter
    barcodeCounter++;
  }

  html = html + '</div></body></html>';

  return html;
};

export async function generateBarcodesAndDownloadPDF(
  patrolName: string,
  qrCodeData: QrCodeData[]
) {
  const html = await qrCodesHtmlString(qrCodeData);
  await htmlStringToPdf(`${patrolName}_qrcodes.pdf`, html);
}
