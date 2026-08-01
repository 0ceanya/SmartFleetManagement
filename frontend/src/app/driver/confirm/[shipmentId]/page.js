"use client";

import React, { use, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";
import DriverAuthGuard from "@/components/driver/DriverAuthGuard";

function DeliveryConfirmationContent({ params, driverId, driverInfo }) {
  const resolvedParams = use(params);
  const shipmentId = resolvedParams?.shipmentId;

  // Form state
  const [recipientName, setRecipientName] = useState("");
  const [proofSignature, setProofSignature] = useState("");
  const [gpsLatitude, setGpsLatitude] = useState("");
  const [gpsLongitude, setGpsLongitude] = useState("");

  // Status & API state
  const [loading, setLoading] = useState(true);
  const [existingConfirmation, setExistingConfirmation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [gpsStatus, setGpsStatus] = useState(null);

  // Check if delivery confirmation already exists for this shipment
  const checkExistingConfirmation = async () => {
    if (!shipmentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/api/fleet/shipments/${shipmentId}/delivery-confirmation`);
      setExistingConfirmation(data);
      if (data) {
        setRecipientName(data.recipientName || "");
        setProofSignature(data.proofSignature || "");
        if (data.gpsLatitude) setGpsLatitude(data.gpsLatitude.toString());
        if (data.gpsLongitude) setGpsLongitude(data.gpsLongitude.toString());
      }
    } catch {
      // Expected if not confirmed yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkExistingConfirmation();
  }, [shipmentId]);

  // Capture GPS Geolocation from Browser API
  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus("Geolocation is not supported by your browser.");
      return;
    }

    setGpsStatus("Locating...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLatitude(position.coords.latitude.toFixed(6));
        setGpsLongitude(position.coords.longitude.toFixed(6));
        setGpsStatus("✓ Location captured successfully.");
      },
      (err) => {
        setGpsStatus(`Unable to retrieve location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Submit Delivery Confirmation to Backend API
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recipientName.trim() || !proofSignature.trim()) {
      setError("Recipient Name and Proof of Delivery Signature are required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSubmitSuccess(null);

    const payload = {
      driverId: driverId,
      recipientName: recipientName.trim(),
      proofSignature: proofSignature.trim(),
      gpsLatitude: gpsLatitude ? parseFloat(gpsLatitude) : null,
      gpsLongitude: gpsLongitude ? parseFloat(gpsLongitude) : null,
    };

    try {
      const result = await apiFetch(`/api/fleet/shipments/${shipmentId}/delivery-confirmation`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setExistingConfirmation(result);
      setSubmitSuccess(`Delivery confirmation submitted successfully for shipment ${shipmentId}.`);
    } catch (err) {
      console.error("Delivery confirmation failed:", err);
      setError(err.message || "Failed to submit delivery confirmation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Page Banner */}
      <div className="bg-white border border-gray-300 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">Shipment Delivery</span>
          <h1 className="text-2xl font-heading text-secondary font-bold mt-0.5">
            Delivery Confirmation
          </h1>
          <p className="text-xs font-mono text-gray-500 mt-1">
            Shipment ID: <span className="text-primary font-bold">{shipmentId || "N/A"}</span>
          </p>
        </div>
      </div>

      {/* Action Banners */}
      {submitSuccess && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 text-sm text-emerald-800 font-medium">
          ✓ {submitSuccess}
        </div>
      )}

      {existingConfirmation && !submitSuccess && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-sm text-blue-800 font-medium">
          Delivery confirmation has already been recorded for this shipment.
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 text-sm text-rose-800 font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white border border-gray-300 p-6 space-y-6 shadow-xs">
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-lg font-heading text-secondary font-bold">
            Proof of Delivery Form
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Record recipient signature and handover location details.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Shipment ID
              </label>
              <input
                type="text"
                readOnly
                value={shipmentId || ""}
                className="w-full border border-gray-300 p-2.5 bg-gray-100 font-mono text-gray-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Authenticated Driver ID
              </label>
              <input
                type="text"
                readOnly
                value={driverId || ""}
                className="w-full border border-gray-300 p-2.5 bg-gray-100 font-mono text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Recipient Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g. Nguyen Van A (Store Receiver / Manager)"
              className="w-full border border-gray-300 p-2.5 text-xs focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Proof of Delivery Signature / Note <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={proofSignature}
              onChange={(e) => setProofSignature(e.target.value)}
              placeholder="Enter digital signature reference, ID number, or receiving note..."
              className="w-full border border-gray-300 p-2.5 text-xs font-mono focus:border-primary focus:outline-none"
            />
          </div>

          {/* GPS Capture */}
          <div className="bg-slate-50 border border-gray-200 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-gray-700 uppercase tracking-wider text-[11px]">
                GPS Geolocation Coordinates
              </span>
              <button
                type="button"
                onClick={handleCaptureGps}
                className="bg-black text-white hover:bg-gray-800 text-xs font-bold px-3 py-1.5 cursor-pointer transition-colors"
              >
                📍 Capture Current GPS Location
              </button>
            </div>

            {gpsStatus && (
              <p className="text-[11px] font-semibold text-primary">{gpsStatus}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={gpsLatitude}
                  onChange={(e) => setGpsLatitude(e.target.value)}
                  placeholder="e.g. 21.028511"
                  className="w-full border border-gray-300 p-2 font-mono bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={gpsLongitude}
                  onChange={(e) => setGpsLongitude(e.target.value)}
                  placeholder="e.g. 105.854167"
                  className="w-full border border-gray-300 p-2 font-mono bg-white"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-6"
            >
              {submitting ? "Submitting..." : "Confirm & Save Delivery Status"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function DeliveryConfirmationPage({ params }) {
  return (
    <DriverAuthGuard>
      {({ driverId, driverInfo }) => (
        <DeliveryConfirmationContent params={params} driverId={driverId} driverInfo={driverInfo} />
      )}
    </DriverAuthGuard>
  );
}
