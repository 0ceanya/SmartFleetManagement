"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import DriverAuthGuard from "@/components/driver/DriverAuthGuard";
import DriverFloatingNav from "@/components/driver/DriverFloatingNav";
import LoadManifestChecklist from "@/components/driver/LoadManifestChecklist";
import DeclineAssignmentModal from "@/components/driver/DeclineAssignmentModal";
import ReportIncidentModal from "@/components/driver/ReportIncidentModal";
import Button from "@/components/ui/Button";
import { getStatusChipClasses } from "@/lib/driverStatus";
import { formatOrderDateTime } from "@/lib/driverOrderDisplay";

const PRIMARY_CTA_CLASSES =
  "w-full bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-heading font-bold text-xs py-2.5 transition-colors cursor-pointer";

function DeliveryConfirmationSection({ shipment, driverId, onFulfilled }) {
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
      driverId,
      recipientName: shipment.customerName || "Customer",
      proofSignature: mockMedia ? `Photo attached: ${mockMedia.name}` : "Confirmed by driver",
    };

    try {
      const result = await apiFetch(`/api/fleet/shipments/${shipment.id}/delivery-confirmation`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setExistingConfirmation(result);
      setSubmitSuccess("Order Fulfilled");
      setTimeout(() => onFulfilled?.(), 1200);
    } catch (err) {
      console.error("Delivery confirmation failed:", err);
      setError(err.message || "Failed to complete delivery.");
    } finally {
      setSubmitting(false);
    }
  };

  const orderDateTime = formatOrderDateTime(order?.createdAt);

  return (
    <div className="bg-white border border-gray-300 p-6 space-y-6 shadow-xs">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-lg font-heading text-secondary font-bold">Complete Delivery</h2>
        <p className="text-xs text-gray-500 mt-0.5">Review order details and mark this delivery as done.</p>
      </div>

      {submitSuccess && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 text-sm text-emerald-800 font-bold">
          {submitSuccess}
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
              disabled={submitting || !!existingConfirmation}
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

function AssignmentDetailContent({ params, driverId, driverInfo, handleSignOut }) {
  const resolvedParams = use(params);
  const assignmentId = resolvedParams?.id;
  const router = useRouter();

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Local-only UI gate: no "Arrived" concept exists in the domain model (nothing to persist
  // between Delivering and the real delivery-confirmation POST), so this resets on refresh.
  const [arrived, setArrived] = useState(false);

  const [accepting, setAccepting] = useState(false);
  const [startingTrip, setStartingTrip] = useState(false);
  const [actionError, setActionError] = useState(null);

  const [assignmentToDecline, setAssignmentToDecline] = useState(null);
  const [declineSubmitting, setDeclineSubmitting] = useState(false);
  const [declineError, setDeclineError] = useState(null);

  const [assignmentToReportIncident, setAssignmentToReportIncident] = useState(null);
  const [incidentSubmitting, setIncidentSubmitting] = useState(false);
  const [incidentError, setIncidentError] = useState(null);
  const [incidentSuccess, setIncidentSuccess] = useState(null);

  const fetchAssignment = async (silent = false) => {
    if (!assignmentId) return;
    if (!silent) setLoading(true);
    if (!silent) setError(null);
    try {
      const data = await apiFetch(`/api/fleet/assignments/${assignmentId}`);
      setAssignment(data);
    } catch (err) {
      if (!silent) setError(err.message || "Failed to load assignment.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  const shipment = assignment?.shipments?.[0];

  const handleAccept = async () => {
    setAccepting(true);
    setActionError(null);
    try {
      await apiFetch(`/api/fleet/assignments/${assignmentId}/approve`, { method: "POST" });
      await fetchAssignment(true);
    } catch (err) {
      setActionError(err.message || "Failed to accept assignment.");
    } finally {
      setAccepting(false);
    }
  };

  const handleStartTrip = async () => {
    if (!shipment) return;
    setStartingTrip(true);
    setActionError(null);
    try {
      await apiFetch(`/api/fleet/shipments/${shipment.id}/start-trip`, { method: "POST" });
      await fetchAssignment(true);
    } catch (err) {
      setActionError(err.message || "Failed to start trip.");
    } finally {
      setStartingTrip(false);
    }
  };

  const handleDeclineSubmit = async ({ shipmentId, description }) => {
    if (!description.trim()) {
      setDeclineError("Please enter a reason for declining this assignment.");
      return;
    }
    setDeclineSubmitting(true);
    setDeclineError(null);
    try {
      await apiFetch("/api/incidents", {
        method: "POST",
        body: JSON.stringify({
          shipmentId,
          description: `[DRIVER DECLINED] ${description.trim()}`,
          severity: "Medium",
          category: "AssignmentDecline",
        }),
      });
      setAssignmentToDecline(null);
      router.push("/driver/assignments");
    } catch (err) {
      setDeclineError(err.message || "Failed to decline assignment.");
    } finally {
      setDeclineSubmitting(false);
    }
  };

  const handleIncidentSubmit = async ({ shipmentId, description, severity, category }) => {
    if (!description.trim()) {
      setIncidentError("Please enter a description of the incident.");
      return;
    }
    setIncidentSubmitting(true);
    setIncidentError(null);
    try {
      const result = await apiFetch("/api/incidents", {
        method: "POST",
        body: JSON.stringify({ shipmentId, description: description.trim(), severity, category }),
      });
      setIncidentSuccess(`Incident reported (ID: ${result.id || "Recorded"}).`);
      setAssignmentToReportIncident(null);
      await fetchAssignment(true);
    } catch (err) {
      setIncidentError(err.message || "Failed to report incident.");
    } finally {
      setIncidentSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        Loading assignment...
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-sm text-rose-600 font-medium">{error || "Assignment not found."}</p>
        <Link href="/driver/assignments" className="text-xs font-bold text-primary hover:underline">
          Back to My Assignment
        </Link>
      </div>
    );
  }

  const inProgress = assignment.status !== "Delivered" && assignment.status !== "Rejected";
  const canDecline = assignment.status === "Pending" || assignment.status === "Assigned" || assignment.status === "Loaded";

  return (
    <div className="h-[100dvh] overflow-hidden bg-white">
      <DriverFloatingNav driverId={driverId} driverInfo={driverInfo} onSignOut={handleSignOut} />

      <div className="h-full overflow-y-auto px-4 pt-20 pb-8">
        <div className="max-w-lg mx-auto space-y-4">
        <div className="space-y-4 pt-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span
                className={`${getStatusChipClasses(assignment.status)} inline-block text-[10px] font-bold px-2 py-0.5 uppercase`}
              >
                {assignment.status}
              </span>
              <h1 className="font-heading text-lg font-bold text-secondary mt-1 truncate">
                {shipment ? `${shipment.pickupAddress} -> ${shipment.deliveryAddress}` : assignment.id}
              </h1>
              {shipment?.customerName && <p className="text-xs text-gray-500 mt-0.5">{shipment.customerName}</p>}
            </div>
            {inProgress && (
              <div className="flex flex-col items-end gap-1 shrink-0">
                {canDecline && (
                  <button
                    type="button"
                    onClick={() => setAssignmentToDecline(assignment)}
                    className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Decline
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setAssignmentToReportIncident(assignment)}
                  className="text-[11px] font-bold text-gray-500 hover:underline cursor-pointer"
                >
                  Report Incident
                </button>
              </div>
            )}
          </div>

          {actionError && (
            <div className="bg-rose-50 border-l-4 border-rose-500 p-3 text-xs text-rose-800 font-medium">
              {actionError}
            </div>
          )}
          {incidentSuccess && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 text-xs text-blue-800 font-medium">
              {incidentSuccess}
            </div>
          )}
          {incidentError && (
            <div className="bg-rose-50 border-l-4 border-rose-500 p-3 text-xs text-rose-800 font-medium">
              {incidentError}
            </div>
          )}

          {shipment && (
            <div className="text-xs text-gray-700 space-y-1 border-t border-gray-200 pt-3">
              <p>
                <span className="font-semibold text-gray-500">Pickup:</span> {shipment.pickupAddress}
              </p>
              <p>
                <span className="font-semibold text-gray-500">Delivery:</span> {shipment.deliveryAddress}
              </p>
              {assignment.route?.originAddress && assignment.route?.destinationAddress && (
                <Link
                  href={`/map?origin=${encodeURIComponent(assignment.route.originAddress)}&destination=${encodeURIComponent(assignment.route.destinationAddress)}&originLabel=Pickup&destinationLabel=Delivery`}
                  className="inline-block mt-1 text-xs font-bold text-primary hover:underline"
                >
                  Route Buddy →
                </Link>
              )}
              {shipment.customerPhone && (
                <p>
                  <span className="font-semibold text-gray-500">Phone:</span>{" "}
                  <a href={`tel:${shipment.customerPhone}`} className="text-primary font-bold hover:underline">
                    {shipment.customerPhone}
                  </a>
                </p>
              )}
            </div>
          )}

          {assignment.status === "Pending" && (
            <button type="button" onClick={handleAccept} disabled={accepting} className={PRIMARY_CTA_CLASSES}>
              {accepting ? "Accepting..." : "Accept Assignment"}
            </button>
          )}

          {shipment && (assignment.status === "Assigned" || assignment.status === "Loaded") && (
            <div className="space-y-3">
              <LoadManifestChecklist shipmentId={shipment.id} onManifestChange={() => fetchAssignment(true)} />
              {assignment.status === "Loaded" && (
                <button type="button" onClick={handleStartTrip} disabled={startingTrip} className={PRIMARY_CTA_CLASSES}>
                  {startingTrip ? "Starting Trip..." : "Start Trip"}
                </button>
              )}
            </div>
          )}

          {assignment.status === "Delivering" && !arrived && (
            <button type="button" onClick={() => setArrived(true)} className={PRIMARY_CTA_CLASSES}>
              Arrived
            </button>
          )}

          {shipment && (arrived || assignment.status === "Delivered") && (
            <DeliveryConfirmationSection
              shipment={shipment}
              driverId={driverId}
              onFulfilled={() => router.push("/driver/assignments")}
            />
          )}
        </div>
        </div>
      </div>

      <DeclineAssignmentModal
        assignment={assignmentToDecline}
        onClose={() => setAssignmentToDecline(null)}
        onSubmit={handleDeclineSubmit}
        submitting={declineSubmitting}
        error={declineError}
      />

      <ReportIncidentModal
        assignment={assignmentToReportIncident}
        onClose={() => setAssignmentToReportIncident(null)}
        onSubmit={handleIncidentSubmit}
        submitting={incidentSubmitting}
        error={incidentError}
      />
    </div>
  );
}

export default function AssignmentDetailPage({ params }) {
  return (
    <DriverAuthGuard chromeless>
      {({ driverId, driverInfo, handleSignOut }) => (
        <AssignmentDetailContent params={params} driverId={driverId} driverInfo={driverInfo} handleSignOut={handleSignOut} />
      )}
    </DriverAuthGuard>
  );
}
