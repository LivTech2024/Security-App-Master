import { PDFDocument, rgb } from "pdf-lib";
import QRCode from "qrcode";

interface BarcodeData {
  text: string;
  name: string;
}

export async function generateBarcodesAndDownloadPDF(
  barcodeData: BarcodeData[]
) {
  const pdfDoc = await PDFDocument.create();
  const pageWidth = 600;
  const pageHeight = 800;

  for (const { text, name } of barcodeData) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Generate QR code
    const canvas = document.createElement("canvas");
    await QRCode.toCanvas(canvas, text, { margin: 1, width: 400 });

    // Add QR code image to PDF
    const imageDataUrl = canvas.toDataURL();
    const image = await pdfDoc.embedPng(imageDataUrl);
    const imageSize = image.scale(0.75);
    const x = (pageWidth - imageSize.width) / 2;
    const y = (pageHeight - imageSize.height) / 2;
    page.drawImage(image, {
      x,
      y,
      width: imageSize.width,
      height: imageSize.height,
    });

    // Calculate text width
    const font = await pdfDoc.embedFont("Helvetica");
    const fontSize = 12;
    const textWidth = font.widthOfTextAtSize(name, fontSize);

    // Add barcode name below the QR code
    page.drawText(name, {
      x: (pageWidth - textWidth) / 2, // Center text horizontally
      y: y - 20,
      size: 12,
      color: rgb(0, 0, 0),
      font: await pdfDoc.embedFont("Helvetica"),
      lineHeight: 12,
    });
  }

  // Download the PDF
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "checkpoints_qrcodes.pdf";
  a.click();
}
