// src/app/orders/receipts/[invoiceId]/page.js
"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

function formatDate(iso) {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "medium",
  });
}

const METHOD_LABELS = {
  Card: "Credit / Debit Card",
  Cash: "Cash",
  Digital: "Digital Wallet",
};

export default function ReceiptPage() {
  const params = useParams();
  const invoiceId = params.invoiceId;

  const [receipt, setReceipt] = React.useState(null);
  const [invoice, setInvoice] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!invoiceId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [receiptData, invoiceData] = await Promise.all([
          apiFetch(`/api/billing/invoices/${invoiceId}/receipt`),
          apiFetch(`/api/billing/invoices/${invoiceId}`),
        ]);
        if (!cancelled) {
          setReceipt(receiptData);
          setInvoice(invoiceData);
        }
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [invoiceId]);

  return (
    <div className="max-w-lg mx-auto my-12 px-4">
      {/* Back link */}
      <Link
        href="/orders/mine"
        className="text-xs font-medium text-gray-500 hover:text-black mb-6 inline-block"
      >
        ← Back to my orders
      </Link>

      {loading && (
        <div className="p-12 text-center space-y-3">
          <div className="inline-block w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-500">Loading receipt…</p>
        </div>
      )}

      {error && (
        <div className="p-6 bg-red-50 text-red-900 rounded-xl space-y-2">
          <h3 className="font-semibold">Failed to load receipt</h3>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && receipt && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
          {/* Header banner */}
          <div className="bg-gray-900 px-8 py-8 text-center">
            {/* Checkmark circle */}
            <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Payment Receipt</h1>
            <p className="text-gray-400 text-sm mt-1">
              Your payment has been processed successfully
            </p>
          </div>

          {/* Amount big display */}
          <div className="bg-gray-50 px-8 py-6 text-center border-b border-gray-200">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
              Amount Paid
            </p>
            <p className="text-4xl font-bold text-gray-900">
              $
              {receipt.amountPaid.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          {/* Receipt details */}
          <div className="px-8 py-6 space-y-4">
            <ReceiptRow
              label="Invoice ID"
              value={
                <span className="font-mono text-xs break-all">{invoiceId}</span>
              }
            />
            {invoice && (
              <ReceiptRow
                label="Order ID"
                value={
                  <Link
                    href={`/orders/${invoice.orderId}`}
                    className="font-mono text-xs text-gray-700 hover:text-black underline break-all"
                  >
                    {invoice.orderId}
                  </Link>
                }
              />
            )}
            <ReceiptRow
              label="Payment Method"
              value={METHOD_LABELS[receipt.paymentMethod] ?? receipt.paymentMethod}
            />
            <ReceiptRow label="Gateway Response" value="Succeed" />
            <ReceiptRow
              label="Date & Time"
              value={formatDate(receipt.issuedAt)}
            />
          </div>

          {/* Divider with dashed style (receipt-like) */}
          <div className="mx-8 border-t-2 border-dashed border-gray-200" />

          {/* Footer note */}
          <div className="px-8 py-5 text-center text-xs text-gray-400 space-y-1">
            <p>Thank you for your payment. Please keep this receipt for your records.</p>
            <p className="font-medium text-gray-500">SmartFleet Management System</p>
          </div>

          {/* Actions */}
          <div className="px-8 pb-8 flex flex-col sm:flex-row gap-3">
            {invoice && (
              <Link
                href={`/orders/${invoice.orderId}`}
                className="flex-1 py-3 text-sm font-semibold text-center bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition"
              >
                Back to Order
              </Link>
            )}
            <button
              onClick={() => window.print()}
              className="flex-1 py-3 text-sm font-semibold text-center border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition"
            >
              🖨 Print Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReceiptRow({ label, value }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex-shrink-0">
        {label}
      </span>
      <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
    </div>
  );
}
