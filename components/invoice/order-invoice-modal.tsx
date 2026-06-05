"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, X } from "lucide-react";
import html2canvas from "html2canvas";

export type OrderInvoiceFields = {
  Reference_Code: string;
  Submitted_At?: string;
  Status?: string;
  Customer_Name?: string;
  GHS_Amount?: number | string;
  RMB_Amount?: number | string;
};

type OrderInvoiceModalProps = {
  order: { fields: OrderInvoiceFields } | null;
  onClose: () => void;
};

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusClass(status?: string) {
  switch (status) {
    case "Completed":
      return "text-emerald-700";
    case "Paid":
      return "text-blue-700";
    case "Cancelled":
      return "text-red-700";
    default:
      return "text-amber-700";
  }
}

export default function OrderInvoiceModal({ order, onClose }: OrderInvoiceModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!order) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [order, handleClose]);

  const handleDownload = async () => {
    const el = printRef.current;
    if (!el || !order) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(el, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `TradeRMB-Invoice-${order.fields.Reference_Code}.png`;
      link.href = canvas.toDataURL("image/png", 0.95);
      link.click();
    } catch (err) {
      console.error("Invoice download failed:", err);
      alert("Could not download invoice. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (!order) return null;

  const f = order.fields;
  const ghs = Number(f.GHS_Amount);
  const rmb = Number(f.RMB_Amount);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-title"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar — not included in download */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 id="invoice-title" className="text-sm font-semibold text-gray-700">
            Invoice preview
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close invoice"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Printable invoice */}
        <div className="p-4 sm:p-6">
          <div
            ref={printRef}
            id="invoice-print"
            className="rounded-xl border border-gray-200 bg-white p-6 text-gray-900"
          >
            <div className="mb-6 flex items-center gap-3 border-b border-gray-200 pb-4">
              <img
                src="/logo-nav.png?v=3"
                alt=""
                className="h-10 w-10 object-contain"
                crossOrigin="anonymous"
              />
              <div>
                <p className="text-lg font-bold tracking-tight text-emerald-900">TRADE RMB</p>
                <p className="text-xs text-gray-500">Currency exchange invoice</p>
              </div>
            </div>

            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Invoice
            </p>

            <dl className="mb-6 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Invoice no.</dt>
                <dd className="font-mono font-semibold">{f.Reference_Code}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Date</dt>
                <dd className="font-medium">{formatDate(f.Submitted_At)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-gray-500">Customer</dt>
                <dd className="font-medium">{f.Customer_Name || "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd className={`font-semibold ${statusClass(f.Status)}`}>
                  {f.Status || "Pending"}
                </dd>
              </div>
            </dl>

            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3">GHS payment</td>
                  <td className="py-3 text-right font-semibold">
                    ₵{Number.isFinite(ghs) ? ghs.toLocaleString() : f.GHS_Amount ?? "—"}
                  </td>
                </tr>
                <tr>
                  <td className="py-3">RMB received</td>
                  <td className="py-3 text-right font-semibold">
                    ¥{Number.isFinite(rmb) ? rmb.toLocaleString() : f.RMB_Amount ?? "—"}
                  </td>
                </tr>
              </tbody>
            </table>

            <p className="mt-6 border-t border-gray-100 pt-4 text-center text-xs text-gray-400">
              Thank you for trading with TRADE RMB
            </p>
          </div>
        </div>

        {/* Actions — outside print area */}
        <div className="flex gap-3 border-t border-gray-100 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {downloading ? "Saving…" : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}
