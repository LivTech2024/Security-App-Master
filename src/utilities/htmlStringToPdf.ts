import html2pdf from "html2pdf.js";

export const htmlStringToPdf = async (
  file_name: string,
  htmlString: string
) => {
  const element = document.createElement("div");
  element.innerHTML = htmlString;

  const pdf = await html2pdf()
    .from(element)
    .set({
      margin: 0,
      filename: file_name,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    })
    .toPdf()
    .get("pdf");

  const blob = pdf.output("blob");
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = file_name;
  document.body.appendChild(a);
  a.click();

  URL.revokeObjectURL(url);
};
