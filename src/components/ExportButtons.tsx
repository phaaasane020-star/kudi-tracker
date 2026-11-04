"use client";

import { FileSpreadsheet, FileText } from "lucide-react";
import { useState } from "react";
import { cedi, monthLabel, paymentLabel } from "@/lib/format";

export type ExportRow = {
  date: string;
  type: string;
  category: string;
  note: string;
  method: string;
  amount: number;
};

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ExportButtons({ rows, bookName, month }: { rows: ExportRow[]; bookName: string; month: string }) {
  const [busy, setBusy] = useState<"" | "xlsx" | "pdf">("");
  const base = `kudi-${bookName.toLowerCase()}-${month}`;
  const spent = rows.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0);
  const earned = rows.filter((r) => r.type === "income").reduce((s, r) => s + r.amount, 0);

  async function toExcel() {
    setBusy("xlsx");
    try {
      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet(monthLabel(month));
      ws.columns = [
        { header: "Date", key: "date", width: 12 },
        { header: "Type", key: "type", width: 10 },
        { header: "Category", key: "category", width: 24 },
        { header: "Note", key: "note", width: 36 },
        { header: "Paid with", key: "method", width: 14 },
        { header: "Amount (GH₵)", key: "amount", width: 14 },
      ];
      ws.getRow(1).font = { bold: true };
      rows.forEach((r) => ws.addRow({ ...r, method: paymentLabel(r.method), amount: r.type === "expense" ? -r.amount : r.amount }));
      ws.getColumn("amount").numFmt = "#,##0.00;[Red]-#,##0.00";
      ws.addRow({});
      ws.addRow({ note: "Total income", amount: earned }).font = { bold: true };
      ws.addRow({ note: "Total spent", amount: -spent }).font = { bold: true };
      ws.addRow({ note: "Balance", amount: earned - spent }).font = { bold: true };
      const buf = await wb.xlsx.writeBuffer();
      download(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${base}.xlsx`);
    } finally {
      setBusy("");
    }
  }

  async function toPdf() {
    setBusy("pdf");
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF();
      // jsPDF's built-in fonts have no ₵ glyph, so the PDF uses "GHS".
      const money = (n: number) => cedi(n).replace("GH₵", "GHS ");
      doc.setFontSize(16);
      doc.text(`Kudi Tracker — ${bookName}`, 14, 16);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(monthLabel(month), 14, 23);
      doc.text(`Income ${money(earned)}   Spent ${money(spent)}   Balance ${money(earned - spent)}`, 14, 30);
      autoTable(doc, {
        startY: 36,
        head: [["Date", "Category", "Note", "Paid with", "Amount"]],
        body: rows.map((r) => [
          r.date,
          r.category,
          r.note,
          paymentLabel(r.method),
          (r.type === "expense" ? "-" : "+") + money(r.amount),
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [63, 41, 43], textColor: [255, 243, 224] },
        columnStyles: { 4: { halign: "right" } },
      });
      doc.save(`${base}.pdf`);
    } finally {
      setBusy("");
    }
  }

  const disabled = rows.length === 0 || busy !== "";
  return (
    <div className="flex gap-2">
      <button onClick={toExcel} disabled={disabled} className="btn-soft">
        <FileSpreadsheet size={16} /> {busy === "xlsx" ? "Preparing…" : "Excel"}
      </button>
      <button onClick={toPdf} disabled={disabled} className="btn-soft">
        <FileText size={16} /> {busy === "pdf" ? "Preparing…" : "PDF"}
      </button>
    </div>
  );
}
