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
