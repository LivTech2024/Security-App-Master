import QRCode from 'qrcode';
import { Company } from '../../store/slice/auth.slice';

interface QrCodeData {
  code: string;
  label: string;
}
export const generateQrCodesHtml = async (
  qrCodesData: QrCodeData[],
  companyDetails: Company
) => {
  let html = '';
  const htmlStart =
    '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta http-equiv="X-UA-Compatible" content="IE=edge" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>';

  html = html + htmlStart;

  html =
    html +
    '<style> body{ font-family: -apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif; font-size: smaller;margin: 0;padding: 0;} .line-clamp-1{overflow: hidden;display: -webkit-box;-webkit-box-orient: vertical;-webkit-line-clamp: 1;} </style>';

  html =
    html +
    '<body> <div style="display: flex; flex-wrap: wrap; vertical-align: top; justify-content:between;  column-gap:8px; row-gap:8px; padding:10px 0px 0px 10px;">';

  let barcodeCounter = 0;
  for (const item of qrCodesData) {
    if (barcodeCounter % 15 === 0 && barcodeCounter !== 0) {
      html =
        html +
        '</div><div style="page-break-after: always;"></div><div style="display: flex; flex-wrap: wrap; vertical-align: top; justify-content:between;  column-gap:8px; row-gap:8px; padding:10px 0px 0px 10px;">';
    }
    const barcodeBase64 = await QRCode.toDataURL(item.code);

    html += `<div style="display: flex; flex-direction: column; align-items:center; padding:16px; border:1px solid black; border-radius:8px; min-width:220px; min-height:181px; max-width:220px; max-height:181px; overflow:hidden;">
       <div style="display:flex; align-items: center; justify-content: center; gap:8px; ">
         <img src=${companyDetails.CompanyLogo} style="width:40px; object-fit:cover;"/>
         <div style="display:flex; flex-direction:column; overflow:hidden; gap:4px;">
           <div class="line-clamp-1" style="font-size:10px;">${companyDetails.CompanyName}</div>
           <div class="line-clamp-1" style="font-size:10px;">Ph.No.: ${companyDetails.CompanyPhone}</div>
         </div>
       </div>
       <img src=${barcodeBase64} style="width:156px; max-width:156px; height:136px; max-height:136px; object-fit:cover;"/>
       <div style="padding-bottom:16px;" class="line-clamp-1">${item.label}</div>
    </div>`;

    // Increase counter
    barcodeCounter++;
  }

  html = html + '</div></body></html>';

  return html;
};
