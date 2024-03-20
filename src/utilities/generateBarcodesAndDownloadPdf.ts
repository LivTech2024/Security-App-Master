/* eslint-disable @typescript-eslint/no-explicit-any */
import QRCode from "qrcode";
import html2pdf from "html2pdf.js";

interface QrCodeData {
  text: string;
  name: string;
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
    const barcodeBase64 = await QRCode.toDataURL(item.text);

    html += `<div style="display: flex; flex-direction: column; align-items:center; height:100%;"><img src=${barcodeBase64} style="width:192px";/><div style="padding-bottom:10px;">${item.name}</div></div>`;

    // Increase counter
    barcodeCounter++;
  }

  html = html + "</div></body></html>";

  return html;
};

const handleDownloadPDF = (file_name: string, htmlString: string) => {
  const element = document.createElement("div");
  element.innerHTML = htmlString;

  html2pdf()
    .from(element)
    .set({
      margin: 1,
      filename: file_name,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    })
    .toPdf()
    .get("pdf")
    .then((pdf: { output: (arg0: string) => any }) => {
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = file_name;
      document.body.appendChild(a);
      a.click();

      URL.revokeObjectURL(url);
    });
};

export async function generateBarcodesAndDownloadPDF(QrCodeData: QrCodeData[]) {
  const html = await qrCodesHtmlString(QrCodeData);
  handleDownloadPDF("checkpoints_qrcodes.pdf", html);
}
