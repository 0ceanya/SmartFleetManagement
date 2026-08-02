"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import DriverAuthGuard from "@/components/driver/DriverAuthGuard";
import DriverPageShell from "@/components/driver/DriverPageShell";
import DriverPageHeader from "@/components/driver/DriverPageHeader";
import LoadManifestChecklist from "@/components/driver/LoadManifestChecklist";
import RejectModal from "@/components/driver/RejectModal";
import RouteMap from "@/components/RouteMap";
import Button from "@/components/ui/Button";
import { formatOrderDateTime } from "@/lib/driverOrderDisplay";

function DeliveryConfirmationSection({ shipment, driverId, isLoaded }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [existingConfirmation, setExistingConfirmation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [mockMedia, setMockMedia] = useState(null);

  useEffect(() => {
    async function loadDetails() {
      if (!shipment) return;
      setLoading(true);
      setError(null);
      const [confirmation, orderData] = await Promise.all([
        apiFetch(`/api/fleet/shipments/${shipment.id}/delivery-confirmation`).catch(() => null),
        apiFetch(`/api/orders/${shipment.orderId}`).catch(() => null),
      ]);
      setExistingConfirmation(confirmation);
      setOrder(orderData);
      setLoading(false);
    }
    loadDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipment]);

  const handleAttachMedia = () => {
    setMockMedia({ name: `delivery_photo_${Date.now()}.jpg` });
  };

  const handleComplete = async () => {
    setSubmitting(true);
    setError(null);
    setSubmitSuccess(null);

    const payload = {
      driverId: driverId,
      recipientName: shipment.customerName || "Customer",
      proofSignature: mockMedia ? `Photo attached: ${mockMedia.name}` : "Confirmed by driver",
    };

    try {
      const result = await apiFetch(`/api/fleet/shipments/${shipment.id}/delivery-confirmation`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setExistingConfirmation(result);
      setSubmitSuccess("Delivery marked as done.");
    } catch (err) {
      console.error("Delivery confirmation failed:", err);
      setError(err.message || "Failed to complete delivery.");
    } finally {
      setSubmitting(false);
    }
  };

  const orderDateTime = formatOrderDateTime(order?.createdAt);

  return (
    <div className={`bg-white border border-gray-300 p-6 space-y-6 shadow-xs ${!isLoaded ? "opacity-60" : ""}`}>
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-lg font-heading text-secondary font-bold">Complete Delivery</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          {isLoaded
            ? "Review order details and mark this delivery as done."
            : "Complete the load manifest checklist above and tap Start before completing delivery."}
        </p>
      </div>

      {submitSuccess && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 text-sm text-emerald-800 font-medium">
          Success: {submitSuccess}
        </div>
      )}
      {existingConfirmation && !submitSuccess && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-sm text-blue-800 font-medium">
          Delivery confirmation has already been recorded for this shipment.
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 text-sm text-rose-800 font-medium">
          Warning: {error}
        </div>
      )}

      {loading ? (
        <p className="text-xs text-gray-500">Loading order details...</p>
      ) : (
        <div className="space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-gray-500 block font-semibold">Customer</span>
              <span className="text-gray-800 font-bold">{shipment.customerName || "N/A"}</span>
            </div>
            <div>
              <span className="text-gray-500 block font-semibold">Phone</span>
              {shipment.customerPhone ? (
                <a href={`tel:${shipment.customerPhone}`} className="text-primary font-bold hover:underline">
                  {shipment.customerPhone}
                </a>
              ) : (
                <span className="text-gray-800">N/A</span>
              )}
            </div>
            <div>
              <span className="text-gray-500 block font-semibold">Delivery Address</span>
              <span className="text-gray-800">{shipment.deliveryAddress}</span>
            </div>
            <div>
              <span className="text-gray-500 block font-semibold">Order Placed</span>
              <span className="text-gray-800">
                {orderDateTime.date} {orderDateTime.time}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 border border-gray-200 p-4 space-y-3">
            <span className="font-bold text-gray-700 uppercase tracking-wider text-[11px] block">
              Delivery Photo (optional)
            </span>
            {mockMedia ? (
              <div className="flex items-center gap-3 bg-white border border-gray-200 p-2">
                <div className="w-12 h-12 bg-slate-200 flex items-center justify-center text-[9px] font-bold text-gray-500 uppercase shrink-0">
                  IMG
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-gray-700 truncate">{mockMedia.name}</p>
                  <p className="text-gray-400 text-[11px]">Attached</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMockMedia(null)}
                  className="text-rose-600 font-bold hover:underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAttachMedia}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold px-3 py-2 cursor-pointer transition-colors"
              >
                Upload Photo (PNG, JPEG)
              </button>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
            <Button
              type="button"
              onClick={handleComplete}
              disabled={submitting || !isLoaded}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-6"
            >
              {submitting ? "Completing..." : "Mark Delivery as Done"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AssignmentDetailContent({ params, driverId }) {
  const resolvedParams = use(params);
  const assignmentId = resolvedParams?.id;

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [manifest, setManifest] = useState(null);
  const [assignmentToReject, setAssignmentToReject] = useState(null);
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [rejectError, setRejectError] = useState(null);
  const [rejectSuccess, setRejectSuccess] = useState(null);

  const fetchAssignment = async () => {
    if (!assignmentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/api/fleet/assignments/${assignmentId}`);
      setAssignment(data);
    } catch (err) {
      setError(err.message || "Failed to load assignment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  const shipment = assignment?.shipments?.[0];

  const handleRejectSubmit = async ({ shipmentId, description, severity }) => {
    if (!description.trim()) {
      setRejectError("Please enter a reason for rejecting the assignment.");
      return;
    }
    setRejectSubmitting(true);
    setRejectError(null);
    setRejectSuccess(null);
    try {
      const result = await apiFetch("/api/incidents", {
        method: "POST",
        body: JSON.stringify({
          shipmentId,
          description: `[ASSIGNMENT REJECTION] ${description.trim()}`,
          severity,
        }),
      });
      setRejectSuccess(`Rejection / Incident report submitted successfully (ID: ${result.id || "Recorded"}).`);
      setAssignmentToReject(null);
      await fetchAssignment();
    } catch (err) {
      setRejectError(err.message || "Failed to submit rejection.");
    } finally {
      setRejectSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DriverPageShell maxWidth="6xl">
        <div className="p-8 text-center text-gray-500 text-sm">Loading assignment...</div>
      </DriverPageShell>
    );
  }

  if (error || !assignment) {
    return (
      <DriverPageShell maxWidth="6xl">
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 text-sm text-rose-800 font-medium">
          Warning: {error || "Assignment not found."}
        </div>
        <Link href="/driver/assignments" className="text-xs font-bold text-primary hover:underline">
          Back to My Assignment
        </Link>
      </DriverPageShell>
    );
  }

  return (
    <DriverPageShell maxWidth="6xl">
      <Link href="/driver/assignments" className="text-xs font-bold text-primary hover:underline">
        &larr; Back to My Assignment
      </Link>

      <DriverPageHeader
        eyebrow="Assignment Detail"
        title={shipment ? `${shipment.pickupAddress} -> ${shipment.deliveryAddress}` : assignment.id}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span className="bg-secondary text-white text-[10px] font-bold px-2 py-0.5 uppercase">
              {assignment.status}
            </span>
            {manifest?.isPickupResolved && (
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 uppercase">
                + Loaded
              </span>
            )}
            {shipment?.customerName && <span>{shipment.customerName}</span>}
            {shipment?.customerPhone && (
              <a href={`tel:${shipment.customerPhone}`} className="text-primary font-bold hover:underline">
                {shipment.customerPhone}
              </a>
            )}
          </span>
        }
        actions={
          <button
            type="button"
            onClick={() => setAssignmentToReject(assignment)}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 cursor-pointer transition-colors"
          >
            Reject Assignment
          </button>
        }
      />

      {rejectSuccess && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 text-sm text-emerald-800 font-medium">
          Success: {rejectSuccess}
        </div>
      )}

      {assignment.route?.originAddress && assignment.route?.destinationAddress ? (
        <RouteMap
          originAddress={assignment.route.originAddress}
          destinationAddress={assignment.route.destinationAddress}
          originLabel="Pickup"
          destinationLabel="Delivery"
        />
      ) : (
        <div className="border border-dashed border-gray-300 bg-slate-50 p-6 text-center text-xs text-gray-500">
          No route information available for this assignment.
        </div>
      )}

      {shipment && <LoadManifestChecklist shipmentId={shipment.id} onManifestChange={setManifest} />}

      {shipment && (
        <DeliveryConfirmationSection
          shipment={shipment}
          driverId={driverId}
          isLoaded={!!manifest?.isPickupResolved}
        />
      )}

      <RejectModal
        assignment={assignmentToReject}
        onClose={() => setAssignmentToReject(null)}
        onSubmit={handleRejectSubmit}
        submitting={rejectSubmitting}
        error={rejectError}
      />
    </DriverPageShell>
  );
}

export default function AssignmentDetailPage({ params }) {
  return (
    <DriverAuthGuard>
      {({ driverId }) => <AssignmentDetailContent params={params} driverId={driverId} />}
    </DriverAuthGuard>
  );
}
