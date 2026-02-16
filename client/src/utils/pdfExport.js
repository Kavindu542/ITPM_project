import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const pad2 = (n) => String(n).padStart(2, "0");

const defaultFilename = (base) => {
  const d = new Date();
  const stamp = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}_${pad2(d.getHours())}${pad2(d.getMinutes())}`;
  return `${base}_${stamp}.pdf`;
};

export function exportPdfTable({
  title,
  columns,
  rows,
  filenameBase = "export",
  filename,
} = {}) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  const safeTitle = String(title || "").trim();
  if (safeTitle) {
    doc.setFontSize(16);
    doc.text(safeTitle, 40, 40);
  }

  autoTable(doc, {
    startY: safeTitle ? 60 : 40,
    head: [columns || []],
    body: rows || [],
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [37, 99, 235] },
    margin: { left: 40, right: 40 },
  });

  doc.save(filename || defaultFilename(filenameBase));
}

export function exportMaterialsListPdf({ title = "Recommended materials", items = [], filenameBase = "materials_recommendations" } = {}) {
  const columns = ["Title", "Module", "Semester", "Downloads", "Preview URL"];
  const rows = (items || []).map((m) => [
    m?.title || "—",
    m?.moduleCode || "—",
    m?.semester ?? "—",
    m?.downloadCount ?? 0,
    m?.previewUrl || "—",
  ]);
  return exportPdfTable({ title, columns, rows, filenameBase });
}

async function fileToImage(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });
  return img;
}

function preprocessToDataUrl(img, { grayscale = true, contrast = 1.15, brightness = 1.05, threshold = 205 } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i + 1], b = data[i + 2];
    // grayscale
    if (grayscale) {
      const y = 0.299 * r + 0.587 * g + 0.114 * b;
      r = g = b = y;
    }
    // contrast and brightness
    r = r * contrast + 255 * (1 - contrast) * 0.5;
    g = g * contrast + 255 * (1 - contrast) * 0.5;
    b = b * contrast + 255 * (1 - contrast) * 0.5;
    r *= brightness; g *= brightness; b *= brightness;
    // simple threshold to clean paper background
    const v = (r + g + b) / 3;
    const bin = v > threshold ? 255 : 0;
    data[i] = data[i + 1] = data[i + 2] = bin;
  }
  ctx.putImageData(imageData, 0, 0);
  // JPEG for smaller PDFs
  return canvas.toDataURL("image/jpeg", 0.92);
}

export async function exportImagesToPdf({ files = [], title = "Handwritten Notes", filenameBase = "handwritten_notes", marginMm = 10 } = {}) {
  if (!files || !files.length) return;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const areaW = pageWidth - marginMm * 2;
  const areaH = pageHeight - marginMm * 2;

  // Title on first page
  const safeTitle = String(title || "").trim();
  if (safeTitle) {
    doc.setFontSize(16);
    doc.text(safeTitle, marginMm, marginMm - 2);
  }

  let first = true;
  for (const file of files) {
    const img = await fileToImage(file);
    const dataUrl = preprocessToDataUrl(img);
    // fit within content area while preserving aspect ratio
    const imgRatio = img.width / img.height;
    let w = areaW;
    let h = w / imgRatio;
    if (h > areaH) {
      h = areaH;
      w = h * imgRatio;
    }
    const x = marginMm + (areaW - w) / 2;
    const y = marginMm + (areaH - h) / 2 + (safeTitle && first ? 4 : 0);
    if (!first) doc.addPage();
    doc.addImage(dataUrl, "JPEG", x, y, w, h, undefined, "FAST");
    first = false;
  }

  doc.save(defaultFilename(filenameBase));
}
