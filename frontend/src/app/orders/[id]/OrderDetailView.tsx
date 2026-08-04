// src/app/orders/[id]/OrderDetailView.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { Offering, OrderDetails, Receipt, Warehouse } from "@/lib/types";

// Helper to format timestamps cleanly
function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusChipClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("completed") || normalized.includes("delivered")) {
    return "bg-emerald-100 text-emerald-800";
  }
  if (normalized.includes("pending") || normalized.includes("processing")) {
    return "bg-amber-100 text-amber-800";
  }
  if (normalized.includes("cancelled") || normalized.includes("failed")) {
    return "bg-red-100 text-red-800";
  }
  return "bg-gray-100 text-gray-700";
}

// ─── Toast Notification ──────────────────────────────────────────────────────
function Toast({
  message,
  type = "info",
  onClose,
}: {
  message: string;
  type?: "info" | "success" | "error";
  onClose?: () => void;
}) {
  const base =
    "fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-sm font-medium transition-all duration-300";
  const styles = {
    info: "bg-gray-900 text-white",
    success: "bg-emerald-600 text-white",
    error: "bg-red-600 text-white",
  };

  return (
    <div className={`${base} ${styles[type]}`} role="status">
      {type === "info" && (
        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      )}
      {type === "success" && (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      )}
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 text-white">
          ✕
        </button>
      )}
    </div>
  );
}

// ─── Payment Method Modal ─────────────────────────────────────────────────────
const PAYMENT_METHODS = ["Card", "Cash", "Digital"] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

const METHOD_ICONS: Record<PaymentMethod, React.ReactNode> = {
  Card: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Cash: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Digital: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
};

function PaymentModal({
  amount,
  onConfirm,
  onCancel,
  processing,
}: {
  amount: number;
  onConfirm: (method: PaymentMethod) => void;
  onCancel: () => void;
  processing: boolean;
}) {
  const [selected, setSelected] = React.useState<PaymentMethod>("Card");

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Complete Payment</h2>
          <p className="text-sm text-gray-500 mt-1">
            Select a payment method to pay your invoice.
          </p>
        </div>

        {/* Amount */}
        <div className="bg-gray-50 rounded-xl px-5 py-4 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-500">Amount Due</span>
          <span className="text-2xl font-bold text-gray-900">
            ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Payment method selector */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Payment Method
          </p>
          <div className="grid grid-cols-3 gap-3">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method}
                onClick={() => setSelected(method)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-sm font-medium transition-all ${selected === method
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 text-gray-700 hover:border-gray-400"
                  }`}
              >
                {METHOD_ICONS[method]}
                {method}
              </button>
            ))}
          </div>
        </div>

        {/* Gateway response note */}
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          &ldquo;Payment Succeed&rdquo;
        </p>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            disabled={processing}
            className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selected)}
            disabled={processing}
            className="flex-1 px-4 py-3 text-sm font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              `Confirm Payment`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OrderDetailView({ id }: { id: string }) {
  const [role, setRole] = React.useState<string | null>(null);
  const [order, setOrder] = React.useState<OrderDetails | null>(null);
  const [offering, setOffering] = React.useState<Offering | null>(null);
  const [warehouses, setWarehouses] = React.useState<Record<string, Warehouse>>(
    {},
  );
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Payment state
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [paymentProcessing, setPaymentProcessing] = React.useState(false);
  const [toast, setToast] = React.useState<{
    message: string;
    type: "info" | "success" | "error";
  } | null>(null);
  const [receipt, setReceipt] = React.useState<Receipt | null>(null);

  React.useEffect(() => {
    setRole(sessionStorage.getItem("smartfm.role"));
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    async function loadOrderData() {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch main order details
        const orderData = await apiFetch<OrderDetails>(`/api/orders/${id}`);
        if (cancelled) return;
        setOrder(orderData);

        // 2. Fetch associated offering details
        if (orderData.offeringId) {
          const offeringData = await apiFetch<Offering>(
            `/api/master-data/offerings/${orderData.offeringId}`,
          );
          if (!cancelled) setOffering(offeringData);
        }

        // 3. Fetch unique warehouses used across shipments
        const warehouseIds = Array.from(
          new Set(
            orderData.shipments
              .map((s) => s.warehouseId)
              .filter((w): w is string => Boolean(w)),
          ),
        );

        if (warehouseIds.length > 0) {
          const warehouseResults = await Promise.all(
            warehouseIds.map((warehouseId) =>
              apiFetch<Warehouse>(`/api/master-data/warehouses/${warehouseId}`),
            ),
          );
          if (cancelled) return;

          const warehouseMap: Record<string, Warehouse> = {};
          warehouseResults.forEach((w) => {
            warehouseMap[w.id] = w;
          });
          setWarehouses(warehouseMap);
        }

        // 4. If invoice already paid, fetch receipt silently
        if (orderData.invoice?.status === "Paid") {
          try {
            const receiptData = await apiFetch<Receipt>(
              `/api/billing/invoices/${orderData.invoice.id}/receipt`,
            );
            if (!cancelled) setReceipt(receiptData);
          } catch {
            // Receipt not found yet — that's fine
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOrderData();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Auto-dismiss success toast after 4 s
  React.useEffect(() => {
    if (toast?.type === "success") {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function handlePayment(method: "Card" | "Cash" | "Digital") {
    if (!order?.invoice) return;
    setPaymentProcessing(true);
    setShowPaymentModal(false);
    setToast({ message: "Creating Receipt…", type: "info" });

    try {
      const result = await apiFetch<Receipt>(
        `/api/billing/invoices/${order.invoice.id}/pay`,
        {
          method: "POST",
          body: JSON.stringify({ paymentMethod: method }),
        },
      );

      setReceipt(result);
      // Update order's invoice status to Paid in local state
      setOrder((prev) =>
        prev && prev.invoice
          ? { ...prev, invoice: { ...prev.invoice, status: "Paid" } }
          : prev,
      );
      setToast({ message: "Receipt created successfully!", type: "success" });
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Payment failed",
        type: "error",
      });
    } finally {
      setPaymentProcessing(false);
    }
  }

  const invoice = order?.invoice ?? null;
  const isPaid = invoice?.status === "Paid";

  return (
    <div className="max-w-6xl mx-auto my-8 px-4">
      {/* Role Permission Warning */}
      {role !== "customer" && role !== "staff" && (
        <div className="mb-6 p-4 bg-amber-50 text-amber-900 text-sm flex items-center justify-between  ">
          <span>
            Please switch to a Customer or Staff role to perform administrative
            actions.
          </span>
          <Link href="/" className="font-medium underline hover:text-amber-700">
            Go to Role Picker
          </Link>
        </div>
      )}

      {/* Clean Page Header */}
      <div className="pb-6 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-black">
        <div>
          <Link
            href="/orders"
            className="text-xs font-medium text-gray-500 hover:text-black mb-1 inline-block"
          >
            ← Back to orders
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl sm:text-3xl font-heading font-semibold text-gray-900">
              Order Detail
            </h1>
            {order && (
              <span className="font-mono text-xs font-medium bg-primary text-gray-600 px-2.5 py-1 rounded">
                #{order.id}
              </span>
            )}
          </div>
        </div>

        {order && (
          <div className="flex items-center gap-2">
            <span
              className={`text-xs bg-tertiary font-medium px-3 py-1 rounded-full ${getStatusChipClass(
                order.status,
              )}`}
            >
              {order.status}
            </span>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-12 text-center space-y-3">
          <div className="inline-block w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-500">
            Loading order details...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-6 bg-red-50 text-red-900   space-y-3">
          <h3 className="font-semibold text-base">Failed to load order</h3>
          <p className="text-sm">{error}</p>
          <div className="pt-1">
            <Link
              href="/orders"
              className="text-xs font-medium underline hover:text-red-700"
            >
              Back to orders
            </Link>
          </div>
        </div>
      )}

      {/* Main Content Layout (4 - 8 Grid) */}
      {!loading && !error && order && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN (4/12): Overview, Offering & Invoice */}
          <div className="lg:col-span-4 space-y-6">
            {/* Overview Section */}
            <div className="bg-gray-50/80 p-6   space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                Order Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Order ID</span>
                  <span className="font-mono font-medium text-gray-900">
                    {order.id}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">
                    Total Weight
                  </span>
                  <span className="font-medium text-gray-900">
                    {order.orderWeightKg} kg
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Created At</span>
                  <span className="text-gray-900 font-medium text-right">
                    {formatDate(order.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Service Offering Section */}
            {offering && (
              <div className="bg-gray-50/80 p-6   space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                  Service Offering
                </h2>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-gray-900">
                    {offering.name}
                  </p>
                  <div className="flex justify-between items-center text-sm pt-2">
                    <span className="text-gray-500 font-medium">
                      Base Price
                    </span>
                    <span className="font-medium text-gray-900">
                      {offering.basePrice}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Invoice & Payment Section ── */}
            {invoice ? (
              <div className="bg-gray-50/80 p-6 space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                  Invoice & Payment
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Invoice ID</span>
                    <span className="font-mono text-xs font-medium text-gray-700 break-all text-right max-w-[60%]">
                      {invoice.id.split("-")[0].toUpperCase()}…
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Amount</span>
                    <span className="font-semibold text-gray-900 text-base">
                      ${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Status</span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isPaid
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                        }`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Issued At</span>
                    <span className="text-gray-700 font-medium text-right">
                      {formatDate(invoice.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Payment / Receipt actions */}
                <div className="pt-2 space-y-2">
                  {!isPaid && (
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      disabled={paymentProcessing}
                      className="w-full py-3 px-4 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Pay Now
                    </button>
                  )}

                  {receipt && (
                    <Link
                      href={`/orders/receipts/${invoice.id}`}
                      className="w-full py-3 px-4 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Receipt
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50/80 p-6 space-y-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                  Invoice & Payment
                </h2>
                <p className="text-sm text-gray-400">
                  No invoice has been generated for this order yet.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN (8/12): Cargo & Shipments */}
          <div className="lg:col-span-8 space-y-8">
            {/* SECTION 1: Cargo Containers */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                Cargo Items ({order.cargoes.length})
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs font-medium text-gray-500">
                      <th className="pb-3 pr-4">Description</th>
                      <th className="pb-3 px-4 text-right">Weight (kg)</th>
                      <th className="pb-3 px-4 text-right">Volume (cbm)</th>
                      <th className="pb-3 pl-4 text-center">Hazardous</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {order.cargoes.map((cargo) => (
                      <tr key={cargo.id} className="hover:bg-gray-50/50">
                        <td className="py-3 pr-4 font-medium text-gray-900">
                          {cargo.description}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-gray-600">
                          {cargo.weightKg}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-gray-600">
                          {cargo.volumeCbm ?? "-"}
                        </td>
                        <td className="py-3 pl-4 text-center">
                          {cargo.isHazardous ?
                            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                              Yes
                            </span>
                            : <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-0.5 rounded-full">
                              No
                            </span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 2: Shipments */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                Shipments ({order.shipments.length})
              </h2>

              <div className="space-y-4">
                {order.shipments.map((shipment) => {
                  const warehouse =
                    shipment.warehouseId ?
                      warehouses[shipment.warehouseId]
                      : null;

                  return (
                    <div
                      key={shipment.id}
                      className="bg-gray-50/80 p-6   space-y-4"
                    >
                      {/* Status Chip & Date */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-xs font-medium px-3 py-1 rounded-full ${getStatusChipClass(
                            shipment.status,
                          )}`}
                        >
                          {shipment.status}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">
                          {formatDate(shipment.createdAt)}
                        </span>
                      </div>

                      {/* Route Details */}
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-xs font-medium text-gray-400 block">
                            Pickup
                          </span>
                          <p className="font-medium text-gray-900">
                            {shipment.pickupAddress}
                          </p>
                        </div>

                        <div>
                          <span className="text-xs font-medium text-gray-400 block">
                            Delivery
                          </span>
                          <p className="font-medium text-gray-900">
                            {shipment.deliveryAddress}
                          </p>
                        </div>

                        {warehouse && (
                          <div className="pt-1">
                            <span className="text-xs font-medium text-gray-400 block">
                              Staging Warehouse
                            </span>
                            <p className="font-medium text-gray-700">
                              {warehouse.name} ({warehouse.address})
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Map Link Action */}
                      <div className="pt-2">
                        <Link
                          href={`/map?origin=${encodeURIComponent(
                            shipment.pickupAddress,
                          )}&destination=${encodeURIComponent(
                            shipment.deliveryAddress,
                          )}`}
                          className="text-xs font-medium text-gray-700 hover:text-black underline"
                        >
                          See Map →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment Modal ── */}
      {showPaymentModal && invoice && (
        <PaymentModal
          amount={invoice.amount}
          onConfirm={handlePayment}
          onCancel={() => setShowPaymentModal(false)}
          processing={paymentProcessing}
        />
      )}

      {/* ── Toast Notification ── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={toast.type !== "info" ? () => setToast(null) : undefined}
        />
      )}
    </div>
  );
}
